import { NextApiRequest, NextApiResponse } from 'next';
import { ChurchFinderService } from '../../../lib/church-finder-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { latitude, longitude, radius, denomination } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const churches = await ChurchFinderService.findChurchesNearby({
      latitude,
      longitude,
      radius: radius || 25000, // Default 25km radius
      denomination
    });

    res.status(200).json({ churches });
  } catch (error) {
    console.error('Error searching churches:', error);
    res.status(500).json({ error: 'Failed to search churches' });
  }
} 