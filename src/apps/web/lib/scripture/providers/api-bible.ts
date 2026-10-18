import { stripHtml } from '../../reference-utils';
import { splitVerseNumbers } from './esv';
import type { CanonicalRef, Passage, ScriptureProvider, Translation, VerseHit } from '../types';
import { KJV_NAMESPACE } from './kjv-pinecone';

const DEFAULT_BASE = 'https://api.scripture.api.bible/v1';

/**
 * Translations our API.Bible key may serve, as "CODE:bibleId" pairs. KJV is
 * not listed by default because the Pinecone provider already serves it.
 * Override with API_BIBLE_VERSIONS, e.g. "WEB:9879dbb7cfe39e4d-04,ASV:06125adad2d5898a-01".
 */
const DEFAULT_VERSIONS = 'WEB:9879dbb7cfe39e4d-04,ASV:06125adad2d5898a-01';

const NAMES: Record<string, string> = {
  WEB: 'World English Bible',
  ASV: 'American Standard Version',
  KJV: 'King James Version',
};

function versions(): Map<string, string> {
  const raw = process.env.API_BIBLE_VERSIONS || DEFAULT_VERSIONS;
  const map = new Map<string, string>();
  for (const pair of raw.split(',')) {
    const [code, id] = pair.split(':').map(s => s.trim());
    if (code && id) map.set(code.toUpperCase(), id);
  }
  return map;
}

function passageId(ref: CanonicalRef): string {
  if (!ref.verseStart) return `${ref.usfm}.${ref.chapter}`;
  const start = `${ref.usfm}.${ref.chapter}.${ref.verseStart}`;
  return ref.verseEnd && ref.verseEnd > ref.verseStart ? `${start}-${ref.usfm}.${ref.chapter}.${ref.verseEnd}` : start;
}

async function apiGet(path: string, params: Record<string, string>): Promise<any> {
  const base = process.env.BIBLE_API_BASE_URL || DEFAULT_BASE;
  const res = await fetch(`${base}${path}?${new URLSearchParams(params)}`, {
    headers: { 'api-key': process.env.BIBLE_API_KEY || '' },
  });
  if (!res.ok) throw new Error(`API.Bible ${res.status}`);
  return (await res.json())?.data;
}

/** Public-domain and licensed translations through API.Bible, plus keyword search. */
export const apiBibleProvider: ScriptureProvider = {
  id: 'api-bible',
  enabled: () => Boolean(process.env.BIBLE_API_KEY),
  translations: (): Translation[] => [...versions().keys()].map(code => ({ code, name: NAMES[code] || code })),

  async getPassage(ref: CanonicalRef, translation: string): Promise<Passage | null> {
    const bibleId = versions().get(translation.toUpperCase());
    if (!bibleId) return null;
    const data = await apiGet(`/bibles/${bibleId}/passages/${passageId(ref)}`, {
      'content-type': 'text',
      'include-verse-numbers': 'true',
      'include-titles': 'false',
      'include-notes': 'false',
    });
    const verses = splitVerseNumbers(String(data?.content || ''));
    if (!verses.length) return null;
    return {
      reference: ref.display,
      translation: translation.toUpperCase(),
      verses,
      copyright: data?.copyright ? stripHtml(String(data.copyright)) : undefined,
      source: 'api-bible',
    };
  },

  async search(query, { limit }): Promise<VerseHit[]> {
    const data = await apiGet(`/bibles/${KJV_NAMESPACE}/search`, { query, limit: String(limit), sort: 'relevance' });
    return (data?.verses || []).map((v: any) => ({
      reference: String(v.reference),
      text: stripHtml(String(v.text || '')),
      translation: 'KJV',
    }));
  },
};
