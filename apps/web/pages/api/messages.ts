import { NextApiRequest, NextApiResponse } from 'next';
import { ChatService } from '../../lib/chat-service';
import { createServerSupabaseClient } from '../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get authenticated user from Authorization header
  const authHeader = req.headers.authorization;
  let user = null;
  let serverSupabase: any = undefined;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    serverSupabase = createServerSupabaseClient(token);
    const { data: { user: authUser }, error: authError } = await serverSupabase.auth.getUser();
    if (!authError && authUser) {
      user = authUser;
      console.log('Authenticated user for messages:', user.id, user.email);
    } else {
      console.error('Auth error:', authError);
    }
  }

  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.method === 'GET') {
    try {
      const { conversationId } = req.query;
      if (!conversationId || typeof conversationId !== 'string') {
        return res.status(400).json({ error: 'Conversation ID is required' });
      }
      const messages = await ChatService.getMessages(conversationId, serverSupabase);
      res.status(200).json(messages);
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({ error: 'Failed to get messages' });
    }
  } else if (req.method === 'POST') {
    try {
      const { conversationId, content, role, mode } = req.body;
      if (!conversationId || !content || !role) {
        return res.status(400).json({ error: 'Conversation ID, content, and role are required' });
      }
      const message = await ChatService.addMessage(conversationId, content, role, mode, serverSupabase);
      res.status(201).json(message);
    } catch (error) {
      console.error('Error adding message:', error);
      res.status(500).json({ error: 'Failed to add message' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 