import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Calendar, 
  BookOpen, 
  Star, 
  Share2, 
  Tag, 
  Heart, 
  MessageCircle, 
  Target, 
  Award, 
  Users, 
  Clock,
  Brain,
  Activity,
  Zap,
  Eye,
  Download,
  RefreshCw,
  AlertTriangle
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

interface AnalyticsData {
  total_insights: number
  total_favorites: number
  total_shared: number
  total_responses: number
  total_interactions: number
  average_rating: number
  insights_by_month: Array<{
    month: string
    count: number
  }>
  insights_by_version: Array<{
    version: string
    count: number
  }>
  top_themes: Array<{
    theme: string
    count: number
  }>
  top_tags: Array<{
    tag: string
    count: number
  }>
  engagement_metrics: {
    total_views: number
    total_likes: number
    total_shares: number
    total_downloads: number
  }
  recent_activity: Array<{
    type: string
    description: string
    timestamp: string
  }>
}

interface InsightsAnalyticsProps {
  insights: Insight[]
  userId?: string
}

export function InsightsAnalytics({ insights, userId }: InsightsAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d')

  useEffect(() => {
    calculateAnalytics()
  }, [insights, timeRange])

  const calculateAnalytics = () => {
    setLoading(true)
    setError(null)

    try {
      const now = new Date()
      const timeRangeDate = new Date()
      
      switch (timeRange) {
        case '7d':
          timeRangeDate.setDate(now.getDate() - 7)
          break
        case '30d':
          timeRangeDate.setDate(now.getDate() - 30)
          break
        case '90d':
          timeRangeDate.setDate(now.getDate() - 90)
          break
        case '1y':
          timeRangeDate.setFullYear(now.getFullYear() - 1)
          break
        case 'all':
          timeRangeDate.setFullYear(2000) // Very old date to include all
          break
      }

      const filteredInsights = insights.filter(insight => 
        new Date(insight.created_at) >= timeRangeDate
      )

      // Calculate basic metrics
      const total_insights = filteredInsights.length
      const total_favorites = filteredInsights.filter(i => i.is_favorite).length
      const total_shared = filteredInsights.filter(i => i.is_shared).length
      const total_responses = filteredInsights.reduce((sum, i) => sum + (i.response_count || 0), 0)
      const total_interactions = filteredInsights.reduce((sum, i) => sum + (i.interaction_count || 0), 0)
      
      const ratings = filteredInsights.filter(i => i.average_rating).map(i => i.average_rating!)
      const average_rating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0

      // Insights by month
      const monthCounts: { [key: string]: number } = {}
      filteredInsights.forEach(insight => {
        const date = new Date(insight.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1
      })

      const insights_by_month = Object.entries(monthCounts)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month))

      // Insights by version
      const versionCounts: { [key: string]: number } = {}
      filteredInsights.forEach(insight => {
        versionCounts[insight.bible_version] = (versionCounts[insight.bible_version] || 0) + 1
      })

      const insights_by_version = Object.entries(versionCounts)
        .map(([version, count]) => ({ version, count }))
        .sort((a, b) => b.count - a.count)

      // Top themes
      const themeCounts: { [key: string]: number } = {}
      filteredInsights.forEach(insight => {
        insight.key_themes.forEach(theme => {
          themeCounts[theme] = (themeCounts[theme] || 0) + 1
        })
      })

      const top_themes = Object.entries(themeCounts)
        .map(([theme, count]) => ({ theme, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Top tags
      const tagCounts: { [key: string]: number } = {}
      filteredInsights.forEach(insight => {
        insight.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      })

      const top_tags = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Engagement metrics (mock data for now)
      const engagement_metrics = {
        total_views: total_interactions * 2.5, // Estimate
        total_likes: Math.floor(total_interactions * 0.6),
        total_shares: total_shared,
        total_downloads: Math.floor(total_interactions * 0.1)
      }

      // Recent activity (mock data for now)
      const recent_activity = filteredInsights
        .slice(-10)
        .map(insight => ({
          type: 'insight_created',
          description: `Created insight for ${insight.passage_reference}`,
          timestamp: insight.created_at
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setAnalyticsData({
        total_insights,
        total_favorites,
        total_shared,
        total_responses,
        total_interactions,
        average_rating,
        insights_by_month,
        insights_by_version,
        top_themes,
        top_tags,
        engagement_metrics,
        recent_activity
      })
    } catch (error) {
      console.error('Error calculating analytics:', error)
      setError(error instanceof Error ? error.message : 'Failed to calculate analytics')
    } finally {
      setLoading(false)
    }
  }

  const exportAnalytics = () => {
    if (!analyticsData) return

    const exportData = {
      generated_at: new Date().toISOString(),
      time_range: timeRange,
      analytics: analyticsData
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `insights-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`
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
            <BarChart3 className="h-6 w-6 text-blue-600 animate-pulse" />
          </div>
        </div>
        <div className="text-blue-400 mb-2 font-medium">Calculating analytics...</div>
        <div className="text-sm text-[#9CA3AF]">Processing your insights data</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <div className="text-red-400 mb-2">Failed to load analytics</div>
        <div className="text-sm text-[#9CA3AF] mb-4">{error}</div>
        <button 
          onClick={calculateAnalytics}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Try again</span>
        </button>
      </div>
    )
  }

  if (!analyticsData) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#E0E0E0] mb-2">Analytics Dashboard</h2>
          <p className="text-[#9CA3AF]">Insights into your Bible study journey</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 bg-[#2C303A] border border-[#3A404B] rounded-lg text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
            <option value="all">All time</option>
          </select>

          <button
            onClick={exportAnalytics}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1A1D24] border border-[#2C303A] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#9CA3AF] text-sm">Total Insights</p>
              <p className="text-2xl font-bold text-[#E0E0E0]">{analyticsData.total_insights}</p>
            </div>
            <Brain className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-[#1A1D24] border border-[#2C303A] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#9CA3AF] text-sm">Favorites</p>
              <p className="text-2xl font-bold text-[#E0E0E0]">{analyticsData.total_favorites}</p>
            </div>
            <Star className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-[#1A1D24] border border-[#2C303A] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#9CA3AF] text-sm">Shared</p>
              <p className="text-2xl font-bold text-[#E0E0E0]">{analyticsData.total_shared}</p>
            </div>
            <Share2 className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-[#1A1D24] border border-[#2C303A] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#9CA3AF] text-sm">Avg Rating</p>
              <p className="text-2xl font-bold text-[#E0E0E0]">
                {analyticsData.average_rating.toFixed(1)}
              </p>
            </div>
            <Award className="h-8 w-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="bg-[#1A1D24] border border-[#2C303A] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[#E0E0E0] mb-4">Engagement Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <Eye className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#E0E0E0]">{analyticsData.engagement_metrics.total_views}</p>
            <p className="text-sm text-[#9CA3AF]">Views</p>
          </div>
          <div className="text-center">
            <Heart className="h-6 w-6 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#E0E0E0]">{analyticsData.engagement_metrics.total_likes}</p>
            <p className="text-sm text-[#9CA3AF]">Likes</p>
          </div>
          <div className="text-center">
            <Share2 className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#E0E0E0]">{analyticsData.engagement_metrics.total_shares}</p>
            <p className="text-sm text-[#9CA3AF]">Shares</p>
          </div>
          <div className="text-center">
            <Download className="h-6 w-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#E0E0E0]">{analyticsData.engagement_metrics.total_downloads}</p>
            <p className="text-sm text-[#9CA3AF]">Downloads</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insights by Bible Version */}
        <div className="bg-[#1A1D24] border border-[#2C303A] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[#E0E0E0] mb-4 flex items-center">
            <BookOpen className="h-5 w-5 text-blue-400 mr-2" />
            Insights by Bible Version
          </h3>
          <div className="space-y-3">
            {analyticsData.insights_by_version.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-[#E0E0E0]">{item.version}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-[#2C303A] rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(item.count / analyticsData.insights_by_version[0].count) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-[#9CA3AF] w-8 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Themes */}
        <div className="bg-[#1A1D24] border border-[#2C303A] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[#E0E0E0] mb-4 flex items-center">
            <Target className="h-5 w-5 text-purple-400 mr-2" />
            Top Themes
          </h3>
          <div className="space-y-3">
            {analyticsData.top_themes.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-[#E0E0E0] text-sm">{item.theme}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-[#2C303A] rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${(item.count / analyticsData.top_themes[0].count) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-[#9CA3AF] w-6 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Tags */}
        <div className="bg-[#1A1D24] border border-[#2C303A] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[#E0E0E0] mb-4 flex items-center">
            <Tag className="h-5 w-5 text-green-400 mr-2" />
            Popular Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {analyticsData.top_tags.map((item, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-green-600 text-white rounded-full text-sm"
              >
                {item.tag} ({item.count})
              </span>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#1A1D24] border border-[#2C303A] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[#E0E0E0] mb-4 flex items-center">
            <Activity className="h-5 w-5 text-orange-400 mr-2" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {analyticsData.recent_activity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-[#E0E0E0] text-sm">{activity.description}</p>
                  <p className="text-[#9CA3AF] text-xs">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
