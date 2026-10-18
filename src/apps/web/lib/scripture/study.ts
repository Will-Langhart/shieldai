import { getOriginalLanguage, formatOriginalLanguage, STEPBIBLE_ATTRIBUTION } from '../original-language';
import { canonicalize } from './reference';
import { scripture } from './engine';
import type { Passage, VerseHit } from './types';
import type { LexiconFocus, Widget } from './widgets';

/** Word-by-word Greek/Hebrew for a passage: model text plus the word_study widget. */
export async function wordStudy(
  reference: string,
  word?: string
): Promise<{ content: string; widget: Extract<Widget, { type: 'word_study' }> | null }> {
  const lookup = await getOriginalLanguage(reference);
  if (!lookup) {
    return { content: `Could not parse "${reference}" as a verse reference (expected e.g. "John 1:1").`, widget: null };
  }
  const content = formatOriginalLanguage(lookup, word);
  if (!lookup.verses.length) return { content, widget: null };

  const focus: LexiconFocus[] = [];
  const f = word?.trim().toLowerCase();
  const verses = lookup.verses.map(v => ({
    verse: v.verse,
    words: v.words.map(w => {
      const entry = lookup.lexicon.get(w.s);
      if (
        f && entry && !focus.some(e => e.strongs === entry.strongs) &&
        [w.s, w.x, w.g, entry.lemma, entry.translit, entry.gloss].some(x => x?.toLowerCase().includes(f))
      ) {
        focus.push({
          strongs: entry.strongs, lemma: entry.lemma, translit: entry.translit,
          pos: entry.pos, gloss: entry.gloss, definition: entry.definition,
        });
      }
      return { surface: w.w, translit: w.x, gloss: w.g, strongs: w.s, morph: w.m, lemma: entry?.lemma };
    }),
  }));

  return {
    content,
    widget: {
      type: 'word_study',
      data: {
        reference: lookup.range.display,
        language: lookup.verses[0].testament === 'NT' ? 'Greek' : 'Hebrew',
        verses,
        focus,
        attribution: STEPBIBLE_ATTRIBUTION,
      },
    },
  };
}

/**
 * Passages related to a verse, found by searching the verse index with the
 * verse's own text. This is semantic neighborhood, not a curated
 * cross-reference list (Treasury of Scripture Knowledge ingestion is a
 * follow-up), so the UI labels it "Related passages".
 */
export async function relatedPassages(reference: string, limit = 6): Promise<{ source: Passage; related: VerseHit[] } | null> {
  const ref = canonicalize(reference);
  if (!ref) return null;
  const source = await scripture.getPassage(ref, 'KJV');
  if (!source) return null;
  const sourceText = source.verses.map(v => v.text).join(' ');
  const hits = await scripture.search(sourceText, 'semantic', limit + source.verses.length + 2);
  const own = new Set(source.verses.map(v => `${ref.book} ${ref.chapter}:${v.num}`.toLowerCase()));
  return {
    source,
    related: hits.filter(h => !own.has(h.reference.toLowerCase())).slice(0, limit),
  };
}
