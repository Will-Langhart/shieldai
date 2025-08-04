import { NextApiRequest, NextApiResponse } from 'next';
import { ChatService } from '../../lib/chat-service';
import { supabase } from '../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get authenticated user from Authorization header
  const authHeader = req.headers.authorization;
  let user = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    if (!authError && authUser) {
      user = authUser;
    }
  }

  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.method === 'GET') {
    try {
      const conversations = await ChatService.getConversations();
      res.status(200).json(conversations);
    } catch (error) {
      console.error('Error getting conversations:', error);
      res.status(500).json({ error: 'Failed to get conversations' });
    }
  } else if (req.method === 'POST') {
    try {
      const { title } = req.body;
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }
      const conversation = await ChatService.createConversation(title);
      res.status(201).json(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({ error: 'Failed to create conversation' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { conversationId, title } = req.body;
      if (!conversationId || !title) {
        return res.status(400).json({ error: 'Conversation ID and title are required' });
      }
      await ChatService.updateConversationTitle(conversationId, title);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating conversation:', error);
      res.status(500).json({ error: 'Failed to update conversation' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { conversationId } = req.query;
      if (!conversationId || typeof conversationId !== 'string') {
        return res.status(400).json({ error: 'Conversation ID is required' });
      }
      await ChatService.deleteConversation(conversationId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      res.status(500).json({ error: 'Failed to delete conversation' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 