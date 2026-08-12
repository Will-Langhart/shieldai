/**
 * Sparse `bible-verses-sparse` index client (architecture pass — hybrid retrieval).
 *
 * Complements the dense `bible-verses` index (llama-text-embed-v2) with a Pinecone
 * INTEGRATED SPARSE index (`pinecone-sparse-english-v0`). Sparse/keyword retrieval
 * catches exact-phrase and reference lookups ("what does Romans 8 say", quoted
 * phrases) that dense embeddings blur. Same records API (text in / text out,
 * Pinecone embeds server-side), same namespace scheme (Bible version id).
 *
 * ACTIVATION (one-time, needs Pinecone access — mirrors how bible-verses was set up):
 *   1. Create the index:  create-index-for-model  name=bible-verses-sparse,
 *      model=pinecone-sparse-english-v0, metric=dotproduct, fieldMap.text=text.
 *   2. Populate it with the SAME verse records as the dense index — reuse
 *      BibleSparseIndex.upsertVerses from an ingest driver.
 * Until then, hybrid search (lib/bible-hybrid.ts) degrades to dense-only.
 */

const PINECONE_API_VERSION = '2026-04';
const BIBLE_SPARSE_INDEX = process.env.BIBLE_SPARSE_INDEX || 'bible-verses-sparse';
const TEXT_FIELD = 'text';

import type { BibleVerseRecord, BibleVerseHit } from './bible-verses-index';

export class BibleSparseIndex {
  private static host: string | null = null;
  private static batchSize = Number(process.env.PINECONE_BATCH_SIZE || 90);
  private static maxRetries = Number(process.env.PINECONE_MAX_RETRIES || 3);
  private static backoffMs = Number(process.env.PINECONE_BACKOFF_MS || 300);

  private static sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }

  private static apiKey(): string {
    const key = process.env.PINECONE_API_KEY || '';
    if (!key) throw new Error('PINECONE_API_KEY is not set');
    return key;
  }

  private static async resolveHost(): Promise<string | null> {
    if (this.host) return this.host;
    try {
      const res = await fetch(`https://api.pinecone.io/indexes/${BIBLE_SPARSE_INDEX}`, {
        headers: {
          'Api-Key': this.apiKey(),
          'X-Pinecone-Api-Version': PINECONE_API_VERSION,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        console.warn(`bible-sparse: control-plane lookup failed (${res.status})`);
        return null;
      }
      const data = await res.json();
      this.host = data.host || null;
      return this.host;
    } catch (err) {
      console.warn('bible-sparse: host resolve failed', err);
      return null;
    }
  }

  /** Upsert verse records (batched NDJSON) — used by an ingest driver to populate. */
  static async upsertVerses(namespace: string, records: BibleVerseRecord[]): Promise<void> {
    if (!records.length) return;
    const host = await this.resolveHost();
    if (!host) throw new Error('bible-verses-sparse index host unavailable');
    const url = `https://${host}/records/namespaces/${encodeURIComponent(namespace)}/upsert`;
    for (let i = 0; i < records.length; i += this.batchSize) {
      const chunk = records.slice(i, i + this.batchSize);
      const ndjson = chunk.map((r) => JSON.stringify(r)).join('\n');
      let attempt = 0;
      while (true) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Api-Key': this.apiKey(),
              'X-Pinecone-Api-Version': PINECONE_API_VERSION,
              'Content-Type': 'application/x-ndjson',
            },
            body: ndjson,
          });
          if (!res.ok) throw new Error(`records upsert failed: ${res.status} ${await res.text().catch(() => '')}`);
          break;
        } catch (err) {
          attempt += 1;
          if (attempt > this.maxRetries) throw err;
          await this.sleep(this.backoffMs * attempt);
        }
      }
    }
  }

  /** Sparse (keyword) search over a version namespace. Returns the same hit shape as the dense index. */
  static async search(namespace: string, query: string, topK = 5): Promise<BibleVerseHit[]> {
    const host = await this.resolveHost();
    if (!host) return [];
    try {
      const res = await fetch(`https://${host}/records/namespaces/${encodeURIComponent(namespace)}/search`, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey(),
          'X-Pinecone-Api-Version': PINECONE_API_VERSION,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          query: { inputs: { text: query }, top_k: topK },
          fields: ['reference', TEXT_FIELD, 'book', 'chapter', 'verse', 'version'],
        }),
      });
      if (!res.ok) {
        console.warn(`bible-sparse: search failed (${res.status})`);
        return [];
      }
      const data = await res.json();
      const hits = data?.result?.hits || [];
      return hits.map((h: any) => ({
        id: String(h._id ?? ''),
        score: Number(h._score ?? 0),
        reference: String(h.fields?.reference ?? ''),
        text: String(h.fields?.[TEXT_FIELD] ?? ''),
        book: String(h.fields?.book ?? ''),
        chapter: Number(h.fields?.chapter ?? 0),
        verse: Number(h.fields?.verse ?? 0),
        version: String(h.fields?.version ?? ''),
      }));
    } catch (err) {
      console.warn('bible-sparse: search error', err);
      return [];
    }
  }
}
