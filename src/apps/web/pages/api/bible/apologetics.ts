import { NextApiRequest, NextApiResponse } from 'next';
import { bibleService } from '../../../lib/bible-service';
import { logger, withCorrelationId } from '../../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `apol_${Date.now()}`);
  const startedAt = Date.now();
  if (req.method !== 'GET') {
    logger.warn('Method not allowed', { cid, path: '/api/bible/apologetics', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { category, versionId = 'de4e12af7f28f599-02' } = req.query;

    if (!category || typeof category !== 'string') {
      logger.warn('Missing category (apologetics)', { cid });
      return res.status(400).json({ error: 'Category parameter is required' });
    }

    const verses = await bibleService.getApologeticsVerses(
      versionId as string,
      category
    );

    logger.info('Apologetics fetched', { cid, ms: Date.now() - startedAt, count: verses?.length || 0 });
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
    res.status(200).json({ verses });
  } catch (error) {
    logger.error('Apologetics error', { cid }, error);
    res.status(500).json({ error: 'Failed to fetch apologetics verses' });
  }
} 