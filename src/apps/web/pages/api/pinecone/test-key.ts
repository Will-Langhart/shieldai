import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use hardcoded API key temporarily to test connection
    const apiKey = process.env.PINECONE_API_KEY || 'pcsk_3MJJaR_EjBt6ktRBUfLAmCTa8DTtQpRBKtwDKB657XofsBYVY6S9aWXxrLCtpvkUGuCULy';

    if (!apiKey) {
      return res.status(400).json({ error: 'PINECONE_API_KEY not set' });
    }

    console.log('Testing Pinecone connection with direct HTTP API...');
    console.log('API Key from env:', process.env.PINECONE_API_KEY ? process.env.PINECONE_API_KEY.substring(0, 20) + '...' : 'NOT SET');
    console.log('Using API Key:', apiKey.substring(0, 20) + '...');

    // Use direct HTTP API to test connection
    const response = await fetch('https://api.pinecone.io/indexes', {
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const shieldaiIndex = data.indexes?.find((idx: any) => idx.name === 'shieldai');
    
    return res.status(200).json({
      success: true,
      message: 'API key is valid and connected to Pinecone',
      apiKeyPrefix: apiKey.substring(0, 8),
      totalIndexes: data.indexes?.length || 0,
      shieldaiIndex: shieldaiIndex ? {
        name: shieldaiIndex.name,
        status: shieldaiIndex.status,
        host: shieldaiIndex.host,
        dimension: shieldaiIndex.dimension,
        metric: shieldaiIndex.metric
      } : null,
      allIndexes: data.indexes?.map((idx: any) => ({
        name: idx.name,
        status: idx.status,
        dimension: idx.dimension
      })) || []
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
