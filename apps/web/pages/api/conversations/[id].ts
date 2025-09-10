import { NextApiRequest, NextApiResponse } from 'next';
import { logger, withCorrelationId } from '../../../lib/logger';
import { conversationStorage } from '../../../lib/conversation-storage';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `conversation_${Date.now()}`);

  if (req.method === 'GET') {
    try {
      const { id } = req.query;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Conversation ID is required' });
      }

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header required' });
      }

      const token = authHeader.substring(7);
      
      if (token === 'test-token') {
        // Get messages for test user
        const messages = conversationStorage.getMessages(id);
        logger.info('Retrieved messages from storage', { cid, conversationId: id, count: messages.length });
        return res.status(200).json({ messages });
      }

      // For other tokens, you would implement proper authentication
      return res.status(401).json({ error: 'Invalid authentication token' });

    } catch (error) {
      logger.error('Get conversation messages failed', { cid }, error);
      return res.status(500).json({ error: 'Failed to get conversation messages' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}