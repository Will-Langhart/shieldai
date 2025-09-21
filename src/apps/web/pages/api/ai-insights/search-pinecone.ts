import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { logger, withCorrelationId } from '../../../lib/logger';
import { InsightsPineconeService } from '../../../lib/insights-pinecone';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `insight_search_pinecone_${Date.now()}`);
  
  if (req.method !== 'POST') {
    logger.warn('Method not allowed', { cid, path: '/api/ai-insights/search-pinecone', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      query,
      top_k = 10,
      min_score = 0.6,
      include_shared = true,
      filters = {}
    } = req.body;

    if (!query) {
      logger.warn('Missing query parameter', { cid });
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // Get user from auth token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid auth header', { cid });
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      logger.warn('Invalid auth token', { cid, error: authError?.message });
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    // Search insights using Pinecone
    const searchResults = await InsightsPineconeService.searchSimilarInsights(
      query,
      user.id,
      {
        includeShared: include_shared,
        topK: top_k,
        minScore: min_score,
        filters: filters
      }
    );

    logger.info('Insight search completed', { 
      cid, 
      user_id: user.id, 
      query: query.substring(0, 100),
      result_count: searchResults.length
    });

    res.status(200).json({
      success: true,
      results: searchResults,
      count: searchResults.length,
      query: query,
      metadata: {
        include_shared: include_shared,
        min_score: min_score,
        filters: filters
      }
    });

  } catch (error) {
    logger.error('Error searching insights', { cid }, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
