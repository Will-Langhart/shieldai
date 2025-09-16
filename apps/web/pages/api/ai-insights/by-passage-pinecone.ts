import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { logger, withCorrelationId } from '../../../lib/logger';
import { InsightsPineconeService } from '../../../lib/insights-pinecone';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `insights_by_passage_pinecone_${Date.now()}`);
  
  if (req.method !== 'GET') {
    logger.warn('Method not allowed', { cid, path: '/api/ai-insights/by-passage-pinecone', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { passage_reference, top_k = '10', include_shared = 'true' } = req.query;

    if (!passage_reference) {
      logger.warn('Missing passage_reference parameter', { cid });
      return res.status(400).json({ error: 'passage_reference parameter is required' });
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

    // Get insights for the passage using Pinecone
    const insights = await InsightsPineconeService.getInsightsForPassage(
      passage_reference as string,
      user.id,
      {
        includeShared: include_shared === 'true',
        topK: parseInt(top_k as string)
      }
    );

    logger.info('Insights by passage retrieved', { 
      cid, 
      user_id: user.id, 
      passage_reference,
      result_count: insights.length
    });

    res.status(200).json({
      success: true,
      insights: insights,
      count: insights.length,
      passage_reference: passage_reference,
      metadata: {
        include_shared: include_shared === 'true',
        top_k: parseInt(top_k as string)
      }
    });

  } catch (error) {
    logger.error('Error getting insights by passage', { cid }, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
