import { NextApiRequest, NextApiResponse } from 'next'
import { InsightsPineconeService } from '../../../lib/insights-pinecone'
import { withCorrelationId } from '../../../lib/logger'
import { logger } from '../../../lib/logger'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `search_insights_${Date.now()}`)

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { query, user_id, filters = {}, options = {} } = req.body

    if (!query || !user_id) {
      return res.status(400).json({ error: 'Query and user_id are required' })
    }

    logger.info('Searching insights', { cid, query, user_id, filters })

    // Perform semantic search using Pinecone
    const searchResults = await InsightsPineconeService.searchSimilarInsights(
      query,
      user_id,
      {
        includeShared: options.includeShared || false,
        topK: options.topK || 20,
        minScore: options.minScore || 0.7,
        filters: {
          key_themes: filters.key_themes || [],
          bible_version: filters.bible_version || '',
          theological_depth: filters.theological_depth || '',
          practical_relevance: filters.practical_relevance || '',
          is_favorite: filters.is_favorite,
          tags: filters.tags || []
        }
      }
    )

    logger.info('Search completed', { 
      cid, 
      resultCount: searchResults.length,
      user_id 
    })

    // Get detailed insight data from database for the search results
    const insightIds = searchResults.map(result => result.metadata.insight_id)
    
    if (insightIds.length === 0) {
      return res.status(200).json({
        success: true,
        insights: [],
        searchResults: [],
        totalCount: 0
      })
    }

    const { data: insights, error: dbError } = await supabase
      .from('ai_insights')
      .select('*')
      .in('id', insightIds)
      .eq('user_id', user_id)

    if (dbError) {
      logger.error('Database error fetching insights', { cid, error: dbError })
      throw new Error('Failed to fetch insights from database')
    }

    // Combine search results with database insights and maintain relevance order
    const insightsWithRelevance = searchResults.map(searchResult => {
      const insight = insights?.find(i => i.id === searchResult.metadata.insight_id)
      return {
        ...insight,
        relevance_score: searchResult.score,
        search_metadata: searchResult.metadata
      }
    }).filter(Boolean)

    // Apply additional filters if needed
    let filteredInsights = insightsWithRelevance

    if (filters.date_from) {
      filteredInsights = filteredInsights.filter(insight => 
        new Date(insight.created_at) >= new Date(filters.date_from)
      )
    }

    if (filters.date_to) {
      filteredInsights = filteredInsights.filter(insight => 
        new Date(insight.created_at) <= new Date(filters.date_to)
      )
    }

    if (filters.is_shared !== null && filters.is_shared !== undefined) {
      filteredInsights = filteredInsights.filter(insight => 
        insight.is_shared === filters.is_shared
      )
    }

    // Sort by relevance score (highest first)
    filteredInsights.sort((a, b) => b.relevance_score - a.relevance_score)

    logger.info('Search results processed', { 
      cid, 
      originalCount: insightsWithRelevance.length,
      filteredCount: filteredInsights.length,
      user_id 
    })

    res.status(200).json({
      success: true,
      insights: filteredInsights,
      searchResults: searchResults,
      totalCount: filteredInsights.length,
      query: query,
      filters: filters
    })

  } catch (error) {
    logger.error('Error searching insights', { cid }, error)
    res.status(500).json({ error: 'Internal server error' })
  }
}