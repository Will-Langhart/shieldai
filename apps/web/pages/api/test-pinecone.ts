import { NextApiRequest, NextApiResponse } from 'next';
import { PineconeService } from '../../lib/pinecone';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test message
    const testMessage = {
      id: 'test-' + Date.now(),
      content: 'This is a test message',
      role: 'user' as const,
      conversationId: 'test-conversation',
      userId: 'test-user',
    };

    // Create a dummy embedding (1024 dimensions)
    const dummyEmbedding = Array(1024).fill(0).map(() => Math.random());

    // Test storing a message
    await PineconeService.storeMessage(
      testMessage.id,
      testMessage.content,
      testMessage.role,
      testMessage.conversationId,
      testMessage.userId,
      dummyEmbedding
    );

    // Test searching for similar messages
    const similarMessages = await PineconeService.searchSimilarMessages(
      dummyEmbedding,
      testMessage.userId,
      testMessage.conversationId
    );

    // Test getting conversation context
    const conversationContext = await PineconeService.getConversationContext(
      testMessage.conversationId,
      testMessage.userId
    );

    // Clean up test data
    await PineconeService.deleteConversationMessages(testMessage.conversationId);

    return res.status(200).json({
      success: true,
      similarMessages,
      conversationContext,
      message: 'Pinecone connection test successful'
    });
  } catch (error) {
    console.error('Pinecone test failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Pinecone connection test failed'
    });
  }
}

