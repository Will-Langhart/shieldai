import { NextApiRequest, NextApiResponse } from 'next';
import { VideoService } from '../../../lib/video-service';
import { createServerSupabaseClient } from '../../../lib/supabase';
import { logger, withCorrelationId } from '../../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `video_search_${Date.now()}`);
  
  if (req.method !== 'POST') {
    logger.warn('Method not allowed', { cid, path: '/api/videos/search', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, maxResults = 5, relevanceThreshold = 0.6, includeScripture = true } = req.body || {};

    if (!query) {
      logger.warn('Missing query parameter', { cid });
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // Get authenticated user from Authorization header
    const authHeader = req.headers.authorization;
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      logger.debug('Received token', { cid, token_prefix: token.substring(0, 8) });
      
      try {
        const serverSupabase = createServerSupabaseClient(token);
        const { data: { user: authUser }, error: authError } = await serverSupabase.auth.getUser();
        
        if (authError) {
          logger.error('Auth error', { cid }, authError);
          return res.status(401).json({ error: 'Invalid authentication token' });
        }
        
        if (authUser) {
          user = authUser;
          logger.info('Authenticated', { cid, userId: user.id, email: user.email });
        } else {
          logger.warn('No user found in token', { cid });
          return res.status(401).json({ error: 'No user found in token' });
        }
      } catch (error) {
        logger.error('Supabase client create failed', { cid }, error);
        return res.status(401).json({ error: 'Authentication failed' });
      }
    } else {
      logger.warn('No authorization header', { cid });
      return res.status(401).json({ error: 'Authorization header required' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    logger.info('Video search request', { cid, userId: user.id, query, maxResults });

    // Search for relevant videos
    const videos = await VideoService.searchRelevantVideos({
      query,
      maxResults,
      relevanceThreshold,
      includeScripture
    });

    logger.info('Video search completed', { cid, count: videos.length });

    return res.status(200).json({
      videos,
      query,
      total: videos.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Video search API error', { cid }, error);
    return res.status(500).json({ 
      error: 'An error occurred while searching for videos' 
    });
  }
}
