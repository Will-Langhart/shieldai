import React, { useState, useEffect, useCallback } from 'react'
import { BookOpen, Search, Bookmark, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import { AIBibleInsights } from './AIBibleInsights'
import { DenominationSelector } from '../../ui/DenominationSelector'

interface BiblePassage {
  id: string
  reference: string
  text: string
  verses: Array<{
    id: string
    text: string
    reference: string
    verseNumber: number
    chapterNumber: number
    bookName: string
  }>
  version: {
    id: string
    name: string
    description: string
    language: { id: string; name: string }
    type: string
  }
}

interface BibleSearchResult {
  query: string
  total: number
  passages: Array<{
    id: string
    reference: string
    text: string
    version: {
      name: string
    }
  }>
}

export function Bible() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBook, setSelectedBook] = useState('Genesis')
  const [selectedChapter, setSelectedChapter] = useState(1)
  const [selectedVerse, setSelectedVerse] = useState(1)
  const [currentPassage, setCurrentPassage] = useState<BiblePassage | null>(null)
  const [searchResults, setSearchResults] = useState<BibleSearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [availableBooks, setAvailableBooks] = useState<string[]>([])
  const [availableChapters, setAvailableChapters] = useState<number[]>([])
  const [availableVerses, setAvailableVerses] = useState<number[]>([])
  const [selectedVersion, setSelectedVersion] = useState('de4e12af7f28f599-02') // Default to KJV
  const [availableVersions, setAvailableVersions] = useState<Array<{id: string, name: string}>>([])

  // Debug logging
  console.log('Bible component rendering', { selectedBook, selectedChapter, selectedVerse, isLoading, error })

  const books = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
    '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
    'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
    'Ecclesiastes', 'Song of Songs', 'Isaiah', 'Jeremiah', 'Lamentations',
    'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
    'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts',
    'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
    'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
    '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
    'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
  ]

  // Initialize available books and versions
  useEffect(() => {
    setAvailableBooks(books)
    loadAvailableVersions()
  }, [])

  // Load available Bible versions
  const loadAvailableVersions = async () => {
    try {
      const response = await fetch('/api/bible/versions')
      const data = await response.json()
      if (response.ok && data.versions) {
        setAvailableVersions(data.versions)
      }
    } catch (err) {
      console.error('Failed to load Bible versions:', err)
    }
  }

  // Load passage when book/chapter/verse changes
  const loadPassage = useCallback(async (book: string, chapter: number, verse?: number) => {
    console.log('Loading passage:', { book, chapter, verse, selectedVersion })
    setIsLoading(true)
    setError(null)
    setShowSearchResults(false)

    try {
      const reference = verse ? `${book} ${chapter}:${verse}` : `${book} ${chapter}`
      console.log('Fetching passage:', reference)
      
      const response = await fetch(`/api/bible/passage?reference=${encodeURIComponent(reference)}&versionId=${selectedVersion}`)
      console.log('API response status:', response.status)
      
      const data = await response.json()
      console.log('API response data:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load passage')
      }

      // Handle different API response structures
      const passage = data.passage || data
      console.log('Processed passage data:', passage)

      // Extract text from HTML content and create verses array
      const content = passage.content || passage.text || ''
      const textContent = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
      
      // Parse verses from the content
      const verses = []
      if (content) {
        // More comprehensive regex to match verse spans and their text
        const verseRegex = /<span[^>]*data-number="(\d+)"[^>]*class="v"[^>]*>(\d+)<\/span>([^<]*?)(?=<span[^>]*data-number="\d+"[^>]*class="v"|$)/g
        let match
        
        while ((match = verseRegex.exec(content)) !== null) {
          const verseNumber = parseInt(match[1])
          const verseText = match[3].trim()
          
          if (verseText) {
            verses.push({
              id: `${passage.id || 'unknown'}-${verseNumber}`,
              text: verseText,
              reference: `${book} ${chapter}:${verseNumber}`,
              verseNumber: verseNumber,
              chapterNumber: chapter,
              bookName: book
            })
          }
        }
        
        // If no verses were parsed, try a simpler approach
        if (verses.length === 0) {
          // Split by verse spans and extract verse numbers and text
          const verseMatches = content.match(/<span[^>]*data-number="(\d+)"[^>]*class="v"[^>]*>(\d+)<\/span>([^<]*)/g)
          if (verseMatches) {
            verseMatches.forEach((match: string, index: number) => {
              const verseNumberMatch = match.match(/data-number="(\d+)"/)
              const verseNumber = verseNumberMatch ? parseInt(verseNumberMatch[1]) : index + 1
              const textMatch = match.match(/<\/span>([^<]*)/)
              const verseText = textMatch ? textMatch[1].trim() : ''
              
              if (verseText) {
                verses.push({
                  id: `${passage.id || 'unknown'}-${verseNumber}`,
                  text: verseText,
                  reference: `${book} ${chapter}:${verseNumber}`,
                  verseNumber: verseNumber,
                  chapterNumber: chapter,
                  bookName: book
                })
              }
            })
          } else {
            // Fallback: create a single verse from the text content
            verses.push({
              id: passage.id || 'unknown',
              text: textContent,
              reference: passage.reference || `${book} ${chapter}${verse ? ':' + verse : ''}`,
              verseNumber: verse || 1,
              chapterNumber: chapter,
              bookName: book
            })
          }
        }
      }

      // Ensure we have the expected structure
      const processedPassage: BiblePassage = {
        id: passage.id || 'unknown',
        reference: passage.reference || `${book} ${chapter}${verse ? ':' + verse : ''}`,
        text: textContent,
        verses: verses,
        version: passage.version || {
          id: selectedVersion,
          name: 'King James Version',
          description: 'King James Version',
          language: { id: 'eng', name: 'English' },
          type: 'text'
        }
      }

      console.log('Processed passage:', processedPassage)
      setCurrentPassage(processedPassage)
      
      // Update available chapters and verses based on the book
      // This is a simplified approach - in a real implementation, you'd fetch this from the API
      const maxChapters = getMaxChaptersForBook(book)
      const chapters = Array.from({ length: maxChapters }, (_, i) => i + 1)
      setAvailableChapters(chapters)

      if (verse) {
        const maxVerses = getMaxVersesForChapter(book, chapter)
        const verses = Array.from({ length: maxVerses }, (_, i) => i + 1)
        setAvailableVerses(verses)
      }
    } catch (err) {
      console.error('Error loading passage:', err)
      setError(err instanceof Error ? err.message : 'Failed to load passage')
    } finally {
      setIsLoading(false)
    }
  }, [selectedVersion])

  // Helper functions for chapter/verse counts (simplified)
  const getMaxChaptersForBook = (book: string): number => {
    const chapterCounts: { [key: string]: number } = {
      'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36, 'Deuteronomy': 34,
      'Joshua': 24, 'Judges': 21, 'Ruth': 4, '1 Samuel': 31, '2 Samuel': 24,
      '1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36, 'Ezra': 10,
      'Nehemiah': 13, 'Esther': 10, 'Job': 42, 'Psalms': 150, 'Proverbs': 31,
      'Ecclesiastes': 12, 'Song of Songs': 8, 'Isaiah': 66, 'Jeremiah': 52, 'Lamentations': 5,
      'Ezekiel': 48, 'Daniel': 12, 'Hosea': 14, 'Joel': 3, 'Amos': 9,
      'Obadiah': 1, 'Jonah': 4, 'Micah': 7, 'Nahum': 3, 'Habakkuk': 3,
      'Zephaniah': 3, 'Haggai': 2, 'Zechariah': 14, 'Malachi': 4,
      'Matthew': 28, 'Mark': 16, 'Luke': 24, 'John': 21, 'Acts': 28,
      'Romans': 16, '1 Corinthians': 16, '2 Corinthians': 13, 'Galatians': 6, 'Ephesians': 6,
      'Philippians': 4, 'Colossians': 4, '1 Thessalonians': 5, '2 Thessalonians': 3,
      '1 Timothy': 6, '2 Timothy': 4, 'Titus': 3, 'Philemon': 1, 'Hebrews': 13,
      'James': 5, '1 Peter': 5, '2 Peter': 3, '1 John': 5, '2 John': 1, '3 John': 1, 'Jude': 1, 'Revelation': 22
    }
    return chapterCounts[book] || 1
  }

  const getMaxVersesForChapter = (book: string, chapter: number): number => {
    // This is a simplified approach - in reality, you'd fetch this from the API
    return 50 // Most chapters have fewer than 50 verses
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/bible/search?query=${encodeURIComponent(searchTerm)}&versionId=${selectedVersion}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      setSearchResults(data)
      setShowSearchResults(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoToPassage = () => {
    loadPassage(selectedBook, selectedChapter, selectedVerse)
  }

  const handleBookChange = (book: string) => {
    setSelectedBook(book)
    setSelectedChapter(1)
    setSelectedVerse(1)
    loadPassage(book, 1, 1)
  }

  const handleChapterChange = (chapter: number) => {
    setSelectedChapter(chapter)
    setSelectedVerse(1)
    loadPassage(selectedBook, chapter) // Load full chapter
  }

  const handleVerseChange = (verse: number) => {
    setSelectedVerse(verse)
    loadPassage(selectedBook, selectedChapter, verse)
  }

  const handleVersionChange = (versionId: string) => {
    setSelectedVersion(versionId)
    // Reload current passage with new version
    loadPassage(selectedBook, selectedChapter, selectedVerse)
  }

  // Load initial passage
  useEffect(() => {
    // Add a small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      // Load the entire chapter by default for better content display
      loadPassage(selectedBook, selectedChapter)
    }, 100)
    
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault()
            if (selectedChapter > 1) {
              handleChapterChange(selectedChapter - 1)
            }
            break
          case 'ArrowRight':
            e.preventDefault()
            if (selectedChapter < availableChapters.length) {
              handleChapterChange(selectedChapter + 1)
            }
            break
          case 'ArrowUp':
            e.preventDefault()
            if (selectedVerse > 1) {
              handleVerseChange(selectedVerse - 1)
            }
            break
          case 'ArrowDown':
            e.preventDefault()
            if (selectedVerse < (availableVerses.length || 50)) {
              handleVerseChange(selectedVerse + 1)
            }
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedChapter, selectedVerse, availableChapters.length, availableVerses.length])

  const renderPassageContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
          <span className="ml-2 text-sm text-shield-muted">Loading scripture...</span>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center py-8">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="ml-2 text-sm text-red-400">{error}</span>
        </div>
      )
    }

    if (showSearchResults && searchResults) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Results for "{searchResults.query}"</h3>
            <button
              onClick={() => setShowSearchResults(false)}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Back to Passage
            </button>
          </div>
          <div className="space-y-3">
            {searchResults.passages.map((passage) => (
              <div key={passage.id} className="p-3 bg-shield-canvas rounded-lg">
                <h4 className="text-sm font-semibold text-blue-400 mb-1">{passage.reference}</h4>
                <p className="text-sm text-shield-fg leading-relaxed">{passage.text}</p>
                <button
                  onClick={() => {
                    const [book, chapterVerse] = passage.reference.split(' ')
                    const [chapter, verse] = chapterVerse.split(':')
                    setSelectedBook(book)
                    setSelectedChapter(parseInt(chapter))
                    setSelectedVerse(parseInt(verse))
                    setShowSearchResults(false)
                    loadPassage(book, parseInt(chapter), parseInt(verse))
                  }}
                  className="mt-1.5 text-xs text-blue-400 hover:text-blue-300"
                >
                  Go to this passage
                </button>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (currentPassage) {
      return (
        <div className="prose prose-invert max-w-none">
          <div className="text-sm leading-relaxed">
            {currentPassage.verses && currentPassage.verses.length > 0 ? (
              currentPassage.verses.map((verse, index) => (
                <p key={verse.id || index} className="mb-3">
                  <span className="text-blue-400 font-semibold mr-1.5">{verse.verseNumber}.</span>
                  {verse.text}
                </p>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-shield-muted">No verses found for this passage</p>
                <p className="text-xs text-shield-muted mt-1">
                  Reference: {currentPassage.reference}
                </p>
              </div>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="text-center py-10">
        <BookOpen className="h-10 w-10 text-shield-muted mx-auto mb-3" />
        <p className="text-sm text-shield-muted">Select a passage to begin reading</p>
        <p className="text-xs text-shield-muted mt-1">
          Current selection: {selectedBook} {selectedChapter}:{selectedVerse}
        </p>
        {isLoading && (
          <div className="mt-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-400 mx-auto" />
            <p className="text-xs text-shield-muted mt-1">Loading scripture...</p>
          </div>
        )}
      </div>
    )
  }

  // Simple fallback for debugging
  if (error) {
    return (
      <div className="min-h-screen bg-shield-canvas text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <h1 className="text-lg font-bold mb-1">Error Loading Bible</h1>
          <p className="text-sm text-red-400 mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 text-sm rounded"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-shield-canvas text-white">
      <div className="container mx-auto px-4 py-5">
        <div className="mb-5">
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-400" />
            Bible Study
          </h1>
          <p className="text-shield-muted text-sm">
            Explore scripture with AI-powered insights and study tools
          </p>
        </div>

        {/* Search Bar and Version Selector */}
        <div className="mb-5">
          <div className="flex flex-col lg:flex-row gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search scripture..."
                className="w-full bg-shield-panel border border-shield-edge text-white px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="lg:w-52">
              <select
                value={selectedVersion}
                onChange={(e) => handleVersionChange(e.target.value)}
                className="w-full bg-shield-panel border border-shield-edge text-white px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-blue-500"
              >
                {availableVersions.length > 0 ? (
                  availableVersions.map((version) => (
                    <option key={version.id} value={version.id}>{version.name}</option>
                  ))
                ) : (
                  <option value="de4e12af7f28f599-02">King James Version</option>
                )}
              </select>
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading || !searchTerm.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 text-sm rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span>Search</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-shield-panel rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3">Navigation</h3>

              <div className="space-y-3">
                <div className="text-xs text-shield-muted">
                  💡 Ctrl/Cmd + Arrow keys to navigate
                </div>
                <div>
                  <label className="block text-xs font-medium text-shield-muted mb-1">Book</label>
                  <select
                    value={selectedBook}
                    onChange={(e) => handleBookChange(e.target.value)}
                    className="w-full bg-shield-canvas border border-shield-edge text-white px-2 py-1.5 text-sm rounded focus:outline-none focus:border-blue-500"
                  >
                    {availableBooks.map((book) => (
                      <option key={book} value={book}>{book}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-shield-muted mb-1">Chapter</label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => selectedChapter > 1 && handleChapterChange(selectedChapter - 1)}
                      disabled={selectedChapter <= 1}
                      className="p-1 text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      value={selectedChapter}
                      onChange={(e) => handleChapterChange(parseInt(e.target.value) || 1)}
                      className="flex-1 bg-shield-canvas border border-shield-edge text-white px-2 py-1.5 text-sm rounded focus:outline-none focus:border-blue-500"
                      min="1"
                      max={availableChapters.length}
                    />
                    <button
                      onClick={() => selectedChapter < availableChapters.length && handleChapterChange(selectedChapter + 1)}
                      disabled={selectedChapter >= availableChapters.length}
                      className="p-1 text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-shield-muted mb-1">Verse</label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => selectedVerse > 1 && handleVerseChange(selectedVerse - 1)}
                      disabled={selectedVerse <= 1}
                      className="p-1 text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      value={selectedVerse}
                      onChange={(e) => handleVerseChange(parseInt(e.target.value) || 1)}
                      className="flex-1 bg-shield-canvas border border-shield-edge text-white px-2 py-1.5 text-sm rounded focus:outline-none focus:border-blue-500"
                      min="1"
                      max={availableVerses.length || 50}
                    />
                    <button
                      onClick={() => selectedVerse < (availableVerses.length || 50) && handleVerseChange(selectedVerse + 1)}
                      disabled={selectedVerse >= (availableVerses.length || 50)}
                      className="p-1 text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleGoToPassage}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-1.5 text-sm rounded transition-colors"
                >
                  {isLoading ? 'Loading...' : 'Go to Passage'}
                </button>
              </div>

              <div className="pt-3 mt-3 border-t border-shield-edge">
                <DenominationSelector variant="panel" />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-shield-panel rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">
                  {currentPassage ? currentPassage.reference : `${selectedBook} ${selectedChapter}:${selectedVerse}`}
                </h2>
                <button className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300">
                  <Bookmark className="h-4 w-4" />
                  <span>Bookmark</span>
                </button>
              </div>

              {renderPassageContent()}

              {currentPassage && !showSearchResults && (
                <AIBibleInsights
                  passage={currentPassage}
                  version={selectedVersion}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
