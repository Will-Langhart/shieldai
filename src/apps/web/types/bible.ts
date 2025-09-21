// Bible Types
export interface BibleVerse {
  text: string
  reference: string
  book: string
  chapter: number
  verse?: number
  verse_start?: number
  verse_end?: number
}

export interface BibleSearchResult {
  results: BibleVerse[]
  query: string
  total_results: number
  bible_id: string
}

export interface BibleBook {
  id: string
  name: string
  abbreviation: string
  testament: 'Old' | 'New'
}

export interface BibleChapter {
  id: string
  number: string
  book_id: string
}

export interface BibleSearchForm {
  query: string
  book?: string
  chapter?: number
  verse_start?: number
  verse_end?: number
}

