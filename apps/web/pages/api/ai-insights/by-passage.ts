import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { logger, withCorrelationId } from '../../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `get_insights_by_passage_${Date.now()}`);
  
  if (req.method !== 'GET') {
    logger.warn('Method not allowed', { cid, path: '/api/ai-insights/by-passage', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { passage_reference, bible_version } = req.query;

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

    // Use the get insights by passage function from the database
    const { data: insights, error: searchError } = await supabase
      .rpc('get_insights_by_passage', {
        p_user_id: user.id,
        p_passage_reference: passage_reference as string,
        p_bible_version: bible_version as string || null
      });

    if (searchError) {
      logger.error('Failed to get insights by passage', { cid, error: searchError.message, user_id: user.id, passage_reference });
      return res.status(500).json({ error: 'Failed to get insights' });
    }

    logger.info('Insights by passage retrieved', { 
      cid, 
      user_id: user.id, 
      passage_reference,
      result_count: insights?.length || 0
    });

    res.status(200).json({
      success: true,
      insights: insights || [],
      count: insights?.length || 0
    });

  } catch (error) {
    logger.error('Error getting insights by passage', { cid }, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
