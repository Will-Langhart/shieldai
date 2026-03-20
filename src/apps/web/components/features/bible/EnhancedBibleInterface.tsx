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
  Loader2
} from 'lucide-react'
import { AIBibleInsights } from './AIBibleInsights'
import { AIStudyQuestions } from './AIStudyQuestions'
import { AICrossReferences } from './AICrossReferences'

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

interface EnhancedBibleInterfaceProps {
  onVerseSelect?: (reference: string, text: string, version?: string) => void
  initialPassage?: BiblePassage
}

export function EnhancedBibleInterface({ onVerseSelect, initialPassage }: EnhancedBibleInterfaceProps) {
  const [activeTab, setActiveTab] = useState<'bible' | 'insights' | 'questions' | 'crossrefs'>('bible')
  const [currentPassage, setCurrentPassage] = useState<BiblePassage | null>(initialPassage || null)
  const [selectedBook, setSelectedBook] = useState('Genesis')
  const [selectedChapter, setSelectedChapter] = useState(1)
  const [selectedVerse, setSelectedVerse] = useState(1)
  const [selectedVersion, setSelectedVersion] = useState('de4e12af7f28f599-02')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['bible']))

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

  const tabs = [
    { id: 'bible', label: 'Bible Text', icon: BookOpen, color: 'text-blue-400' },
    { id: 'insights', label: 'AI Insights', icon: Brain, color: 'text-purple-400' },
    { id: 'questions', label: 'Study Questions', icon: MessageCircle, color: 'text-green-400' },
    { id: 'crossrefs', label: 'Cross-References', icon: Link, color: 'text-orange-400' }
  ]

  // Load passage when parameters change
  const loadPassage = async (book: string, chapter: number, verse?: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const reference = verse ? `${book} ${chapter}:${verse}` : `${book} ${chapter}`
      
      const response = await fetch(`/api/bible/passage?reference=${encodeURIComponent(reference)}&versionId=${selectedVersion}`)
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
          id: selectedVersion,
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

  const handleBookChange = (book: string) => {
    setSelectedBook(book)
    setSelectedChapter(1)
    setSelectedVerse(1)
    loadPassage(book, 1, 1)
  }

  const handleChapterChange = (chapter: number) => {
    setSelectedChapter(chapter)
    setSelectedVerse(1)
    loadPassage(selectedBook, chapter)
  }

  const handleVerseChange = (verse: number) => {
    setSelectedVerse(verse)
    loadPassage(selectedBook, selectedChapter, verse)
  }

  const handleVersionChange = (versionId: string) => {
    setSelectedVersion(versionId)
    loadPassage(selectedBook, selectedChapter, selectedVerse)
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const handleVerseClick = (verse: any) => {
    if (onVerseSelect) {
      onVerseSelect(verse.reference, verse.text, currentPassage?.version?.name)
    }
  }

  // Load initial passage
  useEffect(() => {
    if (!initialPassage) {
      loadPassage(selectedBook, selectedChapter)
    }
  }, [])

  return (
    <div className="min-h-screen bg-shield-canvas text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center">
            <BookOpen className="h-10 w-10 text-blue-400 mr-3" />
            Enhanced Bible Study
          </h1>
          <p className="text-shield-muted text-lg">
            AI-powered Bible study with insights, questions, and cross-references
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-shield-panel rounded-lg p-6 space-y-6">
              <h3 className="text-lg font-semibold mb-4">Navigation</h3>
              
              {/* Book Selection */}
              <div>
                <label className="block text-sm font-medium text-shield-muted mb-2">Book</label>
                <select
                  value={selectedBook}
                  onChange={(e) => handleBookChange(e.target.value)}
                  className="w-full bg-shield-canvas border border-shield-edge text-white px-3 py-2 rounded focus:outline-none focus:border-blue-500"
                >
                  {books.map((book) => (
                    <option key={book} value={book}>{book}</option>
                  ))}
                </select>
              </div>

              {/* Chapter Selection */}
              <div>
                <label className="block text-sm font-medium text-shield-muted mb-2">Chapter</label>
                <input
                  type="number"
                  value={selectedChapter}
                  onChange={(e) => handleChapterChange(parseInt(e.target.value) || 1)}
                  className="w-full bg-shield-canvas border border-shield-edge text-white px-3 py-2 rounded focus:outline-none focus:border-blue-500"
                  min="1"
                />
              </div>

              {/* Verse Selection */}
              <div>
                <label className="block text-sm font-medium text-shield-muted mb-2">Verse (Optional)</label>
                <input
                  type="number"
                  value={selectedVerse}
                  onChange={(e) => handleVerseChange(parseInt(e.target.value) || 1)}
                  className="w-full bg-shield-canvas border border-shield-edge text-white px-3 py-2 rounded focus:outline-none focus:border-blue-500"
                  min="1"
                />
              </div>

              {/* Version Selection */}
              <div>
                <label className="block text-sm font-medium text-shield-muted mb-2">Version</label>
                <select
                  value={selectedVersion}
                  onChange={(e) => handleVersionChange(e.target.value)}
                  className="w-full bg-shield-canvas border border-shield-edge text-white px-3 py-2 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="de4e12af7f28f599-02">King James Version</option>
                  <option value="de4e12af7f28f599-01">New International Version</option>
                </select>
              </div>

              {/* AI Features Toggle */}
              <div className="pt-4 border-t border-shield-edge">
                <h4 className="text-sm font-medium text-shield-muted mb-3">AI Features</h4>
                <div className="space-y-2">
                  {tabs.slice(1).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => toggleSection(tab.id)}
                      className={`w-full flex items-center justify-between p-2 rounded transition-colors ${
                        expandedSections.has(tab.id) 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-shield-canvas text-shield-muted hover:bg-shield-elevated'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <tab.icon className="h-4 w-4" />
                        <span className="text-sm">{tab.label}</span>
                      </div>
                      {expandedSections.has(tab.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
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
                      {currentPassage ? currentPassage.reference : `${selectedBook} ${selectedChapter}:${selectedVerse}`}
                    </h2>
                    <div className="text-sm text-shield-muted">
                      {currentPassage?.version?.name || 'King James Version'}
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
                  version={selectedVersion}
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
      </div>
    </div>
  )
}
