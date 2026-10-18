import { BibleVersesIndex } from '../../bible-verses-index';
import { hybridBibleSearch } from '../../bible-hybrid';
import { verseNumbers } from '../reference';
import type { CanonicalRef, Passage, ScriptureProvider, VerseHit } from '../types';

/** The KJV namespace in the `bible-verses` index (the API.Bible version id it was ingested from). */
export const KJV_NAMESPACE = 'de4e12af7f28f599-02';

/** Whole-chapter fetches pull this many ids; no chapter in the Bible is longer. */
const MAX_CHAPTER_VERSES = 176;

/**
 * KJV straight from our own Pinecone `bible-verses` index: passages by record
 * id, search by dense (or hybrid dense+sparse) retrieval. No third-party Bible
 * API in the path, so it keeps working when API.Bible doesn't.
 */
export const kjvPineconeProvider: ScriptureProvider = {
  id: 'kjv-pinecone',
  enabled: () => Boolean(process.env.PINECONE_API_KEY),
  translations: () => [{ code: 'KJV', name: 'King James Version' }],

  async getPassage(ref: CanonicalRef): Promise<Passage | null> {
    const nums = verseNumbers(ref) ?? Array.from({ length: MAX_CHAPTER_VERSES }, (_, i) => i + 1);
    const ids = nums.map(n => `${KJV_NAMESPACE}_${ref.usfm}_${ref.chapter}_${n}`);
    const hits = await BibleVersesIndex.fetchVerses(KJV_NAMESPACE, ids);
    if (!hits.length) return null;
    return {
      reference: ref.display,
      translation: 'KJV',
      verses: hits
        .map(h => ({ num: h.verse, text: h.text.trim() }))
        .filter(v => v.text)
        .sort((a, b) => a.num - b.num),
      source: 'kjv-pinecone',
    };
  },

  async search(query, { limit }): Promise<VerseHit[]> {
    // Keyword-ish queries still benefit: hybrid mode adds sparse lexical matching.
    const hits = await hybridBibleSearch(KJV_NAMESPACE, query, limit);
    return hits.map(h => ({ reference: h.reference, text: h.text, translation: 'KJV', score: Number(h.score.toFixed(3)) }));
  },
};
