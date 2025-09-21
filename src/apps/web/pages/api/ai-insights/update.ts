import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { logger, withCorrelationId } from '../../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `update_ai_insight_${Date.now()}`);
  
  if (req.method !== 'PUT') {
    logger.warn('Method not allowed', { cid, path: '/api/ai-insights/update', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, ...updateData } = req.body;

    if (!id) {
      logger.warn('Missing insight ID', { cid });
      return res.status(400).json({ error: 'Insight ID is required' });
    }

    // Get user from auth token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid auth header', { cid });
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      logger.warn('Invalid auth token', { cid, error: authError?.message });
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    // First, check if the insight exists and belongs to the user
    const { data: existingInsight, error: fetchError } = await supabase
      .from('ai_insights')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingInsight) {
      logger.warn('Insight not found', { cid, insight_id: id, user_id: user.id });
      return res.status(404).json({ error: 'Insight not found' });
    }

    if (existingInsight.user_id !== user.id) {
      logger.warn('User not authorized to update insight', { cid, insight_id: id, user_id: user.id });
      return res.status(403).json({ error: 'Not authorized to update this insight' });
    }

    // Prepare update data (only allow certain fields to be updated)
    const allowedFields = [
      'is_favorite',
      'is_shared', 
      'tags',
      'notes'
    ];

    const filteredUpdateData: any = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field] = updateData[field];
      }
    });

    if (Object.keys(filteredUpdateData).length === 0) {
      logger.warn('No valid fields to update', { cid, insight_id: id, updateData });
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Update the insight
    const { data: updatedInsight, error: updateError } = await supabase
      .from('ai_insights')
      .update(filteredUpdateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to update AI insight', { cid, error: updateError.message, insight_id: id, user_id: user.id });
      return res.status(500).json({ error: 'Failed to update insight' });
    }

    logger.info('AI insight updated successfully', { 
      cid, 
      insight_id: id, 
      user_id: user.id,
      updated_fields: Object.keys(filteredUpdateData)
    });

    res.status(200).json({
      success: true,
      insight: updatedInsight
    });

  } catch (error) {
    logger.error('Error updating AI insight', { cid }, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
