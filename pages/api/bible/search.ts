import { NextApiRequest, NextApiResponse } from 'next';
import { bibleService } from '../../../lib/bible-service';
import { supabase } from '../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, versionId = 'de4e12af7f28f599-02', limit = 10, userId } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const searchResults = await bibleService.searchBible(
      versionId as string,
      query,
      parseInt(limit as string)
    );

    // Save search history if user is authenticated and search history is enabled
    if (userId && typeof userId === 'string') {
      try {
        // Check user preferences
        const preferences = await bibleService.getUserPreferences(userId);
        
        if (preferences.search_history_enabled) {
          await bibleService.saveSearchHistory(userId, query);
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