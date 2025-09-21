import { NextApiRequest, NextApiResponse } from 'next';
import { AnalyticsService } from '../../lib/analytics-service';
import { createServerSupabaseClient } from '../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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

  if (req.method === 'GET') {
    try {
      const { timeRange } = req.query;
      
      let summary;
      if (timeRange && typeof timeRange === 'string') {
        const [start, end] = timeRange.split(',');
        summary = AnalyticsService.getAnalyticsSummary({
          start: new Date(start),
          end: new Date(end)
        });
      } else {
        summary = AnalyticsService.getAnalyticsSummary();
      }

      const insights = AnalyticsService.getInsights();

      res.status(200).json({
        summary,
        insights,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting analytics:', error);
      res.status(500).json({ error: 'Failed to get analytics' });
    }
  } else if (req.method === 'POST') {
    try {
      const { feedback, objectionType, sessionId, conversationId } = req.body;
      
      if (!feedback || !['positive', 'negative', 'neutral'].includes(feedback)) {
        return res.status(400).json({ error: 'Valid feedback required' });
      }

      AnalyticsService.trackFeedback(
        user.id,
        feedback,
        objectionType,
        sessionId,
        conversationId
      );

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error tracking feedback:', error);
      res.status(500).json({ error: 'Failed to track feedback' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 