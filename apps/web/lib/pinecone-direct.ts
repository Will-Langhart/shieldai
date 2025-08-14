import { EmbeddingService } from './embeddings';

// Direct HTTP-based Pinecone service
export interface VectorMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  conversationId: string;
  userId: string;
  metadata?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  score: number;
  content: string;
  role: string;
  conversationId: string;
  metadata?: Record<string, any>;
}

export class PineconeDirectService {
  private static apiKey: string;
  private static indexHost: string;

  private static async initialize() {
    if (!this.apiKey) {
      this.apiKey = process.env.PINECONE_API_KEY || '';
      if (!this.apiKey) {
        throw new Error('Missing PINECONE_API_KEY');
      }
    }

    if (!this.indexHost) {
      // Get the index host from the API
      const response = await fetch('https://api.pinecone.io/indexes', {
        headers: {
          'Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get indexes: ${response.status}`);
      }

      const data = await response.json();
      const shieldaiIndex = data.indexes.find((idx: any) => idx.name === 'shieldai');
      
      if (!shieldaiIndex) {
        throw new Error('shieldai index not found');
      }

      this.indexHost = shieldaiIndex.host;
      console.log(`✅ Connected to Pinecone index: ${this.indexHost}`);
    }
  }

  // Store a message embedding in Pinecone
  static async storeMessage(
    messageId: string,
    content: string,
    role: 'user' | 'assistant',
    conversationId: string,
    userId: string,
    embedding: number[],
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await this.initialize();
      
      // Convert embedding to 1024 dimensions for Pinecone compatibility
      const convertedEmbedding = EmbeddingService.convertTo1024Dimensions(embedding);
      
      const response = await fetch(`https://${this.indexHost}/vectors/upsert`, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vectors: [{
            id: messageId,
            values: convertedEmbedding,
            metadata: {
              content,
              role,
              conversationId,
              userId,
              timestamp: new Date().toISOString(),
              ...metadata,
            },
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to store message: ${response.status}`);
      }

      console.log('✅ Stored message embedding in Pinecone:', messageId);
    } catch (error) {
      console.error('❌ Error storing message in Pinecone:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  // Search for similar messages
  static async searchSimilarMessages(
    queryEmbedding: number[],
    userId: string,
    conversationId?: string,
    topK: number = 5
  ): Promise<SearchResult[]> {
    try {
      await this.initialize();
      
      // Convert query embedding to 1024 dimensions for Pinecone compatibility
      const convertedQueryEmbedding = EmbeddingService.convertTo1024Dimensions(queryEmbedding);
      
      const filter: any = { userId };
      if (conversationId) {
        filter.conversationId = conversationId;
      }

      const response = await fetch(`https://${this.indexHost}/query`, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vector: convertedQueryEmbedding,
          topK,
          filter,
          includeMetadata: true,
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to search: ${response.status}`);
      }

      const data = await response.json();
      
      return data.matches?.map((match: any) => ({
        id: match.id,
        score: match.score || 0,
        content: String(match.metadata?.content || ''),
        role: String(match.metadata?.role || 'user'),
        conversationId: String(match.metadata?.conversationId || ''),
        metadata: match.metadata,
      })) || [];
    } catch (error) {
      console.error('❌ Error searching Pinecone:', error);
      return [];
    }
  }

  // Get conversation context
  static async getConversationContext(
    conversationId: string,
    userId: string,
    topK: number = 10
  ): Promise<SearchResult[]> {
    try {
      await this.initialize();
      
      const response = await fetch(`https://${this.indexHost}/query`, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vector: new Array(1024).fill(0), // Dummy vector for metadata-only search
          topK,
          filter: {
            conversationId,
            userId,
          },
          includeMetadata: true,
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get context: ${response.status}`);
      }

      const data = await response.json();
      
      return data.matches?.map((match: any) => ({
        id: match.id,
        score: match.score || 0,
        content: String(match.metadata?.content || ''),
        role: String(match.metadata?.role || 'user'),
        conversationId: String(match.metadata?.conversationId || ''),
        metadata: match.metadata,
      })) || [];
    } catch (error) {
      console.error('❌ Error getting conversation context:', error);
      return [];
    }
  }

  // Get index stats
  static async getIndexStats(): Promise<any> {
    try {
      await this.initialize();
      
      const response = await fetch(`https://${this.indexHost}/describe_index_stats`, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get stats: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error getting index stats:', error);
      return null;
    }
  }

  // Test connection
  static async testConnection(): Promise<boolean> {
    try {
      await this.initialize();
      const stats = await this.getIndexStats();
      console.log('✅ Pinecone connection successful:', stats);
      return true;
    } catch (error) {
      console.error('❌ Pinecone connection failed:', error);
      return false;
    }
  }
}
