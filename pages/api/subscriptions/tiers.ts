import { NextApiRequest, NextApiResponse } from 'next';
import { EnhancedStripeService } from '../../../lib/enhanced-stripe-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const tiers = await EnhancedStripeService.getSubscriptionTiers();
    
    res.status(200).json({
      success: true,
      tiers
    });
  } catch (error) {
    console.error('Error fetching subscription tiers:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch subscription tiers' 
    });
  }
}