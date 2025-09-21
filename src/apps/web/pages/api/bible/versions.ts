import { NextApiRequest, NextApiResponse } from 'next';
import { bibleService } from '../../../lib/bible-service';
import { logger, withCorrelationId } from '../../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `versions_${Date.now()}`);
  const startedAt = Date.now();
  if (req.method !== 'GET') {
    logger.warn('Method not allowed', { cid, path: '/api/bible/versions', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const versions = await bibleService.getBibleVersions();
    logger.info('Versions fetched', { cid, ms: Date.now() - startedAt, count: versions?.length || 0 });
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ versions });
  } catch (error) {
    logger.error('Versions error', { cid }, error);
    res.status(500).json({ error: 'Failed to fetch Bible versions' });
  }
} 