import React, { useState, useEffect } from 'react'
import { JournalNoteEditor } from './JournalNoteEditor'
import { devFallbackToken } from '../../../lib/test-token'
import {
  Brain,
  BookOpen,
  Lightbulb,
  Cross, 
  Heart, 
  MessageCircle, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Copy,
  Share2,
  Bookmark,
  Star,
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
  X,
  Download,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'

interface Insight {
  id: string
  passage_reference: string
  passage_text: string
  bible_version: string
  explanation: string
  key_themes: string[]
  cross_references: any[]
  study_questions: any[]
  historical_context?: string
  theological_meaning?: string
  practical_application?: string
  prayer_points: string[]
  ai_model: string
  generation_timestamp: string
  created_at: string
  updated_at: string
  is_favorite: boolean
  is_shared: boolean
  tags: string[]
  notes?: string
  user_id: string
  response_count?: number
  interaction_count?: number
  average_rating?: number
  helpfulness_score?: number
  engagement_score?: number
  last_interaction?: string
  relevance_score?: number
}

interface InsightDetailViewProps {
  insight: Insight
  onClose?: () => void
  onToggleFavorite?: (insightId: string) => void
  onToggleShare?: (insightId: string) => void
}

export function InsightDetailView({ 
  insight, 
  onClose, 
  onToggleFavorite, 
  onToggleShare 
}: InsightDetailViewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['explanation']))
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
  
  // Image generation states
  const [generatedImage, setGeneratedImage] = useState<any>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)

  useEffect(() => {
    if (insight) {
      loadResponses()
      loadInteractions()
    }
  }, [insight])

  const getAuthToken = async (): Promise<string> => {
    try {
      const { data: { session } } = await import('../../../lib/supabase').then(m => m.supabase.auth.getSession())
      return session?.access_token || devFallbackToken()
    } catch (error) {
      return devFallbackToken()
    }
  }

  const loadResponses = async () => {
    try {
      const authToken = await getAuthToken()
      const response = await fetch(`/api/ai-insights/responses?insight_id=${insight.id}`, {
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

  const loadInteractions = async () => {
    try {
      const authToken = await getAuthToken()
      const response = await fetch(`/api/ai-insights/interactions?insight_id=${insight.id}`, {
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
    if (!newResponse.text.trim()) return

    try {
      const authToken = await getAuthToken()
      const response = await fetch('/api/ai-insights/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          insight_id: insight.id,
          response_text: newResponse.text,
          response_type: newResponse.type,
          is_helpful: newResponse.is_helpful,
          rating: newResponse.rating
        })
      })

      if (response.ok) {
        await loadResponses()
        setNewResponse({ text: '', type: 'comment', is_helpful: null, rating: undefined })
        setShowResponseForm(false)
      }
    } catch (error) {
      console.error('Error submitting response:', error)
    }
  }

  const submitFeedback = async () => {
    try {
      const authToken = await getAuthToken()
      const response = await fetch('/api/ai-insights/feedback', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          insight_id: insight.id,
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
    try {
      const authToken = await getAuthToken()
      const response = await fetch('/api/ai-insights/interactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          insight_id: insight.id,
          interaction_type: interactionType
        })
      })

      if (response.ok) {
        await loadInteractions()
      }
    } catch (error) {
      console.error('Error handling interaction:', error)
    }
  }

  const generateImage = async () => {
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
          passage_reference: insight.passage_reference,
          passage_text: insight.passage_text,
          insight_text: insight.explanation,
          key_themes: insight.key_themes || [],
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRatingStars = (rating?: number) => {
    if (!rating) return null
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.round(rating) ? 'text-shield-accent fill-current' : 'text-shield-muted'
        }`}
      />
    ))
  }

  return (
    <div className="bg-shield-canvas border border-shield-panel rounded-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      {onClose && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Brain className="h-6 w-6 text-shield-brand" />
            <h2 className="text-xl font-semibold text-shield-fg">Insight Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-shield-muted hover:text-shield-fg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Passage Reference */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-shield-fg mb-2">{insight.passage_reference}</h1>
        <div className="flex items-center space-x-4 text-sm text-shield-muted mb-3">
          <span>{insight.bible_version}</span>
          <span>•</span>
          <span>{formatDate(insight.created_at)}</span>
          {insight.relevance_score && (
            <>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3" />
                <span>{Math.round(insight.relevance_score * 100)}% match</span>
              </span>
            </>
          )}
        </div>
        
        {/* Passage Text */}
        <div className="bg-shield-panel rounded-lg p-4 mb-4">
          <p className="text-shield-fg leading-relaxed italic">"{insight.passage_text}"</p>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {insight.is_favorite && <Star className="h-4 w-4 text-shield-accent fill-current" />}
            {insight.is_shared && <Share2 className="h-4 w-4 text-shield-brand" />}
            {insight.average_rating && (
              <div className="flex items-center space-x-1">
                {getRatingStars(insight.average_rating)}
                <span className="text-sm text-shield-muted">({insight.average_rating.toFixed(1)})</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleFavorite?.(insight.id)}
              className={`p-2 rounded-lg transition-colors ${
                insight.is_favorite 
                  ? 'bg-shield-accent text-shield-on-brand' 
                  : 'bg-shield-panel text-shield-muted hover:text-shield-fg'
              }`}
            >
              <Star className="h-4 w-4" />
            </button>
            <button
              onClick={() => onToggleShare?.(insight.id)}
              className={`p-2 rounded-lg transition-colors ${
                insight.is_shared 
                  ? 'bg-shield-brand text-shield-on-brand' 
                  : 'bg-shield-panel text-shield-muted hover:text-shield-fg'
              }`}
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Shield AI Header */}
        <div className="bg-gradient-to-r from-shield-brand to-shield-brand-dim rounded-lg p-4 text-shield-on-brand">
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="h-6 w-6" />
            <h3 className="text-lg font-semibold">Shield AI Apologetics Insights</h3>
          </div>
          <p className="text-shield-on-brand/80 text-sm">
            Defending faith through Scripture • Building understanding • Strengthening belief
          </p>
        </div>

        {/* Interaction Bar */}
        <div className="bg-shield-panel rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleInteraction('like')}
                className="flex items-center space-x-2 px-3 py-2 border border-shield-edge bg-shield-surface text-shield-fg hover:bg-shield-elevated rounded-lg transition-colors"
              >
                <ThumbsUp className="h-4 w-4" />
                <span>Helpful</span>
              </button>
              
              <button
                onClick={() => setShowResponseForm(!showResponseForm)}
                className="flex items-center space-x-2 px-3 py-2 bg-shield-brand hover:bg-shield-brand-dim text-shield-on-brand rounded-lg transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Respond</span>
              </button>
              
              <button
                onClick={() => setShowFeedbackForm(!showFeedbackForm)}
                className="flex items-center space-x-2 px-3 py-2 border border-shield-edge bg-shield-surface text-shield-fg hover:bg-shield-elevated rounded-lg transition-colors"
              >
                <Award className="h-4 w-4" />
                <span>Rate</span>
              </button>
              
              <button
                onClick={generateImage}
                disabled={isGeneratingImage}
                className="flex items-center space-x-2 px-3 py-2 border border-shield-edge bg-shield-surface text-shield-fg hover:bg-shield-elevated disabled:opacity-50 rounded-lg transition-colors"
              >
                {isGeneratingImage ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
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
                className="w-full px-3 py-2 bg-shield-canvas border border-shield-edge rounded-lg text-shield-fg focus:outline-none focus:ring-2 focus:ring-shield-brand/50"
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
                className="w-full px-3 py-2 bg-shield-canvas border border-shield-edge rounded-lg text-shield-fg placeholder-shield-muted focus:outline-none focus:ring-2 focus:ring-shield-brand/50 resize-none"
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newResponse.is_helpful === true}
                      onChange={(e) => setNewResponse(prev => ({ ...prev, is_helpful: e.target.checked ? true : null }))}
                      className="rounded border-shield-edge bg-shield-canvas text-shield-brand focus:ring-shield-brand"
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
                          className={`text-lg ${newResponse.rating && star <= newResponse.rating ? 'text-shield-accent' : 'text-shield-muted'}`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={submitResponse}
                  className="flex items-center space-x-2 px-4 py-2 bg-shield-brand hover:bg-shield-brand-dim text-shield-on-brand rounded-lg transition-colors"
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
                        className={`text-lg ${newFeedback[key as keyof typeof newFeedback] && star <= (newFeedback[key as keyof typeof newFeedback] as number) ? 'text-shield-accent' : 'text-shield-muted'}`}
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
                className="w-full px-3 py-2 bg-shield-canvas border border-shield-edge rounded-lg text-shield-fg placeholder-shield-muted focus:outline-none focus:ring-2 focus:ring-shield-brand/50 resize-none"
              />
              
              <button
                onClick={submitFeedback}
                className="flex items-center space-x-2 px-4 py-2 bg-shield-brand hover:bg-shield-brand-dim text-shield-on-brand rounded-lg transition-colors"
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
              <BookOpen className="h-5 w-5 text-shield-brand" />
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
              <p className="text-shield-fg leading-relaxed">{insight.explanation}</p>
              <button
                onClick={() => copyToClipboard(insight.explanation)}
                className="mt-3 flex items-center space-x-2 text-shield-brand hover:text-shield-brand-dim transition-colors"
              >
                <Copy className="h-4 w-4" />
                <span className="text-sm">Copy</span>
              </button>
            </div>
          )}
        </div>

        {/* Key Themes */}
        {insight.key_themes.length > 0 && (
          <div className="border border-shield-panel rounded-lg">
            <button
              onClick={() => toggleSection('themes')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-shield-panel transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Lightbulb className="h-5 w-5 text-shield-accent" />
                <span className="font-medium text-shield-fg">Key Themes</span>
                <span className="text-sm text-shield-muted">({insight.key_themes.length})</span>
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
                  {insight.key_themes.map((theme, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-shield-brand text-shield-on-brand rounded-full text-sm"
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
        {insight.cross_references.length > 0 && (
          <div className="border border-shield-panel rounded-lg">
            <button
              onClick={() => toggleSection('crossrefs')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-shield-panel transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Cross className="h-5 w-5 text-shield-brand" />
                <span className="font-medium text-shield-fg">Cross References</span>
                <span className="text-sm text-shield-muted">({insight.cross_references.length})</span>
              </div>
              {expandedSections.has('crossrefs') ? (
                <ChevronUp className="h-5 w-5 text-shield-muted" />
              ) : (
                <ChevronDown className="h-5 w-5 text-shield-muted" />
              )}
            </button>
            {expandedSections.has('crossrefs') && (
              <div className="p-4 border-t border-shield-panel space-y-3">
                {insight.cross_references.map((ref, index) => (
                  <div key={index} className="p-3 bg-shield-canvas rounded border border-shield-edge">
                    <div className="font-medium text-shield-brand mb-1">{ref.reference}</div>
                    <p className="text-shield-fg text-sm mb-2">{ref.text}</p>
                    <p className="text-shield-muted text-xs">{ref.relevance}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Study Questions */}
        {insight.study_questions.length > 0 && (
          <div className="border border-shield-panel rounded-lg">
            <button
              onClick={() => toggleSection('questions')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-shield-panel transition-colors"
            >
              <div className="flex items-center space-x-3">
                <MessageCircle className="h-5 w-5 text-shield-brand" />
                <span className="font-medium text-shield-fg">Study Questions</span>
                <span className="text-sm text-shield-muted">({insight.study_questions.length})</span>
              </div>
              {expandedSections.has('questions') ? (
                <ChevronUp className="h-5 w-5 text-shield-muted" />
              ) : (
                <ChevronDown className="h-5 w-5 text-shield-muted" />
              )}
            </button>
            {expandedSections.has('questions') && (
              <div className="p-4 border-t border-shield-panel space-y-3">
                {insight.study_questions.map((question, index) => (
                  <div key={index} className="p-3 bg-shield-canvas rounded border border-shield-edge">
                    <div className="flex items-start space-x-3">
                      <span className="text-shield-brand font-medium text-sm mt-1">{index + 1}.</span>
                      <div className="flex-1">
                        <p className="text-shield-fg mb-1">{question.question}</p>
                        <span className="text-xs text-shield-muted bg-shield-elevated px-2 py-1 rounded">
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
        {insight.historical_context && (
          <div className="border border-shield-panel rounded-lg">
            <button
              onClick={() => toggleSection('history')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-shield-panel transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Search className="h-5 w-5 text-shield-brand" />
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
                <p className="text-shield-fg leading-relaxed">{insight.historical_context}</p>
              </div>
            )}
          </div>
        )}

        {/* Theological Meaning */}
        {insight.theological_meaning && (
          <div className="border border-shield-panel rounded-lg">
            <button
              onClick={() => toggleSection('theology')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-shield-panel transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Heart className="h-5 w-5 text-red-500" />
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
                <p className="text-shield-fg leading-relaxed">{insight.theological_meaning}</p>
              </div>
            )}
          </div>
        )}

        {/* Practical Application */}
        {insight.practical_application && (
          <div className="border border-shield-panel rounded-lg">
            <button
              onClick={() => toggleSection('application')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-shield-panel transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Lightbulb className="h-5 w-5 text-shield-brand" />
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
                <p className="text-shield-fg leading-relaxed">{insight.practical_application}</p>
              </div>
            )}
          </div>
        )}

        {/* Prayer Points */}
        {insight.prayer_points.length > 0 && (
          <div className="border border-shield-panel rounded-lg">
            <button
              onClick={() => toggleSection('prayer')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-shield-panel transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Heart className="h-5 w-5 text-shield-brand" />
                <span className="font-medium text-shield-fg">Prayer Points</span>
                <span className="text-sm text-shield-muted">({insight.prayer_points.length})</span>
              </div>
              {expandedSections.has('prayer') ? (
                <ChevronUp className="h-5 w-5 text-shield-muted" />
              ) : (
                <ChevronDown className="h-5 w-5 text-shield-muted" />
              )}
            </button>
            {expandedSections.has('prayer') && (
              <div className="p-4 border-t border-shield-panel space-y-2">
                {insight.prayer_points.map((point, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <span className="text-shield-brand font-medium text-sm mt-1">{index + 1}.</span>
                    <p className="text-shield-fg text-sm">{point}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Journal Note Editor — always shown */}
        <JournalNoteEditor
          insightId={insight.id}
          initialNote={insight.notes ?? ''}
        />
      </div>

      {/* Image Generation Modal */}
      {showImageModal && generatedImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-shield-canvas border border-shield-panel rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Palette className="h-6 w-6 text-shield-brand" />
                <div>
                  <h3 className="text-lg font-semibold text-shield-fg">Generated Image</h3>
                  <p className="text-sm text-shield-muted">{insight.passage_reference}</p>
                </div>
              </div>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-shield-muted hover:text-shield-fg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <img
                  src={generatedImage.url}
                  alt={`Visual representation of ${insight.passage_reference}`}
                  className="w-full rounded-lg shadow-lg"
                />
                <div className="absolute top-4 right-4">
                  <div className="bg-black/50 rounded-lg p-2">
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
                    link.download = `bible-image-${insight.passage_reference.replace(/\s+/g, '-')}.png`
                    link.click()
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-shield-brand hover:bg-shield-brand-dim text-shield-on-brand rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedImage.url)
                  }}
                  className="flex items-center space-x-2 px-4 py-2 border border-shield-edge bg-shield-surface text-shield-fg hover:bg-shield-elevated rounded-lg transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy URL</span>
                </button>

                <button
                  onClick={() => {
                    const shareData = {
                      title: `Bible Image - ${insight.passage_reference}`,
                      text: `Visual representation of ${insight.passage_reference}`,
                      url: generatedImage.url
                    }
                    if (navigator.share) {
                      navigator.share(shareData)
                    } else {
                      navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`)
                    }
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-shield-brand hover:bg-shield-brand-dim text-shield-on-brand rounded-lg transition-colors"
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
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <p className="text-red-500 text-sm">{imageError}</p>
          </div>
        </div>
      )}
    </div>
  )
}

