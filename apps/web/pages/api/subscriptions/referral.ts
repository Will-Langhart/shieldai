import { NextApiRequest, NextApiResponse } from 'next';
import { EnhancedStripeService } from '../../../lib/enhanced-stripe-service';
import { createServerSupabaseClient } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    if (req.method === 'GET') {
      // Get or create referral code for user
      const referralCode = await EnhancedStripeService.createReferralCode(user.id);
      
      res.status(200).json({
        success: true,
        referralCode
      });
    } else if (req.method === 'POST') {
      // Apply referral code
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ error: 'Referral code is required' });
      }

      const result = await EnhancedStripeService.processReferral(code, user.id);
      
      res.status(200).json(result);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling referral:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to handle referral' 
    });
  }
}