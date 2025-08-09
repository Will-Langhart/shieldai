import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    const token = authHeader.replace('Bearer ', '');
    const supabase = createServerSupabaseClient(token);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { expoPushToken, deviceInfo } = req.body || {};
    if (!expoPushToken || typeof expoPushToken !== 'string') {
      return res.status(400).json({ error: 'expoPushToken is required' });
    }

    // Store token in a dedicated table if exists; else upsert into user preferences
    try {
      const { error: upsertError } = await supabase
        .from('user_devices')
        .upsert({
          user_id: user.id,
          expo_push_token: expoPushToken,
          device_info: deviceInfo || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,expo_push_token' as any });

      if (upsertError) {
        // Fallback: store on users.preferences JSON
        await supabase
          .from('users')
          .update({
            preferences: {
              ...(user.user_metadata?.preferences || {}),
              expoPushToken
            }
          })
          .eq('id', user.id);
      }
    } catch (_e) {
      // ignore errors to avoid breaking client
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Notifications register error:', error);
    return res.status(500).json({ error: 'Failed to register device' });
  }
}


