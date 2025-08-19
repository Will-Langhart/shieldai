import { NextApiRequest, NextApiResponse } from 'next';
import { bibleService } from '../../../lib/bible-service';
import { logger, withCorrelationId } from '../../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `adv_search_${Date.now()}`);
  const startedAt = Date.now();
  if (req.method !== 'GET') {
    logger.warn('Method not allowed', { cid, path: '/api/bible/advanced-search', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      query,
      versionId = 'de4e12af7f28f599-02',
      book,
      chapter,
      verse,
      searchType = 'contains',
      caseSensitive = 'false',
      limit = '20',
      userId
    } = req.query;

    if (!query || typeof query !== 'string') {
      logger.warn('Missing query (advanced-search)', { cid });
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const searchResults = await bibleService.advancedSearch({
      query,
      versionId: versionId as string,
      book: book as string,
      chapter: chapter ? parseInt(chapter as string) : undefined,
      verse: verse ? parseInt(verse as string) : undefined,
      searchType: searchType as any,
      caseSensitive: caseSensitive === 'true',
      limit: parseInt(limit as string)
    });

    // Save search history if user is authenticated and search history is enabled
    if (userId && typeof userId === 'string') {
      try {
        // Check user preferences
        const preferences = await bibleService.getUserPreferences(userId);
        
        if (preferences.search_history_enabled) {
          await bibleService.saveSearchHistory(userId, query);
        }
      } catch (error) {
        logger.error('Save search history failed (advanced)', { cid }, error);
        // Don't fail the search if history saving fails
      }
    }

    logger.info('Advanced search complete', { cid, ms: Date.now() - startedAt, total: (searchResults as any)?.total || 0 });
    res.setHeader('Cache-Control', 'private, max-age=10');
    res.status(200).json(searchResults);
  } catch (error) {
    logger.error('Advanced search error', { cid }, error);
    res.status(500).json({ error: 'Failed to perform advanced search' });
  }
} 