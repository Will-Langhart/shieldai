import { NextApiRequest, NextApiResponse } from 'next';
import { bibleService } from '../../../lib/bible-service';
import { logger, withCorrelationId } from '../../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `suggestions_${Date.now()}`);
  const startedAt = Date.now();
  if (req.method !== 'POST') {
    logger.warn('Method not allowed', { cid, path: '/api/bible/suggestions', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { context, versionId = 'de4e12af7f28f599-02' } = req.body;

    if (!context || typeof context !== 'string') {
      logger.warn('Missing context (suggestions)', { cid });
      return res.status(400).json({ error: 'Context parameter is required' });
    }

    const suggestions = await bibleService.getVerseSuggestions(
      context,
      versionId as string
    );
    logger.info('Suggestions fetched', { cid, ms: Date.now() - startedAt, count: suggestions?.length || 0 });
    res.setHeader('Cache-Control', 'private, max-age=30');
    res.status(200).json({ suggestions });
  } catch (error) {
    logger.error('Suggestions error', { cid }, error);
    res.status(500).json({ error: 'Failed to get verse suggestions' });
  }
} 