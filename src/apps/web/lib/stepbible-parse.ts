/**
 * Parsers for the STEPBible original-language datasets (CC BY 4.0,
 * https://github.com/STEPBible/STEPBible-Data — STEPBible.org, created by
 * Tyndale House Cambridge).
 *
 *   - TAGNT: Translators Amalgamated Greek NT (word-by-word, tab-separated)
 *   - TAHOT: Translators Amalgamated Hebrew OT (word-by-word, tab-separated)
 *   - TBESG / TBESH: Translators Brief lexicons of Extended Strong's
 *
 * Pure functions with no I/O so the ingest script and tests can share them.
 */

/** One original-language word, keyed short to keep the JSONB rows compact. */
export interface OriginalWord {
  /** Surface form in Greek/Hebrew script (Hebrew keeps STEP's `/` morpheme splits). */
  w: string;
  /** Transliteration. */
  x: string;
  /** Contextual English gloss. */
  g: string;
  /** Primary disambiguated Strong's number (e.g. "G3056", "H1254A"). */
  s: string;
  /** Morphology code (e.g. "N-NSM", "HVqp3ms"). */
  m: string;
}

export interface OriginalVerse {
  /** USFM book code as used by reference-utils (e.g. "JHN", "GEN"). */
  book: string;
  chapter: number;
  verse: number;
  testament: 'OT' | 'NT';
  words: OriginalWord[];
}

export interface LexiconEntry {
  strongs: string;
  lemma: string;
  translit: string;
  /** Part of speech, e.g. "G:N-M", "H:V". */
  pos: string;
  gloss: string;
  definition: string;
}

// STEPBible book abbreviations → USFM codes. All but Nahum match once uppercased.
const STEP_BOOK_OVERRIDES: Record<string, string> = { NAM: 'NAH' };

export function stepBookToUsfm(stepBook: string): string {
  const upper = stepBook.toUpperCase();
  return STEP_BOOK_OVERRIDES[upper] || upper;
}

// e.g. "Jhn.1.1#01=NKO" or "Gen.31.55(32.1)#03=L" — the parenthesised part is
// the Hebrew versification; we key on the English one so lookups by English
// reference line up with the rest of the app.
const WORD_REF = /^([1-3]?[A-Z][a-z]{1,2})\.(\d+)\.(\d+)(?:\([^)]*\))?#(\d+)=([^\t]+)$/;

/**
 * Greek word types: N = in Nestle-Aland/critical editions, K = KJV/TR only,
 * O = other editions; lower case / parenthesised = minor variant. We keep the
 * critical text (anything led by an uppercase N).
 *
 * Hebrew word types: L = Leningrad Codex, Q = Qere (read) where it differs from
 * the written Ketiv. We keep L and Q, skipping Ketiv-only and other variants.
 */
function keepWord(testament: 'OT' | 'NT', type: string): boolean {
  return testament === 'NT' ? type.startsWith('N') : type.startsWith('L') || type.startsWith('Q');
}

/** "ἀρχῇ (archēa)" → ["ἀρχῇ", "archēa"]. */
function splitGreek(cell: string): [string, string] {
  const m = /^(.*?)\s*\(([^)]*)\)\s*$/.exec(cell);
  return m ? [m[1].trim(), m[2].trim()] : [cell.trim(), ''];
}

/**
 * Pick the main lexical Strong's from a TAHOT dStrongs cell: the braced entry
 * is the word itself, the rest are prefixes/suffixes ("H9003/{H7225G}").
 */
function primaryHebrewStrongs(cell: string): string {
  const braced = /\{([HG]\d+[A-Za-z]?)\}/.exec(cell);
  if (braced) return braced[1];
  const first = /([HG]\d+[A-Za-z]?)/.exec(cell);
  return first ? first[1] : '';
}

/**
 * Parse a TAGNT or TAHOT file into verses. Testament is inferred from the
 * Strong's prefix of the first word row, so the caller can pass either file.
 */
export function parseTranslatorsAmalgamated(text: string): OriginalVerse[] {
  const verses = new Map<string, OriginalVerse>();

  for (const line of text.split(/\r?\n/)) {
    const cols = line.split('\t');
    const ref = WORD_REF.exec(cols[0]);
    if (!ref) continue;

    const [, stepBook, chapter, verse, , type] = ref;
    // Column layouts differ: TAGNT puts "Strong=Grammar" in col 3; TAHOT has
    // Hebrew, transliteration, translation, dStrongs, grammar in cols 1-5.
    const isGreek = /^G\d/.test(cols[3] || '');
    const testament: 'OT' | 'NT' = isGreek ? 'NT' : 'OT';
    if (!keepWord(testament, type)) continue;

    let word: OriginalWord;
    if (isGreek) {
      const [w, x] = splitGreek(cols[1] || '');
      const [s, m] = (cols[3] || '').split('=');
      word = { w, x, g: (cols[2] || '').trim(), s: (s || '').trim(), m: (m || '').trim() };
    } else {
      word = {
        // STEP escapes the sof pasuq verse-end mark as "\\׃".
        w: (cols[1] || '').replace(/\\/g, '').trim(),
        x: (cols[2] || '').trim(),
        g: (cols[3] || '').trim(),
        s: primaryHebrewStrongs(cols[4] || ''),
        m: (cols[5] || '').trim(),
      };
    }

    const book = stepBookToUsfm(stepBook);
    const key = `${book}.${chapter}.${verse}`;
    let v = verses.get(key);
    if (!v) {
      v = { book, chapter: Number(chapter), verse: Number(verse), testament, words: [] };
      verses.set(key, v);
    }
    v.words.push(word);
  }

  return [...verses.values()];
}

const DEFINITION_MAX_CHARS = 1200;

/** Strip STEP's light HTML (<b>, <BR />, <ref='…'>) to plain text. */
export function cleanLexiconHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/__/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

/**
 * Parse TBESG/TBESH. Columns: eStrong, "dStrong = relation", uStrong, lemma,
 * transliteration, part of speech, gloss, definition (HTML). Keyed by dStrong
 * (e.g. "H1254A"), which is what the tagged texts reference.
 */
export function parseBriefLexicon(text: string): LexiconEntry[] {
  const entries = new Map<string, LexiconEntry>();
  for (const line of text.split(/\r?\n/)) {
    if (!/^[HG]\d{4}/.test(line)) continue;
    const cols = line.split('\t');
    if (cols.length < 8) continue;
    const strongs = (cols[1] || '').split('=')[0].trim();
    if (!/^[HG]\d{4}[A-Za-z]?$/.test(strongs) || entries.has(strongs)) continue;
    let definition = cleanLexiconHtml(cols[7] || '');
    if (definition.length > DEFINITION_MAX_CHARS) definition = `${definition.slice(0, DEFINITION_MAX_CHARS)}…`;
    entries.set(strongs, {
      strongs,
      lemma: (cols[3] || '').trim(),
      translit: (cols[4] || '').trim(),
      pos: (cols[5] || '').trim(),
      gloss: (cols[6] || '').trim(),
      definition,
    });
  }
  return [...entries.values()];
}
