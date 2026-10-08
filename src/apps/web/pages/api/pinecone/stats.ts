import { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '../../../lib/admin-guard';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!requireAdmin(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX_NAME || 'shieldai';

    if (!apiKey) {
      return res.status(400).json({ error: 'PINECONE_API_KEY not set' });
    }

    // First, get the index host
    const indexesResponse = await fetch('https://api.pinecone.io/indexes', {
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!indexesResponse.ok) {
      throw new Error(`Failed to get indexes: ${indexesResponse.status}`);
    }

    const indexesData = await indexesResponse.json();
    const shieldaiIndex = indexesData.indexes?.find((idx: any) => idx.name === indexName);
    
    if (!shieldaiIndex) {
      return res.status(404).json({ 
        success: false, 
        error: `Index '${indexName}' not found`,
        availableIndexes: indexesData.indexes?.map((idx: any) => idx.name) || []
      });
    }

    // Get index stats using the host
    const statsResponse = await fetch(`https://${shieldaiIndex.host}/describe_index_stats`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!statsResponse.ok) {
      throw new Error(`Failed to get stats: ${statsResponse.status}`);
    }

    const stats = await statsResponse.json();

    return res.status(200).json({
      success: true,
      indexName,
      indexHost: shieldaiIndex.host,
      stats,
    });
  } catch (error) {
    console.error('Error fetching Pinecone stats:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
