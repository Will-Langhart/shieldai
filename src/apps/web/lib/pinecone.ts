import { EmbeddingService } from './embeddings';

// Direct HTTP-based Pinecone service (bypasses client library issues)
let apiKey: string | null = null;
let indexHost: string | null = null;

async function initializePinecone() {
  if (!apiKey) {
    apiKey = process.env.PINECONE_API_KEY || '';
    if (!apiKey) {
      throw new Error('Missing Pinecone configuration. Ensure PINECONE_API_KEY is set.');
    }
  }

  if (!indexHost) {
    // Get the index host from the API
    const response = await fetch('https://api.pinecone.io/indexes', {
      headers: {
        'Api-Key': apiKey,
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

    indexHost = shieldaiIndex.host;
    console.log(`✅ Connected to Pinecone index: ${indexHost}`);
  }

  return { apiKey, indexHost };
}

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

export class PineconeService {
  private static defaultTopK = Number(process.env.PINECONE_TOPK || 8);
  private static minSimilarity = Number(process.env.PINECONE_MIN_SIMILARITY || 0.18);
  private static batchSize = Number(process.env.PINECONE_BATCH_SIZE || 50);
  private static maxRetries = Number(process.env.PINECONE_MAX_RETRIES || 3);
  private static backoffMs = Number(process.env.PINECONE_BACKOFF_MS || 300);
  private static targetDim = Number(process.env.PINECONE_DIMENSION || 1024);

  // Utility: sleep
  private static async sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }

  // Utility: batched upsert with retries
  private static async upsertBatched(
    apiKey: string,
    indexHost: string,
    vectors: Array<{ id: string; values: number[]; metadata?: Record<string, any> }>,
    namespace?: string
  ) {
    for (let i = 0; i < vectors.length; i += this.batchSize) {
      const chunk = vectors.slice(i, i + this.batchSize);
      let attempt = 0;
      // retry loop
      while (true) {
        try {
          const res = await fetch(`https://${indexHost}/vectors/upsert`, {
            method: 'POST',
            headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vectors: chunk,
              ...(namespace ? { namespace } : {}),
            }),
          });
          if (!res.ok) throw new Error(`Upsert failed: ${res.status}`);
          break;
        } catch (err) {
          attempt += 1;
          if (attempt > this.maxRetries) throw err;
          await this.sleep(this.backoffMs * attempt);
        }
      }
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
      const { apiKey, indexHost } = await initializePinecone();
      // Match target index dimension
      const values = this.targetDim === 1536 ? embedding : EmbeddingService.convertTo1024Dimensions(embedding);
      const namespace = userId; // isolate by user

      await this.upsertBatched(apiKey!, indexHost!, [
        {
          id: messageId,
          values,
          metadata: {
            content,
            role,
            conversationId,
            userId,
            timestamp: new Date().toISOString(),
            ...metadata,
          },
        },
      ], namespace);

      console.log('✅ Stored message embedding in Pinecone:', messageId);
    } catch (error) {
      console.error('❌ Error storing message in Pinecone:', error);
      // Don't throw error to avoid breaking the main flow
      // The message will still be stored in the database
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
      const { apiKey, indexHost } = await initializePinecone();
      // Match target index dimension
      const queryVec = this.targetDim === 1536 ? queryEmbedding : EmbeddingService.convertTo1024Dimensions(queryEmbedding);
      const namespace = userId;
      const filter: any = { userId };
      if (conversationId) {
        filter.conversationId = conversationId;
      }

      const response = await fetch(`https://${indexHost}/query`, {
        method: 'POST',
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vector: queryVec,
          topK: topK || this.defaultTopK,
          filter, // still keep filter for safety; namespace handles isolation
          namespace,
          includeMetadata: true,
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to search: ${response.status}`);
      }

      const data = await response.json();
      
      const gated = (data.matches || []).filter((m: any) => (m.score || 0) >= this.minSimilarity);

      return gated.map((match: any) => ({
        id: match.id,
        score: match.score || 0,
        content: String(match.metadata?.content || ''),
        role: String(match.metadata?.role || 'user'),
        conversationId: String(match.metadata?.conversationId || ''),
        metadata: match.metadata,
      }));
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
      const { apiKey, indexHost } = await initializePinecone();
      
      const response = await fetch(`https://${indexHost}/query`, {
        method: 'POST',
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vector: new Array(this.targetDim).fill(0), // Dummy vector for metadata-only search
          topK: topK || this.defaultTopK,
          filter: {
            conversationId,
            userId,
          },
          namespace: userId,
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

  // Delete messages for a conversation
  static async deleteConversationMessages(conversationId: string): Promise<void> {
    try {
      const { apiKey, indexHost } = await initializePinecone();
      
      const response = await fetch(`https://${indexHost}/vectors/delete`, {
        method: 'POST',
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filter: {
            conversationId,
          }
        , namespace: conversationId ? undefined : undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to delete messages: ${response.status}`);
      }

      console.log('✅ Deleted conversation messages from Pinecone:', conversationId);
    } catch (error) {
      console.error('❌ Error deleting conversation messages:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  // Delete messages for a user
  static async deleteUserMessages(userId: string): Promise<void> {
    try {
      const { apiKey, indexHost } = await initializePinecone();
      
      const response = await fetch(`https://${indexHost}/vectors/delete`, {
        method: 'POST',
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filter: {
            userId,
          }
        , namespace: userId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to delete messages: ${response.status}`);
      }

      console.log('✅ Deleted user messages from Pinecone:', userId);
    } catch (error) {
      console.error('❌ Error deleting user messages:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  // Get index stats
  static async getIndexStats(): Promise<any> {
    try {
      const { apiKey, indexHost } = await initializePinecone();
      
      const response = await fetch(`https://${indexHost}/describe_index_stats`, {
        method: 'POST',
        headers: {
          'Api-Key': apiKey,
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
      await initializePinecone();
      const stats = await this.getIndexStats();
      console.log('✅ Pinecone connection successful:', stats);
      return true;
    } catch (error) {
      console.error('❌ Pinecone connection failed:', error);
      return false;
    }
  }

  // Hybrid search scaffold: combine dense with keyword filter and simple re-rank by score boost
  static async hybridSearch(
    queryText: string,
    userId: string,
    options?: { topK?: number; conversationId?: string }
  ): Promise<SearchResult[]> {
    try {
      const topK = options?.topK || this.defaultTopK;
      const queryEmbedding = await EmbeddingService.generateEmbedding(queryText);
      const dense = await this.searchSimilarMessages(queryEmbedding, userId, options?.conversationId, topK * 2);

      // Simple re-ranking: boost if the content includes any query token
      const tokens = new Set<string>(queryText.toLowerCase().split(/\W+/).filter(Boolean));
      const reranked = dense
        .map((m) => {
          const contentTokens = new Set<string>(String(m.content).toLowerCase().split(/\W+/).filter(Boolean));
          const overlap = Array.from(tokens).some((t) => contentTokens.has(t)) ? 0.05 : 0; // tiny boost
          return { ...m, score: (m.score || 0) + overlap };
        })
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, topK);

      return reranked;
    } catch (error) {
      console.error('❌ Error in hybridSearch:', error);
      return [];
    }
  }

  // List vectors in a namespace (paginated)
  static async listVectors(namespace: string, options?: { limit?: number; paginationToken?: string }): Promise<{ vectors: any[]; pagination?: { next?: string } } | null> {
    try {
      const { apiKey, indexHost } = await initializePinecone();
      const body: any = {
        namespace,
        limit: options?.limit || 100,
      };
      if (options?.paginationToken) body.pagetoken = options.paginationToken;

      const res = await fetch(`https://${indexHost}/vectors/list`, {
        method: 'POST',
        headers: { 'Api-Key': apiKey!, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`List failed: ${res.status}`);
      const data = await res.json();
      return data;
    } catch (e) {
      console.error('❌ Error listing vectors:', e);
      return null;
    }
  }

  // Delete all vectors in a namespace
  static async deleteNamespace(namespace: string): Promise<boolean> {
    try {
      const { apiKey, indexHost } = await initializePinecone();
      const res = await fetch(`https://${indexHost}/vectors/delete`, {
        method: 'POST',
        headers: { 'Api-Key': apiKey!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteAll: true, namespace }),
      });
      if (!res.ok) throw new Error(`Delete namespace failed: ${res.status}`);
      return true;
    } catch (e) {
      console.error('❌ Error deleting namespace:', e);
      return false;
    }
  }
} 