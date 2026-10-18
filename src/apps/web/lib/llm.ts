import Anthropic from '@anthropic-ai/sdk';
import { wrapSDK } from 'langsmith/wrappers';
import { traceModelCall } from './observability/langeval';

/**
 * Shared Claude (Anthropic) client + a small OpenAI-shape-free helper.
 *
 * This is the single seam for text GENERATION across Shield AI. It exists to
 * absorb the shape difference between the OpenAI Chat Completions API (which the
 * codebase used to call directly) and the Anthropic Messages API:
 *
 *   - `system` is a top-level param on Anthropic, NOT a role inside `messages`.
 *   - `temperature` is rejected (400) on the Claude 5-series, so we never send it;
 *     style is steered by the prompts instead.
 *   - Output is content BLOCKS (`resp.content[].text`), not `choices[0].message`.
 *   - Streaming deltas are `content_block_delta` → `delta.text`, not
 *     `choices[0].delta.content`.
 *   - Thinking is ON by default on Opus 5 / Sonnet 5, so `max_tokens` must leave
 *     headroom for it — callers size `maxTokens` accordingly.
 *
 * Callers use `complete()` / `completeStream()` and never touch the SDK shape.
 * Embeddings and image generation stay on OpenAI (see `observability/openai-traced.ts`)
 * — Anthropic has no embeddings/image API — so that client is untouched.
 *
 * Tracing: when LangSmith is enabled the client is wrapped with `wrapSDK` (this
 * langsmith version has no `wrapAnthropic`), so every generation call nests as an
 * LLM span under the surrounding LangGraph run in the `langgraph-rag` project.
 * When tracing is OFF, `wrapSDK` is not applied and this is a plain client.
 */

// Both the modern (LANGSMITH_*) and legacy (LANGCHAIN_*) flags enable tracing.
const tracingEnabled = (() => {
  const v = (process.env.LANGSMITH_TRACING ?? process.env.LANGCHAIN_TRACING_V2 ?? '')
    .toString()
    .toLowerCase();
  return v === 'true' || v === '1';
})();

if (tracingEnabled && !process.env.LANGSMITH_PROJECT && !process.env.LANGCHAIN_PROJECT) {
  process.env.LANGSMITH_PROJECT = 'langgraph-rag';
}

/**
 * Tiered model mapping (env-overridable). Defaults chosen 2026-08-11:
 *   - specialist: cheap/fast, 2–3 fire in parallel per turn, ≤130-word args.
 *   - gentle:     the conversational synthesizer.
 *   - deep:       the grounded scholarly/debate synthesizer (correctness first).
 */
export const MODELS = {
  specialist: process.env.CLAUDE_SPECIALIST_MODEL || 'claude-haiku-4-5',
  gentle: process.env.CLAUDE_GENTLE_MODEL || 'claude-sonnet-5',
  deep: process.env.CLAUDE_DEEP_MODEL || 'claude-opus-5',
} as const;

let client: Anthropic | null = null;

/**
 * Process-wide singleton Anthropic client, LangSmith-wrapped when tracing is on.
 * Throws if ANTHROPIC_API_KEY is missing (same contract as the OpenAI factory it
 * replaces for generation).
 */
export function getClaude(): Anthropic {
  if (client) return client;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  const raw = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  client = tracingEnabled ? (wrapSDK(raw) as unknown as Anthropic) : raw;
  return client;
}

/** True when LangSmith tracing is active (for logging / conditional telemetry). */
export const isTracingEnabled = tracingEnabled;

export type Role = 'system' | 'user' | 'assistant';
export interface ChatMessage {
  role: Role;
  content: string;
}

export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export interface CompleteParams {
  /** Top-level system prompt. Merged with any `system`-role entries in `messages`. */
  system?: string;
  /**
   * Conversation id, so langeval groups the turns of one chat together. Optional: without it a
   * call is still traced, just as a trace of its own rather than part of a thread.
   */
  threadId?: string;
  userId?: string;
  /** What this call is for (`answer`, `triage`, `summarise`) — becomes the span name. */
  operation?: string;
  /** Conversation turns. `system`-role entries are hoisted into `system`. */
  messages: ChatMessage[];
  model: string;
  maxTokens: number;
  /**
   * Thinking depth on the 5-series (`output_config.effort`). Omit for Haiku 4.5
   * (effort is rejected there) and to accept the model default (`high`).
   */
  effort?: Effort;
}

/**
 * Convert OpenAI-style messages (which may carry a `system` role and lead with an
 * assistant turn) into the Anthropic shape: a hoisted `system` string plus a
 * user/assistant `messages` array whose first entry is a user turn.
 */
function toAnthropic(
  system: string | undefined,
  messages: ChatMessage[]
): { system?: string; msgs: Anthropic.MessageParam[] } {
  const systemParts: string[] = [];
  if (system) systemParts.push(system);
  const msgs: Anthropic.MessageParam[] = [];

  for (const m of messages) {
    if (m.role === 'system') {
      if (m.content) systemParts.push(m.content);
      continue;
    }
    if (!m.content) continue;
    msgs.push({ role: m.role, content: m.content });
  }

  // Anthropic requires the first message to be a user turn; drop leading
  // assistant turns that a history slice may start on.
  while (msgs.length && msgs[0].role === 'assistant') msgs.shift();
  // ...and at least one message must be present.
  if (msgs.length === 0) msgs.push({ role: 'user', content: '(no user message)' });

  return { system: systemParts.length ? systemParts.join('\n\n') : undefined, msgs };
}

function outputConfig(effort?: Effort): { output_config?: { effort: Effort } } {
  return effort ? { output_config: { effort } } : {};
}

/** Join the text blocks of a non-streaming response into a single string. */
function textOf(resp: Anthropic.Message): string {
  return resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
}

/**
 * Best-effort extraction of a JSON object/array from a model's text response.
 * Claude (unlike OpenAI's `response_format: json_object`) can wrap JSON in ```json
 * fences or a short preamble. This strips fences and, if the result still isn't
 * parseable, falls back to the outermost `{...}` / `[...]` span. Never throws —
 * returns a string to `JSON.parse` (callers keep their own try/catch fallback).
 */
export function extractJson(raw: string): string {
  if (!raw) return '{}';
  let s = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    JSON.parse(s);
    return s;
  } catch {
    /* fall through to brace/bracket extraction */
  }
  const firstObj = s.indexOf('{');
  const firstArr = s.indexOf('[');
  const start =
    firstArr === -1 ? firstObj : firstObj === -1 ? firstArr : Math.min(firstObj, firstArr);
  const end = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'));
  return start !== -1 && end > start ? s.slice(start, end + 1) : s;
}

/** Non-streaming completion → the assistant's text. */
export async function complete(p: CompleteParams): Promise<string> {
  const { system, msgs } = toAnthropic(p.system, p.messages);
  return traceModelCall(
    { ...traced(p), system, messages: msgs.map(flatten) },
    () =>
      getClaude().messages.create({
        model: p.model,
        max_tokens: p.maxTokens,
        ...(system ? { system } : {}),
        messages: msgs,
        ...outputConfig(p.effort),
      } as Anthropic.MessageCreateParamsNonStreaming),
    (resp) => ({
      text: textOf(resp),
      model: resp.model,
      inputTokens: resp.usage?.input_tokens,
      outputTokens: resp.usage?.output_tokens,
      cacheReadTokens: resp.usage?.cache_read_input_tokens ?? undefined,
      cacheWriteTokens: resp.usage?.cache_creation_input_tokens ?? undefined,
    })
  ).then(textOf);
}

/**
 * Streaming completion. Invokes `onToken` for each text delta as it arrives and
 * returns the full accumulated text once complete. Thinking blocks (5-series) are
 * not forwarded — only user-visible text — so `onToken` sees the answer only.
 */
export async function completeStream(
  p: CompleteParams,
  onToken: (token: string) => void
): Promise<string> {
  const { system, msgs } = toAnthropic(p.system, p.messages);
  // The span has to stay open until the stream is drained, or its duration measures how long the
  // request took to *start* rather than how long the user waited for an answer.
  return traceModelCall(
    { ...traced(p), system, messages: msgs.map(flatten) },
    async () => {
      let text = '';
      let model: string | undefined;
      const tokens: {
        inputTokens?: number;
        outputTokens?: number;
        cacheReadTokens?: number;
        cacheWriteTokens?: number;
      } = {};
      const stream = await getClaude().messages.create({
        model: p.model,
        max_tokens: p.maxTokens,
        ...(system ? { system } : {}),
        messages: msgs,
        ...outputConfig(p.effort),
        stream: true,
      } as Anthropic.MessageCreateParamsStreaming);

      for await (const event of stream) {
        if (event.type === 'message_start') {
          model = event.message.model;
          tokens.inputTokens = event.message.usage?.input_tokens ?? undefined;
          tokens.outputTokens = event.message.usage?.output_tokens ?? undefined;
          tokens.cacheReadTokens = event.message.usage?.cache_read_input_tokens ?? undefined;
          tokens.cacheWriteTokens = event.message.usage?.cache_creation_input_tokens ?? undefined;
        } else if (event.type === 'message_delta' && event.usage) {
          // Output tokens are only final on the closing delta; input is not repeated there.
          tokens.outputTokens = event.usage.output_tokens ?? tokens.outputTokens;
        } else if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const t = event.delta.text;
          if (t) {
            text += t;
            onToken(t);
          }
        }
      }
      return { text, model, ...tokens };
    },
    (r) => r
  ).then((r) => r.text);
}

/** The identifiers langeval groups by, pulled off the caller's params. */
function traced(p: CompleteParams) {
  return {
    model: p.model,
    maxTokens: p.maxTokens,
    threadId: p.threadId,
    userId: p.userId,
    operation: p.operation,
  };
}

/** Anthropic message content can be blocks; the trace wants one readable string. */
function flatten(m: Anthropic.MessageParam): { role: string; content: string } {
  const content =
    typeof m.content === 'string'
      ? m.content
      : m.content
          .map((b) => ('text' in b && typeof b.text === 'string' ? b.text : `[${b.type}]`))
          .join('');
  return { role: m.role, content };
}

export interface ToolRoundParams {
  system: string;
  /** Full Anthropic-shape history, including prior tool_use / tool_result blocks. */
  messages: Anthropic.MessageParam[];
  tools: Anthropic.Tool[];
  /** `{ type: 'none' }` makes the model answer from what it has. Forcing a tool conflicts with thinking. */
  toolChoice?: Anthropic.ToolChoiceAuto | Anthropic.ToolChoiceNone;
  model: string;
  maxTokens: number;
  effort?: Effort;
  threadId?: string;
  userId?: string;
  operation?: string;
}

export interface ToolRoundResult {
  /** The assistant's content blocks verbatim (thinking included), to append to history. */
  content: Anthropic.ContentBlock[];
  text: string;
  toolUses: Anthropic.ToolUseBlock[];
  stopReason: string | null;
}

/**
 * One streamed model turn of a tool-use loop. Text deltas go to `onText` as
 * they arrive; `onToolStart` fires when the model opens a tool call, before its
 * arguments finish, so the UI can show activity immediately. The caller runs
 * the tools and calls again with the results appended.
 */
export async function streamToolRound(
  p: ToolRoundParams,
  handlers: { onText?: (delta: string) => void; onToolStart?: (id: string, name: string) => void } = {}
): Promise<ToolRoundResult> {
  return traceModelCall(
    {
      ...traced({ ...p, messages: [] }),
      system: p.system,
      messages: p.messages.map(flatten),
    },
    async () => {
      const stream = getClaude().messages.stream({
        model: p.model,
        max_tokens: p.maxTokens,
        system: p.system,
        messages: p.messages,
        tools: p.tools,
        ...(p.toolChoice ? { tool_choice: p.toolChoice } : {}),
        ...outputConfig(p.effort),
      } as Anthropic.MessageStreamParams);

      stream.on('streamEvent', (event) => {
        if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
          handlers.onToolStart?.(event.content_block.id, event.content_block.name);
        } else if (event.type === 'content_block_delta' && event.delta.type === 'text_delta' && event.delta.text) {
          handlers.onText?.(event.delta.text);
        }
      });

      const message = await stream.finalMessage();
      return {
        message,
        result: {
          content: message.content,
          text: textOf(message),
          toolUses: message.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'),
          stopReason: message.stop_reason,
        },
      };
    },
    ({ message, result }) => ({
      text: result.text,
      model: message.model,
      inputTokens: message.usage?.input_tokens,
      outputTokens: message.usage?.output_tokens,
      cacheReadTokens: message.usage?.cache_read_input_tokens ?? undefined,
      cacheWriteTokens: message.usage?.cache_creation_input_tokens ?? undefined,
    })
  ).then((r) => r.result);
}
