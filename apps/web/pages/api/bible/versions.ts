import { NextApiRequest, NextApiResponse } from 'next';
import { bibleService } from '../../../lib/bible-service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const versions = await bibleService.getBibleVersions();
    res.status(200).json({ versions });
  } catch (error) {
    console.error('Error fetching Bible versions:', error);
    res.status(500).json({ error: 'Failed to fetch Bible versions' });
  }
} 