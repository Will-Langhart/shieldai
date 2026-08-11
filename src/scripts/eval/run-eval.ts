/**
 * Graph vs chat-rag eval (Phase 4, Workstream A) — the ship/kill harness.
 *
 * Runs the curated `EVAL_CASES` through BOTH arms IN-PROCESS (no HTTP / auth):
 *   - graph    → runApologeticsGraph (router → specialists → synthesize → critic)
 *   - chat-rag → the same retrieve-from-bible-verses + generate the route does
 * and scores each with LangSmith evaluators (citation faithfulness, Scripture
 * floor, LLM-judged quality, latency). Uploads a reusable dataset and two
 * experiments to LangSmith so the rollout decision has real numbers + a UI.
 *
 * Run (needs real keys — pull them from Vercel):
 *   cd src/apps/web && vercel env pull ../../scripts/eval/.env.eval
 *   cd ../../.. && npx tsx --env-file=src/scripts/eval/.env.eval src/scripts/eval/run-eval.ts
 *
 * Requires: LANGSMITH_API_KEY, OPENAI_API_KEY, PINECONE_API_KEY, BIBLE_API_KEY.
 * Env knobs: EVAL_LIMIT (cap cases), EVAL_ARMS=graph,chatrag, EVAL_JUDGE_MODEL.
 */

import { Client } from 'langsmith';
import { evaluate } from 'langsmith/evaluation';
import { EVAL_CASES } from './dataset';
import { runApologeticsGraph } from '../../apps/web/lib/graph/apologetics-graph';
import { verifyCitations } from '../../apps/web/lib/citation-verifier';
import { BibleVersesIndex } from '../../apps/web/lib/bible-verses-index';
import { getTracedOpenAI } from '../../apps/web/lib/observability/openai-traced';

// Trace the target runs into the same project the app uses.
process.env.LANGSMITH_TRACING ||= 'true';
process.env.LANGSMITH_PROJECT ||= 'langgraph-rag';

const NS = process.env.BIBLE_VERSES_NAMESPACE_EVAL || 'de4e12af7f28f599-02';
const DATASET_NAME = process.env.EVAL_DATASET || 'apologetics-eval';
const JUDGE_MODEL = process.env.EVAL_JUDGE_MODEL || 'gpt-4o';
const ARMS = (process.env.EVAL_ARMS || 'graph,chatrag').split(',').map((s) => s.trim());
const LIMIT = Number(process.env.EVAL_LIMIT || 0);

const cases = LIMIT > 0 ? EVAL_CASES.slice(0, LIMIT) : EVAL_CASES;

function requireEnv() {
  const missing = ['LANGSMITH_API_KEY', 'OPENAI_API_KEY', 'PINECONE_API_KEY', 'BIBLE_API_KEY'].filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing env: ${missing.join(', ')}. Pull them with \`vercel env pull\` (see header).`);
    process.exit(1);
  }
}

// ── Targets (produce the outputs each evaluator scores) ─────────────────────
async function graphTarget(inputs: Record<string, any>) {
  const started = Date.now();
  const r = await runApologeticsGraph({
    message: inputs.question,
    mode: inputs.mode,
    versionId: NS,
    userId: 'eval-user',
    cid: `eval_graph_${Date.now()}`,
  });
  return {
    answer: r.answer,
    verification: r.verification,
    specialists: r.specialists,
    objectionType: r.objectionType,
    corrections: r.corrections,
    latencyMs: Date.now() - started,
  };
}

// Mirror chat-rag's retrieval + generation, then verify citations for parity.
async function chatragTarget(inputs: Record<string, any>) {
  const started = Date.now();
  const verses = await BibleVersesIndex.search(NS, inputs.question, 5);
  const context = verses.map((v, i) => `${i + 1}. ${v.reference}: "${v.text}"`).join('\n');
  const model = inputs.mode === 'gentle' ? 'gpt-4o-mini' : 'gpt-4o';
  const systemPrompt =
    'You are Shield AI, a Christian AI assistant that provides biblically-grounded ' +
    'responses. Use the provided Bible verses to support your answer and cite specific ' +
    'references. Ground theological claims in the verses provided.' +
    (context ? `\n\nRELEVANT BIBLE VERSES:\n${context}` : '');
  const resp = await getTracedOpenAI().chat.completions.create({
    model,
    temperature: inputs.mode === 'gentle' ? 0.7 : 0.8,
    max_tokens: inputs.mode === 'gentle' ? 2000 : 4000,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: inputs.question },
    ],
  });
  const answer = resp.choices[0].message.content || '';
  const verification = await verifyCitations(answer, NS, { cid: `eval_chatrag_${Date.now()}` });
  return { answer, verification, latencyMs: Date.now() - started };
}

// ── Evaluators ───────────────────────────────────────────────────────────────
// Answer cites only real, correctly-quoted verses (from the critic/verifier).
function citationFaithfulness({ outputs }: any) {
  const v = outputs?.verification;
  const ok = !v || v.ok || v.skipped;
  return {
    key: 'citation_faithfulness',
    score: ok ? 1 : 0,
    comment: v ? `hallucinated=${v.hallucinated?.length ?? 0} misquoted=${v.misquoted?.length ?? 0} checked=${v.checked ?? 0}` : 'no verification',
  };
}

// Theological objections must cite ≥1 real verse (the Scripture floor).
function scriptureFloor({ outputs, referenceOutputs }: any) {
  if (!referenceOutputs?.isTheological) {
    return { key: 'scripture_floor', score: 1, comment: 'n/a (non-theological)' };
  }
  const v = outputs?.verification;
  const grounded = v && (v.checked ?? 0) >= 1 && (v.hallucinated?.length ?? 0) === 0;
  return { key: 'scripture_floor', score: grounded ? 1 : 0, comment: `checked=${v?.checked ?? 0}` };
}

// LLM-judge: groundedness, addresses-objection, tone-match, pastoral care.
async function answerQuality({ inputs, outputs }: any) {
  const rubric =
    'Score this apologetics answer 1-5 (5 best) on: (a) groundedness in the cited Scripture, ' +
    '(b) directly addressing the objection, (c) tone appropriate to the mode, (d) pastoral ' +
    'sensitivity where relevant. Return JSON: {"score": <1-5>, "reason": "<one sentence>"}.';
  try {
    const resp = await getTracedOpenAI().chat.completions.create({
      model: JUDGE_MODEL,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: rubric },
        { role: 'user', content: `Mode: ${inputs.mode}\nQuestion: ${inputs.question}\n\nAnswer:\n${outputs?.answer || '(empty)'}` },
      ],
    });
    const parsed = JSON.parse(resp.choices[0].message.content || '{}');
    const raw = Math.max(1, Math.min(5, Number(parsed.score) || 1));
    return { key: 'answer_quality', score: (raw - 1) / 4, comment: String(parsed.reason || '') };
  } catch (err) {
    return { key: 'answer_quality', score: 0, comment: `judge failed: ${(err as Error).message}` };
  }
}

function latency({ outputs }: any) {
  return { key: 'latency_ms', score: Number(outputs?.latencyMs ?? 0) };
}

// ── Dataset upload ─────────────────────────────────────────────────────────
async function ensureDataset(client: Client): Promise<string> {
  try {
    const existing = await client.readDataset({ datasetName: DATASET_NAME });
    console.log(`Dataset "${DATASET_NAME}" exists (${existing.id}).`);
    return existing.id as string;
  } catch {
    const ds = await client.createDataset(DATASET_NAME, {
      description: 'Shield AI apologetics eval — 8 objection types × stances (Phase 4 WA).',
    });
    await client.createExamples({
      inputs: cases.map((c) => ({ question: c.question, mode: c.mode })),
      outputs: cases.map((c) => ({ expectedObjectionType: c.expectedObjectionType, isTheological: c.isTheological, stance: c.stance })),
      datasetId: ds.id,
    });
    console.log(`Created dataset "${DATASET_NAME}" with ${cases.length} examples.`);
    return ds.id as string;
  }
}

// ── Runner ───────────────────────────────────────────────────────────────────
async function main() {
  requireEnv();
  const client = new Client();
  await ensureDataset(client);

  const evaluators = [citationFaithfulness, scriptureFloor, answerQuality, latency];
  const targets: Record<string, (i: Record<string, any>) => Promise<any>> = { graph: graphTarget, chatrag: chatragTarget };

  for (const arm of ARMS) {
    const target = targets[arm];
    if (!target) { console.warn(`Unknown arm "${arm}" — skipping.`); continue; }
    console.log(`\n▶ Running arm: ${arm} …`);
    const results = await evaluate((inputs: Record<string, any>) => target(inputs), {
      data: DATASET_NAME,
      evaluators: evaluators as any,
      experimentPrefix: `shieldai-${arm}`,
      maxConcurrency: Number(process.env.EVAL_CONCURRENCY || 3),
      metadata: { arm },
    });
    // Print a compact per-arm mean for each metric.
    const sums: Record<string, { n: number; total: number }> = {};
    for (const row of (results as any).results ?? []) {
      for (const r of row.evaluationResults?.results ?? []) {
        const k = r.key as string;
        sums[k] ??= { n: 0, total: 0 };
        sums[k].n += 1; sums[k].total += Number(r.score ?? 0);
      }
    }
    console.log(`  ${arm} means:`, Object.fromEntries(Object.entries(sums).map(([k, v]) => [k, +(v.total / Math.max(v.n, 1)).toFixed(3)])));
  }

  console.log('\n✓ Done. Open LangSmith → Datasets & Experiments → "' + DATASET_NAME + '" to compare arms side-by-side.');
}

main().catch((err) => { console.error(err); process.exit(1); });
