import { supabase } from './supabase';
import { parseReference, resolveBookCode } from './reference-utils';
import type { LexiconEntry, OriginalVerse } from './stepbible-parse';

/**
 * Original-language (Greek NT / Hebrew OT) lookups backed by the STEPBible
 * datasets loaded into Supabase (see src/config/migrations/original-language.sql
 * and src/scripts/ingest-stepbible.ts).
 */

export const ORIGINAL_LANGUAGE_MAX_VERSES = 5;
export const STEPBIBLE_ATTRIBUTION = 'Source: STEPBible.org data (Tyndale House Cambridge), CC BY 4.0.';

const DEFINITION_PREVIEW_CHARS = 500;

export interface VerseRange {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  /** Canonical display form, e.g. "John 1:1-3". */
  display: string;
}

export interface OriginalLanguageLookup {
  range: VerseRange;
  verses: OriginalVerse[];
  /** Lexicon entries keyed by the Strong's number each word carries. */
  lexicon: Map<string, LexiconEntry>;
}

/** Parse "John 1:1", "Jn 1:1-3", "1 Cor 13:4-7" into a capped verse range. */
export function resolveVerseRange(reference: string): VerseRange | null {
  const parsed = parseReference(reference);
  if (!parsed || !parsed.chapter || !parsed.verseStart) return null;
  const book = resolveBookCode(parsed.book);
  if (!book) return null;
  const verseStart = parsed.verseStart;
  const requestedEnd = Math.max(parsed.verseEnd ?? verseStart, verseStart);
  const verseEnd = Math.min(requestedEnd, verseStart + ORIGINAL_LANGUAGE_MAX_VERSES - 1);
  const display = `${parsed.book} ${parsed.chapter}:${verseStart}${verseEnd > verseStart ? `-${verseEnd}` : ''}`;
  return { book, chapter: parsed.chapter, verseStart, verseEnd, display };
}

/** "H0430J" → "H0430": a few tagged senses have no brief-lexicon row of their own. */
const baseStrongs = (s: string) => s.slice(0, 5);

async function fetchLexicon(codes: string[]): Promise<Map<string, LexiconEntry>> {
  const lexicon = new Map<string, LexiconEntry>();
  if (!codes.length) return lexicon;

  const { data, error } = await supabase.from('original_language_lexicon').select('*').in('strongs', codes);
  if (error) throw new Error(`lexicon lookup failed: ${error.message}`);
  for (const row of (data || []) as LexiconEntry[]) lexicon.set(row.strongs, row);

  // Fall back to any sense of the same Strong's number for the rare misses.
  const missing = codes.filter(c => !lexicon.has(c));
  if (missing.length) {
    const bases = [...new Set(missing.map(baseStrongs))];
    const { data: fallback } = await supabase
      .from('original_language_lexicon')
      .select('*')
      .or(bases.map(b => `strongs.like.${b}%`).join(','))
      .order('strongs');
    for (const code of missing) {
      const hit = ((fallback || []) as LexiconEntry[]).find(r => baseStrongs(r.strongs) === baseStrongs(code));
      if (hit) lexicon.set(code, hit);
    }
  }
  return lexicon;
}

export async function getOriginalLanguage(reference: string): Promise<OriginalLanguageLookup | null> {
  const range = resolveVerseRange(reference);
  if (!range) return null;

  const { data, error } = await supabase
    .from('original_language_verses')
    .select('book, chapter, verse, testament, words')
    .eq('book', range.book)
    .eq('chapter', range.chapter)
    .gte('verse', range.verseStart)
    .lte('verse', range.verseEnd)
    .order('verse');
  if (error) throw new Error(`original-language lookup failed: ${error.message}`);

  const verses = (data || []) as OriginalVerse[];
  const codes = [...new Set(verses.flatMap(v => v.words.map(w => w.s)).filter(Boolean))];
  return { range, verses, lexicon: await fetchLexicon(codes) };
}

/** Does a word match the model's focus term (Strong's, lemma, transliteration or English gloss)? */
function matchesFocus(focus: string, word: OriginalVerse['words'][number], entry?: LexiconEntry): boolean {
  const f = focus.trim().toLowerCase();
  if (!f) return false;
  if (/^[hg]\d+[a-z]?$/.test(f)) return word.s.toLowerCase() === f || baseStrongs(word.s).toLowerCase() === f;
  const haystack = [word.g, word.x, word.w, entry?.lemma, entry?.translit, entry?.gloss]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(f);
}

/**
 * Render a lookup as compact interlinear text for the model: one line per word
 * (surface, transliteration, contextual gloss, Strong's, morphology, lexical
 * form), then full lexicon definitions for any words matching `focus`.
 */
export function formatOriginalLanguage(lookup: OriginalLanguageLookup, focus?: string): string {
  const { range, verses, lexicon } = lookup;
  if (!verses.length) return `No original-language data found for ${range.display}.`;

  const language = verses[0].testament === 'NT' ? 'Greek (critical text, NA28/SBL)' : 'Hebrew (Leningrad Codex)';
  const lines: string[] = [`${range.display} — ${language}`];
  const focused = new Map<string, LexiconEntry>();

  for (const v of verses) {
    lines.push(`\nv${v.verse}:`);
    for (const word of v.words) {
      const entry = lexicon.get(word.s);
      const lexical = entry ? ` | lemma ${entry.lemma} (${entry.translit}) "${entry.gloss}"` : '';
      lines.push(`- ${word.w} (${word.x}) "${word.g}" ${word.s} ${word.m}${lexical}`);
      if (focus && entry && matchesFocus(focus, word, entry)) focused.set(entry.strongs, entry);
    }
  }

  // No gloss/lemma hit (e.g. "virgin" for עַלְמָה, glossed "young woman"):
  // fall back to whole-word matches inside the lexicon definitions.
  if (focus && !focused.size) {
    const escaped = focus.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\b${escaped}\\b`, 'i');
    for (const entry of lexicon.values()) if (re.test(entry.definition)) focused.set(entry.strongs, entry);
  }

  if (focus) {
    if (focused.size) {
      lines.push(`\nLexicon (matching "${focus}"):`);
      for (const e of focused.values()) {
        const def = e.definition.length > DEFINITION_PREVIEW_CHARS
          ? `${e.definition.slice(0, DEFINITION_PREVIEW_CHARS)}…`
          : e.definition;
        lines.push(`${e.strongs} ${e.lemma} (${e.translit}), ${e.pos}, "${e.gloss}":\n${def}`);
      }
    } else {
      lines.push(`\nNo word in ${range.display} matched "${focus}".`);
    }
  }

  lines.push(`\n${STEPBIBLE_ATTRIBUTION}`);
  return lines.join('\n');
}
