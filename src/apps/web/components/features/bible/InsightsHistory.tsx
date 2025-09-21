import React, { useState, useEffect } from 'react'
import { 
  Brain, 
  BookOpen, 
  Calendar,
  Filter,
  Search,
  Star,
  Share2,
  Tag,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  Bookmark,
  Heart,
  Eye,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  X,
  Check,
  SlidersHorizontal,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Send,
  Edit,
  Trash2,
  Plus,
  Minus,
  Award,
  Target,
  Zap,
  Sparkles,
  Users,
  MessageSquare,
  PenTool,
  Lightbulb,
  Cross
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
}

interface InsightResponse {
  id: string
  insight_id: string
  user_id: string
  response_text: string
  response_type: 'comment' | 'question' | 'prayer' | 'reflection' | 'application' | 'correction' | 'appreciation'
  is_helpful?: boolean
  is_accurate?: boolean
  rating?: number
  created_at: string
  updated_at: string
}

interface InsightInteraction {
  id: string
  insight_id: string
  user_id: string
  interaction_type: 'view' | 'like' | 'dislike' | 'share' | 'copy' | 'bookmark' | 'unbookmark' | 'favorite' | 'unfavorite' | 'report' | 'flag' | 'download' | 'print'
  interaction_data: any
  session_id?: string
  created_at: string
}

interface InsightFeedback {
  id: string
  insight_id: string
  user_id: string
  content_quality?: number
  theological_accuracy?: number
  practical_helpfulness?: number
  clarity?: number
  relevance?: number
  overall_rating?: number
  feedback_text?: string
  suggestions?: string
  created_at: string
  updated_at: string
}

interface Statistics {
  overview: {
    total_insights: number
    favorite_insights: number
    shared_insights: number
    recent_insights: number
    unique_passages: number
    unique_versions: number
    last_activity: string | null
  }
  engagement: {
    engagement_rate: number
    sharing_rate: number
    activity_rate: number
  }
  chart_data: Array<{ month: string; count: number }>
  version_usage: Array<{ version: string; count: number }>
  popular_themes: Array<{ theme: string; count: number }>
  popular_tags: Array<{ tag: string; count: number }>
  recent_activity: Array<{ date: string; passage: string }>
  versions_used: string[]
}

interface Filters {
  search_query: string
  bible_version: string
  tags: string[]
  key_themes: string[]
  is_favorite: boolean | null
  is_shared: boolean | null
  date_from: string
  date_to: string
  passage_reference: string
}

interface InsightsHistoryProps {
  userId?: string
  onInsightSelect?: (insight: Insight) => void
}

export function InsightsHistory({ userId, onInsightSelect }: InsightsHistoryProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'analytics' | 'favorites' | 'shared'>('overview')
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    search_query: '',
    bible_version: '',
    tags: [],
    key_themes: [],
    is_favorite: null,
    is_shared: null,
    date_from: '',
    date_to: '',
    passage_reference: ''
  })
  const [availableFilters, setAvailableFilters] = useState<{
    tags: string[]
    themes: string[]
    versions: string[]
  }>({
    tags: [],
    themes: [],
    versions: []
  })
  
  // Response and interaction states
  const [responses, setResponses] = useState<Map<string, InsightResponse[]>>(new Map())
  const [interactions, setInteractions] = useState<Map<string, InsightInteraction[]>>(new Map())
  const [feedback, setFeedback] = useState<Map<string, InsightFeedback[]>>(new Map())
  const [showResponseForm, setShowResponseForm] = useState<string | null>(null)
  const [showFeedbackForm, setShowFeedbackForm] = useState<string | null>(null)
  const [newResponse, setNewResponse] = useState({
    text: '',
    type: 'comment' as InsightResponse['response_type'],
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

  useEffect(() => {
    loadInsightsHistory()
    loadStatistics()
  }, [])

  const getAuthToken = async (): Promise<string> => {
    try {
      const { data: { session } } = await import('../../../lib/supabase').then(m => m.supabase.auth.getSession())
      return session?.access_token || 'test-token'
    } catch (error) {
      return 'test-token'
    }
  }

  const loadInsightsHistory = async () => {
    setLoading(true)
    setError(null)

    try {
      const authToken = await getAuthToken()
      const queryParams = new URLSearchParams({
        limit: '100',
        offset: '0',
        sort_by: 'created_at',
        sort_order: 'desc'
      })

      // Add filters to query params
      if (filters.search_query) queryParams.append('search_query', filters.search_query)
      if (filters.bible_version) queryParams.append('bible_version', filters.bible_version)
      if (filters.passage_reference) queryParams.append('passage_reference', filters.passage_reference)
      if (filters.is_favorite !== null) queryParams.append('is_favorite', filters.is_favorite.toString())
      if (filters.is_shared !== null) queryParams.append('is_shared', filters.is_shared.toString())
      if (filters.date_from) queryParams.append('date_from', filters.date_from)
      if (filters.date_to) queryParams.append('date_to', filters.date_to)
      filters.tags.forEach(tag => queryParams.append('tags', tag))
      filters.key_themes.forEach(theme => queryParams.append('key_themes', theme))

      const response = await fetch(`/api/ai-insights/history?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load insights history')
      }

      const data = await response.json()
      setInsights(data.insights || [])
      setAvailableFilters(data.filters || { tags: [], themes: [], versions: [] })
    } catch (error) {
      console.error('Error loading insights history:', error)
      setError(error instanceof Error ? error.message : 'Failed to load insights history')
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const authToken = await getAuthToken()
      const response = await fetch('/api/ai-insights/statistics', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStatistics(data.statistics)
      }
    } catch (error) {
      console.error('Error loading statistics:', error)
    }
  }

  const toggleInsightExpansion = (insightId: string) => {
    const newExpanded = new Set(expandedInsights)
    if (newExpanded.has(insightId)) {
      newExpanded.delete(insightId)
    } else {
      newExpanded.add(insightId)
    }
    setExpandedInsights(newExpanded)
  }

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      search_query: '',
      bible_version: '',
      tags: [],
      key_themes: [],
      is_favorite: null,
      is_shared: null,
      date_from: '',
      date_to: '',
      passage_reference: ''
    })
  }

  const applyFilters = () => {
    loadInsightsHistory()
    setShowFilters(false)
  }

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
        setResponses(prev => new Map(prev.set(insightId, data.responses || [])))
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
        setInteractions(prev => new Map(prev.set(insightId, data.interactions || [])))
      }
    } catch (error) {
      console.error('Error loading interactions:', error)
    }
  }

  const loadFeedback = async (insightId: string) => {
    try {
      const authToken = await getAuthToken()
      const response = await fetch(`/api/ai-insights/feedback?insight_id=${insightId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setFeedback(prev => new Map(prev.set(insightId, data.feedback || [])))
      }
    } catch (error) {
      console.error('Error loading feedback:', error)
    }
  }

  const submitResponse = async (insightId: string) => {
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
          insight_id: insightId,
          response_text: newResponse.text,
          response_type: newResponse.type,
          is_helpful: newResponse.is_helpful,
          rating: newResponse.rating
        })
      })

      if (response.ok) {
        await loadResponses(insightId)
        setNewResponse({ text: '', type: 'comment', is_helpful: null, rating: undefined })
        setShowResponseForm(null)
      }
    } catch (error) {
      console.error('Error submitting response:', error)
    }
  }

  const submitFeedback = async (insightId: string) => {
    try {
      const authToken = await getAuthToken()
      const response = await fetch('/api/ai-insights/feedback', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          insight_id: insightId,
          ...newFeedback
        })
      })

      if (response.ok) {
        await loadFeedback(insightId)
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
        setShowFeedbackForm(null)
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
    }
  }

  const handleInteraction = async (insightId: string, interactionType: InsightInteraction['interaction_type']) => {
    try {
      const authToken = await getAuthToken()
      const response = await fetch('/api/ai-insights/interactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          insight_id: insightId,
          interaction_type: interactionType
        })
      })

      if (response.ok) {
        await loadInteractions(insightId)
        // Update the insight in the list if needed
        setInsights(prev => prev.map(insight => 
          insight.id === insightId 
            ? { ...insight, interaction_count: (insight.interaction_count || 0) + 1 }
            : insight
        ))
      }
    } catch (error) {
      console.error('Error handling interaction:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3, color: 'text-blue-400' },
    { id: 'insights', label: 'All Insights', icon: Brain, color: 'text-purple-400' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, color: 'text-green-400' },
    { id: 'favorites', label: 'Favorites', icon: Star, color: 'text-yellow-400' },
    { id: 'shared', label: 'Shared', icon: Share2, color: 'text-pink-400' }
  ]

  if (loading && !statistics) {
    return (
      <div className="bg-[#1A1D24] border border-[#2C303A] rounded-lg p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 text-blue-400 animate-spin mb-4" />
          <div className="text-blue-400 mb-2">Loading insights history...</div>
          <div className="text-sm text-[#9CA3AF]">This may take a few moments</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[#1A1D24] border border-[#2C303A] rounded-lg p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <div className="text-red-400 mb-2">Failed to load insights history</div>
          <div className="text-sm text-[#9CA3AF] mb-4">{error}</div>
          <button 
            onClick={loadInsightsHistory}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try again</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#1A1D24] border border-[#2C303A] rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Brain className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-[#E0E0E0]">Insights History</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              showFilters 
                ? 'bg-blue-600 text-white' 
                : 'bg-[#2C303A] text-[#E0E0E0] hover:bg-[#3A404B]'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
          </button>
          
          <button
            onClick={loadInsightsHistory}
            className="flex items-center space-x-2 px-3 py-2 bg-[#2C303A] text-[#E0E0E0] hover:bg-[#3A404B] rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-[#2C303A] rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-[#E0E0E0] mb-2">Search</label>
              <input
                type="text"
                value={filters.search_query}
                onChange={(e) => handleFilterChange('search_query', e.target.value)}
                placeholder="Search insights..."
                className="w-full px-3 py-2 bg-[#1A1D24] border border-[#3A404B] rounded-lg text-[#E0E0E0] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Bible Version */}
            <div>
              <label className="block text-sm font-medium text-[#E0E0E0] mb-2">Bible Version</label>
              <select
                value={filters.bible_version}
                onChange={(e) => handleFilterChange('bible_version', e.target.value)}
                className="w-full px-3 py-2 bg-[#1A1D24] border border-[#3A404B] rounded-lg text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Versions</option>
                {availableFilters.versions.map(version => (
                  <option key={version} value={version}>{version}</option>
                ))}
              </select>
            </div>

            {/* Passage Reference */}
            <div>
              <label className="block text-sm font-medium text-[#E0E0E0] mb-2">Passage Reference</label>
              <input
                type="text"
                value={filters.passage_reference}
                onChange={(e) => handleFilterChange('passage_reference', e.target.value)}
                placeholder="e.g., John 3:16"
                className="w-full px-3 py-2 bg-[#1A1D24] border border-[#3A404B] rounded-lg text-[#E0E0E0] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-[#E0E0E0] mb-2">From Date</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="w-full px-3 py-2 bg-[#1A1D24] border border-[#3A404B] rounded-lg text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#E0E0E0] mb-2">To Date</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="w-full px-3 py-2 bg-[#1A1D24] border border-[#3A404B] rounded-lg text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filters */}
            <div>
              <label className="block text-sm font-medium text-[#E0E0E0] mb-2">Status</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.is_favorite === true}
                    onChange={(e) => handleFilterChange('is_favorite', e.target.checked ? true : null)}
                    className="rounded border-[#3A404B] bg-[#1A1D24] text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-[#E0E0E0]">Favorites Only</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.is_shared === true}
                    onChange={(e) => handleFilterChange('is_shared', e.target.checked ? true : null)}
                    className="rounded border-[#3A404B] bg-[#1A1D24] text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-[#E0E0E0]">Shared Only</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-[#9CA3AF] hover:text-[#E0E0E0] transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-[#2C303A] p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-[#1A1D24] text-[#E0E0E0]'
                  : 'text-[#9CA3AF] hover:text-[#E0E0E0] hover:bg-[#3A404B]'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      {activeTab === 'overview' && statistics && (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#2C303A] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#9CA3AF]">Total Insights</p>
                  <p className="text-2xl font-bold text-[#E0E0E0]">{statistics.overview.total_insights}</p>
                </div>
                <Brain className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            
            <div className="bg-[#2C303A] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#9CA3AF]">Favorites</p>
                  <p className="text-2xl font-bold text-[#E0E0E0]">{statistics.overview.favorite_insights}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-400" />
              </div>
            </div>
            
            <div className="bg-[#2C303A] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#9CA3AF]">Shared</p>
                  <p className="text-2xl font-bold text-[#E0E0E0]">{statistics.overview.shared_insights}</p>
                </div>
                <Share2 className="h-8 w-8 text-pink-400" />
              </div>
            </div>
            
            <div className="bg-[#2C303A] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#9CA3AF]">Unique Passages</p>
                  <p className="text-2xl font-bold text-[#E0E0E0]">{statistics.overview.unique_passages}</p>
                </div>
                <BookOpen className="h-8 w-8 text-green-400" />
              </div>
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#2C303A] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#9CA3AF]">Engagement Rate</p>
                  <p className="text-2xl font-bold text-[#E0E0E0]">{statistics.engagement.engagement_rate}%</p>
                </div>
                <Heart className="h-8 w-8 text-red-400" />
              </div>
            </div>
            
            <div className="bg-[#2C303A] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#9CA3AF]">Sharing Rate</p>
                  <p className="text-2xl font-bold text-[#E0E0E0]">{statistics.engagement.sharing_rate}%</p>
                </div>
                <Share2 className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            
            <div className="bg-[#2C303A] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#9CA3AF]">Activity Rate</p>
                  <p className="text-2xl font-bold text-[#E0E0E0]">{statistics.engagement.activity_rate}%</p>
                </div>
                <Activity className="h-8 w-8 text-green-400" />
              </div>
            </div>
          </div>

          {/* Popular Themes and Tags */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#2C303A] rounded-lg p-4">
              <h3 className="text-lg font-medium text-[#E0E0E0] mb-4">Popular Themes</h3>
              <div className="space-y-2">
                {statistics.popular_themes.slice(0, 5).map((theme, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-[#E0E0E0]">{theme.theme}</span>
                    <span className="text-sm text-[#9CA3AF]">{theme.count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-[#2C303A] rounded-lg p-4">
              <h3 className="text-lg font-medium text-[#E0E0E0] mb-4">Popular Tags</h3>
              <div className="space-y-2">
                {statistics.popular_tags.slice(0, 5).map((tag, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-[#E0E0E0]">{tag.tag}</span>
                    <span className="text-sm text-[#9CA3AF]">{tag.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-4">
          {insights.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="h-12 w-12 text-[#9CA3AF] mx-auto mb-4" />
              <p className="text-[#9CA3AF]">No insights found</p>
              <p className="text-sm text-[#9CA3AF] mt-2">Try adjusting your filters or generate some insights first</p>
            </div>
          ) : (
            insights.map((insight) => (
              <div key={insight.id} className="bg-gradient-to-br from-[#2C303A] to-[#1A1D24] rounded-xl p-6 border border-[#3A404B] hover:border-[#4A505B] transition-all duration-300 shadow-lg">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-[#E0E0E0]">
                        {insight.passage_reference}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {insight.is_favorite && <Star className="h-4 w-4 text-yellow-400 fill-current" />}
                        {insight.is_shared && <Share2 className="h-4 w-4 text-pink-400" />}
                        {insight.average_rating && (
                          <div className="flex items-center space-x-1">
                            <Award className="h-4 w-4 text-yellow-400" />
                            <span className="text-sm text-yellow-400">{insight.average_rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-[#9CA3AF] mb-3">
                      <span className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{insight.bible_version}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(insight.created_at)}</span>
                      </span>
                      {insight.response_count && (
                        <span className="flex items-center space-x-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{insight.response_count} responses</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[#E0E0E0] leading-relaxed">
                      {insight.explanation}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => toggleInsightExpansion(insight.id)}
                    className="p-2 text-[#9CA3AF] hover:text-[#E0E0E0] hover:bg-[#3A404B] rounded-lg transition-colors ml-4"
                  >
                    {expandedInsights.has(insight.id) ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Tags and Themes */}
                {(insight.tags.length > 0 || insight.key_themes.length > 0) && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {insight.key_themes.map((theme, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full text-sm font-medium shadow-sm"
                      >
                        <Sparkles className="h-3 w-3 inline mr-1" />
                        {theme}
                      </span>
                    ))}
                    {insight.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[#3A404B] text-[#E0E0E0] rounded-full text-sm border border-[#4A505B]"
                      >
                        <Tag className="h-3 w-3 inline mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleInteraction(insight.id, insight.is_favorite ? 'unfavorite' : 'favorite')}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                        insight.is_favorite 
                          ? 'bg-yellow-600 text-white' 
                          : 'bg-[#3A404B] text-[#9CA3AF] hover:bg-yellow-600 hover:text-white'
                      }`}
                    >
                      <Star className="h-4 w-4" />
                      <span className="text-sm">{insight.is_favorite ? 'Favorited' : 'Favorite'}</span>
                    </button>
                    
                    <button
                      onClick={() => handleInteraction(insight.id, 'share')}
                      className="flex items-center space-x-1 px-3 py-2 bg-[#3A404B] text-[#9CA3AF] hover:bg-pink-600 hover:text-white rounded-lg transition-colors"
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="text-sm">Share</span>
                    </button>
                    
                    <button
                      onClick={() => setShowResponseForm(showResponseForm === insight.id ? null : insight.id)}
                      className="flex items-center space-x-1 px-3 py-2 bg-[#3A404B] text-[#9CA3AF] hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-sm">Respond</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowFeedbackForm(showFeedbackForm === insight.id ? null : insight.id)}
                      className="flex items-center space-x-1 px-3 py-2 bg-[#3A404B] text-[#9CA3AF] hover:bg-green-600 hover:text-white rounded-lg transition-colors"
                    >
                      <Award className="h-4 w-4" />
                      <span className="text-sm">Rate</span>
                    </button>
                  </div>
                </div>

                {/* Response Form */}
                {showResponseForm === insight.id && (
                  <div className="mb-4 p-4 bg-[#1A1D24] rounded-lg border border-[#3A404B]">
                    <h4 className="text-lg font-medium text-[#E0E0E0] mb-3">Add Your Response</h4>
                    <div className="space-y-3">
                      <select
                        value={newResponse.type}
                        onChange={(e) => setNewResponse(prev => ({ ...prev, type: e.target.value as InsightResponse['response_type'] }))}
                        className="w-full px-3 py-2 bg-[#2C303A] border border-[#3A404B] rounded-lg text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        placeholder="Share your thoughts..."
                        rows={3}
                        className="w-full px-3 py-2 bg-[#2C303A] border border-[#3A404B] rounded-lg text-[#E0E0E0] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={newResponse.is_helpful === true}
                              onChange={(e) => setNewResponse(prev => ({ ...prev, is_helpful: e.target.checked ? true : null }))}
                              className="rounded border-[#3A404B] bg-[#2C303A] text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-[#E0E0E0]">Helpful</span>
                          </label>
                          
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-[#9CA3AF]">Rating:</span>
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setNewResponse(prev => ({ ...prev, rating: star }))}
                                  className={`text-lg ${newResponse.rating && star <= newResponse.rating ? 'text-yellow-400' : 'text-[#9CA3AF]'}`}
                                >
                                  ⭐
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => submitResponse(insight.id)}
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
                {showFeedbackForm === insight.id && (
                  <div className="mb-4 p-4 bg-[#1A1D24] rounded-lg border border-[#3A404B]">
                    <h4 className="text-lg font-medium text-[#E0E0E0] mb-3">Rate This Insight</h4>
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
                            <span className="text-sm text-[#E0E0E0]">{label}</span>
                          </div>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setNewFeedback(prev => ({ ...prev, [key]: star }))}
                                className={`text-lg ${newFeedback[key as keyof typeof newFeedback] && star <= (newFeedback[key as keyof typeof newFeedback] as number) ? 'text-yellow-400' : 'text-[#9CA3AF]'}`}
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
                        className="w-full px-3 py-2 bg-[#2C303A] border border-[#3A404B] rounded-lg text-[#E0E0E0] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                      
                      <textarea
                        value={newFeedback.suggestions}
                        onChange={(e) => setNewFeedback(prev => ({ ...prev, suggestions: e.target.value }))}
                        placeholder="Suggestions for improvement (optional)"
                        rows={2}
                        className="w-full px-3 py-2 bg-[#2C303A] border border-[#3A404B] rounded-lg text-[#E0E0E0] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                      
                      <button
                        onClick={() => submitFeedback(insight.id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        <Award className="h-4 w-4" />
                        <span>Submit Rating</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Expanded Content */}
                {expandedInsights.has(insight.id) && (
                  <div className="mt-6 pt-6 border-t border-[#3A404B] space-y-6">
                    {insight.historical_context && (
                      <div className="bg-[#1A1D24] rounded-lg p-4 border border-[#3A404B]">
                        <h4 className="text-lg font-medium text-[#E0E0E0] mb-3 flex items-center">
                          <Calendar className="h-5 w-5 text-orange-400 mr-2" />
                          Historical Context
                        </h4>
                        <p className="text-[#9CA3AF] leading-relaxed">{insight.historical_context}</p>
                      </div>
                    )}
                    
                    {insight.theological_meaning && (
                      <div className="bg-[#1A1D24] rounded-lg p-4 border border-[#3A404B]">
                        <h4 className="text-lg font-medium text-[#E0E0E0] mb-3 flex items-center">
                          <Cross className="h-5 w-5 text-red-400 mr-2" />
                          Theological Meaning
                        </h4>
                        <p className="text-[#9CA3AF] leading-relaxed">{insight.theological_meaning}</p>
                      </div>
                    )}
                    
                    {insight.practical_application && (
                      <div className="bg-[#1A1D24] rounded-lg p-4 border border-[#3A404B]">
                        <h4 className="text-lg font-medium text-[#E0E0E0] mb-3 flex items-center">
                          <Lightbulb className="h-5 w-5 text-yellow-400 mr-2" />
                          Practical Application
                        </h4>
                        <p className="text-[#9CA3AF] leading-relaxed">{insight.practical_application}</p>
                      </div>
                    )}
                    
                    {insight.prayer_points.length > 0 && (
                      <div className="bg-[#1A1D24] rounded-lg p-4 border border-[#3A404B]">
                        <h4 className="text-lg font-medium text-[#E0E0E0] mb-3 flex items-center">
                          <Heart className="h-5 w-5 text-pink-400 mr-2" />
                          Prayer Points
                        </h4>
                        <ul className="space-y-2">
                          {insight.prayer_points.map((point, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-pink-400 font-medium text-sm mt-1">{index + 1}.</span>
                              <span className="text-[#9CA3AF]">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {onInsightSelect && (
                      <button
                        onClick={() => onInsightSelect(insight)}
                        className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        <Eye className="h-5 w-5" />
                        <span>View Full Insight</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'analytics' && statistics && (
        <div className="space-y-6">
          {/* Chart Placeholder */}
          <div className="bg-[#2C303A] rounded-lg p-4">
            <h3 className="text-lg font-medium text-[#E0E0E0] mb-4">Insights Over Time</h3>
            <div className="h-64 flex items-center justify-center text-[#9CA3AF]">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                <p>Chart visualization would go here</p>
                <p className="text-sm">Data available: {statistics.chart_data.length} data points</p>
              </div>
            </div>
          </div>

          {/* Version Usage */}
          <div className="bg-[#2C303A] rounded-lg p-4">
            <h3 className="text-lg font-medium text-[#E0E0E0] mb-4">Bible Version Usage</h3>
            <div className="space-y-2">
              {statistics.version_usage.map((version, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-[#E0E0E0]">{version.version}</span>
                  <span className="text-sm text-[#9CA3AF]">{version.count} insights</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'favorites' && (
        <div className="space-y-4">
          {insights.filter(insight => insight.is_favorite).length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-[#9CA3AF] mx-auto mb-4" />
              <p className="text-[#9CA3AF]">No favorite insights yet</p>
              <p className="text-sm text-[#9CA3AF] mt-2">Star insights to add them to your favorites</p>
            </div>
          ) : (
            insights.filter(insight => insight.is_favorite).map((insight) => (
              <div key={insight.id} className="bg-[#2C303A] rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-[#E0E0E0] mb-1">
                      {insight.passage_reference}
                    </h3>
                    <p className="text-sm text-[#9CA3AF] mb-2">
                      {insight.bible_version} • {formatDate(insight.created_at)}
                    </p>
                    <p className="text-[#E0E0E0] line-clamp-2">
                      {insight.explanation}
                    </p>
                  </div>
                  <Star className="h-5 w-5 text-yellow-400 ml-4" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'shared' && (
        <div className="space-y-4">
          {insights.filter(insight => insight.is_shared).length === 0 ? (
            <div className="text-center py-12">
              <Share2 className="h-12 w-12 text-[#9CA3AF] mx-auto mb-4" />
              <p className="text-[#9CA3AF]">No shared insights yet</p>
              <p className="text-sm text-[#9CA3AF] mt-2">Share insights to make them visible to others</p>
            </div>
          ) : (
            insights.filter(insight => insight.is_shared).map((insight) => (
              <div key={insight.id} className="bg-[#2C303A] rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-[#E0E0E0] mb-1">
                      {insight.passage_reference}
                    </h3>
                    <p className="text-sm text-[#9CA3AF] mb-2">
                      {insight.bible_version} • {formatDate(insight.created_at)}
                    </p>
                    <p className="text-[#E0E0E0] line-clamp-2">
                      {insight.explanation}
                    </p>
                  </div>
                  <Share2 className="h-5 w-5 text-pink-400 ml-4" />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
