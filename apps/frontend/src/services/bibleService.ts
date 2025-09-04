import { apiService } from './api'
import { BibleVerse, BibleSearchResult, BibleBook, BibleChapter } from '../types/bible'

export class BibleService {
  /**
   * Get Bible verses from a specific book and chapter
   */
  async getVerses(
    book: string,
    chapter: number,
    verseStart?: number,
    verseEnd?: number
  ): Promise<BibleVerse> {
    const response = await apiService.getBibleVerses(book, chapter, verseStart, verseEnd)
    return response.data
  }

  /**
   * Search Bible text
   */
  async searchBible(query: string, limit: number = 10): Promise<BibleSearchResult> {
    const response = await apiService.searchBible(query, limit)
    return response.data
  }

  /**
   * Get list of Bible books
   */
  async getBooks(): Promise<BibleBook[]> {
    const response = await apiService.getBibleBooks()
    return response.data.books
  }

  /**
   * Get chapters for a specific book
   */
  async getChapters(book: string): Promise<BibleChapter[]> {
    const response = await apiService.getBibleChapters(book)
    return response.data.chapters
  }

  /**
   * Get a random verse
   */
  async getRandomVerse(): Promise<BibleVerse> {
    const books = await this.getBooks()
    const randomBook = books[Math.floor(Math.random() * books.length)]
    const chapters = await this.getChapters(randomBook.name)
    const randomChapter = chapters[Math.floor(Math.random() * chapters.length)]
    
    return this.getVerses(randomBook.name, Number(randomChapter.number))
  }

  /**
   * Get verses by reference string (e.g., "John 3:16")
   */
  async getVersesByReference(reference: string): Promise<BibleVerse> {
    const [bookChapter, versePart] = reference.split(':')
    const [book, chapter] = bookChapter.split(' ')
    
    if (versePart) {
      if (versePart.includes('-')) {
        const [start, end] = versePart.split('-').map(Number)
        return this.getVerses(book, Number(chapter), start, end)
      } else {
        return this.getVerses(book, Number(chapter), Number(versePart))
      }
    } else {
      return this.getVerses(book, Number(chapter))
    }
  }
}

export const bibleService = new BibleService()

