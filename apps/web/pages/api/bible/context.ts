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
    const { reference, versionId = 'de4e12af7f28f599-02' } = req.query;

    if (!reference || typeof reference !== 'string') {
      return res.status(400).json({ error: 'Reference parameter is required' });
    }

    const context = await bibleService.getVerseContext(
      reference,
      versionId as string
    );

    if (!context) {
      return res.status(404).json({ error: 'Verse context not found' });
    }

    res.status(200).json(context);
  } catch (error) {
    console.error('Error fetching verse context:', error);
    res.status(500).json({ error: 'Failed to fetch verse context' });
  }
} 