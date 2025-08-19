import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { logger, withCorrelationId } from '../../../lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cid = withCorrelationId(req, `favorites_${Date.now()}`);
  const startedAt = Date.now();
  try {
    if (req.method === 'GET') {
      const { userId, limit = '50' } = req.query;
      if (!userId || typeof userId !== 'string') {
        logger.warn('Favorites GET missing userId', { cid });
        return res.status(400).json({ error: 'userId is required' });
      }
      const { data, error } = await supabase
        .from('bible_favorites')
        .select('id, user_id, reference, text, version, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(parseInt(limit as string, 10));
      if (error) {
        logger.error('Favorites list failed', { cid }, error);
        return res.status(500).json({ error: 'Failed to load favorites' });
      }
      res.setHeader('Cache-Control', 'private, max-age=30');
      logger.info('Favorites fetched', { cid, ms: Date.now() - startedAt, count: (data || []).length });
      return res.status(200).json({ favorites: data || [] });
    }

    if (req.method === 'POST') {
      const { userId, reference, text, version } = req.body || {};
      if (!userId || !reference || !text || !version) {
        logger.warn('Favorites POST missing fields', { cid });
        return res.status(400).json({ error: 'userId, reference, text, version are required' });
      }
      const { data, error } = await supabase
        .from('bible_favorites')
        .upsert({ user_id: userId, reference, text, version, created_at: new Date().toISOString() }, { onConflict: 'user_id,reference' })
        .select('id, user_id, reference, text, version, created_at')
        .single();
      if (error) {
        logger.error('Favorite save failed', { cid }, error);
        return res.status(500).json({ error: 'Failed to save favorite' });
      }
      return res.status(201).json({ favorite: data });
    }

    if (req.method === 'DELETE') {
      const { userId, reference } = req.query;
      if (!userId || !reference || typeof userId !== 'string' || typeof reference !== 'string') {
        logger.warn('Favorites DELETE missing fields', { cid });
        return res.status(400).json({ error: 'userId and reference are required' });
      }
      const { error } = await supabase
        .from('bible_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('reference', reference);
      if (error) {
        logger.error('Favorite delete failed', { cid }, error);
        return res.status(500).json({ error: 'Failed to delete favorite' });
      }
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    logger.error('Favorites API error', { cid }, err);
    return res.status(500).json({ error: 'Unexpected error' });
  }
}


