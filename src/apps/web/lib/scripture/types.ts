/**
 * Shared shapes for the Scripture query engine.
 *
 * Every Bible source (Pinecone KJV, NET, API.Bible, ESV) sits behind one
 * `ScriptureProvider`, so tools ask the engine for a passage or a search and
 * never care which API answered. Results are normalized to `Passage` /
 * `VerseHit` so the chat widgets render them the same way.
 */

/** A parsed, canonical verse range, e.g. John 3:16-17. */
export interface CanonicalRef {
  /** Canonical English book name, e.g. "1 Corinthians". */
  book: string;
  /** USFM book code, e.g. "1CO". */
  usfm: string;
  chapter: number;
  /** Absent for a whole-chapter reference. */
  verseStart?: number;
  verseEnd?: number;
  /** Display form, e.g. "John 3:16-17". */
  display: string;
}

export interface PassageVerse {
  num: number;
  text: string;
}

export interface Passage {
  reference: string;
  /** Translation code, e.g. "KJV", "NET". */
  translation: string;
  verses: PassageVerse[];
  /** Attribution line the license requires, when any. */
  copyright?: string;
  /** Provider id that answered. */
  source: string;
}

export interface VerseHit {
  reference: string;
  text: string;
  translation: string;
  score?: number;
}

export interface Translation {
  code: string;
  name: string;
}

export interface ScriptureProvider {
  id: string;
  /** False when a required key is missing; the engine skips the provider. */
  enabled(): boolean;
  translations(): Translation[];
  getPassage(ref: CanonicalRef, translation: string): Promise<Passage | null>;
  /** Semantic or keyword search, when the provider supports it. */
  search?(query: string, opts: { mode: 'semantic' | 'keyword'; limit: number }): Promise<VerseHit[]>;
}
