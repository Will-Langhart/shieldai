import { NextApiRequest, NextApiResponse } from 'next';
import { isTestToken } from '../../../lib/test-token';
import { supabase } from '../../../lib/supabase';
import { logger, withCorrelationId } from '../../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `insights_interactions_${Date.now()}`);
  
  if (req.method === 'GET') {
    // Get interactions for an insight
    try {
      const { insight_id, user_id, interaction_type, limit = '50', offset = '0' } = req.query;

      if (!insight_id) {
        logger.warn('Missing insight_id parameter', { cid });
        return res.status(400).json({ error: 'insight_id parameter is required' });
      }

      // Get user from auth token (with fallback for testing)
      const authHeader = req.headers.authorization;
      let user = null;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        if (isTestToken(token)) {
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
        .from('insights_interactions')
        .select('*')
        .eq('insight_id', insight_id as string)
        .order('created_at', { ascending: false })
        .limit(parseInt(limit as string))
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      // Filter by user if specified
      if (user_id) {
        query = query.eq('user_id', user_id as string);
      }

      // Filter by interaction type if specified
      if (interaction_type) {
        query = query.eq('interaction_type', interaction_type as string);
      }

      const { data: interactions, error: interactionsError } = await query;

      if (interactionsError) {
        logger.error('Failed to get interactions', { cid, error: interactionsError.message, insight_id });
        return res.status(500).json({ error: 'Failed to get interactions' });
      }

      logger.info('Interactions retrieved successfully', { 
        cid, 
        insight_id, 
        interaction_count: interactions?.length || 0 
      });

      res.status(200).json({
        success: true,
        interactions: interactions || [],
        count: interactions?.length || 0
      });

    } catch (error) {
      logger.error('Error getting interactions', { cid }, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } 
  else if (req.method === 'POST') {
    // Create a new interaction
    try {
      const {
        insight_id,
        interaction_type,
        interaction_data = {},
        session_id
      } = req.body;

      // Validate required fields
      if (!insight_id || !interaction_type) {
        logger.warn('Missing required fields', { cid, fields: { insight_id, interaction_type } });
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Validate interaction type
      const validInteractionTypes = [
        'view', 'like', 'dislike', 'share', 'copy', 'bookmark', 'unbookmark', 
        'favorite', 'unfavorite', 'report', 'flag', 'download', 'print'
      ];
      if (!validInteractionTypes.includes(interaction_type)) {
        logger.warn('Invalid interaction type', { cid, interaction_type });
        return res.status(400).json({ error: 'Invalid interaction type' });
      }

      // Get user from auth token (with fallback for testing)
      const authHeader = req.headers.authorization;
      let user = null;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        if (isTestToken(token)) {
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

      // Handle special cases for interactions that should update the insight
      if (interaction_type === 'favorite') {
        const { error: updateError } = await supabase
          .from('ai_insights')
          .update({ is_favorite: true })
          .eq('id', insight_id)
          .eq('user_id', user.id);

        if (updateError) {
          logger.error('Failed to update favorite status', { cid, error: updateError.message, insight_id });
        }
      } else if (interaction_type === 'unfavorite') {
        const { error: updateError } = await supabase
          .from('ai_insights')
          .update({ is_favorite: false })
          .eq('id', insight_id)
          .eq('user_id', user.id);

        if (updateError) {
          logger.error('Failed to update favorite status', { cid, error: updateError.message, insight_id });
        }
      } else if (interaction_type === 'share') {
        const { error: updateError } = await supabase
          .from('ai_insights')
          .update({ is_shared: true })
          .eq('id', insight_id)
          .eq('user_id', user.id);

        if (updateError) {
          logger.error('Failed to update shared status', { cid, error: updateError.message, insight_id });
        }
      }

      // Create the interaction
      const { data: interaction, error: insertError } = await supabase
        .from('insights_interactions')
        .insert({
          insight_id,
          user_id: user.id,
          interaction_type,
          interaction_data,
          session_id,
          ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          user_agent: req.headers['user-agent']
        })
        .select()
        .single();

      if (insertError) {
        logger.error('Failed to create interaction', { cid, error: insertError.message, user_id: user.id, insight_id });
        return res.status(500).json({ error: 'Failed to create interaction' });
      }

      logger.info('Interaction created successfully', { 
        cid, 
        interaction_id: interaction.id, 
        user_id: user.id, 
        insight_id,
        interaction_type
      });

      res.status(201).json({
        success: true,
        interaction
      });

    } catch (error) {
      logger.error('Error creating interaction', { cid }, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  else {
    logger.warn('Method not allowed', { cid, path: '/api/ai-insights/interactions', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

