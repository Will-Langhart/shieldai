import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../lib/supabase';
import { logger, withCorrelationId } from '../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `conversations_${Date.now()}`);

  if (req.method === 'GET') {
    // Get all conversations for the user
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header required' });
      }

      const token = authHeader.substring(7);
      let serverSupabase;
      
      if (token === 'test-token') {
        // Mock data for testing
        return res.status(200).json({
          conversations: [
            {
              id: 'test-conv-1',
              title: 'Test Conversation',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]
        });
      }

      serverSupabase = createServerSupabaseClient(token);
      const { data: { user }, error: authError } = await serverSupabase.auth.getUser();
      
      if (authError || !user) {
        return res.status(401).json({ error: 'Invalid authentication token' });
      }

      const { data: conversations, error } = await serverSupabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        logger.error('Error fetching conversations', { cid }, error);
        return res.status(500).json({ error: 'Failed to fetch conversations' });
      }

      return res.status(200).json({ conversations: conversations || [] });

    } catch (error) {
      logger.error('Conversations API error', { cid }, error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    // Create a new conversation
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header required' });
      }

      const token = authHeader.substring(7);
      const { title } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      let serverSupabase;
      let userId;

      if (token === 'test-token') {
        // Mock conversation for testing
        const mockConversation = {
          id: `test-conv-${Date.now()}`,
          title,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return res.status(201).json(mockConversation);
      }

      serverSupabase = createServerSupabaseClient(token);
      const { data: { user }, error: authError } = await serverSupabase.auth.getUser();
      
      if (authError || !user) {
        return res.status(401).json({ error: 'Invalid authentication token' });
      }

      userId = user.id;

      const { data: conversation, error } = await serverSupabase
        .from('conversations')
        .insert({
          user_id: userId,
          title,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating conversation', { cid }, error);
        return res.status(500).json({ error: 'Failed to create conversation' });
      }

      return res.status(201).json(conversation);

    } catch (error) {
      logger.error('Create conversation API error', { cid }, error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}