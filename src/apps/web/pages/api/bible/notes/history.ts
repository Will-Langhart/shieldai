import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';
import { logger, withCorrelationId } from '../../../../lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cid = withCorrelationId(req, `notes_history_${Date.now()}`);
  const startedAt = Date.now();
  if (req.method !== 'GET') {
    logger.warn('Method not allowed', { cid, path: '/api/bible/notes/history', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reference, userId, limit = 10 } = req.query;

    if (!reference || typeof reference !== 'string') {
      logger.warn('Notes history missing reference', { cid });
      return res.status(400).json({ error: 'Reference parameter is required' });
    }

    if (!userId || typeof userId !== 'string') {
      logger.warn('Notes history missing userId', { cid });
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get note history for the specific verse reference
    const { data: notes, error } = await supabase
      .from('bible_notes')
      .select('*')
      .eq('reference', reference)
      .eq('user_id', userId)
      .order('last_modified', { ascending: false })
      .limit(parseInt(limit as string));

    if (error) {
      logger.error('Notes history failed', { cid }, error);
      return res.status(500).json({ error: 'Failed to fetch note history' });
    }

    logger.info('Notes history ok', { cid, ms: Date.now() - startedAt, count: (notes||[]).length });
    res.status(200).json({ notes: notes || [] });
  } catch (error) {
    logger.error('Notes history error', { cid }, error);
    res.status(500).json({ error: 'Failed to get note history' });
  }
}