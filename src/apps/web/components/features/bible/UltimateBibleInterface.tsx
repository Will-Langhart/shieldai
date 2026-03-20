import React, { useState, useEffect } from 'react'
import { 
  BookOpen, 
  Search, 
  Brain, 
  MessageCircle, 
  Link, 
  Lightbulb,
  Heart,
  Cross,
  Settings,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Zap,
  Menu,
  X
} from 'lucide-react'
import { AIBibleInsights } from './AIBibleInsights'
import { AIStudyQuestions } from './AIStudyQuestions'
import { AICrossReferences } from './AICrossReferences'
import { EnhancedBibleNavigation } from './EnhancedBibleNavigation'
import { BibleBreadcrumbs } from './BibleBreadcrumbs'
import { QuickNavigation } from './QuickNavigation'
import { MobileBibleNavigation } from './MobileBibleNavigation'
import { useBibleNavigation } from '@/hooks/useBibleNavigation'

interface FavoritePassage {
  id: string
  reference: string
  book: string
  chapter: number
  verse?: number
  note?: string
  addedAt: Date
}

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

interface UltimateBibleInterfaceProps {
  onVerseSelect?: (reference: string, text: string, version?: string) => void
  initialPassage?: BiblePassage
}

export function UltimateBibleInterface({ onVerseSelect, initialPassage }: UltimateBibleInterfaceProps) {
  const [activeTab, setActiveTab] = useState<'bible' | 'insights' | 'questions' | 'crossrefs'>('bible')
  const [currentPassage, setCurrentPassage] = useState<BiblePassage | null>(initialPassage || null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showQuickNav, setShowQuickNav] = useState(false)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Use the navigation hook
  const {
    currentBook,
    currentChapter,
    currentVerse,
    currentVersion,
    history,
    favorites,
    navigateTo,
    navigateNext,
    navigatePrevious,
    addToFavorites,
    removeFromFavorites,
    isCurrentPassageFavorited,
    getRecentPassages,
    getFavoritePassages,
    getNavigationStats,
    clearHistory,
    clearFavorites,
    exportNavigationData,
    importNavigationData
  } = useBibleNavigation()

  const tabs = [
    { id: 'bible', label: 'Bible Text', icon: BookOpen, color: 'text-blue-400' },
    { id: 'insights', label: 'AI Insights', icon: Brain, color: 'text-purple-400' },
    { id: 'questions', label: 'Study Questions', icon: MessageCircle, color: 'text-green-400' },
    { id: 'crossrefs', label: 'Cross-References', icon: Link, color: 'text-orange-400' }
  ]

  // Load passage when navigation state changes
  const loadPassage = async (book: string, chapter: number, verse?: number, version?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const reference = verse ? `${book} ${chapter}:${verse}` : `${book} ${chapter}`
      
      const response = await fetch(`/api/bible/passage?reference=${encodeURIComponent(reference)}&versionId=${version || currentVersion}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load passage')
      }

      const passage = data.passage || data
      const content = passage.content || passage.text || ''
      const textContent = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
      
      // Parse verses from the content
      const verses = []
      if (content) {
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
        
        if (verses.length === 0) {
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

      const processedPassage: BiblePassage = {
        id: passage.id || 'unknown',
        reference: passage.reference || `${book} ${chapter}${verse ? ':' + verse : ''}`,
        text: textContent,
        verses: verses,
        version: passage.version || {
          id: version || currentVersion,
          name: 'King James Version',
          description: 'King James Version',
          language: { id: 'eng', name: 'English' },
          type: 'text'
        }
      }

      setCurrentPassage(processedPassage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load passage')
    } finally {
      setIsLoading(false)
    }
  }

  // Load passage when navigation state changes
  useEffect(() => {
    if (currentBook && currentChapter) {
      loadPassage(currentBook, currentChapter, currentVerse, currentVersion)
    }
  }, [currentBook, currentChapter, currentVerse, currentVersion])

  const handleNavigate = (reference: string) => {
    navigateTo(reference, currentVersion)
  }

  const handleBookChange = (book: string) => {
    navigateTo(`${book} 1`, currentVersion)
  }

  const handleChapterChange = (chapter: number) => {
    navigateTo(`${currentBook} ${chapter}`, currentVersion)
  }

  const handleVerseChange = (verse: number) => {
    navigateTo(`${currentBook} ${currentChapter}:${verse}`, currentVersion)
  }

  const handleVersionChange = (version: string) => {
    navigateTo(`${currentBook} ${currentChapter}${currentVerse ? ':' + currentVerse : ''}`, version)
  }

  const handleAIFeature = (feature: string) => {
    setActiveTab(feature as any)
  }

  const handleVerseClick = (verse: any) => {
    if (onVerseSelect) {
      onVerseSelect(verse.reference, verse.text, currentPassage?.version?.name)
    }
  }

  const handleAddFavorite = (passage: FavoritePassage) => {
    addToFavorites(passage.note)
  }

  const handleAddFavoriteWithNote = (note?: string) => {
    if (currentPassage) {
      const favorite: FavoritePassage = {
        id: `${currentPassage.reference}-${Date.now()}`,
        reference: currentPassage.reference,
        book: currentPassage.reference.split(' ')[0],
        chapter: parseInt(currentPassage.reference.split(' ')[1]?.split(':')[0] || '1'),
        verse: currentPassage.reference.includes(':') ? parseInt(currentPassage.reference.split(':')[1]) : undefined,
        note: note || '',
        addedAt: new Date()
      }
      handleAddFavorite(favorite)
    }
  }

  const handleRemoveFavorite = (id: string) => {
    removeFromFavorites(id)
  }

  const handleExportData = () => {
    const data = exportNavigationData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bible-navigation-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportData = (data: any) => {
    importNavigationData(data)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault()
            setShowQuickNav(true)
            break
          case 'ArrowLeft':
            e.preventDefault()
            navigatePrevious()
            break
          case 'ArrowRight':
            e.preventDefault()
            navigateNext()
            break
          case 'i':
            e.preventDefault()
            setActiveTab('insights')
            break
          case 'q':
            e.preventDefault()
            setActiveTab('questions')
            break
          case 'r':
            e.preventDefault()
            setActiveTab('crossrefs')
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [navigatePrevious, navigateNext])

  return (
    <div className="min-h-screen bg-shield-canvas text-white">
      {/* Header */}
      <div className="bg-shield-canvas border-b border-shield-edge p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold flex items-center">
              <BookOpen className="h-8 w-8 text-blue-400 mr-3" />
              Ultimate Bible Study
            </h1>
            <div className="hidden md:flex items-center space-x-2 text-sm text-shield-muted">
              <span>Ctrl+K for quick nav</span>
              <span>•</span>
              <span>Ctrl+←/→ for chapters</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowQuickNav(true)}
              className="hidden lg:flex items-center space-x-2 px-3 py-2 bg-shield-panel hover:bg-shield-elevated rounded-lg transition-colors"
            >
              <Zap className="h-4 w-4" />
              <span>Quick Nav</span>
            </button>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex items-center space-x-2 px-3 py-2 bg-shield-panel hover:bg-shield-elevated rounded-lg transition-colors"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              <span>{sidebarCollapsed ? 'Show' : 'Hide'} Sidebar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="px-4 py-2">
        <BibleBreadcrumbs
          currentBook={currentBook}
          currentChapter={currentChapter}
          currentVerse={currentVerse}
          currentVersion={currentVersion}
          onNavigate={handleNavigate}
          onGoHome={() => navigateTo('Genesis 1')}
          history={history}
          favorites={favorites}
        />
      </div>

      <div className="flex">
        {/* Sidebar Navigation */}
        {!sidebarCollapsed && (
          <div className="hidden lg:block w-80 p-4">
            <EnhancedBibleNavigation
              selectedBook={currentBook}
              selectedChapter={currentChapter}
              selectedVerse={currentVerse}
              selectedVersion={currentVersion}
              onBookChange={handleBookChange}
              onChapterChange={handleChapterChange}
              onVerseChange={handleVerseChange}
              onVersionChange={handleVersionChange}
              onPassageSelect={handleNavigate}
              onFavoriteAdd={handleAddFavorite}
              onFavoriteRemove={handleRemoveFavorite}
              favorites={favorites}
              history={history}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-4">
          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-shield-panel text-shield-muted hover:bg-shield-elevated hover:text-white'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Bible Text Tab */}
            {activeTab === 'bible' && (
              <div className="bg-shield-panel rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">
                    {currentPassage ? currentPassage.reference : `${currentBook} ${currentChapter}:${currentVerse || 'All'}`}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-shield-muted">
                      {currentPassage?.version?.name || 'King James Version'}
                    </div>
                    <button
                      onClick={() => {
                        if (currentPassage) {
                          const favorite: FavoritePassage = {
                            id: `${currentPassage.reference}-${Date.now()}`,
                            reference: currentPassage.reference,
                            book: currentPassage.reference.split(' ')[0],
                            chapter: parseInt(currentPassage.reference.split(' ')[1]?.split(':')[0] || '1'),
                            verse: currentPassage.reference.includes(':') ? parseInt(currentPassage.reference.split(':')[1]) : undefined,
                            note: '',
                            addedAt: new Date()
                          }
                          handleAddFavorite(favorite)
                        }
                      }}
                      disabled={isCurrentPassageFavorited()}
                      className="p-2 text-shield-muted hover:text-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Add to favorites"
                    >
                      <Heart className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                    <span className="ml-2 text-shield-muted">Loading scripture...</span>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-red-400">{error}</div>
                  </div>
                ) : currentPassage ? (
                  <div className="prose prose-invert max-w-none">
                    <div className="text-lg leading-relaxed">
                      {currentPassage.verses && currentPassage.verses.length > 0 ? (
                        currentPassage.verses.map((verse, index) => (
                          <p key={verse.id || index} className="mb-4">
                            <span className="text-blue-400 font-semibold mr-2">{verse.verseNumber}.</span>
                            <span 
                              className="cursor-pointer hover:bg-blue-900/20 px-1 rounded transition-colors"
                              onClick={() => handleVerseClick(verse)}
                              title="Click to use in chat"
                            >
                              {verse.text}
                            </span>
                          </p>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-shield-muted">No verses found for this passage</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-shield-muted mx-auto mb-4" />
                    <p className="text-shield-muted text-lg">Select a passage to begin reading</p>
                  </div>
                )}
              </div>
            )}

            {/* AI Insights Tab */}
            {activeTab === 'insights' && currentPassage && (
              <AIBibleInsights 
                passage={currentPassage} 
                version={currentVersion}
              />
            )}

            {/* Study Questions Tab */}
            {activeTab === 'questions' && currentPassage && (
              <AIStudyQuestions 
                passage={currentPassage}
                onQuestionSelect={(question) => {
                  if (onVerseSelect) {
                    onVerseSelect(
                      currentPassage.reference, 
                      `Study Question: ${question.question}`,
                      currentPassage.version?.name
                    )
                  }
                }}
              />
            )}

            {/* Cross-References Tab */}
            {activeTab === 'crossrefs' && currentPassage && (
              <AICrossReferences 
                passage={currentPassage}
                onReferenceSelect={(reference) => {
                  if (onVerseSelect) {
                    onVerseSelect(
                      reference.reference, 
                      reference.text,
                      currentPassage.version?.name
                    )
                  }
                }}
              />
            )}

            {/* Empty State for AI Tabs */}
            {activeTab !== 'bible' && !currentPassage && (
              <div className="bg-shield-panel rounded-lg p-12 text-center">
                <BookOpen className="h-16 w-16 text-shield-muted mx-auto mb-4" />
                <p className="text-shield-muted text-lg">Select a Bible passage to see AI insights</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Navigation Modal */}
      <QuickNavigation
        onNavigate={handleNavigate}
        onSearch={(query) => {
          // Handle search - you might want to implement this
          console.log('Search:', query)
        }}
        onAIFeature={handleAIFeature}
        currentBook={currentBook}
        currentChapter={currentChapter}
        recentPassages={getRecentPassages(10)}
        favoritePassages={getFavoritePassages(10)}
        isOpen={showQuickNav}
        onClose={() => setShowQuickNav(false)}
      />

      {/* Mobile Navigation */}
      <MobileBibleNavigation
        currentBook={currentBook}
        currentChapter={currentChapter}
        currentVerse={currentVerse}
        currentVersion={currentVersion}
        onNavigate={handleNavigate}
        onVersionChange={handleVersionChange}
        onAIFeature={handleAIFeature}
        history={history}
        favorites={favorites}
        onAddFavorite={handleAddFavoriteWithNote}
        onRemoveFavorite={handleRemoveFavorite}
        onClearHistory={clearHistory}
        onClearFavorites={clearFavorites}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />
    </div>
  )
}
