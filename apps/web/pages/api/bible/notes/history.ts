import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reference, userId, limit = 10 } = req.query;

    if (!reference || typeof reference !== 'string') {
      return res.status(400).json({ error: 'Reference parameter is required' });
    }

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get note history for the specific verse reference
    const { data: notes, error } = await supabase
      .from('bible_notes')
      .select('*')
      .eq('reference', reference)
      .eq('user_id', userId)
      .order('last_modified', { ascending: false })
      .limit(parseInt(limit as string));

    if (error) {
      console.error('Error fetching note history:', error);
      return res.status(500).json({ error: 'Failed to fetch note history' });
    }

    res.status(200).json({ notes: notes || [] });
  } catch (error) {
    console.error('Error handling note history request:', error);
    res.status(500).json({ error: 'Failed to get note history' });
  }
}