import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { logger, withCorrelationId } from '../../../lib/logger';
import { applyBibleRateLimit } from '../../../lib/rate-limit';
import { InsightsPineconeService } from '../../../lib/insights-pinecone';

// Service role client that bypasses RLS
const createServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey || serviceRoleKey === 'your_supabase_service_role_key') {
    // Fallback to regular client if service role key is not available
    return supabase;
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `save_ai_insight_${Date.now()}`);
  if (!(await applyBibleRateLimit(req, res))) return;
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
      ai_model = 'gpt-4o',
      tags = [],
      notes = ''
    } = req.body;

    // Validate required fields
    if (!passage_reference || !passage_text || !bible_version || !explanation) {
      logger.warn('Missing required fields', { cid, fields: { passage_reference, passage_text, bible_version, explanation } });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get authenticated user
    const authHeader = req.headers.authorization;
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      {
        try {
          const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
          
          if (authError || !authUser) {
            logger.error('Authentication failed', { cid, error: authError?.message });
            return res.status(401).json({ error: 'Invalid authentication token' });
          }
          user = authUser;
          logger.info('Authenticated user', { cid, userId: user.id, email: user.email });
        } catch (error) {
          logger.error('Authentication failed', { cid }, error);
          return res.status(401).json({ error: 'Authentication failed' });
        }
      }
    } else {
      logger.warn('No authorization header provided', { cid });
      return res.status(401).json({ error: 'Authorization header required' });
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

    // Use service client to bypass RLS for all users
    const serviceClient = createServiceClient();
    
    logger.info('Saving AI insight', { cid, user_id: user.id, passage_reference, insightData });
    
    // Ensure user exists in our users table (for foreign key constraint)
    const { data: existingUser, error: userCheckError } = await serviceClient
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (userCheckError && userCheckError.code === 'PGRST116') {
      // User doesn't exist in our users table, create them
      const userData = {
        id: user.id,
        email: user.email || 'user@shieldai.com',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: userCreateError } = await serviceClient
        .from('users')
        .insert(userData);

      if (userCreateError) {
        logger.error('Failed to create user record', { cid, error: userCreateError.message, user_id: user.id });
        return res.status(500).json({ 
          error: 'Failed to create user record',
          details: userCreateError.message,
          code: userCreateError.code
        });
      }
      
      logger.info('Created user record', { cid, user_id: user.id });
    }
    
    // Insert the insight using service client to bypass RLS
    const { data: savedInsight, error: insertError } = await serviceClient
      .from('ai_insights')
      .insert(insightData)
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to save AI insight', { cid, error: insertError.message, user_id: user.id, insertError });
      return res.status(500).json({ 
        error: 'Failed to save insight',
        details: insertError.message,
        code: insertError.code
      });
    }

    logger.info('AI insight saved successfully', { 
      cid, 
      insight_id: savedInsight.id, 
      user_id: user.id, 
      passage_reference 
    });

    // Store insight in Pinecone for enhanced search and recommendations
    try {
      await InsightsPineconeService.storeAIInsight({
        id: savedInsight.id,
        user_id: user.id,
        passage_reference: savedInsight.passage_reference,
        passage_text: savedInsight.passage_text,
        bible_version: savedInsight.bible_version,
        explanation: savedInsight.explanation,
        key_themes: savedInsight.key_themes,
        cross_references: savedInsight.cross_references,
        study_questions: savedInsight.study_questions,
        historical_context: savedInsight.historical_context,
        theological_meaning: savedInsight.theological_meaning,
        practical_application: savedInsight.practical_application,
        prayer_points: savedInsight.prayer_points,
        ai_model: savedInsight.ai_model,
        is_favorite: savedInsight.is_favorite,
        is_shared: savedInsight.is_shared,
        tags: savedInsight.tags,
        notes: savedInsight.notes
      });
      
      logger.info('AI insight stored in Pinecone', { 
        cid, 
        insight_id: savedInsight.id, 
        user_id: user.id 
      });
    } catch (pineconeError) {
      logger.error('Failed to store insight in Pinecone', { cid, error: pineconeError });
      // Don't fail the request if Pinecone storage fails
    }

    res.status(201).json({
      success: true,
      insight: savedInsight
    });

  } catch (error) {
    logger.error('Error saving AI insight', { cid }, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
