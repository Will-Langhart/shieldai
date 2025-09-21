import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { logger, withCorrelationId } from '../../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `search_ai_insights_${Date.now()}`);
  
  if (req.method !== 'GET') {
    logger.warn('Method not allowed', { cid, path: '/api/ai-insights/search', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      search_query,
      passage_reference,
      bible_version,
      tags,
      key_themes,
      is_favorite,
      is_shared,
      date_from,
      date_to,
      limit = 50,
      offset = 0
    } = req.query;

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

    // Parse array parameters
    const tagsArray = tags ? (Array.isArray(tags) ? tags : [tags]) : null;
    const keyThemesArray = key_themes ? (Array.isArray(key_themes) ? key_themes : [key_themes]) : null;
    const isFavorite = is_favorite === 'true' ? true : is_favorite === 'false' ? false : null;
    const isShared = is_shared === 'true' ? true : is_shared === 'false' ? false : null;

    // Parse date parameters
    const dateFrom = date_from ? new Date(date_from as string) : null;
    const dateTo = date_to ? new Date(date_to as string) : null;

    // Use the search function from the database
    const { data: insights, error: searchError } = await supabase
      .rpc('search_ai_insights', {
        p_user_id: user.id,
        p_search_query: search_query as string || null,
        p_passage_reference: passage_reference as string || null,
        p_bible_version: bible_version as string || null,
        p_tags: tagsArray,
        p_key_themes: keyThemesArray,
        p_is_favorite: isFavorite,
        p_is_shared: isShared,
        p_date_from: dateFrom?.toISOString() || null,
        p_date_to: dateTo?.toISOString() || null,
        p_limit: parseInt(limit as string) || 50,
        p_offset: parseInt(offset as string) || 0
      });

    if (searchError) {
      logger.error('Failed to search AI insights', { cid, error: searchError.message, user_id: user.id });
      return res.status(500).json({ error: 'Failed to search insights' });
    }

    logger.info('AI insights search completed', { 
      cid, 
      user_id: user.id, 
      result_count: insights?.length || 0,
      search_params: { search_query, passage_reference, bible_version }
    });

    res.status(200).json({
      success: true,
      insights: insights || [],
      count: insights?.length || 0
    });

  } catch (error) {
    logger.error('Error searching AI insights', { cid }, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
