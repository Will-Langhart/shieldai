import { NextApiRequest, NextApiResponse } from 'next';
import { bibleService } from '../../../lib/bible-service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { context, versionId = 'de4e12af7f28f599-02' } = req.body;

    if (!context || typeof context !== 'string') {
      return res.status(400).json({ error: 'Context parameter is required' });
    }

    const suggestions = await bibleService.getVerseSuggestions(
      context,
      versionId as string
    );

    res.status(200).json({ suggestions });
  } catch (error) {
    console.error('Error getting verse suggestions:', error);
    res.status(500).json({ error: 'Failed to get verse suggestions' });
  }
} 