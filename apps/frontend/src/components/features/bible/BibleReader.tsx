import React, { useState, useEffect } from 'react'
import { Button, Input } from '../../ui'
import { LoadingSpinner } from '../../common'
import { BibleVerse, BibleBook, BibleChapter } from '../../../types/bible'

export interface BibleReaderProps {
  onGetVerses: (book: string, chapter: number, verseStart?: number, verseEnd?: number) => Promise<BibleVerse>
  onGetBooks: () => Promise<BibleBook[]>
  onGetChapters: (book: string) => Promise<BibleChapter[]>
  className?: string
}

const BibleReader: React.FC<BibleReaderProps> = ({
  onGetVerses,
  onGetBooks,
  onGetChapters,
  className
}) => {
  const [books, setBooks] = useState<BibleBook[]>([])
  const [chapters, setChapters] = useState<BibleChapter[]>([])
  const [selectedBook, setSelectedBook] = useState('')
  const [selectedChapter, setSelectedChapter] = useState(1)
  const [verseStart, setVerseStart] = useState<number | undefined>()
  const [verseEnd, setVerseEnd] = useState<number | undefined>()
  const [verses, setVerses] = useState<BibleVerse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadBooks()
  }, [])

  useEffect(() => {
    if (selectedBook) {
      loadChapters(selectedBook)
    }
  }, [selectedBook])

  const loadBooks = async () => {
    try {
      const booksData = await onGetBooks()
      setBooks(booksData)
    } catch (error) {
      console.error('Failed to load books:', error)
    }
  }

  const loadChapters = async (book: string) => {
    try {
      const chaptersData = await onGetChapters(book)
      setChapters(chaptersData)
    } catch (error) {
      console.error('Failed to load chapters:', error)
    }
  }

  const loadVerses = async () => {
    if (!selectedBook || !selectedChapter) return

    setLoading(true)
    try {
      const versesData = await onGetVerses(
        selectedBook,
        selectedChapter,
        verseStart,
        verseEnd
      )
      setVerses(versesData)
    } catch (error) {
      console.error('Failed to load verses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookChange = (bookName: string) => {
    setSelectedBook(bookName)
    setSelectedChapter(1)
    setVerses(null)
  }

  const handleChapterChange = (chapter: number) => {
    setSelectedChapter(chapter)
    setVerses(null)
  }

  return (
    <div className={className}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Bible Reader</h2>
        
        {/* Book Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Book
          </label>
          <select
            value={selectedBook}
            onChange={(e) => handleBookChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a book</option>
            {books.map((book) => (
              <option key={book.id} value={book.name}>
                {book.name}
              </option>
            ))}
          </select>
        </div>

        {/* Chapter Selection */}
        {selectedBook && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chapter
            </label>
            <select
              value={selectedChapter}
              onChange={(e) => handleChapterChange(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.number}>
                  Chapter {chapter.number}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Verse Range */}
        {selectedBook && selectedChapter && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Verse (optional)
              </label>
              <Input
                type="number"
                placeholder="e.g., 1"
                value={verseStart?.toString() || ''}
                onChange={(value) => setVerseStart(value ? Number(value) : undefined)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Verse (optional)
              </label>
              <Input
                type="number"
                placeholder="e.g., 10"
                value={verseEnd?.toString() || ''}
                onChange={(value) => setVerseEnd(value ? Number(value) : undefined)}
              />
            </div>
          </div>
        )}

        {/* Load Button */}
        {selectedBook && selectedChapter && (
          <Button
            onClick={loadVerses}
            loading={loading}
            className="w-full"
          >
            Load Verses
          </Button>
        )}

        {/* Verses Display */}
        {loading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {verses && !loading && (
          <div className="mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-600 mb-2">
                {verses.reference}
              </div>
              <div className="text-gray-800 leading-relaxed whitespace-pre-line">
                {verses.text}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BibleReader

