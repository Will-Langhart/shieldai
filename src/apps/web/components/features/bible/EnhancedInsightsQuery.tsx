import React, { useState, useEffect } from 'react'
import { 
  Brain, 
  Search, 
  Filter, 
  SortAsc, 
  Grid3X3, 
  List, 
  Star, 
  Bookmark, 
  Share2, 
  Download, 
  Eye, 
  MessageCircle, 
  Heart, 
  Calendar, 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  X, 
  Copy, 
  RefreshCw, 
  TrendingUp, 
  Award, 
  Target, 
  Zap, 
  Lightbulb, 
  Cross, 
  Clock, 
  BookOpen,
  Shield,
  Sparkles,
  BarChart3,
  Users,
  ThumbsUp,
  Image,
  PenTool,
  AlertTriangle
} from 'lucide-react'
import { InsightDetailView } from './InsightDetailView'
import { InsightsAnalytics } from './InsightsAnalytics'

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

interface SearchFilters {
  query: string
  bible_version: string
  tags: string[]
  themes: string[]
  date_from: string
  date_to: string
  is_favorite: boolean | null
  is_shared: boolean | null
  sort_by: 'created_at' | 'passage_reference' | 'rating' | 'engagement' | 'relevance'
  sort_order: 'asc' | 'desc'
  view_mode: 'grid' | 'list'
}

interface EnhancedInsightsQueryProps {
  userId?: string
  onInsightSelect?: (insight: Insight) => void
  refreshTrigger?: number // Add this to trigger refresh when it changes
}

export function EnhancedInsightsQuery({ userId, onInsightSelect, refreshTrigger }: EnhancedInsightsQueryProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [filteredInsights, setFilteredInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set())
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null)
  const [showDetailView, setShowDetailView] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  
  // Search and filter states
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    bible_version: '',
    tags: [],
    themes: [],
    date_from: '',
    date_to: '',
    is_favorite: null,
    is_shared: null,
    sort_by: 'created_at',
    sort_order: 'desc',
    view_mode: 'grid'
  })
  
  const [showFilters, setShowFilters] = useState(false)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [availableFilters, setAvailableFilters] = useState<{
    tags: string[]
    themes: string[]
    versions: string[]
  }>({
    tags: [],
    themes: [],
    versions: []
  })

  // Load insights
  useEffect(() => {
    loadInsights()
  }, [])

  // Refresh insights when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      loadInsights()
    }
  }, [refreshTrigger])

  // Filter insights when filters change
  useEffect(() => {
    filterInsights()
  }, [insights, filters])

  const getAuthToken = async (): Promise<string> => {
    try {
      const { data: { session } } = await import('../../../lib/supabase').then(m => m.supabase.auth.getSession())
      return session?.access_token || 'test-token'
    } catch (error) {
      return 'test-token'
    }
  }

  const loadInsights = async () => {
    setLoading(true)
    setError(null)

    try {
      const authToken = await getAuthToken()
      const response = await fetch('/api/ai-insights/history?limit=1000&offset=0', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load insights')
      }

      const data = await response.json()
      setInsights(data.insights || [])
      setAvailableFilters(data.filters || { tags: [], themes: [], versions: [] })
    } catch (error) {
      console.error('Error loading insights:', error)
      setError(error instanceof Error ? error.message : 'Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  const filterInsights = () => {
    let filtered = [...insights]

    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase()
      filtered = filtered.filter(insight => 
        insight.passage_reference.toLowerCase().includes(query) ||
        insight.explanation.toLowerCase().includes(query) ||
        insight.passage_text.toLowerCase().includes(query) ||
        insight.key_themes.some(theme => theme.toLowerCase().includes(query)) ||
        insight.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Bible version filter
    if (filters.bible_version) {
      filtered = filtered.filter(insight => insight.bible_version === filters.bible_version)
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(insight => 
        filters.tags.every(tag => insight.tags.includes(tag))
      )
    }

    // Themes filter
    if (filters.themes.length > 0) {
      filtered = filtered.filter(insight => 
        filters.themes.every(theme => insight.key_themes.includes(theme))
      )
    }

    // Date filters
    if (filters.date_from) {
      filtered = filtered.filter(insight => 
        new Date(insight.created_at) >= new Date(filters.date_from)
      )
    }
    if (filters.date_to) {
      filtered = filtered.filter(insight => 
        new Date(insight.created_at) <= new Date(filters.date_to)
      )
    }

    // Boolean filters
    if (filters.is_favorite !== null) {
      filtered = filtered.filter(insight => insight.is_favorite === filters.is_favorite)
    }
    if (filters.is_shared !== null) {
      filtered = filtered.filter(insight => insight.is_shared === filters.is_shared)
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (filters.sort_by) {
        case 'passage_reference':
          aValue = a.passage_reference
          bValue = b.passage_reference
          break
        case 'rating':
          aValue = a.average_rating || 0
          bValue = b.average_rating || 0
          break
        case 'engagement':
          aValue = a.engagement_score || 0
          bValue = b.engagement_score || 0
          break
        case 'relevance':
          // For relevance, we could implement a more sophisticated scoring
          aValue = a.response_count || 0
          bValue = b.response_count || 0
          break
        default:
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
      }

      if (aValue < bValue) return filters.sort_order === 'asc' ? -1 : 1
      if (aValue > bValue) return filters.sort_order === 'asc' ? 1 : -1
      return 0
    })

    setFilteredInsights(filtered)
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

  const handleInsightSelect = (insight: Insight) => {
    setSelectedInsight(insight)
    setShowDetailView(true)
    if (onInsightSelect) {
      onInsightSelect(insight)
    }
  }

  const handleToggleFavorite = async (insightId: string) => {
    try {
      const authToken = await getAuthToken()
      const insight = insights.find(i => i.id === insightId)
      if (!insight) return

      const response = await fetch(`/api/ai-insights/${insightId}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_favorite: !insight.is_favorite
        })
      })

      if (response.ok) {
        // Update local state
        setInsights(prev => prev.map(i => 
          i.id === insightId ? { ...i, is_favorite: !i.is_favorite } : i
        ))
        if (selectedInsight?.id === insightId) {
          setSelectedInsight(prev => prev ? { ...prev, is_favorite: !prev.is_favorite } : null)
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const handleToggleShare = async (insightId: string) => {
    try {
      const authToken = await getAuthToken()
      const insight = insights.find(i => i.id === insightId)
      if (!insight) return

      const response = await fetch(`/api/ai-insights/${insightId}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_shared: !insight.is_shared
        })
      })

      if (response.ok) {
        // Update local state
        setInsights(prev => prev.map(i => 
          i.id === insightId ? { ...i, is_shared: !i.is_shared } : i
        ))
        if (selectedInsight?.id === insightId) {
          setSelectedInsight(prev => prev ? { ...prev, is_shared: !prev.is_shared } : null)
        }
      }
    } catch (error) {
      console.error('Error toggling share:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const exportInsights = () => {
    const exportData = {
      exported_at: new Date().toISOString(),
      total_insights: filteredInsights.length,
      filters_applied: filters,
      insights: filteredInsights.map(insight => ({
        id: insight.id,
        passage_reference: insight.passage_reference,
        passage_text: insight.passage_text,
        bible_version: insight.bible_version,
        explanation: insight.explanation,
        key_themes: insight.key_themes,
        cross_references: insight.cross_references,
        study_questions: insight.study_questions,
        historical_context: insight.historical_context,
        theological_meaning: insight.theological_meaning,
        practical_application: insight.practical_application,
        prayer_points: insight.prayer_points,
        tags: insight.tags,
        notes: insight.notes,
        is_favorite: insight.is_favorite,
        is_shared: insight.is_shared,
        created_at: insight.created_at,
        average_rating: insight.average_rating,
        response_count: insight.response_count,
        interaction_count: insight.interaction_count
      }))
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `insights-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportInsightsCSV = () => {
    const headers = [
      'Passage Reference',
      'Bible Version',
      'Explanation',
      'Key Themes',
      'Tags',
      'Created Date',
      'Is Favorite',
      'Is Shared',
      'Average Rating',
      'Response Count',
      'Interaction Count'
    ]

    const csvContent = [
      headers.join(','),
      ...filteredInsights.map(insight => [
        `"${insight.passage_reference}"`,
        `"${insight.bible_version}"`,
        `"${insight.explanation.replace(/"/g, '""')}"`,
        `"${insight.key_themes.join('; ')}"`,
        `"${insight.tags.join('; ')}"`,
        `"${insight.created_at}"`,
        insight.is_favorite ? 'Yes' : 'No',
        insight.is_shared ? 'Yes' : 'No',
        insight.average_rating || '',
        insight.response_count || 0,
        insight.interaction_count || 0
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `insights-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="h-6 w-6 text-blue-600 animate-pulse" />
          </div>
        </div>
        <div className="text-blue-400 mb-2 font-medium">Loading insights...</div>
        <div className="text-sm text-[#9CA3AF]">Fetching your saved AI insights</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <div className="text-red-400 mb-2">Failed to load insights</div>
        <div className="text-sm text-[#9CA3AF] mb-4">{error}</div>
        <button 
          onClick={loadInsights}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Try again</span>
        </button>
      </div>
    )
  }

  // Show analytics view
  if (showAnalytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#E0E0E0]">Analytics Dashboard</h1>
            <p className="text-[#9CA3AF]">Insights into your Bible study journey</p>
          </div>
          <button
            onClick={() => setShowAnalytics(false)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#2C303A] hover:bg-[#3A404B] text-[#E0E0E0] rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Back to Insights</span>
          </button>
        </div>
        <InsightsAnalytics insights={insights} userId={userId} />
      </div>
    )
  }

  // Show detail view if an insight is selected
  if (showDetailView && selectedInsight) {
    return (
      <InsightDetailView
        insight={selectedInsight}
        onClose={() => {
          setShowDetailView(false)
          setSelectedInsight(null)
        }}
        onToggleFavorite={handleToggleFavorite}
        onToggleShare={handleToggleShare}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Shield AI Apologetics Insights</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadInsights}
              className="flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowAnalytics(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </button>
          </div>
        </div>
        <p className="text-blue-100">
          Explore your saved insights • Search by content • Filter by themes • Build understanding
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-[#1A1D24] border border-[#2C303A] rounded-lg p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search insights by passage, theme, or content..."
              value={filters.query}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 bg-[#2C303A] border border-[#3A404B] rounded-lg text-[#E0E0E0] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter and Sort Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                showFilters 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-[#2C303A] text-[#9CA3AF] hover:text-[#E0E0E0]'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>

            <select
              value={`${filters.sort_by}-${filters.sort_order}`}
              onChange={(e) => {
                const [sort_by, sort_order] = e.target.value.split('-')
                setFilters(prev => ({ ...prev, sort_by: sort_by as any, sort_order: sort_order as any }))
              }}
              className="px-3 py-2 bg-[#2C303A] border border-[#3A404B] rounded-lg text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="passage_reference-asc">Passage A-Z</option>
              <option value="passage_reference-desc">Passage Z-A</option>
              <option value="rating-desc">Highest Rated</option>
              <option value="engagement-desc">Most Engaged</option>
            </select>

            <button
              onClick={() => setFilters(prev => ({ 
                ...prev, 
                view_mode: prev.view_mode === 'grid' ? 'list' : 'grid' 
              }))}
              className="flex items-center space-x-2 px-3 py-2 bg-[#2C303A] text-[#9CA3AF] hover:text-[#E0E0E0] rounded-lg transition-colors"
            >
              {filters.view_mode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-[#3A404B]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Bible Version */}
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">Bible Version</label>
                <select
                  value={filters.bible_version}
                  onChange={(e) => setFilters(prev => ({ ...prev, bible_version: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#2C303A] border border-[#3A404B] rounded-lg text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Versions</option>
                  {availableFilters.versions.map(version => (
                    <option key={version} value={version}>{version}</option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#2C303A] border border-[#3A404B] rounded-lg text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#2C303A] border border-[#3A404B] rounded-lg text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Boolean Filters */}
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">Status</label>
                <select
                  value={filters.is_favorite === null ? '' : filters.is_favorite.toString()}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    is_favorite: e.target.value === '' ? null : e.target.value === 'true' 
                  }))}
                  className="w-full px-3 py-2 bg-[#2C303A] border border-[#3A404B] rounded-lg text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="true">Favorites Only</option>
                  <option value="false">Non-Favorites</option>
                </select>
              </div>
            </div>

            {/* Tag and Theme Filters */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {availableFilters.tags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        const newTags = filters.tags.includes(tag)
                          ? filters.tags.filter(t => t !== tag)
                          : [...filters.tags, tag]
                        setFilters(prev => ({ ...prev, tags: newTags }))
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        filters.tags.includes(tag)
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#2C303A] text-[#9CA3AF] hover:text-[#E0E0E0]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#9CA3AF] mb-2">Key Themes</label>
                <div className="flex flex-wrap gap-2">
                  {availableFilters.themes.map(theme => (
                    <button
                      key={theme}
                      onClick={() => {
                        const newThemes = filters.themes.includes(theme)
                          ? filters.themes.filter(t => t !== theme)
                          : [...filters.themes, theme]
                        setFilters(prev => ({ ...prev, themes: newThemes }))
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        filters.themes.includes(theme)
                          ? 'bg-purple-600 text-white'
                          : 'bg-[#2C303A] text-[#9CA3AF] hover:text-[#E0E0E0]'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-[#9CA3AF]">
          Showing {filteredInsights.length} of {insights.length} insights
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-4 text-sm text-[#9CA3AF]">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400" />
              <span>{insights.filter(i => i.is_favorite).length} favorites</span>
            </div>
            <div className="flex items-center space-x-1">
              <Share2 className="h-4 w-4 text-blue-400" />
              <span>{insights.filter(i => i.is_shared).length} shared</span>
            </div>
          </div>
          
          {filteredInsights.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={exportInsights}
                className="flex items-center space-x-1 px-3 py-1 bg-[#2C303A] hover:bg-[#3A404B] text-[#E0E0E0] rounded text-sm transition-colors"
              >
                <Download className="h-3 w-3" />
                <span>JSON</span>
              </button>
              <button
                onClick={exportInsightsCSV}
                className="flex items-center space-x-1 px-3 py-1 bg-[#2C303A] hover:bg-[#3A404B] text-[#E0E0E0] rounded text-sm transition-colors"
              >
                <Download className="h-3 w-3" />
                <span>CSV</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Insights Grid/List */}
      {filteredInsights.length === 0 ? (
        <div className="text-center py-12">
          <Brain className="h-12 w-12 text-[#9CA3AF] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#E0E0E0] mb-2">No insights found</h3>
          <p className="text-[#9CA3AF] mb-4">
            {filters.query || filters.bible_version || filters.tags.length > 0 || filters.themes.length > 0
              ? 'Try adjusting your search criteria'
              : 'Generate some AI insights to get started'
            }
          </p>
          {filters.query || filters.bible_version || filters.tags.length > 0 || filters.themes.length > 0 ? (
            <button
              onClick={() => setFilters({
                query: '',
                bible_version: '',
                tags: [],
                themes: [],
                date_from: '',
                date_to: '',
                is_favorite: null,
                is_shared: null,
                sort_by: 'created_at',
                sort_order: 'desc',
                view_mode: 'grid'
              })}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          ) : null}
        </div>
      ) : (
        <div className={filters.view_mode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }>
          {filteredInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              isExpanded={expandedInsights.has(insight.id)}
              onToggleExpansion={() => toggleInsightExpansion(insight.id)}
              onSelect={() => handleInsightSelect(insight)}
              viewMode={filters.view_mode}
              onCopy={copyToClipboard}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface InsightCardProps {
  insight: Insight
  isExpanded: boolean
  onToggleExpansion: () => void
  onSelect: () => void
  viewMode: 'grid' | 'list'
  onCopy: (text: string) => void
}

function InsightCard({ insight, isExpanded, onToggleExpansion, onSelect, viewMode, onCopy }: InsightCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRatingStars = (rating?: number) => {
    if (!rating) return null
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < Math.round(rating) ? 'text-yellow-400 fill-current' : 'text-gray-400'
        }`}
      />
    ))
  }

  return (
    <div className={`bg-[#1A1D24] border border-[#2C303A] rounded-lg overflow-hidden transition-all duration-200 hover:border-[#3A404B] ${
      viewMode === 'list' ? 'flex' : ''
    }`}>
      <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
        {/* Header */}
        <div className="p-4 border-b border-[#2C303A]">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[#E0E0E0] mb-1">
                {insight.passage_reference}
              </h3>
              <p className="text-sm text-[#9CA3AF] mb-2 line-clamp-2">
                {insight.passage_text.substring(0, 100)}...
              </p>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              {insight.is_favorite && <Star className="h-4 w-4 text-yellow-400 fill-current" />}
              {insight.is_shared && <Share2 className="h-4 w-4 text-blue-400" />}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
            <div className="flex items-center space-x-4">
              <span>{insight.bible_version}</span>
              <span>{formatDate(insight.created_at)}</span>
              {insight.average_rating && (
                <div className="flex items-center space-x-1">
                  {getRatingStars(insight.average_rating)}
                  <span>({insight.average_rating.toFixed(1)})</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {insight.response_count && insight.response_count > 0 && (
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-3 w-3" />
                  <span>{insight.response_count}</span>
                </div>
              )}
              <button
                onClick={onToggleExpansion}
                className="text-[#9CA3AF] hover:text-[#E0E0E0] transition-colors"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Tags and Themes */}
          {(insight.tags.length > 0 || insight.key_themes.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {insight.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs">
                  {tag}
                </span>
              ))}
              {insight.key_themes.slice(0, 2).map((theme, index) => (
                <span key={index} className="px-2 py-1 bg-purple-600 text-white rounded-full text-xs">
                  {theme}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-4 space-y-4">
            {/* Shield AI Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-3 text-white">
              <div className="flex items-center space-x-2 mb-1">
                <Shield className="h-5 w-5" />
                <h4 className="font-semibold">Shield AI Apologetics Insights</h4>
              </div>
              <p className="text-blue-100 text-sm">
                Defending faith through Scripture • Building understanding • Strengthening belief
              </p>
            </div>

            {/* Interaction Bar */}
            <div className="bg-[#2C303A] rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button className="flex items-center space-x-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors">
                    <ThumbsUp className="h-3 w-3" />
                    <span>Helpful</span>
                  </button>
                  
                  <button className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors">
                    <MessageCircle className="h-3 w-3" />
                    <span>Respond</span>
                  </button>
                  
                  <button className="flex items-center space-x-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors">
                    <Award className="h-3 w-3" />
                    <span>Rate</span>
                  </button>
                  
                  <button className="flex items-center space-x-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm transition-colors">
                    <Image className="h-3 w-3" />
                    <span>Generate Image</span>
                  </button>
                </div>
                
                <div className="flex items-center space-x-1 text-xs text-[#9CA3AF]">
                  <span>{insight.response_count || 0} responses • {insight.interaction_count || 0} interactions</span>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="border border-[#2C303A] rounded-lg">
              <button
                onClick={onToggleExpansion}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-[#2C303A] transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-blue-400" />
                  <span className="font-medium text-[#E0E0E0]">Explanation</span>
                </div>
                <ChevronUp className="h-4 w-4 text-[#9CA3AF]" />
              </button>
              <div className="p-3 border-t border-[#2C303A]">
                <p className="text-[#E0E0E0] text-sm leading-relaxed mb-2">{insight.explanation}</p>
                <button
                  onClick={() => onCopy(insight.explanation)}
                  className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors text-xs"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Key Themes */}
            {insight.key_themes.length > 0 && (
              <div className="border border-[#2C303A] rounded-lg">
                <div className="p-3 border-b border-[#2C303A]">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="h-4 w-4 text-yellow-400" />
                    <span className="font-medium text-[#E0E0E0]">Key Themes</span>
                    <span className="text-sm text-[#9CA3AF]">({insight.key_themes.length})</span>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {insight.key_themes.map((theme, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs">
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              {insight.cross_references.length > 0 && (
                <div className="bg-[#2C303A] rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Cross className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium text-[#E0E0E0]">Cross References</span>
                  </div>
                  <span className="text-xs text-[#9CA3AF]">{insight.cross_references.length} references</span>
                </div>
              )}
              
              {insight.study_questions.length > 0 && (
                <div className="bg-[#2C303A] rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <MessageCircle className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium text-[#E0E0E0]">Study Questions</span>
                  </div>
                  <span className="text-xs text-[#9CA3AF]">{insight.study_questions.length} questions</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#2C303A]">
              <div className="flex items-center space-x-2">
                <button
                  onClick={onSelect}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                >
                  View Full Insight
                </button>
                <button
                  onClick={() => onCopy(insight.explanation)}
                  className="px-3 py-1 bg-[#2C303A] hover:bg-[#3A404B] text-[#E0E0E0] rounded text-sm transition-colors"
                >
                  Copy
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-1 text-[#9CA3AF] hover:text-[#E0E0E0] transition-colors">
                  <Share2 className="h-4 w-4" />
                </button>
                <button className="p-1 text-[#9CA3AF] hover:text-[#E0E0E0] transition-colors">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
