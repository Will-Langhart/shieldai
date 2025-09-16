import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { EmbeddingService } from '../../lib/embeddings';

// Initialize OpenAI client
let openai: OpenAI | null = null;

const getOpenAI = () => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

// Hardcoded Pinecone API key for now (we'll fix the env issue later)
const PINECONE_API_KEY = 'pcsk_3MJJaR_EjBt6ktRBUfLAmCTa8DTtQpRBKtwDKB657XofsBYVY6S9aWXxrLCtpvkUGuCULy';
const SHIELDAI_INDEX_HOST = 'shieldai-smb4qh6.svc.aped-4627-b74a.pinecone.io';

interface VectorSearchResult {
  id: string;
  score: number;
  content: string;
  role: string;
  conversationId: string;
  metadata?: Record<string, any>;
}

interface VectorResponseRequest {
  message: string;
  userId: string;
  conversationId?: string;
  topK?: number;
  mode?: 'gentle' | 'detailed';
  stream?: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, userId, conversationId, topK = 5, mode = 'gentle', stream = false }: VectorResponseRequest = req.body;

    if (!message || !userId) {
      return res.status(400).json({ error: 'Message and userId are required' });
    }

    console.log(`🔍 Processing vector response for user ${userId}: "${message.substring(0, 100)}..."`);

    // Step 1: Generate embedding for the user's message
    const queryEmbedding = await EmbeddingService.generateEmbedding(message);
    console.log('✅ Generated query embedding');

    // Step 2: Search Pinecone for relevant vectors
    const vectorResults = await searchPineconeVectors(
      queryEmbedding,
      userId,
      conversationId,
      topK
    );
    console.log(`✅ Found ${vectorResults.length} relevant vectors`);

    // Step 3: Build context from vector results
    const context = buildContextFromVectors(vectorResults, message);

    // Step 4: Generate OpenAI response with vector context
    const systemPrompt = `You are Shield AI, a Christian AI assistant that provides biblically-grounded responses.

Your role is to:
1. Provide accurate, scripture-based answers to questions about Christianity, the Bible, and faith
2. Use the provided context from previous conversations and Bible content to enhance your responses
3. Be respectful, compassionate, and encouraging
4. Always ground your responses in biblical truth
5. Reference specific Bible verses when relevant and explain their significance

IMPORTANT: Use the provided context to give more personalized and relevant responses based on the user's conversation history and interests.`;

    const messages = [
      { role: 'system', content: systemPrompt + context },
      { role: 'user', content: message }
    ];

    // Configure OpenAI parameters
    const model = mode === 'gentle' ? 'gpt-3.5-turbo' : 'gpt-4-turbo-preview';
    const maxTokens = mode === 'gentle' ? 2000 : 4000;
    const temperature = mode === 'gentle' ? 0.7 : 0.8;

    if (stream) {
      // Streaming response
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no'
      });

      let fullText = '';

      try {
        const streamResp = await getOpenAI().chat.completions.create({
          model: model,
          max_tokens: maxTokens,
          temperature: temperature,
          messages: messages,
          stream: true,
        });

        for await (const chunk of streamResp) {
          const delta = (chunk as any)?.choices?.[0]?.delta?.content || '';
          if (delta) {
            fullText += delta;
            res.write(delta);
          }
        }

        res.end();
        return;
      } catch (streamErr) {
        console.error('Streaming error:', streamErr);
        res.end();
        return;
      }
    } else {
      // Non-streaming response
      const response = await getOpenAI().chat.completions.create({
        model: model,
        max_tokens: maxTokens,
        temperature: temperature,
        messages: messages,
      });

      const aiResponse = response.choices[0].message.content;

      if (!aiResponse) {
        return res.status(500).json({ error: 'Empty response from AI' });
      }

      console.log(`✅ Generated vector-enhanced response (${aiResponse.length} chars)`);

      return res.status(200).json({
        response: aiResponse,
        mode: mode,
        timestamp: new Date().toISOString(),
        conversationId: conversationId,
        context: {
          vector_results: vectorResults.length,
          relevant_vectors: vectorResults.map(v => ({
            id: v.id,
            score: v.score,
            content: v.content.substring(0, 100) + '...',
            role: v.role
          }))
        },
        metadata: {
          model: model,
          max_tokens: maxTokens,
          temperature: temperature,
          vector_search_performed: true
        }
      });
    }

  } catch (error) {
    console.error('Vector response API error:', error);
    return res.status(500).json({ 
      error: 'An error occurred while processing your request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Search Pinecone for relevant vectors
async function searchPineconeVectors(
  queryEmbedding: number[],
  userId: string,
  conversationId?: string,
  topK: number = 5
): Promise<VectorSearchResult[]> {
  try {
    // Convert to 1024 dimensions for Pinecone
    const queryVec = EmbeddingService.convertTo1024Dimensions(queryEmbedding);
    
    // Search without filter to find any relevant vectors
    const response = await fetch(`https://${SHIELDAI_INDEX_HOST}/query`, {
      method: 'POST',
      headers: {
        'Api-Key': PINECONE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vector: queryVec,
        topK: topK,
        // Search in default namespace for now (existing vectors are there)
        includeMetadata: true,
      })
    });

    if (!response.ok) {
      throw new Error(`Pinecone query failed: ${response.status}`);
    }

    const data = await response.json();
    
    const results = (data.matches || [])
      .filter((match: any) => (match.score || 0) >= 0.18) // Minimum similarity threshold
      .map((match: any) => ({
        id: match.id,
        score: match.score || 0,
        content: String(match.metadata?.content || ''),
        role: String(match.metadata?.role || 'user'),
        conversationId: String(match.metadata?.conversationId || ''),
        metadata: match.metadata,
      }));

    return results;
  } catch (error) {
    console.error('Error searching Pinecone vectors:', error);
    return [];
  }
}

// Build context from vector search results
function buildContextFromVectors(vectors: VectorSearchResult[], currentMessage: string): string {
  if (vectors.length === 0) {
    return '\n\nNo relevant conversation history found.';
  }

  let context = '\n\nRELEVANT CONVERSATION HISTORY:';
  
  vectors.forEach((vector, index) => {
    context += `\n${index + 1}. [${vector.role}] ${vector.content}`;
    if (vector.metadata?.timestamp) {
      context += ` (${new Date(vector.metadata.timestamp).toLocaleDateString()})`;
    }
  });

  context += '\n\nUse this conversation history to provide more personalized and contextually relevant responses.';
  
  return context;
}
