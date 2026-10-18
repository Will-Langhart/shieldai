import { logger } from '../logger';
import { canonicalize } from './reference';
import { kjvPineconeProvider } from './providers/kjv-pinecone';
import { netProvider } from './providers/net';
import { esvProvider } from './providers/esv';
import { apiBibleProvider } from './providers/api-bible';
import type { CanonicalRef, Passage, ScriptureProvider, Translation, VerseHit } from './types';

/**
 * The Scripture query engine: one place that resolves a reference, picks the
 * provider for each requested translation, fans out in parallel with a
 * per-provider timeout, and caches results. Passages never change, so the cache
 * needs no expiry — only a size cap.
 */

const PROVIDER_TIMEOUT_MS = Number(process.env.SCRIPTURE_PROVIDER_TIMEOUT_MS || 6000);
const CACHE_MAX = Number(process.env.SCRIPTURE_CACHE_MAX || 500);
// After this many consecutive failures a provider sits out for BREAKER_COOLDOWN_MS,
// so a dead key stops being offered as a translation and stops costing a timeout per call.
const BREAKER_THRESHOLD = 3;
const BREAKER_COOLDOWN_MS = 5 * 60 * 1000;
export const DEFAULT_TRANSLATION = 'KJV';

export class ScriptureEngine {
  private cache = new Map<string, Passage>();
  private failures = new Map<string, { count: number; until: number }>();

  constructor(private providers: ScriptureProvider[], private now: () => number = Date.now) {}

  private active(): ScriptureProvider[] {
    return this.providers.filter(p => p.enabled() && (this.failures.get(p.id)?.until ?? 0) <= this.now());
  }

  private succeeded(id: string) {
    this.failures.delete(id);
  }

  private failed(id: string) {
    const count = (this.failures.get(id)?.count ?? 0) + 1;
    this.failures.set(id, { count, until: count >= BREAKER_THRESHOLD ? this.now() + BREAKER_COOLDOWN_MS : 0 });
  }

  /** Every translation an enabled provider serves, first provider wins on duplicates. */
  translations(): Translation[] {
    const seen = new Map<string, Translation>();
    for (const p of this.active()) for (const t of p.translations()) if (!seen.has(t.code)) seen.set(t.code, t);
    return [...seen.values()];
  }

  private providerFor(translation: string): ScriptureProvider | undefined {
    const code = translation.toUpperCase();
    return this.active().find(p => p.translations().some(t => t.code === code));
  }

  /** Fetch one passage. Unknown references and translations resolve to null, never throw. */
  async getPassage(reference: string | CanonicalRef, translation = DEFAULT_TRANSLATION): Promise<Passage | null> {
    const ref = typeof reference === 'string' ? canonicalize(reference) : reference;
    if (!ref) return null;
    const code = translation.toUpperCase();
    const key = `${code}:${ref.display}`;
    const cached = this.cache.get(key);
    if (cached) {
      // Refresh recency so frequently used passages survive eviction.
      this.cache.delete(key);
      this.cache.set(key, cached);
      return cached;
    }

    const provider = this.providerFor(code);
    if (!provider) return null;
    try {
      const passage = await withTimeout(provider.getPassage(ref, code), PROVIDER_TIMEOUT_MS, provider.id);
      this.succeeded(provider.id);
      if (passage) this.remember(key, passage);
      return passage;
    } catch (err) {
      this.failed(provider.id);
      logger.warn('Scripture provider failed', { provider: provider.id, reference: ref.display, translation: code, error: String(err) });
      return null;
    }
  }

  /** The same reference in several translations, fetched in parallel. Missing ones are dropped. */
  async compare(reference: string, translations: string[]): Promise<Passage[]> {
    const ref = canonicalize(reference);
    if (!ref) return [];
    const codes = [...new Set(translations.map(t => t.toUpperCase()))];
    const results = await Promise.all(codes.map(code => this.getPassage(ref, code)));
    return results.filter((p): p is Passage => Boolean(p));
  }

  /**
   * Search Scripture. Semantic goes to the vector index; keyword prefers a
   * full-text provider and falls back to the vector index (which runs hybrid
   * lexical+dense when enabled) so a dead API never empties the result.
   */
  async search(query: string, mode: 'semantic' | 'keyword' = 'semantic', limit = 5): Promise<VerseHit[]> {
    const searchers = this.active().filter(p => p.search);
    const ordered = mode === 'keyword'
      ? [...searchers.filter(p => p.id !== 'kjv-pinecone'), ...searchers.filter(p => p.id === 'kjv-pinecone')]
      : [...searchers.filter(p => p.id === 'kjv-pinecone'), ...searchers.filter(p => p.id !== 'kjv-pinecone')];

    for (const p of ordered) {
      try {
        const hits = await withTimeout(p.search!(query, { mode, limit }), PROVIDER_TIMEOUT_MS, p.id);
        this.succeeded(p.id);
        if (hits.length) return hits.slice(0, limit);
      } catch (err) {
        this.failed(p.id);
        logger.warn('Scripture search provider failed', { provider: p.id, mode, error: String(err) });
      }
    }
    return [];
  }

  private remember(key: string, passage: Passage) {
    this.cache.set(key, passage);
    if (this.cache.size > CACHE_MAX) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }
  }
}

export function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    p.finally(() => clearTimeout(timer)),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

/** Process-wide engine. KJV comes from our own index first; API.Bible is last because its key may be dead. */
export const scripture = new ScriptureEngine([kjvPineconeProvider, netProvider, esvProvider, apiBibleProvider]);
