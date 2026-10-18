import type Anthropic from '@anthropic-ai/sdk';
import { randomUUID } from 'crypto';
import { streamToolRound, MODELS, type Effort } from '../llm';
import { formatCorrectionInstruction, type CitationVerification } from '../citation-verifier';
import { agentTools, runAgentTool, toolStatus, SCRIPTURE_FLOOR_TOOL, type AgentToolContext } from '../scripture/tools';
import { verifyReferencesExist } from '../scripture/verify';
import type { WidgetEnvelope } from '../scripture/widgets';
import type { AgentSink } from './sink';

/**
 * The Scripture agent: a bounded Claude tool-use loop over the Scripture engine.
 *
 *   1. Scripture floor: for a theological challenge the route asks for, the
 *      loop runs a search up front and hands the hits to the model as context
 *      (forcing tool_choice would conflict with Claude's default thinking).
 *   2. Up to MAX_ROUNDS streamed turns; each tool_use round runs its calls in
 *      parallel and feeds back tool_result blocks.
 *   3. If the cap is hit mid-research, one last turn answers with tools off.
 *   4. Scholarly/debate buffer the answer, check every cited reference exists,
 *      and rewrite once if any don't. Gentle streams live and is checked after.
 */

const MAX_ROUNDS = Number(process.env.AGENT_MAX_ROUNDS || 3);

export type ChatMode = 'gentle' | 'scholarly' | 'debate';

export interface RunAgentInput {
  system: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  message: string;
  mode: ChatMode;
  scriptureFloor: boolean;
  ctx: AgentToolContext;
  sink: AgentSink;
  threadId: string;
  /** Sent as STATE_SNAPSHOT right after RUN_STARTED, e.g. the conversation id. */
  state?: Record<string, unknown>;
  /** Override for tests. */
  round?: typeof streamToolRound;
}

export interface ToolTrace {
  name: string;
  ok: boolean;
  ms: number;
}

export interface RunAgentResult {
  text: string;
  widgets: WidgetEnvelope[];
  trace: ToolTrace[];
  rounds: number;
  verification: CitationVerification | null;
  corrected: boolean;
}

function modelFor(mode: ChatMode): { model: string; maxTokens: number; effort: Effort } {
  return mode === 'gentle'
    ? { model: MODELS.gentle, maxTokens: 4000, effort: 'medium' }
    : { model: MODELS.deep, maxTokens: 8000, effort: 'high' };
}

export async function runAgent(input: RunAgentInput): Promise<RunAgentResult> {
  const { sink, ctx, mode } = input;
  const round = input.round ?? streamToolRound;
  const runId = randomUUID();
  const tools = agentTools({ includeMemory: Boolean(ctx.conversationId) });
  const { model, maxTokens, effort } = modelFor(mode);
  const buffered = mode !== 'gentle' && process.env.CITATION_VERIFY !== '0';

  const widgets: WidgetEnvelope[] = [];
  const trace: ToolTrace[] = [];
  const answerParts: string[] = [];
  let system = input.system;

  sink.runStarted(input.threadId, runId);
  if (input.state) sink.state(input.state);

  const callTool = async (id: string, name: string, args: Record<string, unknown>) => {
    sink.toolStatus(id, toolStatus(name, args));
    sink.toolArgs(id, JSON.stringify(args));
    sink.toolEnd(id);
    const result = await runAgentTool(name, args, ctx);
    trace.push({ name, ok: !result.isError, ms: result.ms });
    sink.toolResult(randomUUID(), id, result.content);
    if (result.widget) {
      const envelope = { toolCallId: id, widget: result.widget };
      widgets.push(envelope);
      sink.widget(envelope);
    }
    return result;
  };

  if (input.scriptureFloor) {
    const id = `floor_${runId.slice(0, 8)}`;
    sink.toolStart(id, SCRIPTURE_FLOOR_TOOL);
    const floor = await callTool(id, SCRIPTURE_FLOOR_TOOL, { query: input.message, mode: 'semantic', limit: 5 });
    if (!floor.isError) {
      system += `\n\nSCRIPTURE ALREADY RETRIEVED for the user's question (shown to the user as a card):\n${floor.content}\nBuild on these where they fit; use your tools for anything more.`;
    }
  }

  const messages: Anthropic.MessageParam[] = [
    ...input.history.filter(m => m.content).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: input.message },
  ];
  // Anthropic requires the conversation to open on a user turn.
  while (messages.length && messages[0].role === 'assistant') messages.shift();

  let rounds = 0;
  let finalText = '';
  let finished = false;

  // One model turn. Live mode streams its text; buffered mode collects it.
  const turn = async (toolChoice?: Anthropic.ToolChoiceNone) => {
    rounds += 1;
    const messageId = randomUUID();
    let opened = false;
    const result = await round(
      { system, messages, tools, toolChoice, model, maxTokens, effort, threadId: input.threadId, userId: ctx.userId, operation: 'agent' },
      {
        onText: delta => {
          if (buffered) return;
          if (!opened) { sink.textStart(messageId); opened = true; }
          sink.textDelta(messageId, delta);
        },
        onToolStart: (id, name) => sink.toolStart(id, name, opened ? messageId : undefined),
      }
    );
    if (opened) sink.textEnd(messageId);
    messages.push({ role: 'assistant', content: result.content });
    return result;
  };

  for (let i = 0; i < MAX_ROUNDS; i++) {
    const result = await turn();
    if (!result.toolUses.length) {
      finalText = result.text;
      finished = true;
      break;
    }
    // Narration before a tool call is part of what the user saw in live mode.
    if (!buffered && result.text) answerParts.push(result.text);
    const results = await Promise.all(
      result.toolUses.map(tu => callTool(tu.id, tu.name, (tu.input || {}) as Record<string, unknown>))
    );
    messages.push({
      role: 'user',
      content: result.toolUses.map((tu, idx) => ({
        type: 'tool_result' as const,
        tool_use_id: tu.id,
        content: results[idx].content,
        ...(results[idx].isError ? { is_error: true } : {}),
      })),
    });
  }

  if (!finished) {
    // Hit the round cap mid-research: answer from what was gathered.
    finalText = (await turn({ type: 'none' })).text;
  }

  let verification: CitationVerification | null = null;
  let corrected = false;

  if (buffered) {
    sink.activity('Checking Scripture references');
    verification = await verifyReferencesExist(finalText, ctx.cid);
    if (!verification.ok) {
      messages.push({ role: 'user', content: formatCorrectionInstruction(verification) });
      const rewrite = await turn({ type: 'none' });
      if (rewrite.text) {
        finalText = rewrite.text;
        corrected = true;
        verification = await verifyReferencesExist(finalText, ctx.cid);
      }
    }
    const messageId = randomUUID();
    sink.textStart(messageId);
    sink.textDelta(messageId, finalText);
    sink.textEnd(messageId);
  } else {
    verification = await verifyReferencesExist(finalText, ctx.cid);
  }

  answerParts.push(finalText);
  sink.runFinished(input.threadId, runId);

  return {
    text: answerParts.filter(Boolean).join('\n\n'),
    widgets,
    trace,
    rounds,
    verification,
    corrected,
  };
}
