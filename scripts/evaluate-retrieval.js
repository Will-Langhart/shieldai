require('dotenv').config({ path: '.env.local', override: true });

const fetch = global.fetch || require('node-fetch');

async function main() {
  const base = process.env.EVAL_BASE_URL || 'http://localhost:3000';
  const userId = process.env.EVAL_USER_ID || 'eval-user';
  const gold = [
    { query: 'favorite verse about love', expectContains: ['love'] },
    { query: 'conversation about prayer routine', expectContains: ['prayer'] },
  ];

  const results = [];
  for (const g of gold) {
    const res = await fetch(`${base}/api/memory/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: g.query, userId, topK: 5 })
    });
    if (!res.ok) {
      results.push({ query: g.query, ok: false, status: res.status });
      continue;
    }
    const data = await res.json();
    const matches = data?.results || data?.matches || [];
    const hit = matches.some(m => g.expectContains.some(tok => String(m.metadata?.content || m.content || '').toLowerCase().includes(tok)));
    results.push({ query: g.query, ok: hit, matches: matches.length });
  }

  const pass = results.filter(r => r.ok).length;
  console.log('Evaluation results:', results);
  console.log(`Pass: ${pass}/${results.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });


