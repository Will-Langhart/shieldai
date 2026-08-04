/**
 * Scripture guard subgraph (Step 3) — the reusable no-hallucinated-verses gate.
 *
 * A small, generic LangGraph subgraph that wraps any JSON-producing LLM call in
 * a generate → verify → correct-once loop:
 *
 *   START → generate ──▶ critic ──▶ END
 *              ▲            │  unresolved refs & under cap?
 *              └──revise────┘
 *
 * The chat graph (`apologetics-graph.ts`) verifies prose citations; this variant
 * verifies references emitted in STRUCTURED output, so the Bible AI endpoints
 * (`/api/bible/ai-insights`, `/api/bible/study-questions`) inherit the same
 * guarantee without a rewrite. Both share `citation-verifier.ts`.
 *
 * Generic over the caller's output shape: the caller supplies `generate` (its
 * own LLM call) and `extractReferences` (pull refs from its own JSON fields).
 */

import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { verifyReferences, type ReferenceVerification } from '../citation-verifier';
import { logger } from '../logger';

const DEFAULT_MAX_CORRECTIONS = Number(process.env.GRAPH_MAX_CORRECTIONS || 1);

export interface ScriptureGuardOptions {
  /** Produce the model's raw output. `correctionNote` is '' on the first pass
   *  and names the unverifiable references on a revision — append it to the
   *  prompt when non-empty. */
  generate: (correctionNote: string) => Promise<string>;
  /** Pull Scripture references from the raw output. The caller parses its own
   *  shape; return canonicalized refs (e.g. via `extractScriptureReferences`).
   *  Return [] when nothing is verifiable (parse failure, no refs). */
  extractReferences: (raw: string) => string[];
  versionId: string;
  cid: string;
  /** Max correction rounds. Defaults to GRAPH_MAX_CORRECTIONS (1). */
  maxCorrections?: number;
}

const GuardState = Annotation.Root({
  raw: Annotation<string>({ reducer: (_a, b) => b, default: () => '' }),
  verification: Annotation<ReferenceVerification | null>({ reducer: (_a, b) => b, default: () => null }),
  corrections: Annotation<number>({ reducer: (_a, b) => b, default: () => 0 }),
  correctionNote: Annotation<string>({ reducer: (_a, b) => b, default: () => '' }),
});
type GuardStateT = typeof GuardState.State;

export function buildScriptureGuardGraph(opts: ScriptureGuardOptions) {
  const cap = opts.maxCorrections ?? DEFAULT_MAX_CORRECTIONS;

  const generateNode = async (state: GuardStateT): Promise<Partial<GuardStateT>> => {
    const raw = await opts.generate(state.correctionNote);
    return { raw };
  };

  const criticNode = async (state: GuardStateT): Promise<Partial<GuardStateT>> => {
    let references: string[] = [];
    try {
      references = opts.extractReferences(state.raw);
    } catch (err) {
      logger.warn('scriptureGuard.extract failed', { cid: opts.cid }, err as Error);
    }
    const verification = await verifyReferences(references, opts.versionId, { cid: opts.cid });
    const passed = verification.ok || verification.skipped;
    const note = passed
      ? ''
      : `Some Scripture references in your previous response do not resolve to real passages and must be replaced with real, correctly-numbered verses (or removed): ${verification.hallucinated.join('; ')}. Return the exact same JSON shape.`;
    logger.info('scriptureGuard.critic', {
      cid: opts.cid, ok: verification.ok, hallucinated: verification.hallucinated, revision: state.corrections,
    });
    return { verification, correctionNote: note, corrections: passed ? state.corrections : state.corrections + 1 };
  };

  const decide = (state: GuardStateT): 'revise' | 'done' => {
    const v = state.verification;
    if (v && !v.ok && !v.skipped && state.corrections <= cap) return 'revise';
    return 'done';
  };

  return new StateGraph(GuardState)
    .addNode('generate', generateNode)
    .addNode('critic', criticNode)
    .addEdge(START, 'generate')
    .addEdge('generate', 'critic')
    .addConditionalEdges('critic', decide, { revise: 'generate', done: END })
    .compile();
}

export interface ScriptureGuardResult {
  /** Final (possibly corrected) raw model output — parse this as before. */
  raw: string;
  verification: ReferenceVerification | null;
  corrections: number;
}

/** Build the guard graph, run it to completion, and return the guarded output. */
export async function runScriptureGuarded(opts: ScriptureGuardOptions): Promise<ScriptureGuardResult> {
  const app = buildScriptureGuardGraph(opts);
  const final = await app.invoke({});
  return { raw: final.raw, verification: final.verification, corrections: final.corrections };
}
