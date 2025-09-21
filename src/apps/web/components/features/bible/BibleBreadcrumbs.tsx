import React from 'react'
import { 
  ChevronRight, 
  Home, 
  BookOpen, 
  Hash, 
  Clock, 
  Star,
  RotateCcw,
  ExternalLink
} from 'lucide-react'

interface BreadcrumbItem {
  id: string
  label: string
  type: 'home' | 'testament' | 'book' | 'chapter' | 'verse' | 'search' | 'favorite'
  reference?: string
  onClick?: () => void
  isActive?: boolean
}

interface BibleBreadcrumbsProps {
  currentBook: string
  currentChapter: number
  currentVerse?: number
  currentVersion?: string
  searchQuery?: string
  isSearchResult?: boolean
  onNavigate: (reference: string) => void
  onGoHome: () => void
  history?: Array<{
    id: string
    reference: string
    timestamp: Date
  }>
  favorites?: Array<{
    id: string
    reference: string
    book: string
    chapter: number
    verse?: number
  }>
  showHistory?: boolean
  showFavorites?: boolean
}

export function BibleBreadcrumbs({
  currentBook,
  currentChapter,
  currentVerse,
  currentVersion,
  searchQuery,
  isSearchResult = false,
  onNavigate,
  onGoHome,
  history = [],
  favorites = [],
  showHistory = true,
  showFavorites = true
}: BibleBreadcrumbsProps) {
  const [showHistoryDropdown, setShowHistoryDropdown] = React.useState(false)
  const [showFavoritesDropdown, setShowFavoritesDropdown] = React.useState(false)

  const getTestament = (book: string): 'old' | 'new' => {
    const oldTestamentBooks = [
      'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
      'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
      '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
      'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
      'Ecclesiastes', 'Song of Songs', 'Isaiah', 'Jeremiah', 'Lamentations',
      'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
      'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
      'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
    ]
    return oldTestamentBooks.includes(book) ? 'old' : 'new'
  }

  const getBookCategory = (book: string): string => {
    const categories: { [key: string]: string } = {
      // Old Testament
      'Genesis': 'Law', 'Exodus': 'Law', 'Leviticus': 'Law', 'Numbers': 'Law', 'Deuteronomy': 'Law',
      'Joshua': 'History', 'Judges': 'History', 'Ruth': 'History', '1 Samuel': 'History', '2 Samuel': 'History',
      '1 Kings': 'History', '2 Kings': 'History', '1 Chronicles': 'History', '2 Chronicles': 'History',
      'Ezra': 'History', 'Nehemiah': 'History', 'Esther': 'History',
      'Job': 'Poetry', 'Psalms': 'Poetry', 'Proverbs': 'Poetry', 'Ecclesiastes': 'Poetry', 'Song of Songs': 'Poetry',
      'Isaiah': 'Prophecy', 'Jeremiah': 'Prophecy', 'Lamentations': 'Prophecy', 'Ezekiel': 'Prophecy', 'Daniel': 'Prophecy',
      'Hosea': 'Prophecy', 'Joel': 'Prophecy', 'Amos': 'Prophecy', 'Obadiah': 'Prophecy', 'Jonah': 'Prophecy',
      'Micah': 'Prophecy', 'Nahum': 'Prophecy', 'Habakkuk': 'Prophecy', 'Zephaniah': 'Prophecy',
      'Haggai': 'Prophecy', 'Zechariah': 'Prophecy', 'Malachi': 'Prophecy',
      // New Testament
      'Matthew': 'Gospel', 'Mark': 'Gospel', 'Luke': 'Gospel', 'John': 'Gospel',
      'Acts': 'History',
      'Romans': 'Epistle', '1 Corinthians': 'Epistle', '2 Corinthians': 'Epistle', 'Galatians': 'Epistle',
      'Ephesians': 'Epistle', 'Philippians': 'Epistle', 'Colossians': 'Epistle', '1 Thessalonians': 'Epistle',
      '2 Thessalonians': 'Epistle', '1 Timothy': 'Epistle', '2 Timothy': 'Epistle', 'Titus': 'Epistle',
      'Philemon': 'Epistle', 'Hebrews': 'Epistle', 'James': 'Epistle', '1 Peter': 'Epistle',
      '2 Peter': 'Epistle', '1 John': 'Epistle', '2 John': 'Epistle', '3 John': 'Epistle',
      'Jude': 'Epistle', 'Revelation': 'Prophecy'
    }
    return categories[book] || 'Unknown'
  }

  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = []

    // Home
    breadcrumbs.push({
      id: 'home',
      label: 'Bible Study',
      type: 'home',
      onClick: onGoHome
    })

    if (isSearchResult && searchQuery) {
      // Search result
      breadcrumbs.push({
        id: 'search',
        label: `Search: "${searchQuery}"`,
        type: 'search',
        isActive: true
      })
    } else {
      // Testament
      const testament = getTestament(currentBook)
      breadcrumbs.push({
        id: 'testament',
        label: testament === 'old' ? 'Old Testament' : 'New Testament',
        type: 'testament',
        onClick: () => onNavigate(testament === 'old' ? 'Genesis 1' : 'Matthew 1')
      })

      // Book
      breadcrumbs.push({
        id: 'book',
        label: currentBook,
        type: 'book',
        reference: `${currentBook} 1`,
        onClick: () => onNavigate(`${currentBook} 1`)
      })

      // Chapter
      breadcrumbs.push({
        id: 'chapter',
        label: `Chapter ${currentChapter}`,
        type: 'chapter',
        reference: `${currentBook} ${currentChapter}`,
        onClick: () => onNavigate(`${currentBook} ${currentChapter}`)
      })

      // Verse (if applicable)
      if (currentVerse) {
        breadcrumbs.push({
          id: 'verse',
          label: `Verse ${currentVerse}`,
          type: 'verse',
          reference: `${currentBook} ${currentChapter}:${currentVerse}`,
          isActive: true
        })
      } else {
        // Mark chapter as active if no specific verse
        breadcrumbs[breadcrumbs.length - 1].isActive = true
      }
    }

    return breadcrumbs
  }

  const breadcrumbs = buildBreadcrumbs()

  const getBreadcrumbIcon = (type: string) => {
    switch (type) {
      case 'home': return <Home className="h-4 w-4" />
      case 'testament': return <BookOpen className="h-4 w-4" />
      case 'book': return <BookOpen className="h-4 w-4" />
      case 'chapter': return <Hash className="h-4 w-4" />
      case 'verse': return <Hash className="h-4 w-4" />
      case 'search': return <ExternalLink className="h-4 w-4" />
      case 'favorite': return <Star className="h-4 w-4" />
      default: return <BookOpen className="h-4 w-4" />
    }
  }

  const getBreadcrumbColor = (type: string, isActive: boolean = false) => {
    if (isActive) return 'text-white'
    
    switch (type) {
      case 'home': return 'text-blue-400'
      case 'testament': return 'text-purple-400'
      case 'book': return 'text-green-400'
      case 'chapter': return 'text-orange-400'
      case 'verse': return 'text-yellow-400'
      case 'search': return 'text-pink-400'
      case 'favorite': return 'text-yellow-400'
      default: return 'text-[#9CA3AF]'
    }
  }

  return (
    <div className="bg-[#1A1D24] rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={item.id}>
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-[#6B7280] mx-1" />
              )}
              <button
                onClick={item.onClick}
                disabled={item.isActive}
                className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                  item.isActive
                    ? 'bg-blue-600 text-white cursor-default'
                    : 'hover:bg-[#2C303A] text-[#9CA3AF] hover:text-white'
                }`}
              >
                {getBreadcrumbIcon(item.type)}
                <span>{item.label}</span>
              </button>
            </React.Fragment>
          ))}
        </nav>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          {/* History Dropdown */}
          {showHistory && history.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                className="flex items-center space-x-1 px-3 py-2 bg-[#2C303A] hover:bg-[#3A404B] text-[#9CA3AF] hover:text-white rounded transition-colors"
              >
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
                <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full ml-1">
                  {history.length}
                </span>
              </button>
              
              {showHistoryDropdown && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#2C303A] rounded-lg shadow-lg border border-[#3A404B] z-50">
                  <div className="p-3 border-b border-[#3A404B]">
                    <h3 className="font-medium text-white">Recent Passages</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {history.slice(0, 8).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.reference)
                          setShowHistoryDropdown(false)
                        }}
                        className="w-full text-left p-3 hover:bg-[#1A1D24] transition-colors"
                      >
                        <div className="font-medium text-blue-400">{item.reference}</div>
                        <div className="text-xs text-[#9CA3AF]">
                          {item.timestamp.toLocaleDateString()} at {item.timestamp.toLocaleTimeString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Favorites Dropdown */}
          {showFavorites && favorites.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowFavoritesDropdown(!showFavoritesDropdown)}
                className="flex items-center space-x-1 px-3 py-2 bg-[#2C303A] hover:bg-[#3A404B] text-[#9CA3AF] hover:text-white rounded transition-colors"
              >
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline">Favorites</span>
                <span className="text-xs bg-yellow-600 text-white px-1.5 py-0.5 rounded-full ml-1">
                  {favorites.length}
                </span>
              </button>
              
              {showFavoritesDropdown && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#2C303A] rounded-lg shadow-lg border border-[#3A404B] z-50">
                  <div className="p-3 border-b border-[#3A404B]">
                    <h3 className="font-medium text-white">Favorite Passages</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {favorites.slice(0, 8).map((favorite) => (
                      <button
                        key={favorite.id}
                        onClick={() => {
                          onNavigate(favorite.reference)
                          setShowFavoritesDropdown(false)
                        }}
                        className="w-full text-left p-3 hover:bg-[#1A1D24] transition-colors"
                      >
                        <div className="font-medium text-yellow-400">{favorite.reference}</div>
                        <div className="text-xs text-[#9CA3AF]">
                          {favorite.book} {favorite.chapter}
                          {favorite.verse && `:${favorite.verse}`}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Version Info */}
          {currentVersion && (
            <div className="hidden md:flex items-center space-x-1 px-3 py-2 bg-[#2C303A] text-[#9CA3AF] rounded">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm">
                {currentVersion === 'de4e12af7f28f599-02' ? 'KJV' : 
                 currentVersion === 'de4e12af7f28f599-01' ? 'NIV' : 
                 currentVersion === 'de4e12af7f28f599-03' ? 'ESV' : 'NLT'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-3 pt-3 border-t border-[#3A404B]">
        <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
          <div className="flex items-center space-x-4">
            <span>Category: {getBookCategory(currentBook)}</span>
            <span>Testament: {getTestament(currentBook) === 'old' ? 'Old' : 'New'}</span>
            {currentVerse && <span>Verse: {currentVerse}</span>}
          </div>
          <div className="flex items-center space-x-2">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            <button
              onClick={() => window.location.reload()}
              className="p-1 hover:text-white transition-colors"
              title="Refresh"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
