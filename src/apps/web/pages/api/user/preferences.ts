import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabase';

export type Denomination = 'Protestant' | 'Catholic' | 'Oriental Orthodox' | 'Eastern Orthodox';

const VALID_DENOMINATIONS: Denomination[] = [
  'Protestant',
  'Catholic',
  'Oriental Orthodox',
  'Eastern Orthodox',
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  const token = authHeader.substring(7);

  // Resolve the authenticated user from the JWT
  const serverSupabase = createServerSupabaseClient(token);
  const { data: { user }, error: authError } = await serverSupabase.auth.getUser();

  if (authError || !user) {
    console.error('[preferences] auth failed:', authError?.message);
    return res.status(401).json({ error: 'Invalid authentication token' });
  }

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await serverSupabase
      .from('users')
      .select('preferences')
      .eq('id', user.id)
      .maybeSingle();                 // maybeSingle: no error if row is missing

    if (error) {
      console.error('[preferences] GET error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch preferences' });
    }

    return res.status(200).json({ preferences: data?.preferences ?? {} });
  }

  // ── PUT ──────────────────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const { denomination } = req.body ?? {};

    if (denomination !== null && denomination !== undefined && !VALID_DENOMINATIONS.includes(denomination)) {
      return res.status(400).json({ error: 'Invalid denomination' });
    }

    // Fetch current preferences (may not exist yet)
    const { data: current } = await serverSupabase
      .from('users')
      .select('preferences')
      .eq('id', user.id)
      .maybeSingle();

    const merged = {
      ...(current?.preferences ?? {}),
      denomination: denomination ?? null,
    };

    // Upsert: creates the row if missing, updates if present
    const { error } = await serverSupabase
      .from('users')
      .upsert(
        {
          id: user.id,
          email: user.email ?? '',
          preferences: merged,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('[preferences] PUT upsert error:', error.message, error.details);
      return res.status(500).json({ error: 'Failed to update preferences', details: error.message });
    }

    return res.status(200).json({ preferences: merged });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
