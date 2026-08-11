/**
 * Bible → `bible-verses` ingest (Phase 2, Option A).
 *
 * Pulls verses from the Bible API (via `bibleService`) and upserts them as TEXT
 * records into the integrated `bible-verses` index (Pinecone embeds them with
 * llama-text-embed-v2). Namespace = the Bible-API version id, so translations
 * are isolated per namespace.
 *
 * Designed to be **bounded and resumable**: a single call imports at most
 * `maxBooks` books starting at `startBookIndex`, and returns `nextBookIndex`
 * (or null when done). This keeps each invocation inside a serverless timeout —
 * a driver calls it repeatedly, advancing the cursor, until `nextBookIndex` is
 * null. References are stored human-readable ("John 3:16") to match the
 * citation-verifier's parser.
 */

import { bibleService } from './bible-service';
import { BibleVersesIndex, type BibleVerseRecord } from './bible-verses-index';

export interface IngestResult {
  versionId: string;
  versionName: string;
  booksProcessed: string[];
  chaptersImported: number;
  versesUpserted: number;
  errors: string[];
  totalBooks: number;
  nextBookIndex: number | null; // null ⇒ ingest complete
}

export interface IngestOptions {
  bookIds?: string[];          // restrict to specific book ids; default all
  startBookIndex?: number;     // resume cursor (default 0)
  maxBooks?: number;           // books per call (default 3, bounded for timeout)
  maxChaptersPerBook?: number; // safety cap per book (default all)
}

export async function importVerses(versionId: string, opts: IngestOptions = {}): Promise<IngestResult> {
  const { bookIds, startBookIndex = 0, maxBooks = 3, maxChaptersPerBook = Infinity } = opts;

  const version = await bibleService.getBibleVersion(versionId);
  if (!version) throw new Error(`Bible version not found: ${versionId}`);
  const versionLabel = (version as any).abbreviation || version.name || versionId;

  let books = await bibleService.getBooksForVersion(versionId);
  if (bookIds && bookIds.length) books = books.filter((b) => bookIds.includes(b.id));

  const result: IngestResult = {
    versionId,
    versionName: version.name,
    booksProcessed: [],
    chaptersImported: 0,
    versesUpserted: 0,
    errors: [],
    totalBooks: books.length,
    nextBookIndex: null,
  };

  const end = Math.min(startBookIndex + maxBooks, books.length);

  for (let bi = startBookIndex; bi < end; bi++) {
    const book = books[bi];
    try {
      const chapters = await bibleService.getChaptersForBook(versionId, book.id);
      let chaptersDone = 0;

      for (const chapter of chapters) {
        if (chaptersDone >= maxChaptersPerBook) break;
        try {
          // getChapterVersesWithText returns verses WITH text (one call/chapter);
          // plain getVerses() would return ids only and upsert nothing.
          const verses = await bibleService.getChapterVersesWithText(versionId, book.id, chapter.id);
          if (!verses || verses.length === 0) continue;

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
          result.chaptersImported += 1;
          chaptersDone += 1;
        } catch (chErr) {
          result.errors.push(`${book.name} ${chapter.number}: ${chErr instanceof Error ? chErr.message : 'error'}`);
        }
      }
      result.booksProcessed.push(book.name);
    } catch (bkErr) {
      result.errors.push(`${book.name}: ${bkErr instanceof Error ? bkErr.message : 'error'}`);
    }
  }

  result.nextBookIndex = end < books.length ? end : null;
  return result;
}
