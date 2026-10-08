import { NextApiRequest, NextApiResponse } from 'next';
import { isTestToken } from '../../lib/test-token';
import { ChatService } from '../../lib/chat-service';
import { createServerSupabaseClient } from '../../lib/supabase';
import { logger, withCorrelationId } from '../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `messages_${Date.now()}`);
  const startedAt = Date.now();
  // Get authenticated user from Authorization header
  const authHeader = req.headers.authorization;
  let user = null;
  let serverSupabase: any = undefined;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    // Check for test token first
    if (isTestToken(token)) {
      user = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'test@example.com',
        name: 'Test User'
      };
      logger.info('Using test user for messages API', { cid, userId: user.id });
    } else {
      serverSupabase = createServerSupabaseClient(token);
      const { data: { user: authUser }, error: authError } = await serverSupabase.auth.getUser();
      if (!authError && authUser) {
        user = authUser;
        logger.info('Authenticated (messages)', { cid, userId: user.id, email: user.email });
      } else {
        logger.error('Auth error (messages)', { cid }, authError);
      }
    }
  }

  if (!user) {
    logger.warn('Unauthenticated (messages)', { cid });
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.method === 'GET') {
    try {
      const { conversationId } = req.query;
      if (!conversationId || typeof conversationId !== 'string') {
        logger.warn('Messages GET missing conversationId', { cid });
        return res.status(400).json({ error: 'Conversation ID is required' });
      }
      const page = Math.max(1, parseInt(String(req.query.page || '1')) || 1);
      const pageSizeRaw = parseInt(String(req.query.pageSize || '50')) || 50;
      const pageSize = Math.min(200, Math.max(1, pageSizeRaw));
      const messages = await ChatService.getMessagesPaged(conversationId, page, pageSize, serverSupabase);
      logger.info('Messages fetched', { cid, ms: Date.now() - startedAt, count: messages?.items?.length || 0, page, pageSize, total: messages?.total || 0 });
      res.status(200).json(messages);
    } catch (error) {
      logger.error('Get messages failed', { cid }, error);
      res.status(500).json({ error: 'Failed to get messages' });
    }
  } else if (req.method === 'POST') {
    try {
      const { conversationId, content, role, mode } = req.body;
      if (!conversationId || typeof conversationId !== 'string' || !content || typeof content !== 'string' || !role) {
        logger.warn('Messages POST missing fields', { cid, hasConvId: !!conversationId, hasContent: !!content, role });
        return res.status(400).json({ error: 'Conversation ID, content, and role are required' });
      }
      const safeContent = content.slice(0, 8000);
      const message = await ChatService.addMessage(conversationId, safeContent, role, mode, serverSupabase, undefined, undefined, undefined, user);
      logger.info('Message added', { cid, convId: conversationId, id: message?.id });
      res.status(201).json(message);
    } catch (error) {
      logger.error('Add message failed', { cid }, error);
      res.status(500).json({ 
        error: 'Failed to add message', 
        details: error instanceof Error ? error.message : JSON.stringify(error)
      });
    }
  } else {
    logger.warn('Method not allowed (messages)', { cid, method: req.method });
    res.status(405).json({ error: 'Method not allowed' });
  }
} 
