import { parseReference, resolveBookCode, extractScriptureReferences } from '../reference-utils';
import type { CanonicalRef } from './types';

/** Longest range a single tool call may pull, so one call can't dump a book. */
export const MAX_PASSAGE_VERSES = 40;

// USFM code → canonical name, derived from the citation extractor's canonical
// output so the two never disagree on spelling (e.g. "Psalms", "Song of Solomon").
function canonicalBookName(rawBook: string): string | null {
  // extractScriptureReferences canonicalizes abbreviations ("1 Cor" → "1 Corinthians").
  const [hit] = extractScriptureReferences(`${rawBook} 1:1`);
  return hit ? hit.replace(/\s+1:1$/, '') : null;
}

/**
 * Parse "John 3:16", "Jn 3:16-18", "1 Cor 13", "Psalm 23:1" into a canonical
 * range. Ranges longer than MAX_PASSAGE_VERSES are clipped. Returns null for
 * anything that doesn't resolve to a real book.
 */
export function canonicalize(reference: string): CanonicalRef | null {
  const cleaned = reference.replace(/[–—]/g, '-').replace(/\s*-\s*/g, '-').trim();
  const parsed = parseReference(cleaned);
  if (!parsed || !parsed.chapter) return null;

  const usfm = resolveBookCode(parsed.book);
  const book = canonicalBookName(parsed.book);
  if (!usfm || !book) return null;

  const { chapter } = parsed;
  if (!parsed.verseStart) {
    return { book, usfm, chapter, display: `${book} ${chapter}` };
  }

  const verseStart = parsed.verseStart;
  const requestedEnd = Math.max(parsed.verseEnd ?? verseStart, verseStart);
  const verseEnd = Math.min(requestedEnd, verseStart + MAX_PASSAGE_VERSES - 1);
  const display = verseEnd > verseStart
    ? `${book} ${chapter}:${verseStart}-${verseEnd}`
    : `${book} ${chapter}:${verseStart}`;
  return { book, usfm, chapter, verseStart, verseEnd, display };
}

/** Verse numbers a reference covers, or null for a whole chapter. */
export function verseNumbers(ref: CanonicalRef): number[] | null {
  if (!ref.verseStart) return null;
  const end = ref.verseEnd ?? ref.verseStart;
  return Array.from({ length: end - ref.verseStart + 1 }, (_, i) => ref.verseStart! + i);
}
