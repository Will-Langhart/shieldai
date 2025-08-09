import { NextApiRequest, NextApiResponse } from 'next';
import { Pinecone } from '@pinecone-database/pinecone';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const environment = process.env.PINECONE_ENVIRONMENT || 'us-east-1';
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || '',
      environment,
    });

    if (req.method === 'GET') {
      const indexes = await pc.listIndexes();
      return res.status(200).json({ success: true, indexes });
    }

    if (req.method === 'POST') {
      const { name, dimension = 1024, metric = 'cosine' } = req.body || {};
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ success: false, error: 'name is required' });
      }

      // Use classic configuration for us-east-1-aws, serverless for others
      if (environment === 'us-east-1-aws') {
        await pc.createIndex({
          name,
          dimension,
          metric: metric as any,
          pods: 1,
          replicas: 1,
          podType: 'p1.x1',
        } as any);
      } else {
        // Use serverless configuration for other environments
        await pc.createIndex({
          name,
          dimension,
          metric: metric as any,
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
            },
          },
        } as any);
      }

      return res.status(201).json({ 
        success: true, 
        name, 
        dimension, 
        metric, 
        type: environment === 'us-east-1-aws' ? 'classic' : 'serverless',
        environment 
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Error managing Pinecone indexes:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
