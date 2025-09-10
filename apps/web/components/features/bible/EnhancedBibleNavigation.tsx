import React, { useState, useEffect, useRef } from 'react'
import { 
  BookOpen, 
  Search, 
  History, 
  Star, 
  Bookmark, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight,
  Home,
  Clock,
  Filter,
  X,
  Plus,
  Minus,
  RotateCcw,
  Settings,
  Zap,
  Lightbulb,
  Heart,
  Cross,
  MessageCircle,
  Link,
  Brain
} from 'lucide-react'

interface BibleBook {
  name: string
  chapters: number
  testament: 'old' | 'new'
  category: string
  description: string
}

interface NavigationHistory {
  id: string
  reference: string
  timestamp: Date
  book: string
  chapter: number
  verse?: number
}

interface FavoritePassage {
  id: string
  reference: string
  book: string
  chapter: number
  verse?: number
  note?: string
  addedAt: Date
}

interface EnhancedBibleNavigationProps {
  selectedBook: string
  selectedChapter: number
  selectedVerse?: number
  selectedVersion: string
  onBookChange: (book: string) => void
  onChapterChange: (chapter: number) => void
  onVerseChange: (verse: number) => void
  onVersionChange: (version: string) => void
  onPassageSelect: (reference: string) => void
  onFavoriteAdd?: (passage: FavoritePassage) => void
  onFavoriteRemove?: (id: string) => void
  favorites?: FavoritePassage[]
  history?: NavigationHistory[]
}

export function EnhancedBibleNavigation({
  selectedBook,
  selectedChapter,
  selectedVerse,
  selectedVersion,
  onBookChange,
  onChapterChange,
  onVerseChange,
  onVersionChange,
  onPassageSelect,
  onFavoriteAdd,
  onFavoriteRemove,
  favorites = [],
  history = []
}: EnhancedBibleNavigationProps) {
  const [activeSection, setActiveSection] = useState<'navigation' | 'search' | 'history' | 'favorites' | 'settings'>('navigation')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set())
  const [expandedTestaments, setExpandedTestaments] = useState<Set<string>>(new Set(['old', 'new']))
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [quickNavOpen, setQuickNavOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const bibleBooks: BibleBook[] = [
    // Old Testament
    { name: 'Genesis', chapters: 50, testament: 'old', category: 'Law', description: 'The beginning of creation and God\'s covenant with Abraham' },
    { name: 'Exodus', chapters: 40, testament: 'old', category: 'Law', description: 'The deliverance of Israel from Egypt and the giving of the Law' },
    { name: 'Leviticus', chapters: 27, testament: 'old', category: 'Law', description: 'Laws for worship and holy living' },
    { name: 'Numbers', chapters: 36, testament: 'old', category: 'Law', description: 'Israel\'s journey in the wilderness' },
    { name: 'Deuteronomy', chapters: 34, testament: 'old', category: 'Law', description: 'Moses\' final words and the renewal of the covenant' },
    { name: 'Joshua', chapters: 24, testament: 'old', category: 'History', description: 'The conquest of the Promised Land' },
    { name: 'Judges', chapters: 21, testament: 'old', category: 'History', description: 'The period of judges and cycles of sin and deliverance' },
    { name: 'Ruth', chapters: 4, testament: 'old', category: 'History', description: 'A story of loyalty and God\'s providence' },
    { name: '1 Samuel', chapters: 31, testament: 'old', category: 'History', description: 'The transition from judges to kings' },
    { name: '2 Samuel', chapters: 24, testament: 'old', category: 'History', description: 'The reign of King David' },
    { name: '1 Kings', chapters: 22, testament: 'old', category: 'History', description: 'The divided kingdom and Elijah\'s ministry' },
    { name: '2 Kings', chapters: 25, testament: 'old', category: 'History', description: 'The fall of Israel and Judah' },
    { name: '1 Chronicles', chapters: 29, testament: 'old', category: 'History', description: 'Genealogies and David\'s reign' },
    { name: '2 Chronicles', chapters: 36, testament: 'old', category: 'History', description: 'The history of Judah from Solomon to exile' },
    { name: 'Ezra', chapters: 10, testament: 'old', category: 'History', description: 'The return from exile and rebuilding of the temple' },
    { name: 'Nehemiah', chapters: 13, testament: 'old', category: 'History', description: 'The rebuilding of Jerusalem\'s walls' },
    { name: 'Esther', chapters: 10, testament: 'old', category: 'History', description: 'God\'s deliverance of the Jews in Persia' },
    { name: 'Job', chapters: 42, testament: 'old', category: 'Poetry', description: 'The problem of suffering and God\'s sovereignty' },
    { name: 'Psalms', chapters: 150, testament: 'old', category: 'Poetry', description: 'Songs and prayers of worship' },
    { name: 'Proverbs', chapters: 31, testament: 'old', category: 'Poetry', description: 'Wisdom for daily living' },
    { name: 'Ecclesiastes', chapters: 12, testament: 'old', category: 'Poetry', description: 'The meaning of life under the sun' },
    { name: 'Song of Songs', chapters: 8, testament: 'old', category: 'Poetry', description: 'A celebration of love and marriage' },
    { name: 'Isaiah', chapters: 66, testament: 'old', category: 'Prophecy', description: 'Prophecies of judgment and hope' },
    { name: 'Jeremiah', chapters: 52, testament: 'old', category: 'Prophecy', description: 'The weeping prophet and fall of Jerusalem' },
    { name: 'Lamentations', chapters: 5, testament: 'old', category: 'Prophecy', description: 'Mourning over Jerusalem\'s destruction' },
    { name: 'Ezekiel', chapters: 48, testament: 'old', category: 'Prophecy', description: 'Visionary prophecies of restoration' },
    { name: 'Daniel', chapters: 12, testament: 'old', category: 'Prophecy', description: 'Prophecies of future kingdoms and end times' },
    { name: 'Hosea', chapters: 14, testament: 'old', category: 'Prophecy', description: 'God\'s faithful love despite Israel\'s unfaithfulness' },
    { name: 'Joel', chapters: 3, testament: 'old', category: 'Prophecy', description: 'The day of the Lord and outpouring of the Spirit' },
    { name: 'Amos', chapters: 9, testament: 'old', category: 'Prophecy', description: 'Social justice and God\'s judgment' },
    { name: 'Obadiah', chapters: 1, testament: 'old', category: 'Prophecy', description: 'Judgment against Edom' },
    { name: 'Jonah', chapters: 4, testament: 'old', category: 'Prophecy', description: 'God\'s mercy to Nineveh' },
    { name: 'Micah', chapters: 7, testament: 'old', category: 'Prophecy', description: 'Justice, mercy, and the coming Messiah' },
    { name: 'Nahum', chapters: 3, testament: 'old', category: 'Prophecy', description: 'Judgment against Nineveh' },
    { name: 'Habakkuk', chapters: 3, testament: 'old', category: 'Prophecy', description: 'Faith in God\'s justice and timing' },
    { name: 'Zephaniah', chapters: 3, testament: 'old', category: 'Prophecy', description: 'The day of the Lord and restoration' },
    { name: 'Haggai', chapters: 2, testament: 'old', category: 'Prophecy', description: 'Rebuilding the temple' },
    { name: 'Zechariah', chapters: 14, testament: 'old', category: 'Prophecy', description: 'Visionary prophecies of the Messiah' },
    { name: 'Malachi', chapters: 4, testament: 'old', category: 'Prophecy', description: 'The last Old Testament prophet' },
    
    // New Testament
    { name: 'Matthew', chapters: 28, testament: 'new', category: 'Gospel', description: 'The King and His Kingdom' },
    { name: 'Mark', chapters: 16, testament: 'new', category: 'Gospel', description: 'The Servant and His service' },
    { name: 'Luke', chapters: 24, testament: 'new', category: 'Gospel', description: 'The Son of Man and His humanity' },
    { name: 'John', chapters: 21, testament: 'new', category: 'Gospel', description: 'The Son of God and His deity' },
    { name: 'Acts', chapters: 28, testament: 'new', category: 'History', description: 'The spread of the Gospel' },
    { name: 'Romans', chapters: 16, testament: 'new', category: 'Epistle', description: 'The gospel of God\'s righteousness' },
    { name: '1 Corinthians', chapters: 16, testament: 'new', category: 'Epistle', description: 'Problems in the Corinthian church' },
    { name: '2 Corinthians', chapters: 13, testament: 'new', category: 'Epistle', description: 'Paul\'s defense of his ministry' },
    { name: 'Galatians', chapters: 6, testament: 'new', category: 'Epistle', description: 'Justification by faith alone' },
    { name: 'Ephesians', chapters: 6, testament: 'new', category: 'Epistle', description: 'The church as Christ\'s body' },
    { name: 'Philippians', chapters: 4, testament: 'new', category: 'Epistle', description: 'Joy in Christ despite circumstances' },
    { name: 'Colossians', chapters: 4, testament: 'new', category: 'Epistle', description: 'The supremacy of Christ' },
    { name: '1 Thessalonians', chapters: 5, testament: 'new', category: 'Epistle', description: 'The second coming of Christ' },
    { name: '2 Thessalonians', chapters: 3, testament: 'new', category: 'Epistle', description: 'Correcting false teaching about the end times' },
    { name: '1 Timothy', chapters: 6, testament: 'new', category: 'Epistle', description: 'Instructions for church leadership' },
    { name: '2 Timothy', chapters: 4, testament: 'new', category: 'Epistle', description: 'Paul\'s final charge to Timothy' },
    { name: 'Titus', chapters: 3, testament: 'new', category: 'Epistle', description: 'Instructions for church organization' },
    { name: 'Philemon', chapters: 1, testament: 'new', category: 'Epistle', description: 'A personal letter about forgiveness' },
    { name: 'Hebrews', chapters: 13, testament: 'new', category: 'Epistle', description: 'Christ\'s superiority over the old covenant' },
    { name: 'James', chapters: 5, testament: 'new', category: 'Epistle', description: 'Faith demonstrated through works' },
    { name: '1 Peter', chapters: 5, testament: 'new', category: 'Epistle', description: 'Living as strangers in the world' },
    { name: '2 Peter', chapters: 3, testament: 'new', category: 'Epistle', description: 'Warning against false teachers' },
    { name: '1 John', chapters: 5, testament: 'new', category: 'Epistle', description: 'Walking in the light and love' },
    { name: '2 John', chapters: 1, testament: 'new', category: 'Epistle', description: 'Walking in truth and love' },
    { name: '3 John', chapters: 1, testament: 'new', category: 'Epistle', description: 'Supporting faithful workers' },
    { name: 'Jude', chapters: 1, testament: 'new', category: 'Epistle', description: 'Contending for the faith' },
    { name: 'Revelation', chapters: 22, testament: 'new', category: 'Prophecy', description: 'The end times and Christ\'s return' }
  ]

  const versions = [
    { id: 'de4e12af7f28f599-02', name: 'King James Version', abbreviation: 'KJV' },
    { id: 'de4e12af7f28f599-01', name: 'New International Version', abbreviation: 'NIV' },
    { id: 'de4e12af7f28f599-03', name: 'English Standard Version', abbreviation: 'ESV' },
    { id: 'de4e12af7f28f599-04', name: 'New Living Translation', abbreviation: 'NLT' }
  ]

  const navigationSections = [
    { id: 'navigation', label: 'Navigation', icon: BookOpen, color: 'text-blue-400' },
    { id: 'search', label: 'Search', icon: Search, color: 'text-green-400' },
    { id: 'history', label: 'History', icon: History, color: 'text-purple-400' },
    { id: 'favorites', label: 'Favorites', icon: Star, color: 'text-yellow-400' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'text-gray-400' }
  ]

  // Search functionality
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/bible/search?query=${encodeURIComponent(query)}&versionId=${selectedVersion}&limit=10`)
      const data = await response.json()
      
      if (response.ok) {
        setSearchResults(data.passages || [])
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, selectedVersion])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault()
            searchInputRef.current?.focus()
            setActiveSection('search')
            break
          case 'h':
            e.preventDefault()
            setActiveSection('history')
            break
          case 'f':
            e.preventDefault()
            setActiveSection('favorites')
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  const toggleBookExpansion = (bookName: string) => {
    const newExpanded = new Set(expandedBooks)
    if (newExpanded.has(bookName)) {
      newExpanded.delete(bookName)
    } else {
      newExpanded.add(bookName)
    }
    setExpandedBooks(newExpanded)
  }

  const toggleTestamentExpansion = (testament: string) => {
    const newExpanded = new Set(expandedTestaments)
    if (newExpanded.has(testament)) {
      newExpanded.delete(testament)
    } else {
      newExpanded.add(testament)
    }
    setExpandedTestaments(newExpanded)
  }

  const getCurrentBook = () => bibleBooks.find(book => book.name === selectedBook)
  const currentBook = getCurrentBook()

  const addToFavorites = () => {
    if (onFavoriteAdd) {
      const favorite: FavoritePassage = {
        id: `${selectedBook}-${selectedChapter}-${selectedVerse || 'all'}`,
        reference: selectedVerse ? `${selectedBook} ${selectedChapter}:${selectedVerse}` : `${selectedBook} ${selectedChapter}`,
        book: selectedBook,
        chapter: selectedChapter,
        verse: selectedVerse,
        addedAt: new Date()
      }
      onFavoriteAdd(favorite)
    }
  }

  const removeFromFavorites = (id: string) => {
    if (onFavoriteRemove) {
      onFavoriteRemove(id)
    }
  }

  const isCurrentPassageFavorited = favorites.some(fav => 
    fav.book === selectedBook && 
    fav.chapter === selectedChapter && 
    (fav.verse === selectedVerse || (!fav.verse && !selectedVerse))
  )

  const renderNavigationSection = () => (
    <div className="space-y-4">
      {/* Current Location */}
      <div className="bg-[#1A1D24] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-blue-400">Current Location</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => onChapterChange(Math.max(1, selectedChapter - 1))}
              disabled={selectedChapter <= 1}
              className="p-1 text-[#9CA3AF] hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => onChapterChange(selectedChapter + 1)}
              disabled={selectedChapter >= (currentBook?.chapters || 1)}
              className="p-1 text-[#9CA3AF] hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="text-sm">
          <div className="font-medium text-white">{selectedBook} {selectedChapter}</div>
          {selectedVerse && <div className="text-[#9CA3AF]">Verse {selectedVerse}</div>}
          {currentBook && (
            <div className="text-xs text-[#6B7280] mt-1">{currentBook.description}</div>
          )}
        </div>
      </div>

      {/* Testament Navigation */}
      {(['old', 'new'] as const).map(testament => {
        const testamentBooks = bibleBooks.filter(book => book.testament === testament)
        const testamentName = testament === 'old' ? 'Old Testament' : 'New Testament'
        const isExpanded = expandedTestaments.has(testament)
        
        return (
          <div key={testament} className="bg-[#2C303A] rounded-lg">
            <button
              onClick={() => toggleTestamentExpansion(testament)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-[#3A404B] transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${testament === 'old' ? 'bg-orange-500' : 'bg-green-500'}`} />
                <span className="font-medium">{testamentName}</span>
                <span className="text-xs text-[#9CA3AF]">({testamentBooks.length} books)</span>
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            {isExpanded && (
              <div className="px-4 pb-4 space-y-1">
                {testamentBooks.map(book => (
                  <button
                    key={book.name}
                    onClick={() => onBookChange(book.name)}
                    className={`w-full text-left p-2 rounded text-sm transition-colors ${
                      selectedBook === book.name
                        ? 'bg-blue-600 text-white'
                        : 'text-[#E5E7EB] hover:bg-[#1A1D24]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{book.name}</span>
                      <span className="text-xs text-[#9CA3AF]">{book.chapters} ch</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Chapter Navigation */}
      {currentBook && (
        <div className="bg-[#2C303A] rounded-lg p-4">
          <h4 className="font-medium mb-3">Chapters in {selectedBook}</h4>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map(chapter => (
              <button
                key={chapter}
                onClick={() => onChapterChange(chapter)}
                className={`p-2 text-sm rounded transition-colors ${
                  selectedChapter === chapter
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#1A1D24] text-[#E5E7EB] hover:bg-[#3A404B]'
                }`}
              >
                {chapter}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderSearchSection = () => (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search scripture... (Ctrl+K)"
          className="w-full bg-[#1A1D24] border border-[#3A404B] text-white px-10 py-3 rounded-lg focus:outline-none focus:border-blue-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#9CA3AF] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isSearching && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
          <span className="ml-2 text-[#9CA3AF]">Searching...</span>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-[#9CA3AF]">Search Results</h4>
          {searchResults.map((result, index) => (
            <button
              key={index}
              onClick={() => onPassageSelect(result.reference)}
              className="w-full text-left p-3 bg-[#1A1D24] rounded-lg hover:bg-[#2C303A] transition-colors"
            >
              <div className="font-medium text-blue-400">{result.reference}</div>
              <div className="text-sm text-[#E5E7EB] mt-1 line-clamp-2">{result.text}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const renderHistorySection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Recent Passages</h3>
        <button className="text-xs text-blue-400 hover:text-blue-300">Clear All</button>
      </div>
      
      {history.length === 0 ? (
        <div className="text-center py-8 text-[#9CA3AF]">
          <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No recent passages</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.slice(0, 10).map((item) => (
            <button
              key={item.id}
              onClick={() => onPassageSelect(item.reference)}
              className="w-full text-left p-3 bg-[#1A1D24] rounded-lg hover:bg-[#2C303A] transition-colors"
            >
              <div className="font-medium text-blue-400">{item.reference}</div>
              <div className="text-xs text-[#9CA3AF]">
                {item.timestamp.toLocaleDateString()} at {item.timestamp.toLocaleTimeString()}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const renderFavoritesSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Favorite Passages</h3>
        <button
          onClick={addToFavorites}
          disabled={isCurrentPassageFavorited}
          className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCurrentPassageFavorited ? 'Favorited' : 'Add Current'}
        </button>
      </div>
      
      {favorites.length === 0 ? (
        <div className="text-center py-8 text-[#9CA3AF]">
          <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No favorite passages</p>
        </div>
      ) : (
        <div className="space-y-2">
          {favorites.map((favorite) => (
            <div
              key={favorite.id}
              className="flex items-center justify-between p-3 bg-[#1A1D24] rounded-lg"
            >
              <button
                onClick={() => onPassageSelect(favorite.reference)}
                className="flex-1 text-left hover:text-blue-400 transition-colors"
              >
                <div className="font-medium text-blue-400">{favorite.reference}</div>
                {favorite.note && (
                  <div className="text-xs text-[#9CA3AF] mt-1">{favorite.note}</div>
                )}
              </button>
              <button
                onClick={() => removeFromFavorites(favorite.id)}
                className="p-1 text-[#9CA3AF] hover:text-red-400 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderSettingsSection = () => (
    <div className="space-y-4">
      <h3 className="font-semibold">Settings</h3>
      
      <div>
        <label className="block text-sm font-medium text-[#9CA3AF] mb-2">Bible Version</label>
        <select
          value={selectedVersion}
          onChange={(e) => onVersionChange(e.target.value)}
          className="w-full bg-[#1A1D24] border border-[#3A404B] text-white px-3 py-2 rounded focus:outline-none focus:border-blue-500"
        >
          {versions.map(version => (
            <option key={version.id} value={version.id}>
              {version.name} ({version.abbreviation})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#9CA3AF] mb-2">Navigation Preferences</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" defaultChecked />
            <span className="text-sm">Show book descriptions</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" defaultChecked />
            <span className="text-sm">Auto-save reading history</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-sm">Show verse numbers</span>
          </label>
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-[#2C303A] rounded-lg p-6 h-full">
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="w-full flex items-center justify-between p-3 bg-[#1A1D24] rounded-lg"
        >
          <span className="font-medium">Navigation Menu</span>
          {showMobileMenu ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className={`space-y-4 ${showMobileMenu ? 'block' : 'hidden lg:block'}`}>
        {/* Section Tabs */}
        <div className="flex flex-wrap gap-2">
          {navigationSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#1A1D24] text-[#9CA3AF] hover:bg-[#3A404B] hover:text-white'
              }`}
            >
              <section.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{section.label}</span>
            </button>
          ))}
        </div>

        {/* Section Content */}
        <div className="mt-6">
          {activeSection === 'navigation' && renderNavigationSection()}
          {activeSection === 'search' && renderSearchSection()}
          {activeSection === 'history' && renderHistorySection()}
          {activeSection === 'favorites' && renderFavoritesSection()}
          {activeSection === 'settings' && renderSettingsSection()}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-[#3A404B]">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onPassageSelect(`${selectedBook} ${selectedChapter}`)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Go to Passage</span>
          </button>
          <button
            onClick={addToFavorites}
            disabled={isCurrentPassageFavorited}
            className="flex items-center space-x-2 px-3 py-2 bg-[#1A1D24] hover:bg-[#3A404B] text-[#9CA3AF] hover:text-white rounded text-sm transition-colors disabled:opacity-50"
          >
            <Star className="h-4 w-4" />
            <span>Favorite</span>
          </button>
        </div>
      </div>
    </div>
  )
}
