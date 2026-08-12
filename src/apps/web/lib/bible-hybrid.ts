/**
 * Hybrid Bible retrieval (architecture pass): dense + sparse, fused with RRF.
 *
 * Runs the dense `bible-verses` search and the sparse `bible-verses-sparse` search
 * in parallel over a wider pool, then merges with Reciprocal Rank Fusion (RRF) and
 * returns the top-K. Dense catches meaning; sparse catches exact phrases and
 * reference lookups. RRF needs no score calibration between the two systems — it
 * fuses on rank alone.
 *
 * Env-gated (HYBRID_BIBLE_ENABLED) and fail-safe: disabled, or the sparse index
 * missing/unpopulated, transparently degrades to plain dense search. This is a
 * drop-in for BibleVersesIndex.search — same signature, same BibleVerseHit[].
 */

import { BibleVersesIndex, type BibleVerseHit } from './bible-verses-index';
import { BibleSparseIndex } from './bible-sparse-index';

const ENABLED = /^(true|1)$/i.test(process.env.HYBRID_BIBLE_ENABLED || '');
const POOL = Number(process.env.HYBRID_POOL || 20);
const RRF_K = Number(process.env.HYBRID_RRF_K || 60);

export const isHybridBibleEnabled = ENABLED;

/** Reciprocal Rank Fusion: score = Σ 1/(k + rank) across lists; higher wins. */
function rrf(lists: BibleVerseHit[][], k: number, topK: number): BibleVerseHit[] {
  const score = new Map<string, number>();
  const byId = new Map<string, BibleVerseHit>();
  for (const list of lists) {
    list.forEach((hit, rank) => {
      const id = hit.id || hit.reference;
      if (!id) return;
      score.set(id, (score.get(id) || 0) + 1 / (k + rank + 1));
      if (!byId.has(id)) byId.set(id, hit);
    });
  }
  return [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([id, s]) => ({ ...(byId.get(id) as BibleVerseHit), score: Number(s.toFixed(5)) }));
}

/**
 * Retrieve Bible verses for `query`. Hybrid (dense+sparse RRF) when enabled and
 * the sparse index returns results; otherwise plain dense search.
 */
export async function hybridBibleSearch(
  namespace: string,
  query: string,
  topK = 5
): Promise<BibleVerseHit[]> {
  if (!ENABLED) return BibleVersesIndex.search(namespace, query, topK);

  const [dense, sparse] = await Promise.all([
    BibleVersesIndex.search(namespace, query, POOL).catch(() => [] as BibleVerseHit[]),
    BibleSparseIndex.search(namespace, query, POOL).catch(() => [] as BibleVerseHit[]),
  ]);

  // Sparse unavailable/unpopulated → behave exactly like dense-only.
  if (!sparse.length) return dense.slice(0, topK);
  if (!dense.length) return sparse.slice(0, topK);
  return rrf([dense, sparse], RRF_K, topK);
}
