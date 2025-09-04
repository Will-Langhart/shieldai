import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { createServerSupabaseClient } from '../../lib/supabase';
import { logger, withCorrelationId } from '../../lib/logger';
import { bibleService } from '../../lib/bible-service';
import { BiblePineconeService } from '../../lib/bible-pinecone';
import { EmbeddingService } from '../../lib/embeddings';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `chat_rag_${Date.now()}`);
  const startedAt = Date.now();

  if (req.method !== 'POST') {
    logger.warn('Method not allowed', { cid, path: '/api/chat-rag', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, conversationId, mode = 'gentle', stream = false } = req.body || {};

    if (!message) {
      logger.warn('Missing message', { cid });
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get authenticated user (with fallback for testing)
    const authHeader = req.headers.authorization;
    let user = null;
    let serverSupabase: any = undefined;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // For testing with 'test-token', create a mock user
      if (token === 'test-token') {
        user = {
          id: 'test-user-123',
          email: 'test@example.com',
          name: 'Test User'
        };
        logger.info('Using test user for RAG API', { cid, userId: user.id });
      } else {
        try {
          serverSupabase = createServerSupabaseClient(token);
          const { data: { user: authUser }, error: authError } = await serverSupabase.auth.getUser();
          
          if (authError || !authUser) {
            return res.status(401).json({ error: 'Invalid authentication token' });
          }
          user = authUser;
        } catch (error) {
          logger.error('Authentication failed', { cid }, error);
          return res.status(401).json({ error: 'Authentication failed' });
        }
      }
    } else {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    logger.info('Processing RAG chat request', { cid, userId: user.id, messageLength: message.length });

    // Step 1: Search for relevant Bible content using Pinecone
    let relevantVerses: any[] = [];
    try {
      // Generate embedding for the user's message
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: message
      });
      
      const embedding = embeddingResponse.data[0].embedding;
      
      // Search Pinecone for relevant Bible content
      const pineconeResults = await BiblePineconeService.searchBibleContent(
        embedding,
        5, // Get top 5 most relevant verses
        { type: 'bible_verse' }
      );
      
      relevantVerses = pineconeResults || [];
      logger.debug('Pinecone search results', { cid, count: relevantVerses.length });
    } catch (error) {
      logger.error('Pinecone search failed', { cid }, error);
      // Continue without Pinecone results
    }

    // Step 2: Search Bible API for additional context
    let bibleSearchResults: any[] = [];
    try {
      const searchResults = await bibleService.searchVerses(message, 'de4e12af7f28f599-02', 5);
      bibleSearchResults = searchResults || [];
      logger.debug('Bible API search results', { cid, count: bibleSearchResults.length });
    } catch (error) {
      logger.error('Bible API search failed', { cid }, error);
      // Continue without Bible API results
    }

    // Step 3: Get conversation history from Supabase
    let conversationHistory: any[] = [];
    try {
      if (conversationId && serverSupabase) {
        const { data: messages, error } = await serverSupabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(10);
        
        if (!error && messages) {
          conversationHistory = messages;
          logger.debug('Conversation history retrieved', { cid, count: conversationHistory.length });
        }
      }
    } catch (error) {
      logger.error('Failed to get conversation history', { cid }, error);
      // Continue without conversation history
    }

    // Step 4: Build context for OpenAI
    const systemPrompt = `You are Shield AI, a Christian AI assistant that provides biblically-grounded responses. 

Your role is to:
1. Provide accurate, scripture-based answers to questions about Christianity, the Bible, and faith
2. Use the provided Bible verses and context to support your responses
3. Be respectful, compassionate, and encouraging
4. Always ground your responses in biblical truth
5. When appropriate, reference specific Bible verses and explain their relevance

IMPORTANT: Always include relevant Bible verses in your responses and explain how they relate to the user's question. Use the provided context to give accurate, helpful answers.`;

    // Build context from retrieved information
    let contextMessage = '';
    
    if (relevantVerses.length > 0) {
      contextMessage += `\n\nRELEVANT BIBLE VERSES (from vector search):
${relevantVerses.map((verse, index) => 
  `${index + 1}. ${verse.metadata?.reference || 'Unknown'}: "${verse.metadata?.text || verse.text || 'No text available'}"`
).join('\n')}`;
    }

    if (bibleSearchResults.length > 0) {
      contextMessage += `\n\nADDITIONAL BIBLE CONTEXT (from API search):
${bibleSearchResults.map((verse, index) => 
  `${index + 1}. ${verse.reference || 'Unknown'}: "${verse.text || 'No text available'}"`
).join('\n')}`;
    }

    if (conversationHistory.length > 0) {
      contextMessage += `\n\nCONVERSATION HISTORY:
${conversationHistory.slice(-6).map((msg: any) => 
  `${msg.role}: ${msg.content}`
).join('\n')}`;
    }

    // Build messages array
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt + contextMessage },
      ...conversationHistory.slice(-10), // Last 10 messages for context
      { role: 'user', content: message }
    ];

    // Configure OpenAI parameters based on mode
    const model = mode === 'gentle' ? 'gpt-3.5-turbo' : 'gpt-4-turbo-preview';
    const maxTokens = mode === 'gentle' ? 2000 : 4000;
    const temperature = mode === 'gentle' ? 0.7 : 0.8;

    // Step 5: Generate response from OpenAI
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
        const streamResp = await openai.chat.completions.create({
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

        // Save conversation to database
        if (user && conversationId) {
          try {
            // Create Supabase client for test user
            let supabaseClient = serverSupabase;
            if (user.id === 'test-user-123') {
              // For test user, we'll save to a mock or skip saving
              logger.info('Test user - skipping database save', { cid, conversationId });
            } else if (supabaseClient) {
              // Save user message
              await supabaseClient
                .from('messages')
                .insert({
                  conversation_id: conversationId,
                  content: message,
                  role: 'user',
                  metadata: { mode, timestamp: new Date().toISOString() }
                });

              // Save AI response
              await supabaseClient
                .from('messages')
                .insert({
                  conversation_id: conversationId,
                  content: fullText,
                  role: 'assistant',
                  metadata: { 
                    mode, 
                    timestamp: new Date().toISOString(),
                    relevant_verses: relevantVerses.length,
                    bible_search_results: bibleSearchResults.length
                  }
                });

              logger.info('Conversation saved to database', { cid, conversationId });
            }
          } catch (error) {
            logger.error('Failed to save conversation', { cid }, error);
          }
        }

        res.end();
        return;
      } catch (streamErr) {
        logger.error('Streaming error', { cid }, streamErr);
        res.end();
        return;
      }
    } else {
      // Non-streaming response
      const response = await openai.chat.completions.create({
        model: model,
        max_tokens: maxTokens,
        temperature: temperature,
        messages: messages,
      });

      const aiResponse = response.choices[0].message.content;

      // Save conversation to database
      if (user && conversationId) {
        try {
          // Create Supabase client for test user
          let supabaseClient = serverSupabase;
          if (user.id === 'test-user-123') {
            // For test user, we'll save to a mock or skip saving
            logger.info('Test user - skipping database save', { cid, conversationId });
          } else if (supabaseClient) {
            // Save user message
            await supabaseClient
              .from('messages')
              .insert({
                conversation_id: conversationId,
                content: message,
                role: 'user',
                metadata: { mode, timestamp: new Date().toISOString() }
              });

            // Save AI response
            await supabaseClient
              .from('messages')
              .insert({
                conversation_id: conversationId,
                content: aiResponse,
                role: 'assistant',
                metadata: { 
                  mode, 
                  timestamp: new Date().toISOString(),
                  relevant_verses: relevantVerses.length,
                  bible_search_results: bibleSearchResults.length
                }
              });

            logger.info('Conversation saved to database', { cid, conversationId });
          }
        } catch (error) {
          logger.error('Failed to save conversation', { cid }, error);
        }
      }

      logger.info('RAG chat response generated', { 
        cid, 
        ms: Date.now() - startedAt, 
        responseLength: aiResponse?.length || 0,
        relevantVerses: relevantVerses.length,
        bibleSearchResults: bibleSearchResults.length
      });

      return res.status(200).json({
        response: aiResponse,
        mode: mode,
        timestamp: new Date().toISOString(),
        conversationId: conversationId,
        context: {
          relevant_verses: relevantVerses,
          bible_search_results: bibleSearchResults,
          conversation_history_length: conversationHistory.length
        },
        metadata: {
          model: model,
          max_tokens: maxTokens,
          temperature: temperature,
          processing_time_ms: Date.now() - startedAt
        }
      });
    }

  } catch (error) {
    logger.error('RAG chat API error', { cid }, error);
    return res.status(500).json({ 
      error: 'An error occurred while processing your request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
