import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { logger, withCorrelationId } from '../../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `save_ai_insight_${Date.now()}`);
  
  if (req.method !== 'POST') {
    logger.warn('Method not allowed', { cid, path: '/api/ai-insights/save', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      passage_reference,
      passage_text,
      bible_version,
      explanation,
      key_themes,
      cross_references,
      study_questions,
      historical_context,
      theological_meaning,
      practical_application,
      prayer_points,
      ai_model = 'gpt-4-turbo-preview',
      tags = [],
      notes = ''
    } = req.body;

    // Validate required fields
    if (!passage_reference || !passage_text || !bible_version || !explanation) {
      logger.warn('Missing required fields', { cid, fields: { passage_reference, passage_text, bible_version, explanation } });
      return res.status(400).json({ error: 'Missing required fields' });
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

    // Prepare the insight data
    const insightData = {
      user_id: user.id,
      passage_reference,
      passage_text,
      bible_version,
      explanation,
      key_themes: Array.isArray(key_themes) ? key_themes : [],
      cross_references: Array.isArray(cross_references) ? cross_references : [],
      study_questions: Array.isArray(study_questions) ? study_questions : [],
      historical_context: historical_context || null,
      theological_meaning: theological_meaning || null,
      practical_application: practical_application || null,
      prayer_points: Array.isArray(prayer_points) ? prayer_points : [],
      ai_model,
      tags: Array.isArray(tags) ? tags : [],
      notes: notes || null
    };

    // Insert the insight into the database
    const { data: savedInsight, error: insertError } = await supabase
      .from('ai_insights')
      .insert(insightData)
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to save AI insight', { cid, error: insertError.message, user_id: user.id });
      return res.status(500).json({ error: 'Failed to save insight' });
    }

    logger.info('AI insight saved successfully', { 
      cid, 
      insight_id: savedInsight.id, 
      user_id: user.id, 
      passage_reference 
    });

    res.status(201).json({
      success: true,
      insight: savedInsight
    });

  } catch (error) {
    logger.error('Error saving AI insight', { cid }, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
