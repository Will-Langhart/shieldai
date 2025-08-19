import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { logger, withCorrelationId } from '../../../lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cid = withCorrelationId(req, `history_${Date.now()}`);
  const startedAt = Date.now();
  try {
    if (req.method === 'GET') {
      const { userId, limit = '10' } = req.query;
      if (!userId || typeof userId !== 'string') {
        logger.warn('History GET missing userId', { cid });
        return res.status(400).json({ error: 'userId is required' });
      }
      const { data, error } = await supabase
        .from('bible_search_history')
        .select('id, user_id, query, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(parseInt(limit as string, 10));
      if (error) {
        logger.error('History list failed', { cid }, error);
        return res.status(500).json({ error: 'Failed to load history' });
      }
      res.setHeader('Cache-Control', 'private, max-age=30');
      logger.info('History fetched', { cid, ms: Date.now() - startedAt, count: (data || []).length });
      return res.status(200).json({ history: data || [] });
    }

    if (req.method === 'DELETE') {
      const { userId } = req.query;
      if (!userId || typeof userId !== 'string') {
        logger.warn('History DELETE missing userId', { cid });
        return res.status(400).json({ error: 'userId is required' });
      }
      const { error } = await supabase
        .from('bible_search_history')
        .delete()
        .eq('user_id', userId);
      if (error) {
        logger.error('History delete failed', { cid }, error);
        return res.status(500).json({ error: 'Failed to clear history' });
      }
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    logger.error('History API error', { cid }, err);
    return res.status(500).json({ error: 'Unexpected error' });
  }
}


