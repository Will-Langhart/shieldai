import React, { useState, useEffect, useRef } from 'react'
import { 
  Search, 
  Zap, 
  Command, 
  ArrowRight, 
  Clock, 
  Star, 
  BookOpen, 
  Hash,
  X,
  Loader2,
  Lightbulb,
  Heart,
  Cross,
  MessageCircle,
  Link,
  Brain,
  Settings,
  RotateCcw
} from 'lucide-react'

interface QuickNavItem {
  id: string
  label: string
  description: string
  reference: string
  type: 'passage' | 'search' | 'ai-feature' | 'shortcut'
  icon: React.ComponentType<any>
  shortcut?: string
  category: string
}

interface QuickNavigationProps {
  onNavigate: (reference: string) => void
  onSearch: (query: string) => void
  onAIFeature: (feature: string) => void
  currentBook?: string
  currentChapter?: number
  recentPassages?: Array<{
    reference: string
    timestamp: Date
  }>
  favoritePassages?: Array<{
    reference: string
    book: string
    chapter: number
    verse?: number
  }>
  isOpen: boolean
  onClose: () => void
}

export function QuickNavigation({
  onNavigate,
  onSearch,
  onAIFeature,
  currentBook,
  currentChapter,
  recentPassages = [],
  favoritePassages = [],
  isOpen,
  onClose
}: QuickNavigationProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const quickNavItems: QuickNavItem[] = [
    // AI Features
    {
      id: 'ai-insights',
      label: 'AI Insights',
      description: 'Get AI-powered analysis of current passage',
      reference: 'ai-insights',
      type: 'ai-feature',
      icon: Brain,
      shortcut: 'Ctrl+I',
      category: 'ai'
    },
    {
      id: 'study-questions',
      label: 'Study Questions',
      description: 'Generate AI study questions for this passage',
      reference: 'study-questions',
      type: 'ai-feature',
      icon: MessageCircle,
      shortcut: 'Ctrl+Q',
      category: 'ai'
    },
    {
      id: 'cross-references',
      label: 'Cross-References',
      description: 'Find related Bible passages using AI',
      reference: 'cross-references',
      type: 'ai-feature',
      icon: Link,
      shortcut: 'Ctrl+R',
      category: 'ai'
    },
    {
      id: 'prayer-points',
      label: 'Prayer Points',
      description: 'Get AI-generated prayer suggestions',
      reference: 'prayer-points',
      type: 'ai-feature',
      icon: Heart,
      shortcut: 'Ctrl+P',
      category: 'ai'
    },

    // Quick Passages
    {
      id: 'john-3-16',
      label: 'John 3:16',
      description: 'For God so loved the world...',
      reference: 'John 3:16',
      type: 'passage',
      icon: Cross,
      shortcut: 'Ctrl+J',
      category: 'popular'
    },
    {
      id: 'psalm-23',
      label: 'Psalm 23',
      description: 'The Lord is my shepherd...',
      reference: 'Psalm 23',
      type: 'passage',
      icon: Heart,
      shortcut: 'Ctrl+2',
      category: 'popular'
    },
    {
      id: 'romans-8-28',
      label: 'Romans 8:28',
      description: 'And we know that in all things...',
      reference: 'Romans 8:28',
      type: 'passage',
      icon: Lightbulb,
      shortcut: 'Ctrl+8',
      category: 'popular'
    },
    {
      id: 'philippians-4-13',
      label: 'Philippians 4:13',
      description: 'I can do all things through Christ...',
      reference: 'Philippians 4:13',
      type: 'passage',
      icon: Zap,
      shortcut: 'Ctrl+4',
      category: 'popular'
    },

    // Navigation Shortcuts
    {
      id: 'next-chapter',
      label: 'Next Chapter',
      description: 'Go to next chapter in current book',
      reference: 'next-chapter',
      type: 'shortcut',
      icon: ArrowRight,
      shortcut: 'Ctrl+→',
      category: 'navigation'
    },
    {
      id: 'previous-chapter',
      label: 'Previous Chapter',
      description: 'Go to previous chapter in current book',
      reference: 'previous-chapter',
      type: 'shortcut',
      icon: ArrowRight,
      shortcut: 'Ctrl+←',
      category: 'navigation'
    },
    {
      id: 'random-passage',
      label: 'Random Passage',
      description: 'Open a random Bible passage',
      reference: 'random-passage',
      type: 'shortcut',
      icon: RotateCcw,
      shortcut: 'Ctrl+Shift+R',
      category: 'navigation'
    }
  ]

  const categories = [
    { id: 'all', label: 'All', icon: Search },
    { id: 'ai', label: 'AI Features', icon: Brain },
    { id: 'popular', label: 'Popular', icon: Star },
    { id: 'navigation', label: 'Navigation', icon: BookOpen },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'favorites', label: 'Favorites', icon: Star }
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

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      const allItems = getFilteredItems()
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, allItems.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (allItems[selectedIndex]) {
            handleItemSelect(allItems[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex])

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  const getFilteredItems = () => {
    let items: QuickNavItem[] = []

    if (searchQuery.trim()) {
      // Show search results
      return searchResults.map((result, index) => ({
        id: `search-${index}`,
        label: result.reference,
        description: result.text.substring(0, 100) + '...',
        reference: result.reference,
        type: 'passage' as const,
        icon: BookOpen,
        category: 'search'
      }))
    }

    switch (activeCategory) {
      case 'ai':
        items = quickNavItems.filter(item => item.category === 'ai')
        break
      case 'popular':
        items = quickNavItems.filter(item => item.category === 'popular')
        break
      case 'navigation':
        items = quickNavItems.filter(item => item.category === 'navigation')
        break
      case 'recent':
        items = recentPassages.map((passage, index) => ({
          id: `recent-${index}`,
          label: passage.reference,
          description: `Visited ${passage.timestamp.toLocaleDateString()}`,
          reference: passage.reference,
          type: 'passage' as const,
          icon: Clock,
          category: 'recent'
        }))
        break
      case 'favorites':
        items = favoritePassages.map((passage, index) => ({
          id: `favorite-${index}`,
          label: passage.reference,
          description: `${passage.book} ${passage.chapter}${passage.verse ? ':' + passage.verse : ''}`,
          reference: passage.reference,
          type: 'passage' as const,
          icon: Star,
          category: 'favorites'
        }))
        break
      default:
        items = quickNavItems
    }

    return items
  }

  const handleItemSelect = (item: QuickNavItem) => {
    switch (item.type) {
      case 'passage':
        onNavigate(item.reference)
        break
      case 'ai-feature':
        onAIFeature(item.reference)
        break
      case 'shortcut':
        handleShortcut(item.reference)
        break
    }
    onClose()
  }

  const handleShortcut = (shortcut: string) => {
    switch (shortcut) {
      case 'next-chapter':
        if (currentBook && currentChapter) {
          onNavigate(`${currentBook} ${currentChapter + 1}`)
        }
        break
      case 'previous-chapter':
        if (currentBook && currentChapter && currentChapter > 1) {
          onNavigate(`${currentBook} ${currentChapter - 1}`)
        }
        break
      case 'random-passage':
        const books = ['Genesis', 'Psalms', 'Matthew', 'John', 'Romans', 'Ephesians']
        const randomBook = books[Math.floor(Math.random() * books.length)]
        const randomChapter = Math.floor(Math.random() * 20) + 1
        onNavigate(`${randomBook} ${randomChapter}`)
        break
    }
  }

  const filteredItems = getFilteredItems()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div className="bg-[#1A1D24] rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#3A404B]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Zap className="h-5 w-5 mr-2 text-blue-400" />
              Quick Navigation
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-[#9CA3AF] hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedIndex(0)
              }}
              placeholder="Search passages, AI features, or use shortcuts..."
              className="w-full bg-[#2C303A] border border-[#3A404B] text-white px-10 py-3 rounded-lg focus:outline-none focus:border-blue-500"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-blue-400" />
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id)
                  setSelectedIndex(0)
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#2C303A] text-[#9CA3AF] hover:bg-[#3A404B] hover:text-white'
                }`}
              >
                <category.icon className="h-4 w-4" />
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="max-h-96 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-[#9CA3AF]">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No items found</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredItems.map((item, index) => (
                <button
                  key={item.id}
                  data-index={index}
                  onClick={() => handleItemSelect(item)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedIndex === index
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-[#2C303A] text-[#E5E7EB]'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <item.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-sm opacity-75 mt-1">{item.description}</div>
                      {item.shortcut && (
                        <div className="text-xs opacity-50 mt-1 flex items-center">
                          <Command className="h-3 w-3 mr-1" />
                          {item.shortcut}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#3A404B] bg-[#1A1D24]">
          <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
            <div className="flex items-center space-x-4">
              <span>↑↓ Navigate</span>
              <span>Enter Select</span>
              <span>Esc Close</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Ctrl+K to open</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
