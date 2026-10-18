import type { CanonicalRef, Passage, ScriptureProvider } from '../types';

const ESV_API = 'https://api.esv.org/v3/passage/text/';
const ESV_COPYRIGHT = 'Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.';
/** The ESV license caps how much a single page or response may quote. */
const ESV_MAX_VERSES = 500;

/**
 * ESV via api.esv.org. Off until ESV_API_KEY is set (free non-commercial key);
 * every passage carries the copyright line the license requires.
 */
export const esvProvider: ScriptureProvider = {
  id: 'esv',
  enabled: () => Boolean(process.env.ESV_API_KEY),
  translations: () => [{ code: 'ESV', name: 'English Standard Version' }],

  async getPassage(ref: CanonicalRef): Promise<Passage | null> {
    const q = ref.verseStart
      ? `${ref.book} ${ref.chapter}:${ref.verseStart}${ref.verseEnd && ref.verseEnd > ref.verseStart ? `-${ref.verseEnd}` : ''}`
      : `${ref.book} ${ref.chapter}`;
    const params = new URLSearchParams({
      q,
      'include-headings': 'false',
      'include-footnotes': 'false',
      'include-passage-references': 'false',
      'include-short-copyright': 'false',
      'include-verse-numbers': 'true',
    });
    const res = await fetch(`${ESV_API}?${params}`, {
      headers: { Authorization: `Token ${process.env.ESV_API_KEY}` },
    });
    if (!res.ok) throw new Error(`ESV API ${res.status}`);
    const data = (await res.json()) as { passages?: string[] };
    const text = (data.passages || []).join(' ');
    const verses = splitVerseNumbers(text).slice(0, ESV_MAX_VERSES);
    if (!verses.length) return null;
    return { reference: ref.display, translation: 'ESV', verses, copyright: ESV_COPYRIGHT, source: 'esv' };
  },
};

/** "[16] For God so loved… [17] For God did not…" → numbered verses. */
export function splitVerseNumbers(text: string): Array<{ num: number; text: string }> {
  const out: Array<{ num: number; text: string }> = [];
  const re = /\[(\d+)\]\s*([^[]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const t = m[2].replace(/\s+/g, ' ').trim();
    if (t) out.push({ num: Number(m[1]), text: t });
  }
  return out;
}
