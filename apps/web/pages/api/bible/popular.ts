import { NextApiRequest, NextApiResponse } from 'next';
import { bibleService } from '../../../lib/bible-service';
import { logger, withCorrelationId } from '../../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `popular_${Date.now()}`);
  const startedAt = Date.now();
  if (req.method !== 'GET') {
    logger.warn('Method not allowed', { cid, path: '/api/bible/popular', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { versionId = 'de4e12af7f28f599-02' } = req.query;

    const popularVerses = await bibleService.getPopularVerses(versionId as string);
    logger.info('Popular verses', { cid, ms: Date.now() - startedAt, count: popularVerses?.length || 0 });
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
    res.status(200).json({ verses: popularVerses });
  } catch (error) {
    logger.error('Popular error', { cid }, error);
    res.status(500).json({ error: 'Failed to fetch popular verses' });
  }
} 