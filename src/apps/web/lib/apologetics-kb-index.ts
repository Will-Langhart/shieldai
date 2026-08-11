/**
 * Integrated `apologetics-kb` index client (Phase 2 follow-up).
 *
 * The apologetics knowledge base was a static in-code array searched by
 * substring/tag matching (`apologetics-knowledge.ts#searchApologeticsContent`) —
 * brittle: a theodicy question with no shared keywords matched nothing. This
 * vectorizes it into a dedicated integrated index (`llama-text-embed-v2`, 1024,
 * cosine), so the graph's KB specialists retrieve by MEANING. Same records-API
 * pattern as `bible-verses-index.ts` (text in/out, Pinecone embeds server-side).
 *
 * The in-code `apologeticsKnowledgeBase` remains the source of truth; re-run the
 * ingest (`import-apologetics` route action) after editing it.
 */

const PINECONE_API_VERSION = '2026-04';
const APOLOGETICS_INDEX = process.env.APOLOGETICS_INDEX || 'apologetics-kb';
const APOLOGETICS_NAMESPACE = process.env.APOLOGETICS_NAMESPACE || 'kb';
const TEXT_FIELD = 'text';

// Shape the graph consumes (mirrors the old ApologeticsContent projection).
export interface ApologeticsKbHit {
  id: string;
  score: number;
  title: string;
  category: string;
  content: string;
  scriptures: string[];
}

export interface ApologeticsKbRecord {
  _id: string;
  text: string;
  title: string;
  category: string;
  subcategory: string;
  difficulty: string;
  tags: string[];
  scriptures: string[];
}

export class ApologeticsKbIndex {
  private static host: string | null = null;
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
      const res = await fetch(`https://api.pinecone.io/indexes/${APOLOGETICS_INDEX}`, {
        headers: {
          'Api-Key': this.apiKey(),
          'X-Pinecone-Api-Version': PINECONE_API_VERSION,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        console.warn(`apologetics-kb: control-plane lookup failed (${res.status})`);
        return null;
      }
      const data = await res.json();
      this.host = data.host || null;
      return this.host;
    } catch (err) {
      console.warn('apologetics-kb: host resolve failed', err);
      return null;
    }
  }

  /** Upsert KB records (batched NDJSON). Used by the ingest path. */
  static async upsertRecords(records: ApologeticsKbRecord[]): Promise<void> {
    if (!records.length) return;
    const host = await this.resolveHost();
    if (!host) throw new Error('apologetics-kb index host unavailable');
    const url = `https://${host}/records/namespaces/${encodeURIComponent(APOLOGETICS_NAMESPACE)}/upsert`;
    const ndjson = records.map((r) => JSON.stringify(r)).join('\n');
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
        return;
      } catch (err) {
        attempt += 1;
        if (attempt > this.maxRetries) throw err;
        await this.sleep(this.backoffMs * attempt);
      }
    }
  }

  /**
   * Semantic search over the KB. Optional `category` narrows results via a
   * metadata filter (omit for broad recall — e.g. the philosopher, whose
   * "problem of evil" entry is category `theological`, not `philosophical`).
   */
  static async search(query: string, opts: { category?: string; topK?: number } = {}): Promise<ApologeticsKbHit[]> {
    const { category, topK = 3 } = opts;
    const host = await this.resolveHost();
    if (!host) {
      console.warn('apologetics-kb: search skipped (no host)');
      return [];
    }
    try {
      const body: any = {
        query: { inputs: { text: query }, top_k: topK },
        fields: ['title', 'category', TEXT_FIELD, 'scriptures'],
      };
      if (category) body.query.filter = { category: { $eq: category } };

      const res = await fetch(`https://${host}/records/namespaces/${encodeURIComponent(APOLOGETICS_NAMESPACE)}/search`, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey(),
          'X-Pinecone-Api-Version': PINECONE_API_VERSION,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        console.warn(`apologetics-kb: search failed (${res.status})`);
        return [];
      }
      const data = await res.json();
      const hits = data?.result?.hits || [];
      return hits.map((h: any) => ({
        id: String(h._id ?? ''),
        score: Number(h._score ?? 0),
        title: String(h.fields?.title ?? ''),
        category: String(h.fields?.category ?? ''),
        content: String(h.fields?.[TEXT_FIELD] ?? ''),
        scriptures: Array.isArray(h.fields?.scriptures) ? h.fields.scriptures.map(String) : [],
      }));
    } catch (err) {
      console.warn('apologetics-kb: search error', err);
      return [];
    }
  }
}
