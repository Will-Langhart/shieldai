import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { logger, withCorrelationId } from '../../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `delete_ai_insight_${Date.now()}`);
  
  if (req.method !== 'DELETE') {
    logger.warn('Method not allowed', { cid, path: '/api/ai-insights/delete', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      logger.warn('Missing or invalid insight ID', { cid, id });
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
      .select('id, user_id, passage_reference')
      .eq('id', id)
      .single();

    if (fetchError || !existingInsight) {
      logger.warn('Insight not found', { cid, insight_id: id, user_id: user.id });
      return res.status(404).json({ error: 'Insight not found' });
    }

    if (existingInsight.user_id !== user.id) {
      logger.warn('User not authorized to delete insight', { cid, insight_id: id, user_id: user.id });
      return res.status(403).json({ error: 'Not authorized to delete this insight' });
    }

    // Delete the insight
    const { error: deleteError } = await supabase
      .from('ai_insights')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      logger.error('Failed to delete AI insight', { cid, error: deleteError.message, insight_id: id, user_id: user.id });
      return res.status(500).json({ error: 'Failed to delete insight' });
    }

    logger.info('AI insight deleted successfully', { 
      cid, 
      insight_id: id, 
      user_id: user.id,
      passage_reference: existingInsight.passage_reference
    });

    res.status(200).json({
      success: true,
      message: 'Insight deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting AI insight', { cid }, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
