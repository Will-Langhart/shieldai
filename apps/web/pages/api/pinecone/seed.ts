import { NextApiRequest, NextApiResponse } from 'next';
import { PineconeService } from '../../../lib/pinecone';
import { EmbeddingService } from '../../../lib/embeddings';

function generateRandomEmbedding(dim: number): number[] {
  return Array(dim).fill(0).map(() => Math.random());
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId = 'seed-user', conversationId = 'seed-conv' } = req.body || {};

    const samples = [
      { role: 'user' as const, content: 'What does Romans 8:28 mean for suffering?' },
      { role: 'assistant' as const, content: 'Romans 8:28 teaches that God works all things for good for those who love Him.' },
      { role: 'user' as const, content: 'Find verses about hope and perseverance.' },
    ];

    const useOpenAI = Boolean(process.env.OPENAI_API_KEY);

    const embeddings = await Promise.all(samples.map(async (s) => {
      if (useOpenAI) {
        return EmbeddingService.generateEmbedding(s.content);
      }
      // Fallback: generate 1024-dim random vectors so we can seed without OpenAI
      return generateRandomEmbedding(1024);
    }));

    await Promise.all(samples.map((s, i) => {
      const id = `${conversationId}_${Date.now()}_${i}`;
      return PineconeService.storeMessage(
        id,
        s.content,
        s.role,
        conversationId,
        userId,
        embeddings[i],
        { seeded: true, usedOpenAI: useOpenAI }
      );
    }));

    return res.status(200).json({ success: true, inserted: samples.length, usedOpenAI: useOpenAI });
  } catch (error) {
    console.error('Error seeding Pinecone:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
