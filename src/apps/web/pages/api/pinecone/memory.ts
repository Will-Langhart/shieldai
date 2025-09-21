import { NextApiRequest, NextApiResponse } from 'next';
import { MemoryService } from '../../../lib/memory-service';
import { PineconeService } from '../../../lib/pinecone';
import { EmbeddingService } from '../../../lib/embeddings';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    // Test memory retrieval
    try {
      const { query, userId, conversationId, topK = 5 } = req.query;
      
      if (!query || !userId) {
        return res.status(400).json({ 
          error: 'Missing required parameters: query and userId' 
        });
      }

      console.log(`Testing memory retrieval for query: "${query}" from user: ${userId}`);
      
      const memories = await MemoryService.retrieveRelevantMemories(
        query as string,
        userId as string,
        conversationId as string,
        Number(topK)
      );

      return res.status(200).json({
        success: true,
        query: query as string,
        userId: userId as string,
        conversationId: conversationId as string,
        memories,
        count: memories.length,
      });
    } catch (error) {
      console.error('Memory retrieval test failed:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  } else if (req.method === 'POST') {
    // Test memory storage
    try {
      const { conversationId, userId, messages, metadata } = req.body;
      
      if (!conversationId || !userId || !messages || !Array.isArray(messages)) {
        return res.status(400).json({ 
          error: 'Missing required parameters: conversationId, userId, and messages array' 
        });
      }

      console.log(`Testing memory storage for conversation: ${conversationId} with ${messages.length} messages`);
      
      await MemoryService.storeConversationMemory(
        conversationId,
        userId,
        messages,
        metadata
      );

      return res.status(200).json({
        success: true,
        message: `Successfully stored ${messages.length} messages in memory`,
        conversationId,
        userId,
        messageCount: messages.length,
      });
    } catch (error) {
      console.error('Memory storage test failed:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  } else if (req.method === 'DELETE') {
    // Test memory deletion
    try {
      const { conversationId, userId } = req.query;
      
      if (!conversationId || !userId) {
        return res.status(400).json({ 
          error: 'Missing required parameters: conversationId and userId' 
        });
      }

      console.log(`Testing memory deletion for conversation: ${conversationId}`);
      
      await PineconeService.deleteConversationMessages(conversationId as string);

      return res.status(200).json({
        success: true,
        message: `Successfully deleted memories for conversation: ${conversationId}`,
        conversationId,
        userId,
      });
    } catch (error) {
      console.error('Memory deletion test failed:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
