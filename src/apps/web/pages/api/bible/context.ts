import { NextApiRequest, NextApiResponse } from 'next';
import { bibleService } from '../../../lib/bible-service';
import { logger, withCorrelationId } from '../../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `context_${Date.now()}`);
  const startedAt = Date.now();
  if (req.method !== 'GET') {
    logger.warn('Method not allowed', { cid, path: '/api/bible/context', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reference, versionId = 'de4e12af7f28f599-02' } = req.query;

    if (!reference || typeof reference !== 'string') {
      logger.warn('Missing reference (context)', { cid });
      return res.status(400).json({ error: 'Reference parameter is required' });
    }

    const context = await bibleService.getVerseContext(
      reference,
      versionId as string
    );

    if (!context) {
      logger.warn('Verse context not found', { cid, reference });
      return res.status(404).json({ error: 'Verse context not found' });
    }

    logger.info('Context fetched', { cid, ms: Date.now() - startedAt });
    res.status(200).json(context);
  } catch (error) {
    logger.error('Context error', { cid }, error);
    res.status(500).json({ error: 'Failed to fetch verse context' });
  }
} 