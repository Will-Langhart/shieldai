import { NextApiRequest, NextApiResponse } from 'next';
import { bibleService } from '../../../lib/bible-service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (req.method === 'GET') {
      const preferences = await bibleService.getUserPreferences(userId);
      res.status(200).json(preferences);
    } else if (req.method === 'PUT') {
      const preferences = req.body;
      await bibleService.updateUserPreferences(userId, preferences);
      res.status(200).json({ message: 'Preferences updated successfully' });
    }
  } catch (error) {
    console.error('Error handling preferences:', error);
    res.status(500).json({ error: 'Failed to handle preferences' });
  }
} 