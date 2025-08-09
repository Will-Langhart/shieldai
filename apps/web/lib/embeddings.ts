import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class EmbeddingService {
  // Generate embedding for a text using OpenAI
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002', // Keep using ada-002 for 1536 dimensions
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  // Generate embeddings for multiple texts
  static async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002', // Keep using ada-002 for 1536 dimensions
        input: texts,
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }

  // Calculate cosine similarity between two embeddings
  static calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same length');
    }

    const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
    const magnitude1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0));

    return dotProduct / (magnitude1 * magnitude2);
  }

  // Convert 1536-dimensional embedding to 1024-dimensional for Pinecone compatibility
  static convertTo1024Dimensions(embedding: number[]): number[] {
    if (embedding.length === 1024) {
      return embedding;
    }
    
    if (embedding.length === 1536) {
      // Simple truncation to 1024 dimensions
      // In production, you might want to use a more sophisticated dimensionality reduction
      return embedding.slice(0, 1024);
    }
    
    throw new Error(`Unsupported embedding dimension: ${embedding.length}`);
  }
} 