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
  Tag,
  Shield,
  Target,
  Users,
  Award,
  ThumbsUp,
  ThumbsDown,
  Send,
  Edit,
  Trash2,
  Zap,
  Sparkles,
  Eye,
  Clock,
  TrendingUp,
  MessageSquare,
  PenTool,
  Calendar,
  Image,
  Palette,
  Wand2,
  X
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
  // Shield AI Apologetics Features
  apologeticsPoints: Array<{
    point: string
    category: 'defense' | 'evidence' | 'reasoning' | 'testimony'
    strength: 'strong' | 'moderate' | 'foundational'
  }>
  defenseQuestions: Array<{
    question: string
    category: string
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  }>
  evidenceTypes: Array<{
    type: 'historical' | 'archaeological' | 'prophetic' | 'scientific' | 'logical'
    description: string
    relevance: string
  }>
  commonObjections: Array<{
    objection: string
    response: string
    scripture: string
  }>
  faithBuilding: {
    encouragement: string
    promises: string[]
    applications: string[]
  }
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
  
  // Response and interaction states
  const [responses, setResponses] = useState<any[]>([])
  const [interactions, setInteractions] = useState<any[]>([])
  const [showResponseForm, setShowResponseForm] = useState(false)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [newResponse, setNewResponse] = useState({
    text: '',
    type: 'comment' as 'comment' | 'question' | 'prayer' | 'reflection' | 'application' | 'correction' | 'appreciation',
    is_helpful: null as boolean | null,
    rating: undefined as number | undefined
  })
  const [newFeedback, setNewFeedback] = useState({
    content_quality: undefined as number | undefined,
    theological_accuracy: undefined as number | undefined,
    practical_helpfulness: undefined as number | undefined,
    clarity: undefined as number | undefined,
    relevance: undefined as number | undefined,
    overall_rating: undefined as number | undefined,
    feedback_text: '',
    suggestions: ''
  })
  const [currentInsightId, setCurrentInsightId] = useState<string | null>(null)
  const [denomination, setDenomination] = useState<string | null>(null)

  // Image generation states
  const [generatedImage, setGeneratedImage] = useState<any>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)

  // Load denomination preference once on mount
  useEffect(() => {
    getAuthToken().then(token => {
      if (!token || token === 'test-token') return
      fetch('/api/user/preferences', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.preferences?.denomination) {
            setDenomination(data.preferences.denomination)
          }
        })
        .catch(() => {})
    })
  }, [])

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

  const testWithMockData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/bible/test-ai-insights-response')
      
      if (!response.ok) {
        throw new Error('Failed to load test insights')
      }

      const data = await response.json()
      setInsights(data.insights)
      setIsSaved(false)
    } catch (error) {
      console.error('Error loading test insights:', error)
      setError(error instanceof Error ? error.message : 'Failed to load test insights')
    } finally {
      setLoading(false)
    }
  }

  const generateInsights = async () => {
    setLoading(true)
    setError(null)

    // Check if we have a valid passage before making the request
    if (!passage || !passage.reference) {
      setError('Please select a Bible passage first')
      setLoading(false)
      return
    }

    try {
      const authToken = await getAuthToken()

      const response = await fetch('/api/bible/ai-insights', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          passage: passage,
          version: version,
          denomination: denomination
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
      
      // Handle case where insights might be a JSON string instead of an object
      let parsedInsights = data.insights
      if (typeof parsedInsights === 'string') {
        try {
          parsedInsights = JSON.parse(parsedInsights)
        } catch (parseError) {
          console.error('Failed to parse insights JSON string:', parseError)
          // If it's still a string, create a basic structure
          parsedInsights = {
            explanation: parsedInsights,
            keyThemes: [],
            crossReferences: [],
            studyQuestions: [],
            historicalContext: '',
            theologicalMeaning: '',
            practicalApplication: '',
            prayerPoints: []
          }
        }
      }
      
      setInsights(parsedInsights)
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
          explanation: insights.explanation || '',
          key_themes: insights.keyThemes || [],
          cross_references: insights.crossReferences || [],
          study_questions: insights.studyQuestions || [],
          historical_context: insights.historicalContext || '',
          theological_meaning: insights.theologicalMeaning || '',
          practical_application: insights.practicalApplication || '',
          prayer_points: insights.prayerPoints || []
        })
      })

      if (response.ok) {
        setIsSaved(true)
        await loadSavedInsights() // Reload saved insights
      } else {
        const errorData = await response.json()
        console.error('Save error details:', errorData)
        throw new Error(errorData.error || errorData.details || 'Failed to save insights')
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

  // Response and interaction functions
  const loadResponses = async (insightId: string) => {
    try {
      const authToken = await getAuthToken()
      const response = await fetch(`/api/ai-insights/responses?insight_id=${insightId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setResponses(data.responses || [])
      }
    } catch (error) {
      console.error('Error loading responses:', error)
    }
  }

  const loadInteractions = async (insightId: string) => {
    try {
      const authToken = await getAuthToken()
      const response = await fetch(`/api/ai-insights/interactions?insight_id=${insightId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setInteractions(data.interactions || [])
      }
    } catch (error) {
      console.error('Error loading interactions:', error)
    }
  }

  const submitResponse = async () => {
    if (!newResponse.text.trim() || !currentInsightId) return

    try {
      const authToken = await getAuthToken()
      const response = await fetch('/api/ai-insights/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          insight_id: currentInsightId,
          response_text: newResponse.text,
          response_type: newResponse.type,
          is_helpful: newResponse.is_helpful,
          rating: newResponse.rating
        })
      })

      if (response.ok) {
        await loadResponses(currentInsightId)
        setNewResponse({ text: '', type: 'comment', is_helpful: null, rating: undefined })
        setShowResponseForm(false)
      }
    } catch (error) {
      console.error('Error submitting response:', error)
    }
  }

  const submitFeedback = async () => {
    if (!currentInsightId) return

    try {
      const authToken = await getAuthToken()
      const response = await fetch('/api/ai-insights/feedback', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          insight_id: currentInsightId,
          ...newFeedback
        })
      })

      if (response.ok) {
        setNewFeedback({
          content_quality: undefined,
          theological_accuracy: undefined,
          practical_helpfulness: undefined,
          clarity: undefined,
          relevance: undefined,
          overall_rating: undefined,
          feedback_text: '',
          suggestions: ''
        })
        setShowFeedbackForm(false)
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
    }
  }

  const handleInteraction = async (interactionType: string) => {
    if (!currentInsightId) return

    try {
      const authToken = await getAuthToken()
      const response = await fetch('/api/ai-insights/interactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          insight_id: currentInsightId,
          interaction_type: interactionType
        })
      })

      if (response.ok) {
        await loadInteractions(currentInsightId)
      }
    } catch (error) {
      console.error('Error handling interaction:', error)
    }
  }

  const generateImage = async () => {
    if (!insights) return

    setIsGeneratingImage(true)
    setImageError(null)

    try {
      const authToken = await getAuthToken()
      
      const response = await fetch('/api/ai-insights/generate-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          passage_reference: passage.reference,
          passage_text: passage.text,
          insight_text: insights.explanation,
          key_themes: insights.keyThemes || [],
          style: 'biblical'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate image')
      }

      const data = await response.json()
      setGeneratedImage(data.image)
      setShowImageModal(true)
    } catch (error) {
      console.error('Error generating image:', error)
      setImageError(error instanceof Error ? error.message : 'Failed to generate image')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  if (showDiagnostics) {
    return <AIDiagnostics onClose={() => setShowDiagnostics(false)} />
  }

  return (
    <div className="bg-shield-canvas border border-shield-panel rounded-lg p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Brain className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-shield-fg">AI Bible Insights</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {!insights && !loading && (
            <>
              <button
                onClick={generateInsights}
                disabled={!passage || !passage.reference}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  !passage || !passage.reference
                    ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Brain className="h-4 w-4" />
                <span>
                  {!passage || !passage.reference 
                    ? 'Select a passage first' 
                    : 'Generate Insights'
                  }
                </span>
              </button>
              
              <button
                onClick={testWithMockData}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Brain className="h-4 w-4" />
                <span>Test with Mock Data</span>
              </button>
            </>
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
        <div className="mb-6 p-4 bg-shield-panel rounded-lg">
          <h4 className="text-lg font-medium text-shield-fg mb-3 flex items-center">
            <Bookmark className="h-5 w-5 text-yellow-400 mr-2" />
            Previously Saved Insights ({savedInsights.length})
          </h4>
          <div className="space-y-3">
            {savedInsights.map((saved, index) => (
              <div key={saved.id} className="p-3 bg-shield-canvas rounded border border-shield-edge">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-shield-muted">
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
                <p className="text-shield-fg text-sm line-clamp-2">
                  {saved.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="h-6 w-6 text-blue-600 animate-pulse" />
            </div>
          </div>
          <div className="text-blue-400 mb-2 font-medium">Generating AI insights...</div>
          <div className="text-sm text-shield-muted mb-4">Analyzing scripture with AI-powered understanding</div>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <div className="text-red-400 mb-2">Failed to load AI insights</div>
          <div className="text-sm text-shield-muted mb-4">{error}</div>
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
          {/* Shield AI Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6" />
                <h3 className="text-lg font-semibold">Shield AI Apologetics Insights</h3>
              </div>
              {denomination && (
                <span className="text-xs px-2 py-1 bg-white/20 rounded-full font-medium">
                  {denomination}
                </span>
              )}
            </div>
            <p className="text-blue-100 text-sm">
              Defending faith through Scripture • Building understanding • Strengthening belief
              {denomination && ` • Filtered for ${denomination} theology`}
            </p>
          </div>

          {/* Interaction Bar */}
          <div className="bg-shield-panel rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleInteraction('like')}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>Helpful</span>
                </button>
                
                <button
                  onClick={() => setShowResponseForm(!showResponseForm)}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Respond</span>
                </button>
                
                <button
                  onClick={() => setShowFeedbackForm(!showFeedbackForm)}
                  className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Award className="h-4 w-4" />
                  <span>Rate</span>
                </button>
                
                <button
                  onClick={generateImage}
                  disabled={isGeneratingImage || !insights}
                  className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {isGeneratingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Image className="h-4 w-4" />
                  )}
                  <span>{isGeneratingImage ? 'Generating...' : 'Generate Image'}</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-shield-muted">
                  {responses.length} responses • {interactions.length} interactions
                </span>
              </div>
            </div>
          </div>

          {/* Response Form */}
          {showResponseForm && (
            <div className="bg-shield-panel rounded-lg p-4 border border-shield-edge">
              <h4 className="text-lg font-medium text-shield-fg mb-3">Share Your Response</h4>
              <div className="space-y-3">
                <select
                  value={newResponse.type}
                  onChange={(e) => setNewResponse(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-shield-canvas border border-shield-edge rounded-lg text-shield-fg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="comment">💬 Comment</option>
                  <option value="question">❓ Question</option>
                  <option value="prayer">🙏 Prayer</option>
                  <option value="reflection">🤔 Reflection</option>
                  <option value="application">💡 Application</option>
                  <option value="correction">✏️ Correction</option>
                  <option value="appreciation">❤️ Appreciation</option>
                </select>
                
                <textarea
                  value={newResponse.text}
                  onChange={(e) => setNewResponse(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Share your thoughts on this passage..."
                  rows={3}
                  className="w-full px-3 py-2 bg-shield-canvas border border-shield-edge rounded-lg text-shield-fg placeholder-shield-muted focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newResponse.is_helpful === true}
                        onChange={(e) => setNewResponse(prev => ({ ...prev, is_helpful: e.target.checked ? true : null }))}
                        className="rounded border-shield-edge bg-shield-canvas text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-shield-fg">Helpful</span>
                    </label>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-shield-muted">Rating:</span>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setNewResponse(prev => ({ ...prev, rating: star }))}
                            className={`text-lg ${newResponse.rating && star <= newResponse.rating ? 'text-yellow-400' : 'text-shield-muted'}`}
                          >
                            ⭐
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={submitResponse}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    <span>Submit</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Form */}
          {showFeedbackForm && (
            <div className="bg-shield-panel rounded-lg p-4 border border-shield-edge">
              <h4 className="text-lg font-medium text-shield-fg mb-3">Rate This Insight</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'content_quality', label: 'Content Quality', icon: <BookOpen className="h-4 w-4" /> },
                  { key: 'theological_accuracy', label: 'Theological Accuracy', icon: <Cross className="h-4 w-4" /> },
                  { key: 'practical_helpfulness', label: 'Practical Helpfulness', icon: <Target className="h-4 w-4" /> },
                  { key: 'clarity', label: 'Clarity', icon: <Eye className="h-4 w-4" /> },
                  { key: 'relevance', label: 'Relevance', icon: <Zap className="h-4 w-4" /> },
                  { key: 'overall_rating', label: 'Overall Rating', icon: <Award className="h-4 w-4" /> }
                ].map(({ key, label, icon }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {icon}
                      <span className="text-sm text-shield-fg">{label}</span>
                    </div>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setNewFeedback(prev => ({ ...prev, [key]: star }))}
                          className={`text-lg ${newFeedback[key as keyof typeof newFeedback] && star <= (newFeedback[key as keyof typeof newFeedback] as number) ? 'text-yellow-400' : 'text-shield-muted'}`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 space-y-3">
                <textarea
                  value={newFeedback.feedback_text}
                  onChange={(e) => setNewFeedback(prev => ({ ...prev, feedback_text: e.target.value }))}
                  placeholder="Additional feedback (optional)"
                  rows={2}
                  className="w-full px-3 py-2 bg-shield-canvas border border-shield-edge rounded-lg text-shield-fg placeholder-shield-muted focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                
                <button
                  onClick={submitFeedback}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Award className="h-4 w-4" />
                  <span>Submit Rating</span>
                </button>
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className="border border-shield-panel rounded-lg">
            <button
              onClick={() => toggleSection('explanation')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-shield-panel transition-colors"
            >
              <div className="flex items-center space-x-3">
                <BookOpen className="h-5 w-5 text-blue-400" />
                <span className="font-medium text-shield-fg">Explanation</span>
              </div>
              {expandedSections.has('explanation') ? (
                <ChevronUp className="h-5 w-5 text-shield-muted" />
              ) : (
                <ChevronDown className="h-5 w-5 text-shield-muted" />
              )}
            </button>
            {expandedSections.has('explanation') && (
              <div className="p-4 border-t border-shield-panel">
                <p className="text-shield-fg leading-relaxed">
                  {typeof insights.explanation === 'string' 
                    ? insights.explanation 
                    : JSON.stringify(insights.explanation, null, 2)
                  }
                </p>
                <button
                  onClick={() => copyToClipboard(
                    typeof insights.explanation === 'string' 
                      ? insights.explanation 
                      : JSON.stringify(insights.explanation, null, 2)
                  )}
                  className="mt-3 flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  <span className="text-sm">Copy</span>
                </button>
              </div>
            )}
          </div>

          {/* Key Themes */}
          {insights.keyThemes && Array.isArray(insights.keyThemes) && insights.keyThemes.length > 0 && (
            <div className="border border-shield-panel rounded-lg">
              <button
                onClick={() => toggleSection('themes')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-shield-panel transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Lightbulb className="h-5 w-5 text-yellow-400" />
                  <span className="font-medium text-shield-fg">Key Themes</span>
                  <span className="text-sm text-shield-muted">({insights.keyThemes.length})</span>
                </div>
                {expandedSections.has('themes') ? (
                  <ChevronUp className="h-5 w-5 text-shield-muted" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-shield-muted" />
                )}
              </button>
              {expandedSections.has('themes') && (
                <div className="p-4 border-t border-shield-panel">
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
          {insights.crossReferences && Array.isArray(insights.crossReferences) && insights.crossReferences.length > 0 && (
            <div className="border border-shield-panel rounded-lg">
              <button
                onClick={() => toggleSection('crossrefs')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-shield-panel transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Cross className="h-5 w-5 text-green-400" />
                  <span className="font-medium text-shield-fg">Cross References</span>
                  <span className="text-sm text-shield-muted">({insights.crossReferences.length})</span>
                </div>
                {expandedSections.has('crossrefs') ? (
                  <ChevronUp className="h-5 w-5 text-shield-muted" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-shield-muted" />
                )}
              </button>
              {expandedSections.has('crossrefs') && (
                <div className="p-4 border-t border-shield-panel space-y-3">
                  {insights.crossReferences.map((ref, index) => (
                    <div key={index} className="p-3 bg-shield-canvas rounded border border-shield-edge">
                      <div className="font-medium text-blue-400 mb-1">{ref.reference}</div>
                      <p className="text-shield-fg text-sm mb-2">{ref.text}</p>
                      <p className="text-shield-muted text-xs">{ref.relevance}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Study Questions */}
          {insights.studyQuestions && Array.isArray(insights.studyQuestions) && insights.studyQuestions.length > 0 && (
            <div className="border border-shield-panel rounded-lg">
              <button
                onClick={() => toggleSection('questions')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-shield-panel transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <MessageCircle className="h-5 w-5 text-purple-400" />
                  <span className="font-medium text-shield-fg">Study Questions</span>
                  <span className="text-sm text-shield-muted">({insights.studyQuestions.length})</span>
                </div>
                {expandedSections.has('questions') ? (
                  <ChevronUp className="h-5 w-5 text-shield-muted" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-shield-muted" />
                )}
              </button>
              {expandedSections.has('questions') && (
                <div className="p-4 border-t border-shield-panel space-y-3">
                  {insights.studyQuestions.map((question, index) => (
                    <div key={index} className="p-3 bg-shield-canvas rounded border border-shield-edge">
                      <div className="flex items-start space-x-3">
                        <span className="text-purple-400 font-medium text-sm mt-1">{index + 1}.</span>
                        <div className="flex-1">
                          <p className="text-shield-fg mb-1">{question.question}</p>
                          <span className="text-xs text-shield-muted bg-purple-900 px-2 py-1 rounded">
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
            <div className="border border-shield-panel rounded-lg">
              <button
                onClick={() => toggleSection('history')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-shield-panel transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Search className="h-5 w-5 text-orange-400" />
                  <span className="font-medium text-shield-fg">Historical Context</span>
                </div>
                {expandedSections.has('history') ? (
                  <ChevronUp className="h-5 w-5 text-shield-muted" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-shield-muted" />
                )}
              </button>
              {expandedSections.has('history') && (
                <div className="p-4 border-t border-shield-panel">
                  <p className="text-shield-fg leading-relaxed">{insights.historicalContext}</p>
                </div>
              )}
            </div>
          )}

          {/* Theological Meaning */}
          {insights.theologicalMeaning && (
            <div className="border border-shield-panel rounded-lg">
              <button
                onClick={() => toggleSection('theology')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-shield-panel transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Heart className="h-5 w-5 text-red-400" />
                  <span className="font-medium text-shield-fg">Theological Meaning</span>
                </div>
                {expandedSections.has('theology') ? (
                  <ChevronUp className="h-5 w-5 text-shield-muted" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-shield-muted" />
                )}
              </button>
              {expandedSections.has('theology') && (
                <div className="p-4 border-t border-shield-panel">
                  <p className="text-shield-fg leading-relaxed">{insights.theologicalMeaning}</p>
                </div>
              )}
            </div>
          )}

          {/* Practical Application */}
          {insights.practicalApplication && (
            <div className="border border-shield-panel rounded-lg">
              <button
                onClick={() => toggleSection('application')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-shield-panel transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Lightbulb className="h-5 w-5 text-green-400" />
                  <span className="font-medium text-shield-fg">Practical Application</span>
                </div>
                {expandedSections.has('application') ? (
                  <ChevronUp className="h-5 w-5 text-shield-muted" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-shield-muted" />
                )}
              </button>
              {expandedSections.has('application') && (
                <div className="p-4 border-t border-shield-panel">
                  <p className="text-shield-fg leading-relaxed">{insights.practicalApplication}</p>
                </div>
              )}
            </div>
          )}

          {/* Prayer Points */}
          {insights.prayerPoints && Array.isArray(insights.prayerPoints) && insights.prayerPoints.length > 0 && (
            <div className="border border-shield-panel rounded-lg">
              <button
                onClick={() => toggleSection('prayer')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-shield-panel transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Heart className="h-5 w-5 text-pink-400" />
                  <span className="font-medium text-shield-fg">Prayer Points</span>
                  <span className="text-sm text-shield-muted">({insights.prayerPoints.length})</span>
                </div>
                {expandedSections.has('prayer') ? (
                  <ChevronUp className="h-5 w-5 text-shield-muted" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-shield-muted" />
                )}
              </button>
              {expandedSections.has('prayer') && (
                <div className="p-4 border-t border-shield-panel space-y-2">
                  {insights.prayerPoints.map((point, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <span className="text-pink-400 font-medium text-sm mt-1">{index + 1}.</span>
                      <p className="text-shield-fg text-sm">{point}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Shield AI Apologetics Features */}
          {insights.apologeticsPoints && insights.apologeticsPoints.length > 0 && (
            <div className="border border-shield-panel rounded-lg">
              <button
                onClick={() => toggleSection('apologetics')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-shield-panel transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-blue-400" />
                  <span className="font-medium text-shield-fg">Apologetics Points</span>
                  <span className="text-sm text-shield-muted">({insights.apologeticsPoints.length})</span>
                </div>
                {expandedSections.has('apologetics') ? (
                  <ChevronUp className="h-5 w-5 text-shield-muted" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-shield-muted" />
                )}
              </button>
              {expandedSections.has('apologetics') && (
                <div className="p-4 border-t border-shield-panel space-y-3">
                  {insights.apologeticsPoints.map((point, index) => (
                    <div key={index} className="bg-shield-canvas rounded-lg p-3 border border-shield-edge">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            point.category === 'defense' ? 'bg-red-600 text-white' :
                            point.category === 'evidence' ? 'bg-green-600 text-white' :
                            point.category === 'reasoning' ? 'bg-blue-600 text-white' :
                            'bg-purple-600 text-white'
                          }`}>
                            {point.category}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            point.strength === 'strong' ? 'bg-yellow-600 text-white' :
                            point.strength === 'moderate' ? 'bg-orange-600 text-white' :
                            'bg-gray-600 text-white'
                          }`}>
                            {point.strength}
                          </span>
                        </div>
                      </div>
                      <p className="text-shield-fg text-sm">{point.point}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Defense Questions */}
          {insights.defenseQuestions && insights.defenseQuestions.length > 0 && (
            <div className="border border-shield-panel rounded-lg">
              <button
                onClick={() => toggleSection('defense')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-shield-panel transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Target className="h-5 w-5 text-green-400" />
                  <span className="font-medium text-shield-fg">Defense Questions</span>
                  <span className="text-sm text-shield-muted">({insights.defenseQuestions.length})</span>
                </div>
                {expandedSections.has('defense') ? (
                  <ChevronUp className="h-5 w-5 text-shield-muted" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-shield-muted" />
                )}
              </button>
              {expandedSections.has('defense') && (
                <div className="p-4 border-t border-shield-panel space-y-3">
                  {insights.defenseQuestions.map((question, index) => (
                    <div key={index} className="bg-shield-canvas rounded-lg p-3 border border-shield-edge">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
                            {question.category}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            question.difficulty === 'beginner' ? 'bg-green-600 text-white' :
                            question.difficulty === 'intermediate' ? 'bg-yellow-600 text-white' :
                            'bg-red-600 text-white'
                          }`}>
                            {question.difficulty}
                          </span>
                        </div>
                      </div>
                      <p className="text-shield-fg text-sm">{question.question}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Evidence Types */}
          {insights.evidenceTypes && insights.evidenceTypes.length > 0 && (
            <div className="border border-shield-panel rounded-lg">
              <button
                onClick={() => toggleSection('evidence')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-shield-panel transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Search className="h-5 w-5 text-purple-400" />
                  <span className="font-medium text-shield-fg">Evidence Types</span>
                  <span className="text-sm text-shield-muted">({insights.evidenceTypes.length})</span>
                </div>
                {expandedSections.has('evidence') ? (
                  <ChevronUp className="h-5 w-5 text-shield-muted" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-shield-muted" />
                )}
              </button>
              {expandedSections.has('evidence') && (
                <div className="p-4 border-t border-shield-panel space-y-3">
                  {insights.evidenceTypes.map((evidence, index) => (
                    <div key={index} className="bg-shield-canvas rounded-lg p-3 border border-shield-edge">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          evidence.type === 'historical' ? 'bg-orange-600 text-white' :
                          evidence.type === 'archaeological' ? 'bg-brown-600 text-white' :
                          evidence.type === 'prophetic' ? 'bg-purple-600 text-white' :
                          evidence.type === 'scientific' ? 'bg-blue-600 text-white' :
                          'bg-green-600 text-white'
                        }`}>
                          {evidence.type}
                        </span>
                      </div>
                      <p className="text-shield-fg text-sm mb-2">{evidence.description}</p>
                      <p className="text-shield-muted text-xs">{evidence.relevance}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Common Objections */}
          {insights.commonObjections && insights.commonObjections.length > 0 && (
            <div className="border border-shield-panel rounded-lg">
              <button
                onClick={() => toggleSection('objections')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-shield-panel transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <span className="font-medium text-shield-fg">Common Objections</span>
                  <span className="text-sm text-shield-muted">({insights.commonObjections.length})</span>
                </div>
                {expandedSections.has('objections') ? (
                  <ChevronUp className="h-5 w-5 text-shield-muted" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-shield-muted" />
                )}
              </button>
              {expandedSections.has('objections') && (
                <div className="p-4 border-t border-shield-panel space-y-4">
                  {insights.commonObjections.map((objection, index) => (
                    <div key={index} className="bg-shield-canvas rounded-lg p-4 border border-shield-edge">
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-red-400 mb-2">Objection:</h4>
                        <p className="text-shield-fg text-sm">{objection.objection}</p>
                      </div>
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-green-400 mb-2">Response:</h4>
                        <p className="text-shield-fg text-sm">{objection.response}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-400 mb-2">Scripture:</h4>
                        <p className="text-shield-fg text-sm">{objection.scripture}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Faith Building */}
          {insights.faithBuilding && (
            <div className="border border-shield-panel rounded-lg">
              <button
                onClick={() => toggleSection('faith')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-shield-panel transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Heart className="h-5 w-5 text-pink-400" />
                  <span className="font-medium text-shield-fg">Faith Building</span>
                </div>
                {expandedSections.has('faith') ? (
                  <ChevronUp className="h-5 w-5 text-shield-muted" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-shield-muted" />
                )}
              </button>
              {expandedSections.has('faith') && (
                <div className="p-4 border-t border-shield-panel space-y-4">
                  <div className="bg-shield-canvas rounded-lg p-3 border border-shield-edge">
                    <h4 className="text-sm font-medium text-pink-400 mb-2">Encouragement:</h4>
                    <p className="text-shield-fg text-sm">{insights.faithBuilding.encouragement}</p>
                  </div>
                  
                  {insights.faithBuilding.promises && insights.faithBuilding.promises.length > 0 && (
                    <div className="bg-shield-canvas rounded-lg p-3 border border-shield-edge">
                      <h4 className="text-sm font-medium text-yellow-400 mb-2">Promises:</h4>
                      <ul className="space-y-1">
                        {insights.faithBuilding.promises.map((promise, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-yellow-400 font-medium text-sm mt-1">•</span>
                            <span className="text-shield-fg text-sm">{promise}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {insights.faithBuilding.applications && insights.faithBuilding.applications.length > 0 && (
                    <div className="bg-shield-canvas rounded-lg p-3 border border-shield-edge">
                      <h4 className="text-sm font-medium text-green-400 mb-2">Applications:</h4>
                      <ul className="space-y-1">
                        {insights.faithBuilding.applications.map((application, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-green-400 font-medium text-sm mt-1">•</span>
                            <span className="text-shield-fg text-sm">{application}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Image Generation Modal */}
      {showImageModal && generatedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-shield-canvas border border-shield-panel rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Palette className="h-6 w-6 text-indigo-400" />
                <div>
                  <h3 className="text-lg font-semibold text-shield-fg">Generated Image</h3>
                  <p className="text-sm text-shield-muted">{passage.reference}</p>
                </div>
              </div>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-shield-muted hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <img
                  src={generatedImage.url}
                  alt={`Visual representation of ${passage.reference}`}
                  className="w-full rounded-lg shadow-lg"
                />
                <div className="absolute top-4 right-4">
                  <div className="bg-black bg-opacity-50 rounded-lg p-2">
                    <Wand2 className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>

              {generatedImage.revisedPrompt && (
                <div className="p-4 bg-shield-panel rounded-lg">
                  <h4 className="text-sm font-medium text-shield-fg mb-2">Generated from:</h4>
                  <p className="text-sm text-shield-muted italic">"{generatedImage.revisedPrompt}"</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = generatedImage.url
                    link.download = `bible-image-${passage.reference.replace(/\s+/g, '-')}.png`
                    link.click()
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedImage.url)
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy URL</span>
                </button>

                <button
                  onClick={() => {
                    const shareData = {
                      title: `Bible Image - ${passage.reference}`,
                      text: `Visual representation of ${passage.reference}`,
                      url: generatedImage.url
                    }
                    if (navigator.share) {
                      navigator.share(shareData)
                    } else {
                      navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`)
                    }
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Error Display */}
      {imageError && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <p className="text-red-400 text-sm">{imageError}</p>
          </div>
        </div>
      )}
    </div>
  )
}
