// Pure analytics calculation for the InsightsAnalytics panel.

export interface Insight {
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

export type InsightsTimeRange = '7d' | '30d' | '90d' | '1y' | 'all'

export interface AnalyticsData {
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

export function computeInsightsAnalytics(
  insights: Insight[],
  timeRange: InsightsTimeRange,
  now: Date = new Date()
): AnalyticsData {
  const timeRangeDate = new Date(now.getTime())

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

  return {
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
  }
}
