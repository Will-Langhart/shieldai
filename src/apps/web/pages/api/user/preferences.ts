import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabase';

export type Denomination = 'Protestant' | 'Catholic' | 'Oriental Orthodox' | 'Eastern Orthodox';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  const token = authHeader.substring(7);
  const serverSupabase = createServerSupabaseClient(token);
  const { data: { user }, error: authError } = await serverSupabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }

  if (req.method === 'GET') {
    const { data, error } = await serverSupabase
      .from('users')
      .select('preferences')
      .eq('id', user.id)
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch preferences' });
    }

    return res.status(200).json({ preferences: data?.preferences ?? {} });
  }

  if (req.method === 'PUT') {
    const { denomination } = req.body ?? {};

    const validDenominations: Denomination[] = [
      'Protestant',
      'Catholic',
      'Oriental Orthodox',
      'Eastern Orthodox',
    ];

    if (denomination !== null && denomination !== undefined && !validDenominations.includes(denomination)) {
      return res.status(400).json({ error: 'Invalid denomination' });
    }

    // Fetch current preferences then merge
    const { data: current } = await serverSupabase
      .from('users')
      .select('preferences')
      .eq('id', user.id)
      .single();

    const merged = {
      ...(current?.preferences ?? {}),
      denomination: denomination ?? null,
    };

    const { error } = await serverSupabase
      .from('users')
      .update({ preferences: merged, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to update preferences' });
    }

    return res.status(200).json({ preferences: merged });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
