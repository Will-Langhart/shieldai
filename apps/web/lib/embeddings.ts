import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class EmbeddingService {
  // Generate embedding for a text using OpenAI
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small', // Updated to use text-embedding-3-small for 1536 dimensions
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
        model: 'text-embedding-3-small', // Updated to use text-embedding-3-small for 1536 dimensions
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
  // This is a more sophisticated approach than simple truncation
  static convertTo1024Dimensions(embedding: number[]): number[] {
    if (embedding.length === 1024) {
      return embedding;
    }
    
    if (embedding.length === 1536) {
      // Use weighted averaging to reduce dimensions while preserving information
      const result = new Array(1024).fill(0);
      const ratio = 1536 / 1024; // 1.5
      
      for (let i = 0; i < 1024; i++) {
        const startIdx = Math.floor(i * ratio);
        const endIdx = Math.floor((i + 1) * ratio);
        
        // Weighted average of the corresponding 1536 dimensions
        let sum = 0;
        let weight = 0;
        
        for (let j = startIdx; j < endIdx && j < 1536; j++) {
          const w = 1 - (j - startIdx) / (endIdx - startIdx); // Higher weight for earlier dimensions
          sum += embedding[j] * w;
          weight += w;
        }
        
        result[i] = weight > 0 ? sum / weight : 0;
      }
      
      return result;
    }
    
    throw new Error(`Unsupported embedding dimension: ${embedding.length}`);
  }

  // Produce an embedding that matches the target index dimension (1024 or 1536)
  // Defaults to 1024 when dimension cannot be determined
  static async generateEmbeddingForIndex(text: string, targetDimension?: number): Promise<number[]> {
    const raw = await this.generateEmbedding(text);
    const dim = targetDimension || Number(process.env.PINECONE_DIMENSION || 1024);
    if (dim === 1536) {
      return raw;
    }
    if (dim === 1024) {
      return this.convertTo1024Dimensions(raw);
    }
    // Fallback: best-effort down-project to 1024
    return this.convertTo1024Dimensions(raw);
  }
} 