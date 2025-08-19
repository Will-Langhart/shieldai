import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { logger, withCorrelationId } from '../../../lib/logger';

// Minimal steps API: list by plan, create step, delete step
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cid = withCorrelationId(req, `plan_steps_${Date.now()}`);
  const startedAt = Date.now();
  try {
    if (req.method === 'GET') {
      const { planId } = req.query;
      if (!planId || typeof planId !== 'string') {
        logger.warn('Steps GET missing planId', { cid });
        return res.status(400).json({ error: 'planId is required' });
      }
      const { data, error } = await supabase
        .from('study_plan_steps')
        .select('id, plan_id, day_index, reference, title, notes, created_at')
        .eq('plan_id', planId)
        .order('day_index', { ascending: true });
      if (error) {
        logger.error('Steps list failed', { cid }, error);
        return res.status(500).json({ error: 'Failed to list steps' });
      }
      logger.info('Steps fetched', { cid, ms: Date.now() - startedAt, count: (data||[]).length });
      return res.status(200).json({ steps: data || [] });
    }

    if (req.method === 'POST') {
      const { planId, reference = null, title = '', notes = '', dueDate = null } = req.body || {};
      if (!planId) {
        logger.warn('Steps POST missing planId', { cid });
        return res.status(400).json({ error: 'planId is required' });
      }

      // Determine next day_index
      const { data: existing, error: idxErr } = await supabase
        .from('study_plan_steps')
        .select('day_index')
        .eq('plan_id', planId)
        .order('day_index', { ascending: false })
        .limit(1);
      if (idxErr) {
        logger.error('Steps read last index failed', { cid }, idxErr);
        return res.status(500).json({ error: 'Failed to compute next index' });
      }
      const nextIndex = existing && existing.length > 0 ? (existing[0].day_index || 0) + 1 : 1;

      const { data, error } = await supabase
        .from('study_plan_steps')
        .insert([{ plan_id: planId, day_index: nextIndex, reference, title, notes, due_date: dueDate }])
        .select('id, plan_id, day_index, reference, title, notes, created_at')
        .single();
      if (error) {
        logger.error('Step create failed', { cid }, error);
        return res.status(500).json({ error: 'Failed to create step' });
      }
      logger.info('Step created', { cid, planId, id: data?.id, ms: Date.now() - startedAt });
      return res.status(201).json({ step: data });
    }

    if (req.method === 'PATCH') {
      // Reorder or bulk add
      const { planId, reorder, bulk } = req.body || {};
      if (!planId) {
        logger.warn('Steps PATCH missing planId', { cid });
        return res.status(400).json({ error: 'planId is required' });
      }
      if (Array.isArray(reorder)) {
        // reorder: array of step ids in new order
        let index = 1;
        for (const stepId of reorder) {
          await supabase.from('study_plan_steps').update({ day_index: index++ }).eq('id', stepId).eq('plan_id', planId);
        }
        logger.info('Steps reordered', { cid, planId, count: reorder.length, ms: Date.now() - startedAt });
        return res.status(200).json({ ok: true });
      }
      if (Array.isArray(bulk)) {
        // bulk: [{ reference?, title?, notes? }, ...]
        const { data: existing, error: idxErr } = await supabase
          .from('study_plan_steps')
          .select('day_index')
          .eq('plan_id', planId)
          .order('day_index', { ascending: false })
          .limit(1);
        if (idxErr) {
          logger.error('Steps bulk read last index failed', { cid }, idxErr);
          return res.status(500).json({ error: 'Failed to compute next index' });
        }
        let nextIndex = existing && existing.length > 0 ? (existing[0].day_index || 0) + 1 : 1;
        const rows = bulk.map((b: any) => ({ plan_id: planId, day_index: nextIndex++, reference: b.reference || null, title: b.title || '', notes: b.notes || '', due_date: b.dueDate || null }));
        const { error } = await supabase.from('study_plan_steps').insert(rows);
        if (error) {
          logger.error('Steps bulk insert failed', { cid }, error);
          return res.status(500).json({ error: 'Failed to create steps' });
        }
        logger.info('Steps bulk inserted', { cid, planId, count: rows.length, ms: Date.now() - startedAt });
        return res.status(201).json({ ok: true, count: rows.length });
      }
      return res.status(400).json({ error: 'Invalid PATCH payload' });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id || typeof id !== 'string') {
        logger.warn('Steps DELETE missing id', { cid });
        return res.status(400).json({ error: 'id is required' });
      }
      const { error } = await supabase
        .from('study_plan_steps')
        .delete()
        .eq('id', id);
      if (error) {
        logger.error('Step delete failed', { cid }, error);
        return res.status(500).json({ error: 'Failed to delete step' });
      }
      logger.info('Step deleted', { cid, id, ms: Date.now() - startedAt });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    logger.error('Plan steps API error', { cid }, err);
    return res.status(500).json({ error: 'Unexpected error' });
  }
}


