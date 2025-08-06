import { NextApiRequest, NextApiResponse } from 'next';
import { EnhancedStripeService } from '../../../lib/enhanced-stripe-service';
import { createServerSupabaseClient } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from auth token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const serverSupabase = createServerSupabaseClient(token);
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const usage = await EnhancedStripeService.getCurrentUsage(user.id);
    
    res.status(200).json({
      success: true,
      usage
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch usage data' 
    });
  }
}