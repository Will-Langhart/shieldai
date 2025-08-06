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
    const { versionId = 'de4e12af7f28f599-02' } = req.query;

    const dailyVerse = await bibleService.getDailyVerse(versionId as string);

    if (!dailyVerse) {
      return res.status(404).json({ error: 'Daily verse not found' });
    }

    res.status(200).json({ verse: dailyVerse });
  } catch (error) {
    console.error('Error fetching daily verse:', error);
    res.status(500).json({ error: 'Failed to fetch daily verse' });
  }
} 