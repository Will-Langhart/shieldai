import { NextApiRequest, NextApiResponse } from 'next';
import { bibleService } from '../../../lib/bible-service';
import { logger, withCorrelationId } from '../../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `passage_${Date.now()}`);
  const startedAt = Date.now();
  if (req.method !== 'GET') {
    logger.warn('Method not allowed', { cid, path: '/api/bible/passage', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reference, versionId = 'de4e12af7f28f599-02' } = req.query;

    if (!reference || typeof reference !== 'string') {
      logger.warn('Missing reference (passage)', { cid });
      return res.status(400).json({ error: 'Reference parameter is required' });
    }

    const passage = await bibleService.getVerseByReference(
      versionId as string,
      reference
    );

    if (!passage) {
      logger.warn('Passage not found', { cid, reference });
      return res.status(404).json({ error: 'Passage not found' });
    }

    logger.info('Passage fetched', { cid, ms: Date.now() - startedAt, hasText: !!(passage as any)?.text });
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    res.status(200).json({ passage });
  } catch (error) {
    logger.error('Passage error', { cid }, error);
    res.status(500).json({ error: 'Failed to fetch passage' });
  }
} 