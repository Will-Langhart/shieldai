import type { CanonicalRef, Passage, ScriptureProvider } from '../types';

const NET_API = 'https://labs.bible.org/api/';
const NET_COPYRIGHT = 'Scripture quoted by permission. Quotations designated (NET) are from the NET Bible® copyright ©1996, 2019 by Biblical Studies Press, L.L.C. http://netbible.com All rights reserved.';

/**
 * NET Bible via the free labs.bible.org API (no key). Passage lookups only —
 * the API has no search endpoint.
 */
export const netProvider: ScriptureProvider = {
  id: 'net',
  enabled: () => process.env.NET_BIBLE_DISABLED !== '1',
  translations: () => [{ code: 'NET', name: 'New English Translation' }],

  async getPassage(ref: CanonicalRef): Promise<Passage | null> {
    const passage = ref.verseStart
      ? `${ref.book} ${ref.chapter}:${ref.verseStart}${ref.verseEnd && ref.verseEnd > ref.verseStart ? `-${ref.verseEnd}` : ''}`
      : `${ref.book} ${ref.chapter}`;
    const url = `${NET_API}?${new URLSearchParams({ passage, type: 'json', formatting: 'plain' })}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`NET API ${res.status}`);
    const rows = (await res.json()) as Array<{ bookname: string; chapter: string; verse: string; text: string }>;
    if (!Array.isArray(rows) || !rows.length) return null;
    return {
      reference: ref.display,
      translation: 'NET',
      verses: rows.map(r => ({ num: Number(r.verse), text: stripTags(r.text) })).filter(v => v.text),
      copyright: NET_COPYRIGHT,
      source: 'net',
    };
  },
};

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
