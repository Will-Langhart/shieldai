// Shared Bible reference parsing and normalization utilities

export interface ParsedReference {
  book: string;
  chapter?: number;
  verseStart?: number;
  verseEnd?: number;
  raw: string;
}

const BOOK_MAPPINGS: { [key: string]: string } = {
  'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM', 'Deuteronomy': 'DEU',
  'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT', '1 Samuel': '1SA', '2 Samuel': '2SA',
  '1 Kings': '1KI', '2 Kings': '2KI', '1 Chronicles': '1CH', '2 Chronicles': '2CH',
  'Ezra': 'EZR', 'Nehemiah': 'NEH', 'Esther': 'EST', 'Job': 'JOB', 'Psalms': 'PSA',
  'Proverbs': 'PRO', 'Ecclesiastes': 'ECC', 'Song of Solomon': 'SNG', 'Isaiah': 'ISA',
  'Jeremiah': 'JER', 'Lamentations': 'LAM', 'Ezekiel': 'EZK', 'Daniel': 'DAN',
  'Hosea': 'HOS', 'Joel': 'JOL', 'Amos': 'AMO', 'Obadiah': 'OBA', 'Jonah': 'JON',
  'Micah': 'MIC', 'Nahum': 'NAH', 'Habakkuk': 'HAB', 'Zephaniah': 'ZEP', 'Haggai': 'HAG',
  'Zechariah': 'ZEC', 'Malachi': 'MAL',
  'Matthew': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN', 'Acts': 'ACT',
  'Romans': 'ROM', '1 Corinthians': '1CO', '2 Corinthians': '2CO', 'Galatians': 'GAL',
  'Ephesians': 'EPH', 'Philippians': 'PHP', 'Colossians': 'COL', '1 Thessalonians': '1TH',
  '2 Thessalonians': '2TH', '1 Timothy': '1TI', '2 Timothy': '2TI', 'Titus': 'TIT',
  'Philemon': 'PHM', 'Hebrews': 'HEB', 'James': 'JAS', '1 Peter': '1PE', '2 Peter': '2PE',
  '1 John': '1JN', '2 John': '2JN', '3 John': '3JN', 'Jude': 'JUD', 'Revelation': 'REV'
};

export function normalizeReferenceString(reference: string): string {
  return reference.replace(/\s+/g, ' ').trim();
}

export function parseReference(reference: string): ParsedReference | null {
  const ref = normalizeReferenceString(reference);

  // Range: "Book C:V-V"
  let m = ref.match(/^([1-3]?\s*[A-Za-z\s]+)\s+(\d+):(\d+)-(\d+)$/);
  if (m) {
    const [, bookName, chapter, startVerse, endVerse] = m;
    return {
      book: bookName.trim(),
      chapter: parseInt(chapter, 10),
      verseStart: parseInt(startVerse, 10),
      verseEnd: parseInt(endVerse, 10),
      raw: ref
    };
  }

  // Single verse: "Book C:V"
  m = ref.match(/^([1-3]?\s*[A-Za-z\s]+)\s+(\d+):(\d+)$/);
  if (m) {
    const [, bookName, chapter, verse] = m;
    return {
      book: bookName.trim(),
      chapter: parseInt(chapter, 10),
      verseStart: parseInt(verse, 10),
      raw: ref
    };
  }

  // Chapter only: "Book C"
  m = ref.match(/^([1-3]?\s*[A-Za-z\s]+)\s+(\d+)$/);
  if (m) {
    const [, bookName, chapter] = m;
    return {
      book: bookName.trim(),
      chapter: parseInt(chapter, 10),
      raw: ref
    };
  }

  // Book only
  if (BOOK_MAPPINGS[ref]) {
    return { book: ref, raw: ref };
  }

  return null;
}

export function toApiBibleId(reference: string): string {
  const parsed = parseReference(reference);
  if (!parsed) return reference;
  const bookCode = BOOK_MAPPINGS[parsed.book];
  if (!bookCode) return reference;

  if (parsed.chapter && parsed.verseStart && parsed.verseEnd && parsed.verseEnd !== parsed.verseStart) {
    return `${bookCode}.${parsed.chapter}.${parsed.verseStart}-${bookCode}.${parsed.chapter}.${parsed.verseEnd}`;
  }
  if (parsed.chapter && parsed.verseStart) {
    return `${bookCode}.${parsed.chapter}.${parsed.verseStart}`;
  }
  if (parsed.chapter) {
    return `${bookCode}.${parsed.chapter}`;
  }
  return bookCode;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}


