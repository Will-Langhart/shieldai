import { NextApiRequest, NextApiResponse } from 'next';
import { bibleService } from '../../../lib/bible-service';
import { logger, withCorrelationId } from '../../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `concordance_${Date.now()}`);
  const startedAt = Date.now();
  if (req.method !== 'GET') {
    logger.warn('Method not allowed', { cid, path: '/api/bible/concordance', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reference, versionId = 'de4e12af7f28f599-02' } = req.query;

    if (!reference || typeof reference !== 'string') {
      logger.warn('Missing reference (concordance)', { cid });
      return res.status(400).json({ error: 'Reference parameter is required' });
    }

    const concordanceData = await bibleService.getConcordance(
      reference,
      versionId as string
    );
    const entries = (concordanceData && (concordanceData as any).entries) || [];
    logger.info('Concordance fetched', { cid, ms: Date.now() - startedAt, count: entries.length });
    res.status(200).json({ concordance: entries });
  } catch (error) {
    logger.error('Concordance error', { cid }, error);
    res.status(500).json({ error: 'Failed to get concordance' });
  }
} 