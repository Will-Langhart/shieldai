import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return res.status(200).json({ 
    status: 'ok',
    message: 'Shield AI API is working',
    timestamp: new Date().toISOString()
  });
} 