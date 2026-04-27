import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabase';
import { logger, withCorrelationId } from '../../../lib/logger';

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
      const serverSupabase = createServerSupabaseClient(token);
      const { data: { user }, error: authError } = await serverSupabase.auth.getUser();

      if (authError || !user) {
        return res.status(401).json({ error: 'Invalid authentication token' });
      }

      const { data: messages, error } = await serverSupabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Error fetching messages', { cid }, error);
        return res.status(500).json({ error: 'Failed to fetch messages' });
      }

      logger.info('Retrieved messages from Supabase', { cid, conversationId: id, count: messages?.length || 0 });
      return res.status(200).json({ messages: messages || [] });

    } catch (error) {
      logger.error('Get conversation messages failed', { cid }, error);
      return res.status(500).json({ error: 'Failed to get conversation messages' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
