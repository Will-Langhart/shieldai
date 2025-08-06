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
    const { category, versionId = 'de4e12af7f28f599-02' } = req.query;

    if (!category || typeof category !== 'string') {
      return res.status(400).json({ error: 'Category parameter is required' });
    }

    const verses = await bibleService.getApologeticsVerses(
      versionId as string,
      category
    );

    res.status(200).json({ verses });
  } catch (error) {
    console.error('Error fetching apologetics verses:', error);
    res.status(500).json({ error: 'Failed to fetch apologetics verses' });
  }
} 