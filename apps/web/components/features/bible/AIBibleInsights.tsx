import React, { useState, useEffect } from 'react'
import { 
  Brain, 
  BookOpen, 
  Lightbulb, 
  Cross, 
  Heart, 
  MessageCircle, 
  Search, 
  Loader2, 
  ChevronDown, 
  ChevronUp,
  Copy,
  Share2,
  Bookmark,
  AlertTriangle,
  RefreshCw,
  Save,
  Download,
  Star,
  Tag
} from 'lucide-react'
import { AIDiagnostics } from './AIDiagnostics'

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

interface AIInsights {
  explanation: string
  keyThemes: string[]
  crossReferences: Array<{
    reference: string
    text: string
    relevance: string
  }>
  studyQuestions: Array<{
    question: string
    category: string
  }>
  historicalContext: string
  theologicalMeaning: string
  practicalApplication: string
  prayerPoints: string[]
}

interface AIBibleInsightsProps {
  passage: BiblePassage
  version: string
}

export function AIBibleInsights({ passage, version }: AIBibleInsightsProps) {
  const [insights, setInsights] = useState<AIInsights | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['explanation']))
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedInsights, setSavedInsights] = useState<any[]>([])

  // Load saved insights for this passage
  useEffect(() => {
    if (passage) {
      loadSavedInsights()
    }
  }, [passage])

  const loadSavedInsights = async () => {
    try {
      const authToken = await getAuthToken()
      const response = await fetch(`/api/ai-insights/by-passage?passage_reference=${encodeURIComponent(passage.reference)}&bible_version=${version}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSavedInsights(data.insights || [])
      }
    } catch (error) {
      console.error('Failed to load saved insights:', error)
    }
  }

  const getAuthToken = async (): Promise<string> => {
    try {
      const { data: { session } } = await import('../../../lib/supabase').then(m => m.supabase.auth.getSession())
      return session?.access_token || 'test-token'
    } catch (error) {
      return 'test-token'
    }
  }

  const generateInsights = async () => {
    setLoading(true)
    setError(null)

    try {
      const authToken = await getAuthToken()

      const response = await fetch('/api/bible/ai-insights', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          passage_reference: passage.reference,
          passage_text: passage.text,
          bible_version: version
        })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to generate insights'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          // If response is not JSON (e.g., HTML error page), use status text
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setInsights(data.insights)
      setIsSaved(false)
    } catch (error) {
      console.error('Error generating insights:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate insights')
    } finally {
      setLoading(false)
    }
  }

  const saveInsights = async () => {
    if (!insights) return

    setSaving(true)
    try {
      const authToken = await getAuthToken()

      const response = await fetch('/api/ai-insights/save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          passage_reference: passage.reference,
          passage_text: passage.text,
          bible_version: version,
          explanation: insights.explanation,
          key_themes: insights.keyThemes,
          cross_references: insights.crossReferences,
          study_questions: insights.studyQuestions,
          historical_context: insights.historicalContext,
          theological_meaning: insights.theologicalMeaning,
          practical_application: insights.practicalApplication,
          prayer_points: insights.prayerPoints
        })
      })

      if (response.ok) {
        setIsSaved(true)
        await loadSavedInsights() // Reload saved insights
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save insights')
      }
    } catch (error) {
      console.error('Error saving insights:', error)
      setError(error instanceof Error ? error.message : 'Failed to save insights')
    } finally {
      setSaving(false)
    }
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (showDiagnostics) {
    return <AIDiagnostics onClose={() => setShowDiagnostics(false)} />
  }

  return (
    <div className="bg-[#1A1D24] border border-[#2C303A] rounded-lg p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Brain className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-[#E0E0E0]">AI Bible Insights</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {!insights && !loading && (
            <button
              onClick={generateInsights}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Brain className="h-4 w-4" />
              <span>Generate Insights</span>
            </button>
          )}
          
          {insights && !isSaved && (
            <button
              onClick={saveInsights}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{saving ? 'Saving...' : 'Save Insights'}</span>
            </button>
          )}
          
          {isSaved && (
            <div className="flex items-center space-x-2 text-green-400">
              <Bookmark className="h-4 w-4" />
              <span>Saved</span>
            </div>
          )}
        </div>
      </div>

      {/* Saved Insights Section */}
      {savedInsights.length > 0 && (
        <div className="mb-6 p-4 bg-[#2C303A] rounded-lg">
          <h4 className="text-lg font-medium text-[#E0E0E0] mb-3 flex items-center">
            <Bookmark className="h-5 w-5 text-yellow-400 mr-2" />
            Previously Saved Insights ({savedInsights.length})
          </h4>
          <div className="space-y-3">
            {savedInsights.map((saved, index) => (
              <div key={saved.id} className="p-3 bg-[#1A1D24] rounded border border-[#3A404B]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#9CA3AF]">
                    {new Date(saved.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center space-x-2">
                    {saved.is_favorite && <Star className="h-4 w-4 text-yellow-400" />}
                    {saved.tags?.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Tag className="h-3 w-3 text-blue-400" />
                        <span className="text-xs text-blue-400">{saved.tags.length} tags</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[#E0E0E0] text-sm line-clamp-2">
                  {saved.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 text-blue-400 animate-spin mb-4" />
          <div className="text-blue-400 mb-2">Generating AI insights...</div>
          <div className="text-sm text-[#9CA3AF]">This may take a few moments</div>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <div className="text-red-400 mb-2">Failed to load AI insights</div>
          <div className="text-sm text-[#9CA3AF] mb-4">{error}</div>
          <div className="flex items-center justify-center space-x-4">
            <button 
              onClick={generateInsights}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try again</span>
            </button>
            <button
              onClick={() => setShowDiagnostics(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Diagnostics</span>
            </button>
          </div>
        </div>
      )}

      {insights && (
        <div className="space-y-6">
          {/* Explanation */}
          <div className="border border-[#2C303A] rounded-lg">
            <button
              onClick={() => toggleSection('explanation')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-[#2C303A] transition-colors"
            >
              <div className="flex items-center space-x-3">
                <BookOpen className="h-5 w-5 text-blue-400" />
                <span className="font-medium text-[#E0E0E0]">Explanation</span>
              </div>
              {expandedSections.has('explanation') ? (
                <ChevronUp className="h-5 w-5 text-[#9CA3AF]" />
              ) : (
                <ChevronDown className="h-5 w-5 text-[#9CA3AF]" />
              )}
            </button>
            {expandedSections.has('explanation') && (
              <div className="p-4 border-t border-[#2C303A]">
                <p className="text-[#E0E0E0] leading-relaxed">{insights.explanation}</p>
                <button
                  onClick={() => copyToClipboard(insights.explanation)}
                  className="mt-3 flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  <span className="text-sm">Copy</span>
                </button>
              </div>
            )}
          </div>

          {/* Key Themes */}
          {insights.keyThemes.length > 0 && (
            <div className="border border-[#2C303A] rounded-lg">
              <button
                onClick={() => toggleSection('themes')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[#2C303A] transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Lightbulb className="h-5 w-5 text-yellow-400" />
                  <span className="font-medium text-[#E0E0E0]">Key Themes</span>
                  <span className="text-sm text-[#9CA3AF]">({insights.keyThemes.length})</span>
                </div>
                {expandedSections.has('themes') ? (
                  <ChevronUp className="h-5 w-5 text-[#9CA3AF]" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-[#9CA3AF]" />
                )}
              </button>
              {expandedSections.has('themes') && (
                <div className="p-4 border-t border-[#2C303A]">
                  <div className="flex flex-wrap gap-2">
                    {insights.keyThemes.map((theme, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cross References */}
          {insights.crossReferences.length > 0 && (
            <div className="border border-[#2C303A] rounded-lg">
              <button
                onClick={() => toggleSection('crossrefs')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[#2C303A] transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Cross className="h-5 w-5 text-green-400" />
                  <span className="font-medium text-[#E0E0E0]">Cross References</span>
                  <span className="text-sm text-[#9CA3AF]">({insights.crossReferences.length})</span>
                </div>
                {expandedSections.has('crossrefs') ? (
                  <ChevronUp className="h-5 w-5 text-[#9CA3AF]" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-[#9CA3AF]" />
                )}
              </button>
              {expandedSections.has('crossrefs') && (
                <div className="p-4 border-t border-[#2C303A] space-y-3">
                  {insights.crossReferences.map((ref, index) => (
                    <div key={index} className="p-3 bg-[#1A1D24] rounded border border-[#3A404B]">
                      <div className="font-medium text-blue-400 mb-1">{ref.reference}</div>
                      <p className="text-[#E0E0E0] text-sm mb-2">{ref.text}</p>
                      <p className="text-[#9CA3AF] text-xs">{ref.relevance}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Study Questions */}
          {insights.studyQuestions.length > 0 && (
            <div className="border border-[#2C303A] rounded-lg">
              <button
                onClick={() => toggleSection('questions')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[#2C303A] transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <MessageCircle className="h-5 w-5 text-purple-400" />
                  <span className="font-medium text-[#E0E0E0]">Study Questions</span>
                  <span className="text-sm text-[#9CA3AF]">({insights.studyQuestions.length})</span>
                </div>
                {expandedSections.has('questions') ? (
                  <ChevronUp className="h-5 w-5 text-[#9CA3AF]" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-[#9CA3AF]" />
                )}
              </button>
              {expandedSections.has('questions') && (
                <div className="p-4 border-t border-[#2C303A] space-y-3">
                  {insights.studyQuestions.map((question, index) => (
                    <div key={index} className="p-3 bg-[#1A1D24] rounded border border-[#3A404B]">
                      <div className="flex items-start space-x-3">
                        <span className="text-purple-400 font-medium text-sm mt-1">{index + 1}.</span>
                        <div className="flex-1">
                          <p className="text-[#E0E0E0] mb-1">{question.question}</p>
                          <span className="text-xs text-[#9CA3AF] bg-purple-900 px-2 py-1 rounded">
                            {question.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Historical Context */}
          {insights.historicalContext && (
            <div className="border border-[#2C303A] rounded-lg">
              <button
                onClick={() => toggleSection('history')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[#2C303A] transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Search className="h-5 w-5 text-orange-400" />
                  <span className="font-medium text-[#E0E0E0]">Historical Context</span>
                </div>
                {expandedSections.has('history') ? (
                  <ChevronUp className="h-5 w-5 text-[#9CA3AF]" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-[#9CA3AF]" />
                )}
              </button>
              {expandedSections.has('history') && (
                <div className="p-4 border-t border-[#2C303A]">
                  <p className="text-[#E0E0E0] leading-relaxed">{insights.historicalContext}</p>
                </div>
              )}
            </div>
          )}

          {/* Theological Meaning */}
          {insights.theologicalMeaning && (
            <div className="border border-[#2C303A] rounded-lg">
              <button
                onClick={() => toggleSection('theology')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[#2C303A] transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Heart className="h-5 w-5 text-red-400" />
                  <span className="font-medium text-[#E0E0E0]">Theological Meaning</span>
                </div>
                {expandedSections.has('theology') ? (
                  <ChevronUp className="h-5 w-5 text-[#9CA3AF]" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-[#9CA3AF]" />
                )}
              </button>
              {expandedSections.has('theology') && (
                <div className="p-4 border-t border-[#2C303A]">
                  <p className="text-[#E0E0E0] leading-relaxed">{insights.theologicalMeaning}</p>
                </div>
              )}
            </div>
          )}

          {/* Practical Application */}
          {insights.practicalApplication && (
            <div className="border border-[#2C303A] rounded-lg">
              <button
                onClick={() => toggleSection('application')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[#2C303A] transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Lightbulb className="h-5 w-5 text-green-400" />
                  <span className="font-medium text-[#E0E0E0]">Practical Application</span>
                </div>
                {expandedSections.has('application') ? (
                  <ChevronUp className="h-5 w-5 text-[#9CA3AF]" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-[#9CA3AF]" />
                )}
              </button>
              {expandedSections.has('application') && (
                <div className="p-4 border-t border-[#2C303A]">
                  <p className="text-[#E0E0E0] leading-relaxed">{insights.practicalApplication}</p>
                </div>
              )}
            </div>
          )}

          {/* Prayer Points */}
          {insights.prayerPoints.length > 0 && (
            <div className="border border-[#2C303A] rounded-lg">
              <button
                onClick={() => toggleSection('prayer')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[#2C303A] transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Heart className="h-5 w-5 text-pink-400" />
                  <span className="font-medium text-[#E0E0E0]">Prayer Points</span>
                  <span className="text-sm text-[#9CA3AF]">({insights.prayerPoints.length})</span>
                </div>
                {expandedSections.has('prayer') ? (
                  <ChevronUp className="h-5 w-5 text-[#9CA3AF]" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-[#9CA3AF]" />
                )}
              </button>
              {expandedSections.has('prayer') && (
                <div className="p-4 border-t border-[#2C303A] space-y-2">
                  {insights.prayerPoints.map((point, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <span className="text-pink-400 font-medium text-sm mt-1">{index + 1}.</span>
                      <p className="text-[#E0E0E0] text-sm">{point}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
