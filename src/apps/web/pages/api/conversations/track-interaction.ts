import { NextApiRequest, NextApiResponse } from 'next';
import { enhancedConversationStorage } from '../../../lib/enhanced-conversation-storage';
import { logger, withCorrelationId } from '../../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `track_interaction_${Date.now()}`);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messageId, interaction } = req.body;

    if (!messageId || !interaction) {
      return res.status(400).json({ 
        error: 'Missing required fields: messageId and interaction' 
      });
    }

    if (!['copy', 'share', 'bookmark', 'rate', 'feedback', 'reaction'].includes(interaction.type)) {
      return res.status(400).json({ 
        error: 'Invalid interaction type. Must be one of: copy, share, bookmark, rate, feedback, reaction' 
      });
    }

    // Track the user interaction
    enhancedConversationStorage.trackUserInteraction(messageId, interaction);

    logger.info('User interaction tracked', { 
      cid, 
      messageId, 
      interactionType: interaction.type 
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Interaction tracked successfully' 
    });

  } catch (error) {
    logger.error('Error tracking user interaction', { cid }, error);
    return res.status(500).json({ 
      error: 'Failed to track interaction' 
    });
  }
}
