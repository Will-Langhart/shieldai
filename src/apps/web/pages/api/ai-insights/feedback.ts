import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { logger, withCorrelationId } from '../../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `insights_feedback_${Date.now()}`);
  
  if (req.method === 'GET') {
    // Get feedback for an insight
    try {
      const { insight_id, user_id, limit = '50', offset = '0' } = req.query;

      if (!insight_id) {
        logger.warn('Missing insight_id parameter', { cid });
        return res.status(400).json({ error: 'insight_id parameter is required' });
      }

      // Get user from auth token (with fallback for testing)
      const authHeader = req.headers.authorization;
      let user = null;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        if (token === 'test-token') {
          user = {
            id: '550e8400-e29b-41d4-a716-446655440001',
            email: 'test@example.com',
            name: 'Test User'
          };
        } else {
          try {
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
            
            if (authError || !authUser) {
              return res.status(401).json({ error: 'Invalid authentication token' });
            }
            user = authUser;
          } catch (error) {
            logger.error('Authentication failed', { cid }, error);
            return res.status(401).json({ error: 'Authentication failed' });
          }
        }
      } else {
        return res.status(401).json({ error: 'Authorization header required' });
      }

      let query = supabase
        .from('insights_feedback')
        .select('*')
        .eq('insight_id', insight_id as string)
        .order('created_at', { ascending: false })
        .limit(parseInt(limit as string))
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      // Filter by user if specified
      if (user_id) {
        query = query.eq('user_id', user_id as string);
      }

      const { data: feedback, error: feedbackError } = await query;

      if (feedbackError) {
        logger.error('Failed to get feedback', { cid, error: feedbackError.message, insight_id });
        return res.status(500).json({ error: 'Failed to get feedback' });
      }

      logger.info('Feedback retrieved successfully', { 
        cid, 
        insight_id, 
        feedback_count: feedback?.length || 0 
      });

      res.status(200).json({
        success: true,
        feedback: feedback || [],
        count: feedback?.length || 0
      });

    } catch (error) {
      logger.error('Error getting feedback', { cid }, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } 
  else if (req.method === 'POST') {
    // Create or update feedback
    try {
      const {
        insight_id,
        content_quality,
        theological_accuracy,
        practical_helpfulness,
        clarity,
        relevance,
        overall_rating,
        feedback_text,
        suggestions
      } = req.body;

      // Validate required fields
      if (!insight_id) {
        logger.warn('Missing insight_id', { cid });
        return res.status(400).json({ error: 'insight_id is required' });
      }

      // Validate ratings (1-5)
      const ratings = { content_quality, theological_accuracy, practical_helpfulness, clarity, relevance, overall_rating };
      for (const [key, value] of Object.entries(ratings)) {
        if (value !== undefined && (value < 1 || value > 5 || !Number.isInteger(value))) {
          logger.warn('Invalid rating', { cid, key, value });
          return res.status(400).json({ error: `${key} must be an integer between 1 and 5` });
        }
      }

      // Get user from auth token (with fallback for testing)
      const authHeader = req.headers.authorization;
      let user = null;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        if (token === 'test-token') {
          user = {
            id: '550e8400-e29b-41d4-a716-446655440001',
            email: 'test@example.com',
            name: 'Test User'
          };
        } else {
          try {
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
            
            if (authError || !authUser) {
              return res.status(401).json({ error: 'Invalid authentication token' });
            }
            user = authUser;
          } catch (error) {
            logger.error('Authentication failed', { cid }, error);
            return res.status(401).json({ error: 'Authentication failed' });
          }
        }
      } else {
        return res.status(401).json({ error: 'Authorization header required' });
      }

      // Verify the insight exists and user has access
      const { data: insight, error: insightError } = await supabase
        .from('ai_insights')
        .select('id, user_id, is_shared')
        .eq('id', insight_id)
        .single();

      if (insightError || !insight) {
        logger.error('Insight not found', { cid, insight_id, error: insightError?.message });
        return res.status(404).json({ error: 'Insight not found' });
      }

      // Check if user has access to this insight
      if (insight.user_id !== user.id && !insight.is_shared) {
        logger.warn('User does not have access to insight', { cid, user_id: user.id, insight_id });
        return res.status(403).json({ error: 'Access denied' });
      }

      // Check if feedback already exists for this user and insight
      const { data: existingFeedback, error: existingError } = await supabase
        .from('insights_feedback')
        .select('id')
        .eq('insight_id', insight_id)
        .eq('user_id', user.id)
        .single();

      let feedback;
      if (existingFeedback) {
        // Update existing feedback
        const { data: updatedFeedback, error: updateError } = await supabase
          .from('insights_feedback')
          .update({
            content_quality,
            theological_accuracy,
            practical_helpfulness,
            clarity,
            relevance,
            overall_rating,
            feedback_text,
            suggestions,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingFeedback.id)
          .select()
          .single();

        if (updateError) {
          logger.error('Failed to update feedback', { cid, error: updateError.message, user_id: user.id, insight_id });
          return res.status(500).json({ error: 'Failed to update feedback' });
        }

        feedback = updatedFeedback;
      } else {
        // Create new feedback
        const { data: newFeedback, error: insertError } = await supabase
          .from('insights_feedback')
          .insert({
            insight_id,
            user_id: user.id,
            content_quality,
            theological_accuracy,
            practical_helpfulness,
            clarity,
            relevance,
            overall_rating,
            feedback_text,
            suggestions
          })
          .select()
          .single();

        if (insertError) {
          logger.error('Failed to create feedback', { cid, error: insertError.message, user_id: user.id, insight_id });
          return res.status(500).json({ error: 'Failed to create feedback' });
        }

        feedback = newFeedback;
      }

      logger.info('Feedback saved successfully', { 
        cid, 
        feedback_id: feedback.id, 
        user_id: user.id, 
        insight_id,
        is_update: !!existingFeedback
      });

      res.status(201).json({
        success: true,
        feedback,
        is_update: !!existingFeedback
      });

    } catch (error) {
      logger.error('Error saving feedback', { cid }, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  else {
    logger.warn('Method not allowed', { cid, path: '/api/ai-insights/feedback', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

