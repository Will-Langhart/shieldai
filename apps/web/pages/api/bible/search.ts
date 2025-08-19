import { NextApiRequest, NextApiResponse } from 'next';
import { bibleService } from '../../../lib/bible-service';
import { logger, withCorrelationId } from '../../../lib/logger';
import { supabase } from '../../../lib/supabase';
import { SubscriptionMiddleware } from '../../../lib/subscription-middleware';
import { createServerSupabaseClient } from '../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `bible_search_${Date.now()}`);
  const start = Date.now();
  if (req.method !== 'GET') {
    logger.warn('Method not allowed', { cid, path: '/api/bible/search', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, versionId = 'de4e12af7f28f599-02', limit = 10, advanced = 'false' } = req.query;

    if (!query || typeof query !== 'string') {
      logger.warn('Missing query', { cid });
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // Get user from auth token if provided
    let user = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const serverSupabase = createServerSupabaseClient(token);
        const { data: { user: authUser }, error: authError } = await serverSupabase.auth.getUser();
        if (!authError && authUser) {
          user = authUser;
        }
      } catch (error) {
        logger.error('Auth error in Bible search', { cid }, error);
      }
    }

    // Check subscription access for Bible search
    if (user) {
      const isAdvanced = advanced === 'true';
      const featureAccess = await SubscriptionMiddleware.checkBibleSearchAccess(user.id, isAdvanced);
      
      if (!featureAccess.allowed) {
        logger.warn('Bible search blocked by subscription', { cid, userId: user.id });
        return res.status(403).json({ 
          error: 'Feature not available',
          message: `${isAdvanced ? 'Advanced Bible search' : 'Bible search'} not available on your current plan`,
          upgrade_required: featureAccess.upgrade_required,
          current_tier: featureAccess.current_tier,
          required_tier: featureAccess.required_tier,
          remaining: featureAccess.remaining,
          limit: featureAccess.limit
        });
      }
    }

    const searchResults = await bibleService.searchBible(
      versionId as string,
      query,
      parseInt(limit as string)
    );
    logger.info('Bible search completed', { cid, ms: Date.now() - start, q: String(query).slice(0,80), count: (searchResults as any)?.total });

    // Save search history if user is authenticated and search history is enabled
    if (user) {
      try {
        // Check user preferences
        const preferences = await bibleService.getUserPreferences(user.id);
        
        if (preferences.search_history_enabled) {
          await bibleService.saveSearchHistory(user.id, query);
        }
      } catch (error) {
        logger.error('Save search history failed', { cid }, error);
        // Don't fail the search if history saving fails
      }
    }

    res.setHeader('Cache-Control', 'private, max-age=10');
    res.status(200).json(searchResults);
  } catch (error) {
    logger.error('Bible search error', { cid }, error);
    res.status(500).json({ error: 'Failed to search Bible' });
  }
} 