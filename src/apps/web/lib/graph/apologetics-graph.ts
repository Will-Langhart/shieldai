/**
 * Apologetics reasoning graph (LangGraph.js — Phase 3: reasoning specialists).
 *
 * A deterministic router dispatches a small set of *reasoning specialist agents*
 * (not thin retrieval fetchers). Each specialist retrieves its own scoped
 * evidence AND produces a focused argument from its angle; a synthesizer weaves
 * those arguments into one grounded answer; a citation critic verifies Scripture
 * and can trigger a bounded revision.
 *
 *   analyze ─▶ (fan-out, parallel) ─▶ synthesize ─▶ critic ─┐
 *     (router)   ├─ exegete       (ALWAYS — Scripture floor)  │ unresolved refs
 *                ├─ historian     (historical)                │ & under cap?
 *                ├─ philosopher   (logical/philosophical/moral)▼
 *                ├─ scientist     (scientific)          revise → synthesize
 *                ├─ pastor        (emotional/personal)   done  → END
 *                └─ culturalist   (cultural)
 *
 * Design choices:
 *  - The ROUTER IS DETERMINISTIC (`classifyObjection`). No model call to route —
 *    the objection taxonomy is stable, so rules beat an LLM supervisor on cost,
 *    latency, and reliability. We invest the model calls in the *specialists*.
 *  - The exegete always runs, so every answer is grounded in retrieved Scripture
 *    (the "floor"). It queries the integrated `bible-verses` index by text.
 *  - Specialists run on a cheap model in PARALLEL, so added quality costs ~one
 *    extra sequential LLM hop, not the sum. The synthesizer uses the mode's model.
 *  - The Critic reuses `verifyCitations`; its reflection loop re-runs synthesize.
 *  - LLM calls go through the LangSmith-traced client, so each specialist and the
 *    synthesizer appear as their own spans in the `langgraph-rag` project.
 */

import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import type OpenAI from 'openai';
import { getTracedOpenAI } from '../observability/openai-traced';
import { analyzeQuestion, generateSpecializedPrompt, generateDenominationContext } from '../prompt-engineering';
import { classifyObjection, type ObjectionAnalysis } from '../objection-classifier';
import { BibleVersesIndex } from '../bible-verses-index';
import { ApologeticsKbIndex } from '../apologetics-kb-index';
import { MemoryService } from '../memory-service';
import { verifyCitations, type CitationVerification } from '../citation-verifier';
import { logger } from '../logger';

const MAX_CORRECTIONS = Number(process.env.GRAPH_MAX_CORRECTIONS || 1);
// Specialists reason on a cheap, fast model; the synthesizer uses the mode model.
const SPECIALIST_MODEL = process.env.GRAPH_SPECIALIST_MODEL || 'gpt-4o-mini';

// LangSmith-wrapped when tracing is enabled; transparent passthrough otherwise.
const getOpenAI = getTracedOpenAI;

// ── Retrieved-evidence shapes (compact) ─────────────────────────────────────
interface ScriptureHit { reference: string; text: string; score?: number }
interface ApologeticsHit { title: string; category: string; content: string; scriptures: string[] }
interface MemoryContext { keyTopics: string[]; emotionalTone: string; relevant: string[] }
interface SpecialistArgument { specialist: string; text: string }

// ── Graph state ─────────────────────────────────────────────────────────────
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

  // Evidence + arguments written by the specialist fan-out (concat reducers so
  // parallel specialists merge cleanly).
  scripture: Annotation<ScriptureHit[]>({ reducer: (a, b) => a.concat(b), default: () => [] }),
  apologetics: Annotation<ApologeticsHit[]>({ reducer: (a, b) => a.concat(b), default: () => [] }),
  memory: Annotation<MemoryContext | null>({ reducer: (_a, b) => b, default: () => null }),
  argumentList: Annotation<SpecialistArgument[]>({ reducer: (a, b) => a.concat(b), default: () => [] }),
  specialistsFired: Annotation<string[]>({ reducer: (a, b) => a.concat(b), default: () => [] }),

  // Synthesize/critic loop.
  draft: Annotation<string>({ reducer: (_a, b) => b, default: () => '' }),
  verification: Annotation<CitationVerification | null>({ reducer: (_a, b) => b, default: () => null }),
  corrections: Annotation<number>({ reducer: (_a, b) => b, default: () => 0 }),

  // Output.
  answer: Annotation<string>({ reducer: (_a, b) => b, default: () => '' }),
});

type State = typeof GraphState.State;

// ── Specialist personas ───────────────────────────────────────────────────────
// Each returns a concise (≤130-word) argument from its angle, grounded only in
// the evidence handed to it. The synthesizer merges them.
const PERSONAS: Record<string, string> = {
  exegete:
    'You are a careful biblical exegete. Interpret the retrieved verses in their literary and canonical context and explain how they bear on the question. Ground every claim in the provided verses and cite their references. Do not cite verses not provided.',
  historian:
    'You are a historical-evidence apologist. Address the question with historical reasoning — manuscript transmission and reliability, the resurrection, and extra-biblical corroboration — at a rigorous but accessible level.',
  philosopher:
    'You are an analytic philosopher of religion. Address the logical and philosophical structure of the question (e.g. the problem of evil, the moral argument, coherence of theism) with clear, valid reasoning.',
  scientist:
    'You are a science-and-faith specialist. Frame the question through the relationship of science and faith — the "how vs. why" distinction, cosmic fine-tuning, and non-overlapping domains — without overclaiming on either side.',
  pastor:
    'You are a pastoral counselor. Respond with warmth, empathy, and gentleness, honoring the person\'s lived experience. Offer comfort and hope more than argument, and keep any Scripture tender and apt.',
  culturalist:
    'You are a cultural-engagement specialist. Address the modern, cultural dimension of the question — why it resonates today and how the Christian view speaks into contemporary life — charitably and without caricature.',
};

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

// Shared reasoning call for a specialist: focused persona + its own evidence.
async function reason(
  state: State,
  name: string,
  evidenceText: string
): Promise<string> {
  const persona = PERSONAS[name];
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: `${persona}\n\nBe concise: at most ~130 words. This is one perspective that will be merged with others, so do not write a full answer — contribute your angle.` },
    { role: 'user', content: `Question: ${state.message}\n\nEvidence available to you:\n${evidenceText || '(no retrieval — reason from established knowledge and be explicit about uncertainty)'}` },
  ];
  try {
    const resp = await getOpenAI().chat.completions.create({
      model: SPECIALIST_MODEL,
      max_tokens: 400,
      temperature: 0.5,
      messages,
    });
    return resp.choices[0].message.content?.trim() || '';
  } catch (err) {
    logger.error(`graph.specialist.${name} failed`, { cid: state.cid }, err as Error);
    return '';
  }
}

// Exegete (ALWAYS): retrieves Scripture from bible-verses + reasons over it.
async function exegeteNode(state: State): Promise<Partial<State>> {
  let scripture: ScriptureHit[] = [];
  try {
    const results = await BibleVersesIndex.search(state.versionId, state.message, 5);
    scripture = results.map(r => ({ reference: r.reference, text: r.text, score: Number(r.score.toFixed(3)) }));
  } catch (err) {
    logger.error('graph.exegete.retrieval failed', { cid: state.cid }, err as Error);
  }
  const evidence = scripture.length
    ? scripture.map(s => `- ${s.reference}: "${s.text}"`).join('\n')
    : '';
  const text = await reason(state, 'exegete', evidence);
  return { scripture, argumentList: [{ specialist: 'exegete', text }], specialistsFired: ['exegete'] };
}

// Knowledge-base specialists: retrieve apologetics KB (scoped by category) + reason.
function makeKbSpecialist(name: string, category?: string) {
  return async function (state: State): Promise<Partial<State>> {
    let apologetics: ApologeticsHit[] = [];
    try {
      // Semantic retrieval from the integrated `apologetics-kb` index (Pinecone
      // embeds the query). `category` narrows results for the clean 1:1 mappings;
      // the philosopher passes none (problem-of-evil is category `theological`).
      const results = await ApologeticsKbIndex.search(state.message, { category, topK: 3 });
      apologetics = results.map(r => ({
        title: r.title,
        category: r.category,
        scriptures: r.scriptures,
        content: r.content.length > 600 ? `${r.content.slice(0, 600)}…` : r.content,
      }));
    } catch (err) {
      logger.error(`graph.${name}.retrieval failed`, { cid: state.cid }, err as Error);
    }
    const evidence = apologetics.length
      ? apologetics.map(a => `- [${a.category}] ${a.title}: ${a.content}`).join('\n')
      : '';
    const text = await reason(state, name, evidence);
    return { apologetics, argumentList: [{ specialist: name, text }], specialistsFired: [name] };
  };
}

// Pastor: pulls conversation memory (if any) + reasons with empathy.
async function pastorNode(state: State): Promise<Partial<State>> {
  let memory: MemoryContext | null = null;
  if (state.conversationId && state.userId) {
    try {
      const mem = await MemoryService.getEnhancedConversationContext(
        state.conversationId, state.userId, state.message, 10
      );
      if (mem && mem.messages?.length) {
        const relevant = mem.messages
          .filter((m: any) => m.relevance > 0.7).slice(0, 5)
          .map((m: any) => `${m.role}: ${m.content}`);
        memory = { keyTopics: mem.keyTopics || [], emotionalTone: mem.emotionalTone || 'neutral', relevant };
      }
    } catch (err) {
      logger.error('graph.pastor.memory failed', { cid: state.cid }, err as Error);
    }
  }
  const evidence = memory
    ? `Prior context — topics: ${memory.keyTopics.join(', ') || 'none'}; emotional tone: ${memory.emotionalTone}.`
    : '';
  const text = await reason(state, 'pastor', evidence);
  return { memory, argumentList: [{ specialist: 'pastor', text }], specialistsFired: ['pastor'] };
}

// Synthesize the final answer from the specialists' arguments + evidence.
async function synthesizeNode(state: State): Promise<Partial<State>> {
  const answerModel = state.mode === 'gentle' ? 'gpt-4o-mini' : 'gpt-4o';
  const maxTokens = state.mode === 'gentle' ? 2000 : 4000;
  const temperature = state.mode === 'gentle' ? 0.7 : 0.8;

  const evidence = buildEvidenceBlock(state);
  const perspectives = state.argumentList
    .filter(a => a.text)
    .map(a => `[${a.specialist}] ${a.text}`)
    .join('\n\n');

  const correction = state.verification && !state.verification.ok
    ? `\n\nYour previous draft cited unverifiable Scripture: ${state.verification.hallucinated.join('; ')}. ` +
      'Rewrite using ONLY verses from the evidence above. Keep the same tone and length.'
    : '';

  const synthInstruction =
    'Below are perspectives from specialist advisors and the retrieved evidence. ' +
    'Weave them into ONE coherent, well-structured answer to the user in your own voice — ' +
    'do not list the advisors or label sections by specialist. Ground every theological ' +
    'claim in the provided Scripture and cite references explicitly; never cite a verse ' +
    'that is not in the evidence.';

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: state.systemPrompt },
    ...state.history,
    {
      role: 'user',
      content: `${state.message}\n\n---\n${synthInstruction}\n\nSPECIALIST PERSPECTIVES:\n${perspectives || '(none)'}\n\nRETRIEVED EVIDENCE:\n${evidence}${correction}`,
    },
  ];

  const resp = await getOpenAI().chat.completions.create({ model: answerModel, max_tokens: maxTokens, temperature, messages });
  const draft = resp.choices[0].message.content || '';
  logger.debug('graph.synthesize', { cid: state.cid, revision: state.corrections, specialists: state.specialistsFired, len: draft.length });
  return { draft };
}

// Verify citations in the draft (reuses the Step-1 verifier).
async function criticNode(state: State): Promise<Partial<State>> {
  const verification = await verifyCitations(state.draft, state.versionId, { cid: state.cid });
  const passed = verification.ok || verification.skipped;
  logger.info('graph.critic', {
    cid: state.cid, ok: verification.ok, hallucinated: verification.hallucinated, revision: state.corrections,
  });
  return {
    verification,
    answer: state.draft,
    corrections: passed ? state.corrections : state.corrections + 1,
  };
}

// ── Edges ─────────────────────────────────────────────────────────────────────

// Deterministic router: the exegete always fires (Scripture floor); add the
// specialist(s) matching the objection's primary (and secondary) type.
function dispatchSpecialists(state: State): string[] {
  const targets = new Set<string>(['exegete']);
  const add = (t: string | undefined) => {
    switch (t) {
      case 'historical': targets.add('historian'); break;
      case 'logical':
      case 'philosophical':
      case 'moral': targets.add('philosopher'); break;
      case 'scientific': targets.add('scientist'); break;
      case 'emotional':
      case 'personal': targets.add('pastor'); break;
      case 'cultural': targets.add('culturalist'); break;
    }
  };
  add(state.objection.primaryType);
  add(state.objection.secondaryType);
  // Pastoral support whenever there's an ongoing conversation to draw on.
  if (state.conversationId) targets.add('pastor');
  return Array.from(targets);
}

// After the critic: loop back to synthesize while there are unresolved refs and
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
    .addNode('exegete', exegeteNode)
    .addNode('historian', makeKbSpecialist('historian', 'historical'))
    // Philosopher covers logical/moral/philosophical — the "problem of evil" KB
    // entry is category `theological`, so search unfiltered (relevance) here.
    .addNode('philosopher', makeKbSpecialist('philosopher'))
    .addNode('scientist', makeKbSpecialist('scientist', 'scientific'))
    .addNode('pastor', pastorNode)
    .addNode('culturalist', makeKbSpecialist('culturalist', 'cultural'))
    .addNode('synthesize', synthesizeNode)
    .addNode('critic', criticNode)
    .addEdge(START, 'analyze')
    // Deterministic fan-out from analyze to the chosen specialists.
    .addConditionalEdges('analyze', dispatchSpecialists, ['exegete', 'historian', 'philosopher', 'scientist', 'pastor', 'culturalist'])
    // Fan-in: synthesize runs once all dispatched specialists complete.
    .addEdge('exegete', 'synthesize')
    .addEdge('historian', 'synthesize')
    .addEdge('philosopher', 'synthesize')
    .addEdge('scientist', 'synthesize')
    .addEdge('pastor', 'synthesize')
    .addEdge('culturalist', 'synthesize')
    .addEdge('synthesize', 'critic')
    // Reflection loop.
    .addConditionalEdges('critic', decideAfterCritic, { revise: 'synthesize', done: END });

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
  specialists: string[];
  evidence: { scripture: number; apologetics: number; memory: boolean };
}

/**
 * Run the graph to completion and return the answer + telemetry. Buffers the
 * full answer (the critic must run before the answer is final). Streaming is
 * available via `graph.stream(..., { streamMode: 'messages' })` when a route
 * needs it.
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
    specialists: final.specialistsFired,
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
    // De-duplicate apologetics entries (parallel specialists may fetch overlaps).
    const seen = new Set<string>();
    const unique = state.apologetics.filter(a => (seen.has(a.title) ? false : (seen.add(a.title), true)));
    parts.push('Apologetics knowledge base:\n' + unique
      .map(a => `- [${a.category}] ${a.title}: ${a.content} (key: ${a.scriptures.join(', ') || 'none'})`)
      .join('\n'));
  }
  if (state.memory) {
    parts.push(`Prior context — topics: ${state.memory.keyTopics.join(', ') || 'none'}; tone: ${state.memory.emotionalTone}.`);
  }
  return parts.length ? parts.join('\n\n') : '(no retrieved evidence — answer from general knowledge and be explicit about uncertainty)';
}
