import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { logger, withCorrelationId } from '../../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `insights_responses_${Date.now()}`);
  
  if (req.method === 'GET') {
    // Get responses for an insight
    try {
      const { insight_id, user_id, response_type, limit = '50', offset = '0' } = req.query;

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
        .from('insights_responses')
        .select(`
          *,
          ai_insights!inner(
            id,
            passage_reference,
            is_shared,
            user_id
          )
        `)
        .eq('insight_id', insight_id as string)
        .order('created_at', { ascending: false })
        .limit(parseInt(limit as string))
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      // Filter by user if specified
      if (user_id) {
        query = query.eq('user_id', user_id as string);
      }

      // Filter by response type if specified
      if (response_type) {
        query = query.eq('response_type', response_type as string);
      }

      const { data: responses, error: responsesError } = await query;

      if (responsesError) {
        logger.error('Failed to get responses', { cid, error: responsesError.message, insight_id });
        return res.status(500).json({ error: 'Failed to get responses' });
      }

      logger.info('Responses retrieved successfully', { 
        cid, 
        insight_id, 
        response_count: responses?.length || 0 
      });

      res.status(200).json({
        success: true,
        responses: responses || [],
        count: responses?.length || 0
      });

    } catch (error) {
      logger.error('Error getting responses', { cid }, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } 
  else if (req.method === 'POST') {
    // Create a new response
    try {
      const {
        insight_id,
        response_text,
        response_type,
        is_helpful,
        is_accurate,
        rating
      } = req.body;

      // Validate required fields
      if (!insight_id || !response_text || !response_type) {
        logger.warn('Missing required fields', { cid, fields: { insight_id, response_text, response_type } });
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Validate response type
      const validResponseTypes = ['comment', 'question', 'prayer', 'reflection', 'application', 'correction', 'appreciation'];
      if (!validResponseTypes.includes(response_type)) {
        logger.warn('Invalid response type', { cid, response_type });
        return res.status(400).json({ error: 'Invalid response type' });
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

      // Create the response
      const { data: response, error: insertError } = await supabase
        .from('insights_responses')
        .insert({
          insight_id,
          user_id: user.id,
          response_text,
          response_type,
          is_helpful,
          is_accurate,
          rating
        })
        .select()
        .single();

      if (insertError) {
        logger.error('Failed to create response', { cid, error: insertError.message, user_id: user.id, insight_id });
        return res.status(500).json({ error: 'Failed to create response' });
      }

      logger.info('Response created successfully', { 
        cid, 
        response_id: response.id, 
        user_id: user.id, 
        insight_id 
      });

      res.status(201).json({
        success: true,
        response
      });

    } catch (error) {
      logger.error('Error creating response', { cid }, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  else {
    logger.warn('Method not allowed', { cid, path: '/api/ai-insights/responses', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

