import { NextApiRequest, NextApiResponse } from 'next';
import { StripeService } from '../../../lib/stripe';
import { supabase } from '../../../lib/supabase';

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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const subscription = await StripeService.getUserSubscription(user.id);
    const isInTrial = await StripeService.isInTrialPeriod(user.id);
    const hasActiveSubscription = await StripeService.hasActiveSubscription(user.id);

    res.status(200).json({
      subscription,
      isInTrial,
      hasActiveSubscription,
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
} 