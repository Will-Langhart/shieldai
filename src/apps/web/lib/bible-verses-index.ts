/**
 * Integrated `bible-verses` index client (Phase 2, Option A).
 *
 * The Bible index uses Pinecone **integrated embedding** (`llama-text-embed-v2`,
 * 1024, cosine) — Pinecone embeds both the stored verses and the query text
 * server-side, so this client sends/queries **text**, never vectors. That means
 * NO OpenAI embedding calls and NO 1536→1024 averaging on the Scripture path
 * (contrast `bible-pinecone.ts`, which targets the legacy `shieldai` index with
 * raw OpenAI vectors and stays only for memory/insights).
 *
 * Records API (integrated indexes only):
 *   upsert  POST https://{host}/records/namespaces/{ns}/upsert   (application/x-ndjson)
 *   search  POST https://{host}/records/namespaces/{ns}/search   (application/json)
 * The embedded field is `text` (the index's fieldMap); everything else is metadata.
 *
 * Namespace = the Bible-API version id (e.g. `de4e12af7f28f599-02`), so multiple
 * translations coexist in one index, isolated per version.
 */

const PINECONE_API_VERSION = '2026-04';
const BIBLE_VERSES_INDEX = process.env.BIBLE_VERSES_INDEX || 'bible-verses';

// Text field the index embeds (must match create-index-for-model fieldMap.text).
const TEXT_FIELD = 'text';

export interface BibleVerseRecord {
  _id: string;            // e.g. "de4e12af7f28f599-02_JHN_3_16"
  text: string;           // verse text — the embedded field
  reference: string;      // "John 3:16"
  book: string;           // "John"
  chapter: number;
  verse: number;
  version: string;        // human-readable version name/abbrev, e.g. "KJV"
}

export interface BibleVerseHit {
  id: string;
  score: number;
  reference: string;
  text: string;
  book: string;
  chapter: number;
  verse: number;
  version: string;
}

export class BibleVersesIndex {
  private static host: string | null = null;
  private static batchSize = Number(process.env.PINECONE_BATCH_SIZE || 90);
  private static maxRetries = Number(process.env.PINECONE_MAX_RETRIES || 3);
  private static backoffMs = Number(process.env.PINECONE_BACKOFF_MS || 300);
  private static minSimilarity = Number(process.env.BIBLE_MIN_SIMILARITY || 0);
  // Optional reranking: retrieve a wider pool then let Pinecone's hosted reranker
  // reorder to the requested topK. Env-gated; falls back to dense on any failure.
  private static rerankEnabled = /^(true|1)$/i.test(process.env.RERANK_ENABLED || '');
  private static rerankModel = process.env.RERANK_MODEL || 'bge-reranker-v2-m3';
  private static rerankPool = Number(process.env.RERANK_POOL || 20);

  private static sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }

  private static apiKey(): string {
    const key = process.env.PINECONE_API_KEY || '';
    if (!key) throw new Error('PINECONE_API_KEY is not set');
    return key;
  }

  /** Resolve (and cache) the index data-plane host from the control plane. */
  private static async resolveHost(): Promise<string | null> {
    if (this.host) return this.host;
    try {
      const res = await fetch(`https://api.pinecone.io/indexes/${BIBLE_VERSES_INDEX}`, {
        headers: {
          'Api-Key': this.apiKey(),
          'X-Pinecone-Api-Version': PINECONE_API_VERSION,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        console.warn(`bible-verses: control-plane lookup failed (${res.status})`);
        return null;
      }
      const data = await res.json();
      this.host = data.host || null;
      return this.host;
    } catch (err) {
      console.warn('bible-verses: host resolve failed', err);
      return null;
    }
  }

  /**
   * Upsert verse records (text embedded by Pinecone) into a version namespace.
   * Batched NDJSON with retry/backoff. Used by the ingest path.
   */
  static async upsertVerses(namespace: string, records: BibleVerseRecord[]): Promise<void> {
    if (!records.length) return;
    const host = await this.resolveHost();
    if (!host) throw new Error('bible-verses index host unavailable');
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

  /**
   * Semantic search over a version namespace. Pinecone embeds `query` with the
   * index's model. Returns compact hits shaped like the legacy service so the
   * graph's scripture node is a drop-in swap.
   */
  static async search(namespace: string, query: string, topK = 5): Promise<BibleVerseHit[]> {
    const host = await this.resolveHost();
    if (!host) {
      console.warn('bible-verses: search skipped (no host)');
      return [];
    }
    const fields = ['reference', TEXT_FIELD, 'book', 'chapter', 'verse', 'version'];
    const useRerank = this.rerankEnabled && topK < this.rerankPool;
    const doFetch = (rerank: boolean) => {
      const body: any = {
        query: { inputs: { text: query }, top_k: rerank ? this.rerankPool : topK },
        fields,
      };
      if (rerank) body.rerank = { model: this.rerankModel, top_n: topK, rank_fields: [TEXT_FIELD] };
      return fetch(`https://${host}/records/namespaces/${encodeURIComponent(namespace)}/search`, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey(),
          'X-Pinecone-Api-Version': PINECONE_API_VERSION,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      });
    };
    try {
      let res = await doFetch(useRerank);
      // A rerank failure (model/plan unavailable) must not drop retrieval — degrade to dense.
      if (useRerank && !res.ok) {
        console.warn(`bible-verses: rerank failed (${res.status}); falling back to dense`);
        res = await doFetch(false);
      }
      if (!res.ok) {
        console.warn(`bible-verses: search failed (${res.status})`);
        return [];
      }
      const data = await res.json();
      const hits = data?.result?.hits || [];
      return hits
        .filter((h: any) => (h._score ?? 0) >= this.minSimilarity)
        .map((h: any) => ({
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
      console.warn('bible-verses: search error', err);
      return [];
    }
  }
}
