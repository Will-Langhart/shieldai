import { NextApiRequest, NextApiResponse } from 'next';
import { ChatService } from '../../lib/chat-service';
import { createServerSupabaseClient } from '../../lib/supabase';
import { logger, withCorrelationId } from '../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `conversations_${Date.now()}`);
  const startedAt = Date.now();
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
      logger.info('Authenticated (conversations)', { cid, userId: user.id, email: user.email });
    } else {
      logger.error('Auth error (conversations)', { cid }, authError);
    }
  }

  if (!user) {
    logger.warn('Unauthenticated (conversations)', { cid });
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.method === 'GET') {
    try {
      const page = Math.max(1, parseInt(String(req.query.page || '1')) || 1);
      const pageSizeRaw = parseInt(String(req.query.pageSize || '20')) || 20;
      const pageSize = Math.min(100, Math.max(1, pageSizeRaw));
      const conversations = await ChatService.getConversationsPaged(page, pageSize, serverSupabase);
      logger.info('Conversations fetched', { cid, ms: Date.now() - startedAt, count: conversations?.items?.length || 0, page, pageSize, total: conversations?.total || 0 });
      res.status(200).json(conversations);
    } catch (error) {
      logger.error('Get conversations failed', { cid }, error);
      res.status(500).json({ error: 'Failed to get conversations' });
    }
  } else if (req.method === 'POST') {
    try {
      const { title } = req.body;
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        logger.warn('Create conversation missing/invalid title', { cid });
        return res.status(400).json({ error: 'Title is required' });
      }
      const safeTitle = title.trim().slice(0, 200);
      const conversation = await ChatService.createConversation(safeTitle, serverSupabase);
      logger.info('Conversation created', { cid, convId: conversation?.id });
      res.status(201).json(conversation);
    } catch (error) {
      logger.error('Create conversation failed', { cid }, error);
      res.status(500).json({ error: 'Failed to create conversation' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { conversationId, title } = req.body;
      if (!conversationId || typeof conversationId !== 'string' || !title || typeof title !== 'string') {
        logger.warn('Update conversation missing fields', { cid, hasId: !!conversationId, hasTitle: !!title });
        return res.status(400).json({ error: 'Conversation ID and title are required' });
      }
      await ChatService.updateConversationTitle(conversationId, title.trim().slice(0, 200), serverSupabase);
      logger.info('Conversation updated', { cid, convId: conversationId });
      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Update conversation failed', { cid }, error);
      res.status(500).json({ error: 'Failed to update conversation' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { conversationId } = req.query;
      if (!conversationId || typeof conversationId !== 'string') {
        logger.warn('Delete conversation missing id', { cid });
        return res.status(400).json({ error: 'Conversation ID is required' });
      }
      await ChatService.deleteConversation(conversationId, serverSupabase);
      logger.info('Conversation deleted', { cid, convId: conversationId });
      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Delete conversation failed', { cid }, error);
      res.status(500).json({ error: 'Failed to delete conversation' });
    }
  } else {
    logger.warn('Method not allowed (conversations)', { cid, method: req.method });
    res.status(405).json({ error: 'Method not allowed' });
  }
} 