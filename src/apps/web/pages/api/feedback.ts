import { NextApiRequest, NextApiResponse } from 'next';
import { AnalyticsService } from '../../lib/analytics-service';
import { createServerSupabaseClient } from '../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get authenticated user from Authorization header
  const authHeader = req.headers.authorization;
  let user = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const serverSupabase = createServerSupabaseClient(token);
    const { data: { user: authUser }, error: authError } = await serverSupabase.auth.getUser();
    if (!authError && authUser) {
      user = authUser;
    }
  }

  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { messageId, feedback, conversationId, objectionType } = req.body;
    
    if (!messageId || !feedback || !['positive', 'negative'].includes(feedback)) {
      return res.status(400).json({ error: 'Valid messageId and feedback required' });
    }

    // Track feedback in analytics
    AnalyticsService.trackFeedback(
      user.id,
      feedback,
      objectionType,
      undefined, // sessionId
      conversationId
    );

    console.log(`Feedback tracked: ${feedback} for message ${messageId}`);

    res.status(200).json({ 
      success: true,
      message: 'Feedback recorded successfully'
    });
  } catch (error) {
    console.error('Error recording feedback:', error);
    res.status(500).json({ error: 'Failed to record feedback' });
  }
} 