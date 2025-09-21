import { NextApiRequest, NextApiResponse } from 'next';
import { EnhancedStripeService } from '../../../lib/enhanced-stripe-service';
import { createServerSupabaseClient } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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

    const { feature, incrementUsage = false } = req.body;

    if (!feature) {
      return res.status(400).json({ error: 'Feature name is required' });
    }

    const result = await EnhancedStripeService.checkFeatureAccess(
      user.id, 
      feature, 
      incrementUsage
    );
    
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error checking feature access:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check feature access' 
    });
  }
}