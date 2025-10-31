import { NextApiRequest, NextApiResponse } from 'next';
import { enhancedConversationStorage } from '../../../lib/enhanced-conversation-storage';
import { logger, withCorrelationId } from '../../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `conversation_analytics_${Date.now()}`);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, conversationId, type } = req.query;

    if (type === 'user-insights' && userId) {
      // Get user-specific insights
      const insights = enhancedConversationStorage.getUserInsights(userId as string);
      
      logger.info('Retrieved user insights', { cid, userId });
      return res.status(200).json({ insights });

    } else if (type === 'conversation-analytics' && conversationId) {
      // Get specific conversation analytics
      const analytics = enhancedConversationStorage.getConversationAnalytics(conversationId as string);
      
      if (!analytics) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      
      logger.info('Retrieved conversation analytics', { cid, conversationId });
      return res.status(200).json({ analytics });

    } else if (type === 'overall-analytics') {
      // Get overall platform analytics
      const analytics = enhancedConversationStorage.getAnalytics();
      
      logger.info('Retrieved overall analytics', { cid });
      return res.status(200).json({ analytics });

    } else {
      return res.status(400).json({ 
        error: 'Invalid request. Specify type (user-insights, conversation-analytics, overall-analytics) and required parameters' 
      });
    }

  } catch (error) {
    logger.error('Error retrieving analytics', { cid }, error);
    return res.status(500).json({ 
      error: 'Failed to retrieve analytics' 
    });
  }
}
