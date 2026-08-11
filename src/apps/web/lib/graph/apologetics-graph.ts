/**
 * Apologetics reasoning graph (LangGraph.js skeleton — Step 2).
 *
 * This is the multi-agent successor to the flat tool loop in
 * `pages/api/chat-agentic.ts`. It models the same domain guarantees (Scripture
 * floor, citation verification) as an explicit `StateGraph` instead of an
 * imperative loop, which is what unlocks the reflection loop and parallel
 * specialists you can't cleanly express today.
 *
 *   analyze ──▶ (fan-out, parallel) ──▶ writer ──▶ critic ──┐
 *                ├─ scripture   (forced for theological)      │ unresolved refs
 *                ├─ apologetics                               │ & under cap?
 *                └─ memory      (only with a conversation)    ▼
 *                                                      revise → writer
 *                                                      done   → END
 *
 * Design choices worth calling out:
 *  - The ROUTER IS DETERMINISTIC. `classifyObjection` already decides the shape
 *    of the turn far more cheaply and reliably than an LLM supervisor would.
 *    We do NOT spend a model call to route.
 *  - Specialist nodes are thin wrappers over the SAME services the agent tools
 *    call (see `lib/agent-tools.ts`). No new retrieval logic. When you commit,
 *    consider exporting the tool handlers and reusing them here to stay DRY.
 *  - The Writer uses the raw `openai` SDK (already a dependency) rather than a
 *    LangChain LLM wrapper, so this file has no runtime dependency on the
 *    stale `@langchain/openai`. Swap in `ChatOpenAI` later if you want tracing.
 *  - The Critic reuses `verifyCitations` from the Step-1 verifier.
 *
 * NOT YET WIRED to a route. Install deps first (see repo notes):
 *   npm i @langchain/langgraph @langchain/core
 *   npm rm langchain @langchain/openai @langchain/pinecone   # unused, stale
 */

import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import type OpenAI from 'openai';
import { getTracedOpenAI } from '../observability/openai-traced';
import { analyzeQuestion, generateSpecializedPrompt, generateDenominationContext } from '../prompt-engineering';
import { classifyObjection, type ObjectionAnalysis } from '../objection-classifier';
import { EmbeddingService } from '../embeddings';
import { BiblePineconeService } from '../bible-pinecone';
import { searchApologeticsContent } from '../apologetics-knowledge';
import { MemoryService } from '../memory-service';
import { verifyCitations, type CitationVerification } from '../citation-verifier';
import { logger } from '../logger';

// Objection types that require at least one Scripture lookup (the "floor").
// Mirrors THEOLOGICAL_OBJECTION_TYPES in chat-agentic.ts.
const THEOLOGICAL_OBJECTION_TYPES = new Set([
  'logical', 'moral', 'scientific', 'historical', 'philosophical',
]);

const MAX_CORRECTIONS = Number(process.env.GRAPH_MAX_CORRECTIONS || 1);

// LangSmith-wrapped when tracing is enabled; transparent passthrough otherwise.
const getOpenAI = getTracedOpenAI;

// ── Retrieved-evidence shapes (compact; mirror the tool results) ────────────
interface ScriptureHit { reference: string; text: string; score?: number }
interface ApologeticsHit { title: string; category: string; content: string; scriptures: string[] }
interface MemoryContext { keyTopics: string[]; emotionalTone: string; relevant: string[] }

// ── Graph state ─────────────────────────────────────────────────────────────
// Each channel written by exactly one node, except the evidence arrays (given a
// concat reducer so the design tolerates future multi-source writes).
const GraphState = Annotation.Root({
  // Inputs (carried through unchanged).
  message: Annotation<string>,
  mode: Annotation<'gentle' | 'scholarly' | 'debate'>,
  versionId: Annotation<string>,
  userId: Annotation<string>,
  conversationId: Annotation<string | undefined>,
  denomination: Annotation<string | null>,
  history: Annotation<Array<{ role: 'user' | 'assistant'; content: string }>>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  cid: Annotation<string>,

  // Derived by the deterministic analyze node.
  objection: Annotation<ObjectionAnalysis>,
  systemPrompt: Annotation<string>,

  // Retrieved evidence (fan-out).
  scripture: Annotation<ScriptureHit[]>({ reducer: (a, b) => a.concat(b), default: () => [] }),
  apologetics: Annotation<ApologeticsHit[]>({ reducer: (a, b) => a.concat(b), default: () => [] }),
  memory: Annotation<MemoryContext | null>({ reducer: (_a, b) => b, default: () => null }),

  // Writer/critic loop.
  draft: Annotation<string>({ reducer: (_a, b) => b, default: () => '' }),
  verification: Annotation<CitationVerification | null>({ reducer: (_a, b) => b, default: () => null }),
  corrections: Annotation<number>({ reducer: (_a, b) => b, default: () => 0 }),

  // Output.
  answer: Annotation<string>({ reducer: (_a, b) => b, default: () => '' }),
});

type State = typeof GraphState.State;

// ── Nodes ────────────────────────────────────────────────────────────────────

// Deterministic pre-analysis. No model call — this is the "router".
function analyzeNode(state: State): Partial<State> {
  const objection = classifyObjection(state.message);
  const questionContext = analyzeQuestion(state.message);
  let systemPrompt = generateSpecializedPrompt(questionContext, state.mode);
  systemPrompt += generateDenominationContext(state.denomination as any);
  systemPrompt +=
    '\n\nGround theological claims in the Scripture provided to you below, and cite references explicitly. Do not cite verses that are not in the provided evidence.';
  logger.debug('graph.analyze', { cid: state.cid, type: objection.primaryType });
  return { objection, systemPrompt };
}

async function scriptureNode(state: State): Promise<Partial<State>> {
  try {
    const embedding = await EmbeddingService.generateEmbeddingForIndex(state.message);
    const results = await BiblePineconeService.searchBibleContent(embedding, 5, { type: 'bible_verse' });
    const scripture = results.map(r => ({ reference: r.reference, text: r.text, score: Number(r.score.toFixed(3)) }));
    return { scripture };
  } catch (err) {
    logger.error('graph.scripture failed', { cid: state.cid }, err as Error);
    return { scripture: [] };
  }
}

async function apologeticsNode(state: State): Promise<Partial<State>> {
  try {
    const results = searchApologeticsContent(state.message).slice(0, 3);
    const apologetics = results.map(r => ({
      title: r.title,
      category: r.category,
      scriptures: r.scriptures,
      content: r.content.length > 600 ? `${r.content.slice(0, 600)}…` : r.content,
    }));
    return { apologetics };
  } catch (err) {
    logger.error('graph.apologetics failed', { cid: state.cid }, err as Error);
    return { apologetics: [] };
  }
}

async function memoryNode(state: State): Promise<Partial<State>> {
  if (!state.conversationId || !state.userId) return { memory: null };
  try {
    const mem = await MemoryService.getEnhancedConversationContext(
      state.conversationId, state.userId, state.message, 10
    );
    if (!mem || !mem.messages?.length) return { memory: null };
    const relevant = mem.messages
      .filter((m: any) => m.relevance > 0.7).slice(0, 5)
      .map((m: any) => `${m.role}: ${m.content}`);
    return { memory: { keyTopics: mem.keyTopics || [], emotionalTone: mem.emotionalTone || 'neutral', relevant } };
  } catch (err) {
    logger.error('graph.memory failed', { cid: state.cid }, err as Error);
    return { memory: null };
  }
}

// Synthesize the answer from retrieved evidence. Re-run on a critic revision.
async function writerNode(state: State): Promise<Partial<State>> {
  const answerModel = state.mode === 'gentle' ? 'gpt-4o-mini' : 'gpt-4o';
  const maxTokens = state.mode === 'gentle' ? 2000 : 4000;
  const temperature = state.mode === 'gentle' ? 0.7 : 0.8;

  const evidence = buildEvidenceBlock(state);
  const correction = state.verification && !state.verification.ok
    ? `\n\nYour previous draft cited unverifiable Scripture: ${state.verification.hallucinated.join('; ')}. ` +
      'Rewrite using ONLY verses from the evidence above. Keep the same tone and length.'
    : '';

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: state.systemPrompt },
    ...state.history,
    { role: 'user', content: `${state.message}\n\n---\nRETRIEVED EVIDENCE:\n${evidence}${correction}` },
  ];

  const resp = await getOpenAI().chat.completions.create({ model: answerModel, max_tokens: maxTokens, temperature, messages });
  const draft = resp.choices[0].message.content || '';
  logger.debug('graph.writer', { cid: state.cid, revision: state.corrections, len: draft.length });
  return { draft };
}

// Verify citations in the draft (reuses the Step-1 verifier).
async function criticNode(state: State): Promise<Partial<State>> {
  const verification = await verifyCitations(state.draft, state.versionId, { cid: state.cid });
  const passed = verification.ok || verification.skipped;
  logger.info('graph.critic', {
    cid: state.cid, ok: verification.ok, hallucinated: verification.hallucinated, revision: state.corrections,
  });
  // Accept the draft as the answer; a following revision (if any) overwrites it.
  return {
    verification,
    answer: state.draft,
    corrections: passed ? state.corrections : state.corrections + 1,
  };
}

// ── Edges ─────────────────────────────────────────────────────────────────────

// Fan-out: which specialists to dispatch. Scripture is forced ("floor") for
// theological objections; memory only runs with an existing conversation.
// NB: node names must NOT collide with state channel names in LangGraph — hence
// `retrieve_scripture` (node) vs `scripture` (channel).
function dispatchSpecialists(state: State): string[] {
  const targets: string[] = ['retrieve_apologetics'];
  const isTheological = THEOLOGICAL_OBJECTION_TYPES.has(state.objection.primaryType);
  if (isTheological || state.scripture.length === 0) targets.push('retrieve_scripture');
  if (state.conversationId) targets.push('recall_memory');
  return targets;
}

// After the critic: loop back to the writer while there are unresolved refs and
// we're under the correction cap; otherwise finish.
function decideAfterCritic(state: State): 'revise' | 'done' {
  const v = state.verification;
  if (v && !v.ok && !v.skipped && state.corrections <= MAX_CORRECTIONS) return 'revise';
  return 'done';
}

// ── Assembly ──────────────────────────────────────────────────────────────────
export function buildApologeticsGraph() {
  const graph = new StateGraph(GraphState)
    .addNode('analyze', analyzeNode)
    .addNode('retrieve_scripture', scriptureNode)
    .addNode('retrieve_apologetics', apologeticsNode)
    .addNode('recall_memory', memoryNode)
    .addNode('writer', writerNode)
    .addNode('critic', criticNode)
    .addEdge(START, 'analyze')
    // Fan-out from analyze to the specialists chosen at runtime.
    .addConditionalEdges('analyze', dispatchSpecialists, ['retrieve_scripture', 'retrieve_apologetics', 'recall_memory'])
    // Fan-in: writer runs once all dispatched specialists complete.
    .addEdge('retrieve_scripture', 'writer')
    .addEdge('retrieve_apologetics', 'writer')
    .addEdge('recall_memory', 'writer')
    .addEdge('writer', 'critic')
    // Reflection loop.
    .addConditionalEdges('critic', decideAfterCritic, { revise: 'writer', done: END });

  return graph.compile();
}

// ── Public entry point ────────────────────────────────────────────────────────
export interface ApologeticsGraphInput {
  message: string;
  mode: 'gentle' | 'scholarly' | 'debate';
  versionId: string;
  userId: string;
  conversationId?: string;
  denomination?: string | null;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  cid: string;
}

export interface ApologeticsGraphResult {
  answer: string;
  objectionType: string;
  corrections: number;
  verification: CitationVerification | null;
  evidence: { scripture: number; apologetics: number; memory: boolean };
}

/**
 * Run the graph to completion and return the answer + telemetry. This buffers
 * the full answer (no token streaming). Streaming is available via
 * `graph.stream(..., { streamMode: 'messages' })` on the compiled graph — wire
 * that into a route when you replace chat-agentic's streaming path.
 */
export async function runApologeticsGraph(input: ApologeticsGraphInput): Promise<ApologeticsGraphResult> {
  const app = buildApologeticsGraph();
  const final = await app.invoke({
    message: input.message,
    mode: input.mode,
    versionId: input.versionId,
    userId: input.userId,
    conversationId: input.conversationId,
    denomination: input.denomination ?? null,
    history: input.history ?? [],
    cid: input.cid,
  });

  return {
    answer: final.answer,
    objectionType: final.objection?.primaryType ?? 'unknown',
    corrections: final.corrections,
    verification: final.verification,
    evidence: {
      scripture: final.scripture.length,
      apologetics: final.apologetics.length,
      memory: Boolean(final.memory),
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildEvidenceBlock(state: State): string {
  const parts: string[] = [];
  if (state.scripture.length) {
    parts.push('Scripture:\n' + state.scripture.map(s => `- ${s.reference}: "${s.text}"`).join('\n'));
  }
  if (state.apologetics.length) {
    parts.push('Apologetics knowledge base:\n' + state.apologetics
      .map(a => `- [${a.category}] ${a.title}: ${a.content} (key: ${a.scriptures.join(', ') || 'none'})`)
      .join('\n'));
  }
  if (state.memory) {
    parts.push(`Prior context — topics: ${state.memory.keyTopics.join(', ') || 'none'}; tone: ${state.memory.emotionalTone}.`);
  }
  return parts.length ? parts.join('\n\n') : '(no retrieved evidence — answer from general knowledge and be explicit about uncertainty)';
}
