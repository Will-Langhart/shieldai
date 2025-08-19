import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

// CRUD for study plans: list/create/update/delete
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { userId } = req.query;
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'userId is required' });
      }

      const { data, error } = await supabase
        .from('study_plans')
        .select('id, user_id, title, description, duration_days, visibility, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error listing plans:', error);
        return res.status(500).json({ error: 'Failed to list plans' });
      }

      return res.status(200).json({ plans: data || [] });
    }

    if (req.method === 'POST') {
      const { userId, title, description = '', durationDays = null, visibility = 'private' } = req.body;
      if (!userId || !title) {
        return res.status(400).json({ error: 'userId and title are required' });
      }
      if (!['private', 'shared', 'public'].includes(visibility)) {
        return res.status(400).json({ error: 'Invalid visibility' });
      }

      const { data, error } = await supabase
        .from('study_plans')
        .insert([
          {
            user_id: userId,
            title: String(title).trim(),
            description: String(description).trim(),
            duration_days: durationDays,
            visibility,
          },
        ])
        .select('id, user_id, title, description, duration_days, visibility, created_at, updated_at')
        .single();

      if (error) {
        console.error('Error creating plan:', error);
        return res.status(500).json({ error: 'Failed to create plan' });
      }

      return res.status(201).json({ plan: data });
    }

    if (req.method === 'PUT') {
      const { id, userId, title, description, durationDays, visibility, isCompleted } = req.body;
      if (!id || !userId) {
        return res.status(400).json({ error: 'id and userId are required' });
      }
      const update: any = {};
      if (title !== undefined) update.title = String(title).trim();
      if (description !== undefined) update.description = String(description).trim();
      if (durationDays !== undefined) update.duration_days = durationDays;
      if (visibility !== undefined) {
        if (!['private', 'shared', 'public'].includes(visibility)) {
          return res.status(400).json({ error: 'Invalid visibility' });
        }
        update.visibility = visibility;
      }

      const { data, error } = await supabase
        .from('study_plans')
        .update(update)
        .eq('id', id)
        .eq('user_id', userId)
        .select('id, user_id, title, description, duration_days, visibility, created_at, updated_at')
        .single();

      if (error) {
        console.error('Error updating plan:', error);
        return res.status(500).json({ error: 'Failed to update plan' });
      }

      return res.status(200).json({ plan: data });
    }

    if (req.method === 'DELETE') {
      const { id, userId } = req.query;
      if (!id || !userId || typeof id !== 'string' || typeof userId !== 'string') {
        return res.status(400).json({ error: 'id and userId are required' });
      }

      const { error } = await supabase
        .from('study_plans')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting plan:', error);
        return res.status(500).json({ error: 'Failed to delete plan' });
      }

      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('Plans API error:', err);
    return res.status(500).json({ error: 'Unexpected error' });
  }
}


