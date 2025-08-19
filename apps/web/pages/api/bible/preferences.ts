import { NextApiRequest, NextApiResponse } from 'next';
import { bibleService } from '../../../lib/bible-service';
import { logger, withCorrelationId } from '../../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `prefs_${Date.now()}`);
  const startedAt = Date.now();
  if (req.method !== 'GET' && req.method !== 'PUT') {
    logger.warn('Method not allowed', { cid, path: '/api/bible/preferences', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      logger.warn('Preferences missing userId', { cid });
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (req.method === 'GET') {
      const preferences = await bibleService.getUserPreferences(userId);
      logger.info('Preferences fetched', { cid, ms: Date.now() - startedAt });
      res.status(200).json(preferences);
    } else if (req.method === 'PUT') {
      const preferences = req.body;
      await bibleService.updateUserPreferences(userId, preferences);
      logger.info('Preferences updated', { cid, ms: Date.now() - startedAt });
      res.status(200).json({ message: 'Preferences updated successfully' });
    }
  } catch (error) {
    logger.error('Preferences error', { cid }, error);
    res.status(500).json({ error: 'Failed to handle preferences' });
  }
} 