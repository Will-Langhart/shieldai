import { NextApiRequest, NextApiResponse } from 'next';
import { StripeService } from '../../../lib/stripe';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { planName, paymentMethodId } = req.body;

    if (!planName || !['basic', 'premium'].includes(planName)) {
      return res.status(400).json({ error: 'Invalid plan name' });
    }

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

    const result = await StripeService.createSubscription(
      user.id,
      planName as 'basic' | 'premium',
      paymentMethodId
    );

    res.status(200).json(result);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
} 