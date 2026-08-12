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
 * Both TARGET arms (graph, chat-rag) now generate with Claude (see lib/llm.ts).
 * The JUDGE stays on OpenAI (gpt-4o-mini) on purpose: a cross-provider judge
 * avoids the self-preference bias a Claude judge would have over Claude answers.
 *
 * Requires: ANTHROPIC_API_KEY (targets) + OPENAI_API_KEY (judge) + PINECONE_API_KEY
 * + BIBLE_API_KEY (+ LANGSMITH_API_KEY for the dataset/experiment UI).
 * Env knobs: EVAL_LIMIT (cap cases), EVAL_ARMS=graph,chatrag, EVAL_JUDGE_MODEL.
 */

import { Client } from 'langsmith';
import { evaluate } from 'langsmith/evaluation';
import { EVAL_CASES } from './dataset';
import { runApologeticsGraph } from '../../apps/web/lib/graph/apologetics-graph';
import { verifyCitations } from '../../apps/web/lib/citation-verifier';
import { BibleVersesIndex } from '../../apps/web/lib/bible-verses-index';
import { complete, MODELS } from '../../apps/web/lib/llm';
// The judge only — targets use Claude via `complete()` above.
import { getTracedOpenAI } from '../../apps/web/lib/observability/openai-traced';

// Trace the target runs into the same project the app uses.
process.env.LANGSMITH_TRACING ||= 'true';
process.env.LANGSMITH_PROJECT ||= 'langgraph-rag';

const NS = process.env.BIBLE_VERSES_NAMESPACE_EVAL || 'de4e12af7f28f599-02';
const DATASET_NAME = process.env.EVAL_DATASET || 'apologetics-eval';
// Judge is an OpenAI model on purpose (cross-provider = unbiased over Claude
// answers). gpt-4o-mini: high TPM, ~15× cheaper than gpt-4o, run costs cents.
// Override with EVAL_JUDGE_MODEL=gpt-4o for a higher-fidelity (pricier) judge.
const JUDGE_MODEL = process.env.EVAL_JUDGE_MODEL || 'gpt-4o-mini';
const ARMS = (process.env.EVAL_ARMS || 'graph,chatrag').split(',').map((s) => s.trim());
const LIMIT = Number(process.env.EVAL_LIMIT || 0);

const cases = LIMIT > 0 ? EVAL_CASES.slice(0, LIMIT) : EVAL_CASES;

// Local mode tabulates in-process and skips the LangSmith dataset/experiment
// upload — useful when only an ingest-scoped LANGSMITH_API_KEY is available (a
// Vercel "Sensitive" var pulls back as "[SENSITIVE]", which can't manage datasets).
const LANGSMITH_KEY_USABLE = !!process.env.LANGSMITH_API_KEY && process.env.LANGSMITH_API_KEY.length >= 20;
const LOCAL = process.env.EVAL_LOCAL === '1' || !LANGSMITH_KEY_USABLE;

function requireEnv() {
  // ANTHROPIC_API_KEY → target arms; OPENAI_API_KEY → the judge.
  const needed = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'PINECONE_API_KEY', 'BIBLE_API_KEY'];
  if (!LOCAL) needed.unshift('LANGSMITH_API_KEY');
  const missing = needed.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing env: ${missing.join(', ')}. Pull them with \`vercel env pull\` (see header).`);
    process.exit(1);
  }
}

// Retry on 429 (TPM caps — this org's gpt-4o is 30k TPM), honoring the
// "try again in Xms" hint when present, else exponential backoff.
async function withRetry<T>(fn: () => Promise<T>, tries = 6): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const is429 = err?.status === 429 || /rate limit/i.test(err?.message || '');
      if (!is429 || i >= tries) throw err;
      const hint = /try again in ([\d.]+)(ms|s)/i.exec(err?.message || '');
      const waitMs = hint ? Number(hint[1]) * (hint[2] === 's' ? 1000 : 1) + 250 : Math.min(2 ** i * 500, 8000);
      await new Promise((r) => setTimeout(r, waitMs));
    }
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
  const gentle = inputs.mode === 'gentle';
  const systemPrompt =
    'You are Shield AI, a Christian AI assistant that provides biblically-grounded ' +
    'responses. Use the provided Bible verses to support your answer and cite specific ' +
    'references. Ground theological claims in the verses provided.' +
    (context ? `\n\nRELEVANT BIBLE VERSES:\n${context}` : '');
  // Mirror the updated chat-rag route: tiered model, no temperature, thinking headroom.
  const answer = await withRetry(() => complete({
    system: systemPrompt,
    messages: [{ role: 'user', content: inputs.question }],
    model: gentle ? MODELS.gentle : MODELS.deep,
    maxTokens: gentle ? 3000 : 6000,
    effort: gentle ? 'medium' : 'high',
  }));
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

// Multi-dimension LLM-judge (absolute). Scores 5 dimensions 1-10 with explicit
// anchors and a spread instruction, then averages — this breaks the ceiling the
// old single 1-5 score hit (both arms landed ~4.3). `breadth` specifically
// rewards engaging multiple relevant angles (where multi-agent should show up).
const QUALITY_DIMENSIONS = ['groundedness', 'addresses', 'depth', 'breadth', 'tone'] as const;
async function answerQuality({ inputs, outputs }: any) {
  const rubric =
    'You are a demanding apologetics evaluator. Score the answer on each dimension 1-10 (10 best). ' +
    'USE THE FULL RANGE: reserve 9-10 for genuinely excellent, 5-6 for adequate-but-generic, ≤4 for weak. ' +
    'Do not reward length or verbosity — judge substance.\n' +
    '- groundedness: claims supported by the cited Scripture; no fabricated or misapplied verses.\n' +
    '- addresses: directly and specifically answers THIS objection, not a generic essay.\n' +
    '- depth: substantive, specific reasoning vs surface-level platitudes.\n' +
    '- breadth: engages the multiple relevant angles the question raises (e.g. historical AND moral).\n' +
    '- tone: fits the requested mode and is pastorally appropriate where relevant.\n' +
    'Return JSON: {"groundedness":n,"addresses":n,"depth":n,"breadth":n,"tone":n,"reason":"<one sentence>"}.';
  try {
    const resp = await withRetry(() => getTracedOpenAI().chat.completions.create({
      model: JUDGE_MODEL,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: rubric },
        { role: 'user', content: `Mode: ${inputs.mode}\nQuestion: ${inputs.question}\n\nAnswer:\n${outputs?.answer || '(empty)'}` },
      ],
    }));
    const p = JSON.parse(resp.choices[0].message.content || '{}');
    const vals = QUALITY_DIMENSIONS.map((d) => Math.max(1, Math.min(10, Number(p[d]) || 1)));
    const mean10 = vals.reduce((a, b) => a + b, 0) / vals.length;
    return { key: 'answer_quality', score: +((mean10 - 1) / 9).toFixed(4), comment: String(p.reason || '') };
  } catch (err) {
    return { key: 'answer_quality', score: 0, comment: `judge failed: ${(err as Error).message}` };
  }
}

// Blinded pairwise judge — the discriminating metric. Sees both answers in a
// RANDOMIZED order (caller supplies the mapping) and picks the better one with a
// margin. Pairwise comparison avoids the absolute-score ceiling entirely.
async function pairwiseJudge(question: string, mode: string, answerA: string, answerB: string) {
  const rubric =
    'Two answers (A and B) to the same apologetics question. Decide which BETTER satisfies: ' +
    'groundedness in cited Scripture, directly addressing the objection, depth and specificity, ' +
    'engaging the multiple relevant angles the question raises, and appropriate tone. ' +
    'Avoid any bias toward length or verbosity — judge substance. If truly indistinguishable, say "tie". ' +
    'Return JSON: {"winner":"A"|"B"|"tie","margin":1-3,"reason":"<one sentence>"} (margin 1=slight, 3=decisive).';
  try {
    const resp = await withRetry(() => getTracedOpenAI().chat.completions.create({
      model: JUDGE_MODEL,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: rubric },
        { role: 'user', content: `Mode: ${mode}\nQuestion: ${question}\n\n--- Answer A ---\n${answerA || '(empty)'}\n\n--- Answer B ---\n${answerB || '(empty)'}` },
      ],
    }));
    const p = JSON.parse(resp.choices[0].message.content || '{}');
    const winner = p.winner === 'A' || p.winner === 'B' ? p.winner : 'tie';
    return { winner, margin: Math.max(1, Math.min(3, Number(p.margin) || 1)), reason: String(p.reason || '') };
  } catch (err) {
    return { winner: 'tie' as const, margin: 1, reason: `judge failed: ${(err as Error).message}` };
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

// Run an async fn over items with a bounded concurrency pool.
async function mapPool<T, R>(items: T[], n: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
    }
  }));
  return out;
}

// ── Local tabulation: per-arm absolute metrics + BLINDED PAIRWISE head-to-head ──
async function runLocal() {
  const accG: Record<string, { n: number; total: number }> = {};
  const accC: Record<string, { n: number; total: number }> = {};
  const add = (acc: typeof accG, k: string, v: number) => { acc[k] ??= { n: 0, total: 0 }; acc[k].n += 1; acc[k].total += v; };
  let gWins = 0, cWins = 0, ties = 0, gMargin = 0, cMargin = 0, fails = 0;

  const conc = Number(process.env.EVAL_CONCURRENCY || 2);
  process.stdout.write(`\n▶ graph vs chat-rag, ${cases.length} cases @ concurrency ${conc} `);

  await mapPool(cases, conc, async (c) => {
    const inputs = { question: c.question, mode: c.mode };
    const refOut = { isTheological: c.isTheological, expectedObjectionType: c.expectedObjectionType, stance: c.stance };
    try {
      const [outG, outC] = await Promise.all([graphTarget(inputs), chatragTarget(inputs)]);
      // Per-arm absolute metrics.
      for (const [acc, out] of [[accG, outG], [accC, outC]] as const) {
        add(acc, 'citation_faithfulness', citationFaithfulness({ outputs: out }).score);
        add(acc, 'scripture_floor', scriptureFloor({ outputs: out, referenceOutputs: refOut }).score);
        add(acc, 'answer_quality', (await answerQuality({ inputs, outputs: out })).score);
        add(acc, 'latency_ms', latency({ outputs: out }).score);
      }
      // Blinded pairwise: randomize which arm is shown as "A".
      const gIsA = Math.random() < 0.5;
      const j = await pairwiseJudge(c.question, c.mode, gIsA ? outG.answer : outC.answer, gIsA ? outC.answer : outG.answer);
      if (j.winner === 'tie') ties++;
      else {
        const graphWon = (j.winner === 'A') === gIsA;
        if (graphWon) { gWins++; gMargin += j.margin; } else { cWins++; cMargin += j.margin; }
      }
      process.stdout.write('.');
    } catch (err) {
      fails++; process.stdout.write('!');
      console.error(`\n  ${c.id} failed: ${(err as Error).message}`);
    }
  });

  const mean = (acc: typeof accG, k: string) => (acc[k] ? +(acc[k].total / acc[k].n).toFixed(3) : null);
  const rows = [
    { arm: 'graph', acc: accG }, { arm: 'chatrag', acc: accC },
  ].map(({ arm, acc }) => ({ arm, n: acc['latency_ms']?.n ?? 0, citation: mean(acc, 'citation_faithfulness'), floor: mean(acc, 'scripture_floor'), quality: mean(acc, 'answer_quality'), latencyMs: mean(acc, 'latency_ms') }));

  console.log('\n\n=== Per-arm means (citation/floor/quality 0–1, higher better) ===');
  const head = ['arm', 'n', 'citation', 'floor', 'quality', 'latency ms'];
  const data = rows.map(r => [r.arm, String(r.n), String(r.citation), String(r.floor), String(r.quality), String(Math.round(r.latencyMs ?? 0))]);
  const w = head.map((h, i) => Math.max(h.length, ...data.map(d => d[i].length)));
  const line = (cols: string[]) => cols.map((c, i) => c.padEnd(w[i])).join('  ');
  console.log(line(head)); console.log(w.map(x => '─'.repeat(x)).join('  '));
  for (const d of data) console.log(line(d));

  const decided = gWins + cWins;
  console.log('\n=== Blinded pairwise (graph vs chat-rag) ===');
  console.log(`  graph wins:   ${gWins}  (avg margin ${gWins ? (gMargin / gWins).toFixed(2) : '—'})`);
  console.log(`  chatrag wins: ${cWins}  (avg margin ${cWins ? (cMargin / cWins).toFixed(2) : '—'})`);
  console.log(`  ties:         ${ties}${fails ? `   (fails: ${fails})` : ''}`);
  if (decided) console.log(`  graph win-rate among decided: ${((gWins / decided) * 100).toFixed(0)}%`);
}

// ── Runner ───────────────────────────────────────────────────────────────────
async function main() {
  requireEnv();
  if (LOCAL) {
    console.log(`LOCAL mode (no LangSmith dataset write). Cases: ${cases.length}, arms: ${ARMS.join(', ')}, judge: ${JUDGE_MODEL}.`);
    if (process.env.EVAL_LOCAL !== '1') console.log('  (reason: no management-capable LANGSMITH_API_KEY — see header to enable the LangSmith UI.)');
    await runLocal();
    console.log('\n✓ Done.');
    return;
  }
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
