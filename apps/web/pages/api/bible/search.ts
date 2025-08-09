import { NextApiRequest, NextApiResponse } from 'next';
import { bibleService } from '../../../lib/bible-service';
import { supabase } from '../../../lib/supabase';
import { SubscriptionMiddleware } from '../../../lib/subscription-middleware';
import { createServerSupabaseClient } from '../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, versionId = 'de4e12af7f28f599-02', limit = 10, advanced = 'false' } = req.query;

    if (!query || typeof query !== 'string') {
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
        console.error('Auth error in Bible search:', error);
      }
    }

    // Check subscription access for Bible search
    if (user) {
      const isAdvanced = advanced === 'true';
      const featureAccess = await SubscriptionMiddleware.checkBibleSearchAccess(user.id, isAdvanced);
      
      if (!featureAccess.allowed) {
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

    // Save search history if user is authenticated and search history is enabled
    if (user) {
      try {
        // Check user preferences
        const preferences = await bibleService.getUserPreferences(user.id);
        
        if (preferences.search_history_enabled) {
          await bibleService.saveSearchHistory(user.id, query);
        }
      } catch (error) {
        console.error('Error saving search history:', error);
        // Don't fail the search if history saving fails
      }
    }

    res.status(200).json(searchResults);
  } catch (error) {
    console.error('Error searching Bible:', error);
    res.status(500).json({ error: 'Failed to search Bible' });
  }
} 