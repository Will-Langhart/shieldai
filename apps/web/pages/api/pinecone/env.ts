import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const maskedKey = process.env.PINECONE_API_KEY
    ? `${process.env.PINECONE_API_KEY.substring(0, 8)}...${process.env.PINECONE_API_KEY.slice(-4)}`
    : '(not set)';

  return res.status(200).json({
    PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT || '(not set)',
    PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME || '(not set)',
    PINECONE_API_KEY: maskedKey,
  });
}

