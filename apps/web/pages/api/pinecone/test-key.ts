import { NextApiRequest, NextApiResponse } from 'next';
import { Pinecone } from '@pinecone-database/pinecone';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.PINECONE_API_KEY;
    const environment = process.env.PINECONE_ENVIRONMENT;

    if (!apiKey) {
      return res.status(400).json({ error: 'PINECONE_API_KEY not set' });
    }

    if (!environment) {
      return res.status(400).json({ error: 'PINECONE_ENVIRONMENT not set' });
    }

    console.log('Testing Pinecone connection with:', {
      apiKey: apiKey.substring(0, 8) + '...',
      environment,
    });

    const pc = new Pinecone({
      apiKey,
      environment,
    });

    // Try to list indexes to test the connection
    const indexes = await pc.listIndexes();
    
    return res.status(200).json({
      success: true,
      message: 'API key is valid',
      environment,
      indexes: indexes,
      apiKeyPrefix: apiKey.substring(0, 8),
    });
  } catch (error) {
    console.error('Pinecone API key test failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
    });
  }
}
