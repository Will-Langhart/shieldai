import { NextApiRequest, NextApiResponse } from 'next';
import { StripeService } from '../../../lib/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const plans = await StripeService.getSubscriptionPlans();
    res.status(200).json({ plans });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
} 