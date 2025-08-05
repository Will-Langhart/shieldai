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

    const crossReferences = await bibleService.getCrossReferences(
      reference,
      versionId as string
    );

    res.status(200).json(crossReferences);
  } catch (error) {
    console.error('Error getting cross-references:', error);
    res.status(500).json({ error: 'Failed to get cross-references' });
  }
} 