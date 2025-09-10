import { useState, useEffect, useCallback } from 'react'

interface NavigationHistory {
  id: string
  reference: string
  book: string
  chapter: number
  verse?: number
  timestamp: Date
  version: string
}

interface FavoritePassage {
  id: string
  reference: string
  book: string
  chapter: number
  verse?: number
  note?: string
  addedAt: Date
  version: string
  tags?: string[]
}

interface NavigationState {
  currentBook: string
  currentChapter: number
  currentVerse?: number
  currentVersion: string
  history: NavigationHistory[]
  favorites: FavoritePassage[]
  lastVisited: Date
}

const STORAGE_KEY = 'bible-navigation-state'
const MAX_HISTORY_ITEMS = 50
const MAX_FAVORITES = 100

export function useBibleNavigation() {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentBook: 'Genesis',
    currentChapter: 1,
    currentVerse: undefined,
    currentVersion: 'de4e12af7f28f599-02',
    history: [],
    favorites: [],
    lastVisited: new Date()
  })

  const [isLoading, setIsLoading] = useState(true)

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY)
      if (savedState) {
        const parsed = JSON.parse(savedState)
        // Convert timestamp strings back to Date objects
        parsed.history = parsed.history.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
        parsed.favorites = parsed.favorites.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt)
        }))
        parsed.lastVisited = new Date(parsed.lastVisited)
        setNavigationState(parsed)
      }
    } catch (error) {
      console.error('Failed to load navigation state:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(navigationState))
      } catch (error) {
        console.error('Failed to save navigation state:', error)
      }
    }
  }, [navigationState, isLoading])

  // Navigate to a specific passage
  const navigateTo = useCallback((reference: string, version?: string) => {
    const parts = reference.split(' ')
    if (parts.length < 2) return

    const book = parts[0]
    const chapterVerse = parts[1]
    const [chapterStr, verseStr] = chapterVerse.split(':')
    const chapter = parseInt(chapterStr) || 1
    const verse = verseStr ? parseInt(verseStr) : undefined

    const newState: NavigationState = {
      ...navigationState,
      currentBook: book,
      currentChapter: chapter,
      currentVerse: verse,
      currentVersion: version || navigationState.currentVersion,
      lastVisited: new Date()
    }

    // Add to history
    const historyItem: NavigationHistory = {
      id: `${book}-${chapter}-${verse || 'all'}-${Date.now()}`,
      reference,
      book,
      chapter,
      verse,
      timestamp: new Date(),
      version: version || navigationState.currentVersion
    }

    // Remove duplicate if exists and add to beginning
    const filteredHistory = navigationState.history.filter(
      item => !(item.book === book && item.chapter === chapter && item.verse === verse)
    )
    
    newState.history = [historyItem, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS)

    setNavigationState(newState)
  }, [navigationState])

  // Navigate to next chapter
  const navigateNext = useCallback(() => {
    const currentBook = navigationState.currentBook
    const currentChapter = navigationState.currentChapter
    
    // Simple chapter limits - in a real app, you'd get this from an API
    const chapterLimits: { [key: string]: number } = {
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

    const maxChapters = chapterLimits[currentBook] || 1
    if (currentChapter < maxChapters) {
      navigateTo(`${currentBook} ${currentChapter + 1}`)
    }
  }, [navigationState, navigateTo])

  // Navigate to previous chapter
  const navigatePrevious = useCallback(() => {
    const currentBook = navigationState.currentBook
    const currentChapter = navigationState.currentChapter
    
    if (currentChapter > 1) {
      navigateTo(`${currentBook} ${currentChapter - 1}`)
    }
  }, [navigationState, navigateTo])

  // Add to favorites
  const addToFavorites = useCallback((note?: string, tags?: string[]) => {
    const { currentBook, currentChapter, currentVerse, currentVersion } = navigationState
    
    const favorite: FavoritePassage = {
      id: `${currentBook}-${currentChapter}-${currentVerse || 'all'}-${Date.now()}`,
      reference: currentVerse ? `${currentBook} ${currentChapter}:${currentVerse}` : `${currentBook} ${currentChapter}`,
      book: currentBook,
      chapter: currentChapter,
      verse: currentVerse,
      note,
      addedAt: new Date(),
      version: currentVersion,
      tags: tags || []
    }

    // Check if already exists
    const exists = navigationState.favorites.some(
      fav => fav.book === currentBook && fav.chapter === currentChapter && fav.verse === currentVerse
    )

    if (!exists) {
      const newFavorites = [favorite, ...navigationState.favorites].slice(0, MAX_FAVORITES)
      setNavigationState(prev => ({
        ...prev,
        favorites: newFavorites
      }))
    }
  }, [navigationState])

  // Remove from favorites
  const removeFromFavorites = useCallback((id: string) => {
    setNavigationState(prev => ({
      ...prev,
      favorites: prev.favorites.filter(fav => fav.id !== id)
    }))
  }, [])

  // Update favorite note
  const updateFavoriteNote = useCallback((id: string, note: string) => {
    setNavigationState(prev => ({
      ...prev,
      favorites: prev.favorites.map(fav => 
        fav.id === id ? { ...fav, note } : fav
      )
    }))
  }, [])

  // Add tags to favorite
  const addFavoriteTags = useCallback((id: string, tags: string[]) => {
    setNavigationState(prev => ({
      ...prev,
      favorites: prev.favorites.map(fav => 
        fav.id === id ? { ...fav, tags: [...(fav.tags || []), ...tags] } : fav
      )
    }))
  }, [])

  // Remove tag from favorite
  const removeFavoriteTag = useCallback((id: string, tag: string) => {
    setNavigationState(prev => ({
      ...prev,
      favorites: prev.favorites.map(fav => 
        fav.id === id ? { ...fav, tags: (fav.tags || []).filter(t => t !== tag) } : fav
      )
    }))
  }, [])

  // Clear history
  const clearHistory = useCallback(() => {
    setNavigationState(prev => ({
      ...prev,
      history: []
    }))
  }, [])

  // Clear favorites
  const clearFavorites = useCallback(() => {
    setNavigationState(prev => ({
      ...prev,
      favorites: []
    }))
  }, [])

  // Get recent passages
  const getRecentPassages = useCallback((limit: number = 10) => {
    return navigationState.history.slice(0, limit)
  }, [navigationState.history])

  // Get favorite passages
  const getFavoritePassages = useCallback((limit?: number) => {
    const favorites = navigationState.favorites
    return limit ? favorites.slice(0, limit) : favorites
  }, [navigationState.favorites])

  // Get favorites by tag
  const getFavoritesByTag = useCallback((tag: string) => {
    return navigationState.favorites.filter(fav => 
      fav.tags && fav.tags.includes(tag)
    )
  }, [navigationState.favorites])

  // Check if current passage is favorited
  const isCurrentPassageFavorited = useCallback(() => {
    const { currentBook, currentChapter, currentVerse } = navigationState
    return navigationState.favorites.some(
      fav => fav.book === currentBook && fav.chapter === currentChapter && fav.verse === currentVerse
    )
  }, [navigationState])

  // Get navigation statistics
  const getNavigationStats = useCallback(() => {
    return {
      totalHistoryItems: navigationState.history.length,
      totalFavorites: navigationState.favorites.length,
      lastVisited: navigationState.lastVisited,
      mostVisitedBook: getMostVisitedBook(),
      mostVisitedChapter: getMostVisitedChapter()
    }
  }, [navigationState])

  const getMostVisitedBook = () => {
    const bookCounts: { [key: string]: number } = {}
    navigationState.history.forEach(item => {
      bookCounts[item.book] = (bookCounts[item.book] || 0) + 1
    })
    return Object.entries(bookCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'
  }

  const getMostVisitedChapter = () => {
    const chapterCounts: { [key: string]: number } = {}
    navigationState.history.forEach(item => {
      const key = `${item.book} ${item.chapter}`
      chapterCounts[key] = (chapterCounts[key] || 0) + 1
    })
    return Object.entries(chapterCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'
  }

  // Export navigation data
  const exportNavigationData = useCallback(() => {
    return {
      state: navigationState,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
  }, [navigationState])

  // Import navigation data
  const importNavigationData = useCallback((data: any) => {
    try {
      if (data.version === '1.0' && data.state) {
        const importedState = data.state
        // Convert timestamp strings back to Date objects
        importedState.history = importedState.history.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
        importedState.favorites = importedState.favorites.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt)
        }))
        importedState.lastVisited = new Date(importedState.lastVisited)
        
        setNavigationState(importedState)
        return true
      }
    } catch (error) {
      console.error('Failed to import navigation data:', error)
    }
    return false
  }, [])

  return {
    // State
    currentBook: navigationState.currentBook,
    currentChapter: navigationState.currentChapter,
    currentVerse: navigationState.currentVerse,
    currentVersion: navigationState.currentVersion,
    history: navigationState.history,
    favorites: navigationState.favorites,
    isLoading,

    // Navigation actions
    navigateTo,
    navigateNext,
    navigatePrevious,

    // Favorites actions
    addToFavorites,
    removeFromFavorites,
    updateFavoriteNote,
    addFavoriteTags,
    removeFavoriteTag,
    isCurrentPassageFavorited,

    // Data access
    getRecentPassages,
    getFavoritePassages,
    getFavoritesByTag,
    getNavigationStats,

    // Data management
    clearHistory,
    clearFavorites,
    exportNavigationData,
    importNavigationData
  }
}
