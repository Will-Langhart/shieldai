import { NextApiRequest, NextApiResponse } from 'next';
import { ChatService } from '../../lib/chat-service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const { conversationId } = req.query;
      if (!conversationId || typeof conversationId !== 'string') {
        return res.status(400).json({ error: 'Conversation ID is required' });
      }
      const messages = await ChatService.getMessages(conversationId);
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
      const message = await ChatService.addMessage(conversationId, content, role, mode);
      res.status(201).json(message);
    } catch (error) {
      console.error('Error adding message:', error);
      res.status(500).json({ error: 'Failed to add message' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 