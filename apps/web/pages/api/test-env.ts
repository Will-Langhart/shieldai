import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    PINECONE_API_KEY: process.env.PINECONE_API_KEY ? 
      `${process.env.PINECONE_API_KEY.substring(0, 20)}...` : 'NOT SET',
    PINECONE_API_KEY_FULL: process.env.PINECONE_API_KEY || 'NOT SET',
    PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME || 'NOT SET',
    PINECONE_DIMENSION: process.env.PINECONE_DIMENSION || 'NOT SET',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 
      `${process.env.OPENAI_API_KEY.substring(0, 20)}...` : 'NOT SET',
  };

  return res.status(200).json({
    success: true,
    environment: envVars,
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('PINECONE') || key.includes('OPENAI')),
  });
}
