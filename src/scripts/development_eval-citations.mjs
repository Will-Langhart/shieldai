#!/usr/bin/env node
/**
 * Citation eval harness — measures hallucinated-Scripture rates across the chat
 * arms and the Bible AI endpoints, so the "retire the old pipeline" decision
 * (roadmap step 4) has real numbers behind it.
 *
 * It fires a fixed set of hard theological questions + well-known passages at a
 * RUNNING server and tabulates, per endpoint/arm:
 *   - runs, avg latency
 *   - correction rate  (how often the guard had to regenerate — a proxy for the
 *     raw hallucination rate of the underlying model)
 *   - residual hallucinated refs (bad citations that survived the guard — should
 *     be ~0 if the guard is working)
 *
 * Usage:
 *   # 1. start the web server:  npm run dev:web   (port 3001)
 *   # 2. run against it:
 *   EVAL_TOKEN=<supabase-access-token> node src/scripts/development_eval-citations.mjs
 *
 * Env:
 *   EVAL_BASE_URL     default http://localhost:3001
 *   EVAL_TOKEN        Supabase access token — REQUIRED for chat arms (chat has no
 *                     test-token bypass). The user should be a developer
 *                     (DEVELOPER_EMAILS) or on a tier allowing debate mode.
 *   EVAL_BIBLE_TOKEN  default 'test-token' (the Bible endpoints accept it)
 *   EVAL_BIBLE_VERSION default de4e12af7f28f599-02
 *   EVAL_ARMS         comma list of chat arms: agentic,graph  (default both)
 *   EVAL_MOCK=1       skip HTTP; feed synthetic responses (self-test the harness)
 */

const BASE_URL = process.env.EVAL_BASE_URL || 'http://localhost:3001';
const CHAT_TOKEN = process.env.EVAL_TOKEN || '';
const BIBLE_TOKEN = process.env.EVAL_BIBLE_TOKEN || 'test-token';
const BIBLE_VERSION = process.env.EVAL_BIBLE_VERSION || 'de4e12af7f28f599-02';
const ARMS = (process.env.EVAL_ARMS || 'agentic,graph').split(',').map(s => s.trim()).filter(Boolean);
const MOCK = process.env.EVAL_MOCK === '1';

// ── Datasets ─────────────────────────────────────────────────────────────────
// Hard theological challenges — the objection types that trip the Scripture floor.
const CHAT_CASES = [
  { id: 'evil',        mode: 'debate',    q: 'If God is all-good and all-powerful, why does he allow gratuitous suffering?' },
  { id: 'resurrection',mode: 'scholarly', q: 'What historical evidence supports the bodily resurrection of Jesus?' },
  { id: 'contradiction',mode: 'debate',   q: 'The Gospels contradict each other about the resurrection accounts. How is the Bible reliable?' },
  { id: 'science',     mode: 'scholarly', q: 'Does the Genesis creation account conflict with modern cosmology and evolution?' },
  { id: 'hell',        mode: 'debate',    q: 'How is eternal conscious torment in hell compatible with a loving God?' },
  { id: 'canon',       mode: 'scholarly', q: 'Who decided which books belong in the Bible, and why trust that process?' },
];

// Well-known passages (reference + a short text stub the endpoints can work from).
const PASSAGE_CASES = [
  { reference: 'Romans 8:28',    text: 'And we know that in all things God works for the good of those who love him.' },
  { reference: 'John 3:16',      text: 'For God so loved the world that he gave his one and only Son.' },
  { reference: 'Philippians 4:13', text: 'I can do all this through him who gives me strength.' },
  { reference: 'Psalms 23:1',    text: 'The Lord is my shepherd, I lack nothing.' },
  { reference: 'Isaiah 53:5',    text: 'But he was pierced for our transgressions, he was crushed for our iniquities.' },
];

// ── HTTP ─────────────────────────────────────────────────────────────────────
async function postJSON(path, body, token) {
  const started = Date.now();
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    const ms = Date.now() - started;
    let json = null;
    try { json = await res.json(); } catch { /* non-JSON */ }
    return { status: res.status, ms, json };
  } catch (err) {
    return { status: 0, ms: Date.now() - started, json: null, error: err.message };
  }
}

// ── Telemetry extractors (per endpoint) ──────────────────────────────────────
// Normalize each endpoint's citation telemetry to { checked, hallucinated[], corrected }.
function extractChatAgentic(json) {
  const c = json?.agentic?.citations;
  return { checked: c?.checked ?? 0, hallucinated: c?.hallucinated ?? [], corrected: Boolean(json?.agentic?.citationCorrected) };
}
function extractChatGraph(json) {
  const c = json?.graph?.citations;
  return { checked: c?.checked ?? 0, hallucinated: c?.hallucinated ?? [], corrected: (json?.graph?.corrections ?? 0) > 0 };
}
function extractBible(json) {
  const c = json?.metadata?.citations;
  return { checked: c?.checked ?? 0, hallucinated: c?.hallucinated ?? [], corrected: (json?.metadata?.citation_corrections ?? 0) > 0 };
}

// ── Mock responses (self-test without a server / keys) ───────────────────────
function mockResponse(kind, seed) {
  const bad = seed % 3 === 0; // ~1/3 of cases "hallucinate" then get corrected
  const cit = { checked: 3, hallucinated: [], misquoted: [], skipped: false, ok: true };
  if (kind === 'agentic') return { status: 200, ms: 1800 + seed * 10, json: { response: 'x', agentic: { citations: cit, citationCorrected: bad } } };
  if (kind === 'graph')   return { status: 200, ms: 2600 + seed * 10, json: { response: 'x', graph: { citations: cit, corrections: bad ? 1 : 0 } } };
  return { status: 200, ms: 2200 + seed * 10, json: { insights: {}, questions: [], metadata: { citations: cit, citation_corrections: bad ? 1 : 0 } } };
}

// ── Aggregation ──────────────────────────────────────────────────────────────
function summarize(label, records) {
  const ok = records.filter(r => r.status === 200);
  const errors = records.length - ok.length;
  const runs = ok.length;
  const corrected = ok.filter(r => r.tel.corrected).length;
  const residual = ok.filter(r => (r.tel.hallucinated?.length ?? 0) > 0).length;
  const totalChecked = ok.reduce((n, r) => n + (r.tel.checked ?? 0), 0);
  const avgMs = runs ? Math.round(ok.reduce((n, r) => n + r.ms, 0) / runs) : 0;
  return {
    label,
    runs,
    errors,
    avgMs,
    correctionRate: runs ? corrected / runs : 0,
    residualRate: runs ? residual / runs : 0,
    refsChecked: totalChecked,
  };
}

function pct(x) { return `${(x * 100).toFixed(0)}%`; }

function printTable(rows) {
  const head = ['endpoint / arm', 'runs', 'err', 'avg ms', 'corrected', 'residual halluc.', 'refs'];
  const data = rows.map(r => [r.label, String(r.runs), String(r.errors), String(r.avgMs), pct(r.correctionRate), pct(r.residualRate), String(r.refsChecked)]);
  const widths = head.map((h, i) => Math.max(h.length, ...data.map(d => d[i].length)));
  const line = cols => cols.map((c, i) => c.padEnd(widths[i])).join('  ');
  console.log('\n' + line(head));
  console.log(widths.map(w => '─'.repeat(w)).join('  '));
  for (const d of data) console.log(line(d));
}

// ── Runner ───────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Citation eval → ${MOCK ? '[MOCK MODE]' : BASE_URL}`);
  if (!MOCK && ARMS.length && !CHAT_TOKEN) {
    console.log('⚠  EVAL_TOKEN not set — chat arms need a real Supabase token and will 401. Set EVAL_TOKEN or use EVAL_MOCK=1.');
  }
  const rows = [];

  // Chat arms.
  for (const arm of ARMS) {
    const records = [];
    for (const [i, c] of CHAT_CASES.entries()) {
      const body = { message: c.q, mode: c.mode, bibleVersion: { id: BIBLE_VERSION, name: 'Eval' } };
      const resp = MOCK ? mockResponse(arm, i) : await postJSON(`/api/chat?${arm}=1`, body, CHAT_TOKEN);
      const tel = arm === 'agentic' ? extractChatAgentic(resp.json) : extractChatGraph(resp.json);
      records.push({ ...resp, tel });
      if (!MOCK) process.stdout.write(resp.status === 200 ? '.' : `!(${resp.status})`);
    }
    if (!MOCK) process.stdout.write('\n');
    rows.push(summarize(`chat:${arm}`, records));
  }

  // Bible AI endpoints.
  for (const [path, kind] of [['/api/bible/ai-insights', 'ai-insights'], ['/api/bible/study-questions', 'study-questions']]) {
    const records = [];
    for (const [i, p] of PASSAGE_CASES.entries()) {
      const body = { passage: { reference: p.reference, text: p.text, version: { name: 'Eval' } }, version: BIBLE_VERSION };
      const resp = MOCK ? mockResponse('bible', i) : await postJSON(path, body, BIBLE_TOKEN);
      records.push({ ...resp, tel: extractBible(resp.json) });
      if (!MOCK) process.stdout.write(resp.status === 200 ? '.' : `!(${resp.status})`);
    }
    if (!MOCK) process.stdout.write('\n');
    rows.push(summarize(`bible:${kind}`, records));
  }

  printTable(rows);
  console.log('\nLegend: corrected = guard regenerated (≈ raw hallucination rate); residual = bad refs that survived the guard (want ~0).');
}

main().catch(err => { console.error(err); process.exit(1); });
