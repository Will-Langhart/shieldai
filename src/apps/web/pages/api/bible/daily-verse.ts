import { NextApiRequest, NextApiResponse } from 'next';
import { bibleService } from '../../../lib/bible-service';
import { logger, withCorrelationId } from '../../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `daily_${Date.now()}`);
  const startedAt = Date.now();
  if (req.method !== 'GET') {
    logger.warn('Method not allowed', { cid, path: '/api/bible/daily-verse', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { versionId = 'de4e12af7f28f599-02' } = req.query;

    const dailyVerse = await bibleService.getDailyVerse(versionId as string);

    if (!dailyVerse) {
      logger.warn('Daily verse not found', { cid });
      return res.status(404).json({ error: 'Daily verse not found' });
    }

    logger.info('Daily verse fetched', { cid, ms: Date.now() - startedAt, hasVerse: !!dailyVerse });
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    res.status(200).json({ verse: dailyVerse });
  } catch (error) {
    logger.error('Daily verse error', { cid }, error);
    res.status(500).json({ error: 'Failed to fetch daily verse' });
  }
} 