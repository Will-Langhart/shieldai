import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { logger, withCorrelationId } from '../../../lib/logger';
import { InsightsPineconeService } from '../../../lib/insights-pinecone';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `insight_recommendations_${Date.now()}`);
  
  if (req.method !== 'GET') {
    logger.warn('Method not allowed', { cid, path: '/api/ai-insights/recommendations', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      current_passage, 
      top_k = '5', 
      include_shared = 'true',
      based_on_themes = 'true',
      based_on_passage = 'true'
    } = req.query;

    // Get user from auth token (with fallback for testing)
    const authHeader = req.headers.authorization;
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Check for test token first
      if (token === 'test-token') {
        user = {
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'test@example.com',
          name: 'Test User'
        };
        logger.info('Using test user for recommendations', { cid, userId: user.id });
      } else {
        try {
          const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
          
          if (authError || !authUser) {
            return res.status(401).json({ error: 'Invalid authentication token' });
          }
          user = authUser;
        } catch (error) {
          logger.error('Authentication failed', { cid }, error);
          return res.status(401).json({ error: 'Authentication failed' });
        }
      }
    } else {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    // Get recommendations
    const recommendations = await InsightsPineconeService.getInsightRecommendations(
      user.id,
      current_passage as string,
      {
        topK: parseInt(top_k as string),
        includeShared: include_shared === 'true',
        basedOnThemes: based_on_themes === 'true',
        basedOnPassage: based_on_passage === 'true'
      }
    );

    logger.info('Insight recommendations retrieved', { 
      cid, 
      user_id: user.id, 
      current_passage,
      recommendation_count: recommendations.length
    });

    res.status(200).json({
      success: true,
      recommendations: recommendations,
      count: recommendations.length,
      metadata: {
        current_passage: current_passage || null,
        based_on_themes: based_on_themes === 'true',
        based_on_passage: based_on_passage === 'true',
        include_shared: include_shared === 'true'
      }
    });

  } catch (error) {
    logger.error('Error getting insight recommendations', { cid }, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
