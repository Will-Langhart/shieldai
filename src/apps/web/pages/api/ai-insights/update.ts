import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { logger, withCorrelationId } from '../../../lib/logger';

// Service role client bypasses RLS — same pattern used by save.ts and history.ts
const createServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey || serviceRoleKey === 'your_supabase_service_role_key') {
    return supabase;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

const ALLOWED_FIELDS = ['is_favorite', 'is_shared', 'tags', 'notes'] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cid = withCorrelationId(req, `update_ai_insight_${Date.now()}`);

  if (req.method !== 'PUT') {
    logger.warn('Method not allowed', { cid, method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, ...updateData } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Insight ID is required' });
    }

    // Verify auth token with the anon client (auth check doesn't need service role)
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logger.warn('Invalid auth token', { cid, error: authError?.message });
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    // Use service client so RLS doesn't block the lookup
    const serviceClient = createServiceClient();

    const { data: existingInsight, error: fetchError } = await serviceClient
      .from('ai_insights')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingInsight) {
      logger.warn('Insight not found', { cid, insight_id: id, db_error: fetchError?.message });
      return res.status(404).json({ error: 'Insight not found' });
    }

    if (existingInsight.user_id !== user.id) {
      logger.warn('Unauthorized update attempt', { cid, insight_id: id, user_id: user.id });
      return res.status(403).json({ error: 'Not authorized to update this insight' });
    }

    // Filter to only allowed fields
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const field of ALLOWED_FIELDS) {
      if (updateData[field] !== undefined) payload[field] = updateData[field];
    }

    if (Object.keys(payload).length === 1) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data: updatedInsight, error: updateError } = await serviceClient
      .from('ai_insights')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to update insight', { cid, error: updateError.message, insight_id: id });
      return res.status(500).json({ error: 'Failed to update insight', detail: updateError.message });
    }

    logger.info('Insight updated', { cid, insight_id: id, fields: Object.keys(payload) });
    return res.status(200).json({ success: true, insight: updatedInsight });

  } catch (error) {
    logger.error('Unexpected error in update', { cid }, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
