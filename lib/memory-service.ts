import { PineconeService } from './pinecone';
import { EmbeddingService } from './embeddings';
import { ChatService } from './chat-service';
import { createServerSupabaseClient } from './supabase';

export interface MemoryContext {
  conversationId: string;
  userId: string;
  messages: Array<{
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: string;
    relevance: number;
  }>;
  summary?: string;
  keyTopics: string[];
  emotionalTone?: 'positive' | 'negative' | 'neutral';
  userPreferences?: Record<string, any>;
}

export interface MemorySearchResult {
  content: string;
  role: string;
  conversationId: string;
  score: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class MemoryService {
  // Store a conversation memory with enhanced metadata
  static async storeConversationMemory(
    conversationId: string,
    userId: string,
    messages: Array<{ content: string; role: 'user' | 'assistant'; timestamp: string }>,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Generate embeddings for each message
      const messageEmbeddings = await Promise.all(
        messages.map(async (message) => {
          const embedding = await EmbeddingService.generateEmbedding(message.content);
          return {
            ...message,
            embedding,
          };
        })
      );

      // Store each message in Pinecone with enhanced metadata
      await Promise.all(
        messageEmbeddings.map(async (message, index) => {
          const messageId = `${conversationId}_${index}`;
          await PineconeService.storeMessage(
            messageId,
            message.content,
            message.role,
            conversationId,
            userId,
            message.embedding,
            {
              ...metadata,
              timestamp: message.timestamp,
              messageIndex: index,
              totalMessages: messages.length,
              conversationType: this.detectConversationType(messages),
              keyTopics: await this.extractKeyTopics(messages),
              emotionalTone: this.analyzeEmotionalTone(messages),
            }
          );
        })
      );

      console.log(`Stored ${messages.length} messages in memory for conversation ${conversationId}`);
    } catch (error) {
      console.error('Error storing conversation memory:', error);
      throw error;
    }
  }

  // Retrieve relevant memories for a given query
  static async retrieveRelevantMemories(
    query: string,
    userId: string,
    conversationId?: string,
    topK: number = 10,
    minScore: number = 0.7
  ): Promise<MemorySearchResult[]> {
    try {
      const queryEmbedding = await EmbeddingService.generateEmbedding(query);
      const results = await PineconeService.searchSimilarMessages(
        queryEmbedding,
        userId,
        conversationId,
        topK
      );

      // Filter results by minimum similarity score
      return results
        .filter(result => result.score >= minScore)
        .map(result => ({
          content: result.content,
          role: result.role,
          conversationId: result.conversationId,
          score: result.score,
          timestamp: result.metadata?.timestamp || '',
          metadata: result.metadata,
        }));
    } catch (error) {
      console.error('Error retrieving memories:', error);
      return [];
    }
  }

  // Get conversation context with memory enhancement
  static async getEnhancedConversationContext(
    conversationId: string,
    userId: string,
    currentMessage: string,
    topK: number = 15
  ): Promise<MemoryContext> {
    try {
      // Get recent messages from the current conversation
      const recentMessages = await ChatService.getMessages(conversationId);
      
      // Get relevant memories from all conversations
      const relevantMemories = await this.retrieveRelevantMemories(
        currentMessage,
        userId,
        undefined, // Search across all conversations
        topK
      );

      // Combine recent messages with relevant memories
      const allMessages = [
        ...recentMessages.map(msg => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          timestamp: msg.created_at,
          relevance: 1.0, // Recent messages are highly relevant
        })),
        ...relevantMemories
          .filter(memory => memory.conversationId !== conversationId) // Exclude current conversation
          .map(memory => ({
            id: `memory_${memory.conversationId}_${memory.timestamp}`,
            content: memory.content,
            role: memory.role as 'user' | 'assistant',
            timestamp: memory.timestamp,
            relevance: memory.score,
          }))
      ];

      // Sort by relevance and timestamp
      allMessages.sort((a, b) => {
        if (a.relevance !== b.relevance) {
          return b.relevance - a.relevance;
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      // Extract key topics from the combined context
      const keyTopics = await this.extractKeyTopics(
        allMessages.map(msg => ({ content: msg.content, role: msg.role, timestamp: msg.timestamp }))
      );

      // Analyze emotional tone
      const emotionalTone = this.analyzeEmotionalTone(
        allMessages.map(msg => ({ content: msg.content, role: msg.role, timestamp: msg.timestamp }))
      );

      return {
        conversationId,
        userId,
        messages: allMessages.slice(0, topK), // Limit to top K messages
        keyTopics,
        emotionalTone,
        userPreferences: await this.extractUserPreferences(allMessages),
      };
    } catch (error) {
      console.error('Error getting enhanced conversation context:', error);
      return {
        conversationId,
        userId,
        messages: [],
        keyTopics: [],
      };
    }
  }

  // Generate a memory summary for a conversation
  static async generateMemorySummary(
    conversationId: string,
    userId: string
  ): Promise<string> {
    try {
      const messages = await ChatService.getMessages(conversationId);
      if (messages.length === 0) return '';

      const conversationText = messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      // Generate a summary using the embedding service
      const summaryEmbedding = await EmbeddingService.generateEmbedding(
        `Summarize this conversation: ${conversationText}`
      );

      // For now, return a simple summary based on key topics
      const keyTopics = await this.extractKeyTopics(messages);
      return `Conversation covered: ${keyTopics.join(', ')}`;
    } catch (error) {
      console.error('Error generating memory summary:', error);
      return '';
    }
  }

  // Extract key topics from messages
  private static async extractKeyTopics(
    messages: Array<{ content: string; role: string; timestamp: string }>
  ): Promise<string[]> {
    try {
      const allText = messages.map(msg => msg.content).join(' ');
      
      // Simple keyword extraction (in production, you might use NLP libraries)
      const commonTopics = [
        'theology', 'philosophy', 'apologetics', 'bible', 'scripture',
        'faith', 'religion', 'christianity', 'god', 'jesus', 'holy spirit',
        'salvation', 'grace', 'sin', 'redemption', 'prayer', 'worship',
        'church', 'community', 'discipleship', 'evangelism', 'mission',
        'creation', 'evolution', 'science', 'history', 'morality', 'ethics',
        'love', 'forgiveness', 'hope', 'peace', 'joy', 'patience',
        'kindness', 'goodness', 'faithfulness', 'gentleness', 'self-control'
      ];

      const foundTopics = commonTopics.filter(topic => 
        allText.toLowerCase().includes(topic.toLowerCase())
      );

      return foundTopics.slice(0, 5); // Return top 5 topics
    } catch (error) {
      console.error('Error extracting key topics:', error);
      return [];
    }
  }

  // Analyze emotional tone of conversation
  private static analyzeEmotionalTone(
    messages: Array<{ content: string; role: string; timestamp: string }>
  ): 'positive' | 'negative' | 'neutral' {
    try {
      const allText = messages.map(msg => msg.content).join(' ').toLowerCase();
      
      const positiveWords = [
        'love', 'joy', 'peace', 'hope', 'faith', 'grace', 'blessed',
        'wonderful', 'amazing', 'beautiful', 'good', 'great', 'excellent'
      ];
      
      const negativeWords = [
        'hate', 'anger', 'fear', 'sadness', 'pain', 'suffering', 'evil',
        'terrible', 'awful', 'horrible', 'bad', 'wrong', 'evil'
      ];

      const positiveCount = positiveWords.filter(word => allText.includes(word)).length;
      const negativeCount = negativeWords.filter(word => allText.includes(word)).length;

      if (positiveCount > negativeCount) return 'positive';
      if (negativeCount > positiveCount) return 'negative';
      return 'neutral';
    } catch (error) {
      console.error('Error analyzing emotional tone:', error);
      return 'neutral';
    }
  }

  // Detect conversation type
  private static detectConversationType(
    messages: Array<{ content: string; role: string; timestamp: string }>
  ): string {
    try {
      const allText = messages.map(msg => msg.content).join(' ').toLowerCase();
      
      if (allText.includes('bible') || allText.includes('scripture')) return 'bible_study';
      if (allText.includes('apologetics') || allText.includes('defense')) return 'apologetics';
      if (allText.includes('prayer') || allText.includes('worship')) return 'spiritual';
      if (allText.includes('philosophy') || allText.includes('theology')) return 'theological';
      if (allText.includes('personal') || allText.includes('struggle')) return 'personal';
      
      return 'general';
    } catch (error) {
      console.error('Error detecting conversation type:', error);
      return 'general';
    }
  }

  // Extract user preferences from conversation history
  private static async extractUserPreferences(
    messages: Array<{ content: string; role: string; timestamp: string; relevance: number }>
  ): Promise<Record<string, any>> {
    try {
      const preferences: Record<string, any> = {};
      
      // Analyze user's preferred topics
      const userMessages = messages.filter(msg => msg.role === 'user');
      const keyTopics = await this.extractKeyTopics(userMessages);
      preferences.preferredTopics = keyTopics;

      // Analyze communication style
      const avgMessageLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length;
      preferences.communicationStyle = avgMessageLength > 100 ? 'detailed' : 'concise';

      // Analyze emotional patterns
      const emotionalTone = this.analyzeEmotionalTone(userMessages);
      preferences.emotionalPattern = emotionalTone;

      return preferences;
    } catch (error) {
      console.error('Error extracting user preferences:', error);
      return {};
    }
  }

  // Clean up old memories (optional - for privacy/data management)
  static async cleanupOldMemories(
    userId: string,
    olderThanDays: number = 90
  ): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // This would require additional Pinecone functionality to filter by date
      // For now, we'll just log the intention
      console.log(`Would cleanup memories older than ${cutoffDate.toISOString()} for user ${userId}`);
    } catch (error) {
      console.error('Error cleaning up old memories:', error);
    }
  }

  // Get memory statistics for a user
  static async getMemoryStats(userId: string): Promise<{
    totalMemories: number;
    totalConversations: number;
    averageRelevance: number;
    topTopics: string[];
  }> {
    try {
      // This would require additional Pinecone queries
      // For now, return placeholder data
      return {
        totalMemories: 0,
        totalConversations: 0,
        averageRelevance: 0,
        topTopics: [],
      };
    } catch (error) {
      console.error('Error getting memory stats:', error);
      return {
        totalMemories: 0,
        totalConversations: 0,
        averageRelevance: 0,
        topTopics: [],
      };
    }
  }
}

