import React, { useState, useEffect } from 'react'
import { 
  Menu, 
  X, 
  Search, 
  BookOpen, 
  Star, 
  History, 
  Settings, 
  ChevronDown, 
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Home,
  Zap,
  Filter,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  Edit3,
  Tag,
  Plus,
  Minus
} from 'lucide-react'

interface MobileBibleNavigationProps {
  currentBook: string
  currentChapter: number
  currentVerse?: number
  currentVersion: string
  onNavigate: (reference: string) => void
  onVersionChange: (version: string) => void
  onAIFeature: (feature: string) => void
  history: Array<{
    id: string
    reference: string
    timestamp: Date
  }>
  favorites: Array<{
    id: string
    reference: string
    book: string
    chapter: number
    verse?: number
    note?: string
  }>
  onAddFavorite: (note?: string) => void
  onRemoveFavorite: (id: string) => void
  onClearHistory: () => void
  onClearFavorites: () => void
  onExportData: () => void
  onImportData: (data: any) => void
}

export function MobileBibleNavigation({
  currentBook,
  currentChapter,
  currentVerse,
  currentVersion,
  onNavigate,
  onVersionChange,
  onAIFeature,
  history,
  favorites,
  onAddFavorite,
  onRemoveFavorite,
  onClearHistory,
  onClearFavorites,
  onExportData,
  onImportData
}: MobileBibleNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'navigation' | 'search' | 'history' | 'favorites' | 'settings'>('navigation')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)

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

  const versions = [
    { id: 'de4e12af7f28f599-02', name: 'KJV', fullName: 'King James Version' },
    { id: 'de4e12af7f28f599-01', name: 'NIV', fullName: 'New International Version' },
    { id: 'de4e12af7f28f599-03', name: 'ESV', fullName: 'English Standard Version' },
    { id: 'de4e12af7f28f599-04', name: 'NLT', fullName: 'New Living Translation' }
  ]

  const aiFeatures = [
    { id: 'insights', label: 'AI Insights', icon: '🧠', description: 'Get AI analysis' },
    { id: 'questions', label: 'Study Questions', icon: '❓', description: 'Generate questions' },
    { id: 'crossrefs', label: 'Cross-References', icon: '🔗', description: 'Find related passages' },
    { id: 'prayer', label: 'Prayer Points', icon: '🙏', description: 'Prayer suggestions' }
  ]

  const quickPassages = [
    { reference: 'John 3:16', label: 'John 3:16', description: 'For God so loved...' },
    { reference: 'Psalm 23', label: 'Psalm 23', description: 'The Lord is my shepherd...' },
    { reference: 'Romans 8:28', label: 'Romans 8:28', description: 'All things work together...' },
    { reference: 'Philippians 4:13', label: 'Philippians 4:13', description: 'I can do all things...' }
  ]

  // Search functionality
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/bible/search?query=${encodeURIComponent(query)}&limit=8`)
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
  }, [searchQuery])

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          onImportData(data)
        } catch (error) {
          console.error('Failed to import data:', error)
        }
      }
      reader.readAsText(file)
    }
  }

  const isCurrentPassageFavorited = favorites.some(fav => 
    fav.book === currentBook && 
    fav.chapter === currentChapter && 
    fav.verse === currentVerse
  )

  const renderNavigationTab = () => (
    <div className="space-y-4">
      {/* Current Location */}
      <div className="bg-shield-canvas rounded-lg p-4">
        <h3 className="font-semibold text-blue-400 mb-3">Current Location</h3>
        <div className="text-center">
          <div className="text-lg font-bold text-white">{currentBook} {currentChapter}</div>
          {currentVerse && <div className="text-sm text-shield-muted">Verse {currentVerse}</div>}
        </div>
        
        {/* Navigation Controls */}
        <div className="flex items-center justify-center space-x-4 mt-4">
          <button
            onClick={() => onNavigate(`${currentBook} ${Math.max(1, currentChapter - 1)}`)}
            disabled={currentChapter <= 1}
            className="p-2 bg-shield-panel rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => onNavigate(`${currentBook} ${currentChapter + 1}`)}
            className="p-2 bg-shield-panel rounded-lg"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Book Selection */}
      <div className="bg-shield-canvas rounded-lg p-4">
        <button
          onClick={() => toggleSection('books')}
          className="w-full flex items-center justify-between p-3 bg-shield-panel rounded-lg"
        >
          <span className="font-medium">Select Book</span>
          {expandedSections.has('books') ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        
        {expandedSections.has('books') && (
          <div className="mt-3 max-h-64 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              {books.map(book => (
                <button
                  key={book}
                  onClick={() => {
                    onNavigate(`${book} 1`)
                    setIsOpen(false)
                  }}
                  className={`p-2 text-sm rounded transition-colors ${
                    currentBook === book
                      ? 'bg-blue-600 text-white'
                      : 'bg-shield-panel text-shield-fg hover:bg-shield-elevated'
                  }`}
                >
                  {book}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Passages */}
      <div className="bg-shield-canvas rounded-lg p-4">
        <h3 className="font-semibold text-green-400 mb-3">Quick Passages</h3>
        <div className="space-y-2">
          {quickPassages.map(passage => (
            <button
              key={passage.reference}
              onClick={() => {
                onNavigate(passage.reference)
                setIsOpen(false)
              }}
              className="w-full text-left p-3 bg-shield-panel rounded-lg hover:bg-shield-elevated transition-colors"
            >
              <div className="font-medium text-blue-400">{passage.label}</div>
              <div className="text-sm text-shield-muted">{passage.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const renderSearchTab = () => (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-shield-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search scripture..."
          className="w-full bg-shield-canvas border border-shield-edge text-white px-10 py-3 rounded-lg focus:outline-none focus:border-blue-500"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
          </div>
        )}
      </div>

      {searchResults.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-green-400">Search Results</h3>
          {searchResults.map((result, index) => (
            <button
              key={index}
              onClick={() => {
                onNavigate(result.reference)
                setIsOpen(false)
              }}
              className="w-full text-left p-3 bg-shield-canvas rounded-lg hover:bg-shield-panel transition-colors"
            >
              <div className="font-medium text-blue-400">{result.reference}</div>
              <div className="text-sm text-shield-fg mt-1 line-clamp-2">{result.text}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const renderHistoryTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-purple-400">Recent Passages</h3>
        <button
          onClick={onClearHistory}
          className="text-xs text-red-400 hover:text-red-300"
        >
          Clear All
        </button>
      </div>
      
      {history.length === 0 ? (
        <div className="text-center py-8 text-shield-muted">
          <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No recent passages</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.slice(0, 10).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.reference)
                setIsOpen(false)
              }}
              className="w-full text-left p-3 bg-shield-canvas rounded-lg hover:bg-shield-panel transition-colors"
            >
              <div className="font-medium text-blue-400">{item.reference}</div>
              <div className="text-xs text-shield-muted">
                {item.timestamp.toLocaleDateString()} at {item.timestamp.toLocaleTimeString()}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const renderFavoritesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-yellow-400">Favorite Passages</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => onAddFavorite()}
            disabled={isCurrentPassageFavorited}
            className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
          >
            Add Current
          </button>
          <button
            onClick={onClearFavorites}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Clear All
          </button>
        </div>
      </div>
      
      {favorites.length === 0 ? (
        <div className="text-center py-8 text-shield-muted">
          <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No favorite passages</p>
        </div>
      ) : (
        <div className="space-y-2">
          {favorites.map((favorite) => (
            <div
              key={favorite.id}
              className="flex items-center justify-between p-3 bg-shield-canvas rounded-lg"
            >
              <button
                onClick={() => {
                  onNavigate(favorite.reference)
                  setIsOpen(false)
                }}
                className="flex-1 text-left hover:text-blue-400 transition-colors"
              >
                <div className="font-medium text-yellow-400">{favorite.reference}</div>
                {favorite.note && (
                  <div className="text-xs text-shield-muted mt-1">{favorite.note}</div>
                )}
              </button>
              <button
                onClick={() => onRemoveFavorite(favorite.id)}
                className="p-1 text-shield-muted hover:text-red-400 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderSettingsTab = () => (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-400">Settings</h3>
      
      {/* Version Selection */}
      <div>
        <label className="block text-sm font-medium text-shield-muted mb-2">Bible Version</label>
        <select
          value={currentVersion}
          onChange={(e) => onVersionChange(e.target.value)}
          className="w-full bg-shield-canvas border border-shield-edge text-white px-3 py-2 rounded focus:outline-none focus:border-blue-500"
        >
          {versions.map(version => (
            <option key={version.id} value={version.id}>
              {version.name} - {version.fullName}
            </option>
          ))}
        </select>
      </div>

      {/* AI Features */}
      <div>
        <h4 className="font-medium text-shield-fg mb-3">AI Features</h4>
        <div className="grid grid-cols-2 gap-2">
          {aiFeatures.map(feature => (
            <button
              key={feature.id}
              onClick={() => {
                onAIFeature(feature.id)
                setIsOpen(false)
              }}
              className="p-3 bg-shield-canvas rounded-lg hover:bg-shield-panel transition-colors text-left"
            >
              <div className="text-2xl mb-1">{feature.icon}</div>
              <div className="text-sm font-medium">{feature.label}</div>
              <div className="text-xs text-shield-muted">{feature.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div>
        <h4 className="font-medium text-shield-fg mb-3">Data Management</h4>
        <div className="space-y-2">
          <button
            onClick={onExportData}
            className="w-full flex items-center space-x-2 p-3 bg-shield-canvas rounded-lg hover:bg-shield-panel transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export Data</span>
          </button>
          <label className="w-full flex items-center space-x-2 p-3 bg-shield-canvas rounded-lg hover:bg-shield-panel transition-colors cursor-pointer">
            <Upload className="h-4 w-4" />
            <span>Import Data</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  )

  const tabs = [
    { id: 'navigation', label: 'Navigate', icon: BookOpen },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'history', label: 'History', icon: History },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 z-40 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile Navigation Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
          
          <div className="absolute bottom-0 left-0 right-0 bg-shield-canvas rounded-t-lg max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-shield-edge">
              <h2 className="text-lg font-semibold">Bible Navigation</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-shield-muted hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-shield-edge">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 p-3 text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-shield-muted hover:text-white'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              {activeTab === 'navigation' && renderNavigationTab()}
              {activeTab === 'search' && renderSearchTab()}
              {activeTab === 'history' && renderHistoryTab()}
              {activeTab === 'favorites' && renderFavoritesTab()}
              {activeTab === 'settings' && renderSettingsTab()}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
