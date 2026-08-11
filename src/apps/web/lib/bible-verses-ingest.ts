/**
 * Bible → `bible-verses` ingest (Phase 2, Option A).
 *
 * Pulls verses from the Bible API (via `bibleService`) and upserts them as TEXT
 * records into the integrated `bible-verses` index (Pinecone embeds them with
 * llama-text-embed-v2). Namespace = the Bible-API version id, so translations
 * are isolated per namespace.
 *
 * Designed to be **bounded and resumable at CHAPTER granularity**: a single call
 * processes at most `maxChapters` chapters starting from the (book, chapter)
 * cursor, and returns the next cursor (`nextBookIndex`, `nextChapterIndex`) — or
 * nulls when the translation is fully imported. This keeps each invocation
 * inside a serverless timeout even for huge books (Psalms = 150 chapters). A
 * driver calls it repeatedly, advancing the cursor, until it's null. References
 * are stored human-readable ("John 3:16") to match the citation-verifier.
 */

import { bibleService } from './bible-service';
import { BibleVersesIndex, type BibleVerseRecord } from './bible-verses-index';

export interface IngestResult {
  versionId: string;
  versionName: string;
  chaptersImported: number;
  versesUpserted: number;
  errors: string[];
  totalBooks: number;
  // Resume cursor for the next call; both null ⇒ ingest complete.
  nextBookIndex: number | null;
  nextChapterIndex: number | null;
}

export interface IngestOptions {
  bookIds?: string[];        // restrict to specific book ids; default all
  startBookIndex?: number;   // resume: book cursor (default 0)
  startChapterIndex?: number;// resume: chapter cursor within the start book (default 0)
  maxChapters?: number;      // chapters processed this call (default 40)
}

export async function importVerses(versionId: string, opts: IngestOptions = {}): Promise<IngestResult> {
  const { bookIds, startBookIndex = 0, startChapterIndex = 0, maxChapters = 40 } = opts;

  const version = await bibleService.getBibleVersion(versionId);
  if (!version) throw new Error(`Bible version not found: ${versionId}`);
  const versionLabel = (version as any).abbreviation || version.name || versionId;

  let books = await bibleService.getBooksForVersion(versionId);
  if (bookIds && bookIds.length) books = books.filter((b) => bookIds.includes(b.id));

  const result: IngestResult = {
    versionId,
    versionName: version.name,
    chaptersImported: 0,
    versesUpserted: 0,
    errors: [],
    totalBooks: books.length,
    nextBookIndex: null,
    nextChapterIndex: null,
  };

  let budget = maxChapters;

  for (let bi = startBookIndex; bi < books.length; bi++) {
    // Budget exhausted exactly at a book boundary — resume at the next book.
    if (budget <= 0) {
      result.nextBookIndex = bi;
      result.nextChapterIndex = 0;
      return result;
    }
    const book = books[bi];
    let chapters: Array<{ id: string; number: string }>;
    try {
      chapters = await bibleService.getChaptersForBook(versionId, book.id);
    } catch (bkErr) {
      result.errors.push(`${book.name}: ${bkErr instanceof Error ? bkErr.message : 'error'}`);
      continue;
    }

    // Resume mid-book only for the very first book of this call.
    const firstChapter = bi === startBookIndex ? startChapterIndex : 0;

    for (let ci = firstChapter; ci < chapters.length; ci++) {
      if (budget <= 0) {
        // Ran out of budget mid-book — resume here next call.
        result.nextBookIndex = bi;
        result.nextChapterIndex = ci;
        return result;
      }
      const chapter = chapters[ci];
      try {
        const verses = await bibleService.getChapterVersesWithText(versionId, book.id, chapter.id);
        if (verses && verses.length) {
          const chapterNum = Number(chapter.number) || 0;
          const records: BibleVerseRecord[] = verses
            .filter((v) => v.text && v.text.trim().length > 0)
            .map((v) => ({
              _id: `${versionId}_${book.id}_${chapterNum}_${v.verseNumber}`,
              text: v.text.trim(),
              reference: `${book.name} ${chapterNum}:${v.verseNumber}`,
              book: book.name,
              chapter: chapterNum,
              verse: v.verseNumber,
              version: versionLabel,
            }));
          if (records.length) {
            await BibleVersesIndex.upsertVerses(versionId, records);
            result.versesUpserted += records.length;
          }
        }
        result.chaptersImported += 1;
        budget -= 1;
      } catch (chErr) {
        result.errors.push(`${book.name} ${chapter.number}: ${chErr instanceof Error ? chErr.message : 'error'}`);
        budget -= 1; // count the attempt so a persistently-failing chapter can't wedge the cursor
      }
    }
    // Finished this book; if budget remains, the loop advances to the next book.
  }

  // Fell through: either budget exhausted exactly at a book boundary or all done.
  // If we processed the last book to completion, we're done (nulls stay).
  return result;
}
