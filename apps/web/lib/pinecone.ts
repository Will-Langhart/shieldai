import { Pinecone } from '@pinecone-database/pinecone';
import { EmbeddingService } from './embeddings';

// Initialize Pinecone client (server-side only)
let pc: Pinecone | null = null;
let index: any = null;

function initializePinecone() {
  if (!pc) {
    const apiKey = process.env.PINECONE_API_KEY;
    const environment = process.env.PINECONE_ENVIRONMENT || 'us-east-1';
    const indexName = process.env.PINECONE_INDEX_NAME || 'shieldai';

    if (!apiKey) {
      throw new Error('Missing Pinecone configuration. Ensure PINECONE_API_KEY is set.');
    }

    // For serverless Pinecone, use us-east-1 environment
    // Remove any -aws suffix if present
    const cleanEnvironment = environment.replace('-aws', '');
    
    console.log(`Initializing Pinecone with environment: ${cleanEnvironment}, index: ${indexName}`);
    
    pc = new Pinecone({ apiKey, environment: cleanEnvironment });
    index = pc.index(indexName);
  }
  return { pc, index };
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
      const { index } = initializePinecone();
      // Convert embedding to 1024 dimensions for Pinecone compatibility
      const convertedEmbedding = EmbeddingService.convertTo1024Dimensions(embedding);
      
      await index.upsert([
        {
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
        },
      ]);
      console.log('Stored message embedding in Pinecone:', messageId);
    } catch (error) {
      console.error('Error storing message in Pinecone:', error);
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
      const { index } = initializePinecone();
      // Convert query embedding to 1024 dimensions for Pinecone compatibility
      const convertedQueryEmbedding = EmbeddingService.convertTo1024Dimensions(queryEmbedding);
      
      const filter: any = { userId };
      if (conversationId) {
        filter.conversationId = conversationId;
      }

      const searchResponse = await index.query({
        vector: convertedQueryEmbedding,
        topK,
        filter,
        includeMetadata: true,
      });

      return searchResponse.matches?.map((match: any) => ({
        id: match.id,
        score: match.score || 0,
        content: String(match.metadata?.content || ''),
        role: String(match.metadata?.role || 'user'),
        conversationId: String(match.metadata?.conversationId || ''),
        metadata: match.metadata,
      })) || [];
    } catch (error) {
      console.error('Error searching Pinecone:', error);
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
      const { index } = initializePinecone();
      const searchResponse = await index.query({
        vector: new Array(1024).fill(0), // Dummy vector for metadata-only search (1024 dimensions)
        topK,
        filter: {
          conversationId,
          userId,
        },
        includeMetadata: true,
      });

      return searchResponse.matches?.map((match: any) => ({
        id: match.id,
        score: match.score || 0,
        content: String(match.metadata?.content || ''),
        role: String(match.metadata?.role || 'user'),
        conversationId: String(match.metadata?.conversationId || ''),
        metadata: match.metadata,
      })) || [];
    } catch (error) {
      console.error('Error getting conversation context:', error);
      return [];
    }
  }

  // Delete messages for a conversation
  static async deleteConversationMessages(conversationId: string): Promise<void> {
    try {
      const { index } = initializePinecone();
      await index.deleteMany({
        filter: {
          conversationId,
        },
      });
      console.log('Deleted conversation messages from Pinecone:', conversationId);
    } catch (error) {
      console.error('Error deleting conversation messages:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  // Delete messages for a user
  static async deleteUserMessages(userId: string): Promise<void> {
    try {
      const { index } = initializePinecone();
      await index.deleteMany({
        filter: {
          userId,
        },
      });
      console.log('Deleted user messages from Pinecone:', userId);
    } catch (error) {
      console.error('Error deleting user messages:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }
} 