import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { analyzeQuestion, generateSpecializedPrompt, generateDenominationContext } from '../../lib/prompt-engineering';
import { classifyObjection, generateSpecializedResponse, objectionHandlers } from '../../lib/objection-classifier';
import { advancedPrompts, responseEnhancers } from '../../lib/advanced-prompts';
import { searchApologeticsContent, enhanceResponseWithContent } from '../../lib/apologetics-knowledge';
import { AnalyticsService } from '../../lib/analytics-service';
import { ChatService } from '../../lib/chat-service';
import { MemoryService } from '../../lib/memory-service';
import { createServerSupabaseClient } from '../../lib/supabase';
import { SubscriptionMiddleware } from '../../lib/subscription-middleware';
import { bibleService } from '../../lib/bible-service';
import { BiblePineconeService } from '../../lib/bible-pinecone';
import { EmbeddingService } from '../../lib/embeddings';
import { VideoService } from '../../lib/video-service';
import { logger, withCorrelationId, devLogger } from '../../lib/logger';
import { applyChatRateLimit } from '../../lib/rate-limit';

// Initialize OpenAI client lazily
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

// In-memory conversation store (for development/testing)
const conversationStore = new Map<string, Array<{ role: 'system' | 'user' | 'assistant'; content: string }>>();

// Memory service health check - disable if it fails consistently
let memoryServiceDisabled = false;
let memoryServiceFailureCount = 0;
const MAX_MEMORY_FAILURES = 3;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `chat_${Date.now()}`);
  const startedAt = Date.now();
  if (!(await applyChatRateLimit(req, res))) return;
  if (req.method !== 'POST') {
    logger.warn('Method not allowed', { cid, path: '/api/chat', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, mode = 'gentle', sessionId = 'default', conversationId, stream, bibleVersion } = req.body || {};
    const shouldStream = Boolean(stream) || req.query.stream === '1' || req.query.stream === 'true';

    if (!message) {
      logger.warn('Missing message', { cid });
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get authenticated user from Authorization header
    const authHeader = req.headers.authorization;
    let user = null;
    let serverSupabase: any = undefined;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      logger.debug('Received token', { cid, token_prefix: token.substring(0, 8) });
      
      try {
        serverSupabase = createServerSupabaseClient(token);
        const { data: { user: authUser }, error: authError } = await serverSupabase.auth.getUser();
        
        if (authError) {
          logger.error('Auth error', { cid }, authError);
          return res.status(401).json({ error: 'Invalid authentication token' });
        }
        
        if (authUser) {
          user = authUser;
          logger.info('Authenticated', { cid, userId: user.id, email: user.email });
        } else {
          logger.warn('No user found in token', { cid });
          return res.status(401).json({ error: 'No user found in token' });
        }
      } catch (error) {
        logger.error('Supabase client create failed', { cid }, error);
        return res.status(401).json({ error: 'Authentication failed' });
      }
    } else {
      logger.warn('No authorization header', { cid });
      return res.status(401).json({ error: 'Authorization header required' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Enhanced development logging for chat requests (after authentication)
    devLogger.chat.request(message, user.id, mode, cid);

    const developerEmails = (process.env.DEVELOPER_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
    const isDeveloper = process.env.NODE_ENV !== 'production' && developerEmails.includes(user.email);
    const developerMode = req.body.developerMode === true;

    // Check subscription access for AI conversations
    const featureAccess = await SubscriptionMiddleware.checkChatAccess(user.id, mode);

    // Apply restrictions for non-developers
    if (!isDeveloper) {
      
      if (!featureAccess.allowed) {
        return res.status(403).json({ 
          error: 'Feature not available',
          message: `${mode === 'scholarly' ? 'GPT-4 Scholarly mode' : mode === 'debate' ? 'GPT-4 Debate mode' : 'AI conversations'} not available on your current plan`,
          upgrade_required: featureAccess.upgrade_required,
          current_tier: featureAccess.current_tier,
          required_tier: featureAccess.required_tier,
          remaining: featureAccess.remaining,
          limit: featureAccess.limit
        });
      }
    } else {
      logger.info('Developer mode enabled', { cid, userId: user.id, email: user.email });
    }

    // Fetch user denomination preference
    let userDenomination: string | null = null;
    try {
      const { data: userRow } = await serverSupabase
        .from('users')
        .select('preferences')
        .eq('id', user.id)
        .single();
      userDenomination = userRow?.preferences?.denomination ?? null;
    } catch {
      // non-fatal
    }

    // Get conversation history for this session
    let conversationHistory = conversationStore.get(sessionId) || [];
    
    // Limit conversation history to last 10 messages to manage context
    if (conversationHistory.length > 10) {
      conversationHistory = conversationHistory.slice(-10);
    }

    // Analyze the question to determine context
    const questionContext = analyzeQuestion(message);
    questionContext.sessionLength = conversationHistory.length / 2; // Each exchange is 2 messages

    // Advanced objection classification
    const objectionAnalysis = classifyObjection(message);
    logger.debug('Objection analysis', { cid }, objectionAnalysis);

    // Track analytics for the question
    if (user) {
      AnalyticsService.trackQuestion(
        user.id,
        message,
        objectionAnalysis.primaryType,
        objectionAnalysis.userStance,
        objectionAnalysis.intensity,
        sessionId,
        conversationId
      );
    }

    // Get enhanced conversation context with long-term memory
    let memoryContext = null;
    let similarMessages: Array<{ content: string; role: string; score: number }> = [];
    
    if (user && conversationId && typeof conversationId === 'string') {
      try {
        // Get enhanced memory context
        memoryContext = await MemoryService.getEnhancedConversationContext(
          conversationId,
          user.id,
          message,
          10 // Get top 10 relevant memories
        );
        
        // Extract similar messages from memory context
        similarMessages = memoryContext.messages
          .filter(msg => msg.relevance > 0.7) // Only include highly relevant memories
          .map(msg => ({
            content: msg.content,
            role: msg.role,
            score: msg.relevance,
          }));
        
        logger.info('Memory context', { cid, count: memoryContext.messages.length, keyTopics: memoryContext.keyTopics, emotionalTone: memoryContext.emotionalTone });
      } catch (error) {
        logger.error('Enhanced memory context failed', { cid }, error);
        
        // Fallback to basic similarity search
        try {
          similarMessages = await ChatService.searchSimilarMessages(message, user.id, conversationId, 3, serverSupabase);
          logger.info('Similarity fallback', { cid, count: similarMessages.length });
        } catch (fallbackError) {
          logger.error('Similarity fallback failed', { cid }, fallbackError);
        }
      }
    }

    // Search apologetics knowledge base for relevant content
    const relevantContent = searchApologeticsContent(message, objectionAnalysis.primaryType);
    logger.debug('Apologetics content', { cid, count: relevantContent.length });

    // Get Bible verse suggestions based on conversation context
    let verseSuggestions: any[] = [];
    try {
      const suggestions = await bibleService.getVerseSuggestions(message, 'de4e12af7f28f599-02');
      verseSuggestions = suggestions.slice(0, 3); // Limit to 3 suggestions
      logger.debug('Verse suggestions', { cid, count: verseSuggestions.length });
    } catch (error) {
      logger.error('Verse suggestions failed', { cid }, error);
    }

    // Get Bible content from Pinecone vector database for enhanced context
    let bibleVectorResults: any[] = [];
    try {
      // Generate embedding for the user's message
      const messageEmbedding = await EmbeddingService.generateEmbeddingForIndex(message);
      
      // Search for relevant Bible content across all namespaces
      const results = await BiblePineconeService.searchBibleContent(
        messageEmbedding,
        5, // Get top 5 most relevant verses
        { type: 'bible_verse' }
      );
      
      bibleVectorResults = results;
      logger.debug('Bible vector search results', { cid, count: bibleVectorResults.length });
    } catch (error) {
      logger.error('Bible vector search failed', { cid }, error);
      // Don't fail the entire request if vector search fails
    }

    // Search for relevant videos based on user message
    let relevantVideos: any[] = [];
    try {
      // Enhanced development logging for video search
      devLogger.chat.videoSearch(message, cid);
      
      const videoResults = await VideoService.searchRelevantVideos({
        query: message,
        maxResults: 3,
        relevanceThreshold: 0.05,
        includeScripture: true,
        userContext: {
          objectionType: objectionAnalysis.primaryType,
          userStance: objectionAnalysis.userStance,
          intensity: objectionAnalysis.intensity,
          mode: mode,
          previousTopics: memoryContext?.keyTopics || [],
          emotionalTone: memoryContext?.emotionalTone
        }
      });
      
      relevantVideos = videoResults;
      logger.debug('Video search results', { cid, count: relevantVideos.length });
    } catch (error) {
      logger.error('Video search failed', { cid }, error);
      // Don't fail the entire request if video search fails
    }

    // Generate specialized prompt based on context and objection type
    let systemPrompt = generateSpecializedPrompt(questionContext, mode);

    // Inject denomination-specific theological framing
    const denominationContext = generateDenominationContext(userDenomination as any);
    if (denominationContext) {
      systemPrompt += denominationContext;
    }

    // Add Bible version context if provided
    if (bibleVersion && bibleVersion.id && bibleVersion.name) {
      systemPrompt += `\n\nBIBLE VERSION CONTEXT:
You are working with the ${bibleVersion.name} (${bibleVersion.id}) Bible translation. When referencing Scripture, please use this version and note that you're working from the ${bibleVersion.name}. If you need to quote specific verses, please indicate that you're referencing the ${bibleVersion.name} translation.

This Bible version has the following characteristics:
- Name: ${bibleVersion.name}
- Type: ${bibleVersion.type}
- Language: ${bibleVersion.language.name}
- Description: ${bibleVersion.description}

Please incorporate this Bible version context naturally into your responses when referencing Scripture.`;
    }
    
    // Add memory context to system prompt if available
    if (memoryContext && memoryContext.messages.length > 0) {
      const memoryContextPrompt = `
IMPORTANT MEMORY CONTEXT:
Based on our previous conversations, I remember discussing these topics: ${memoryContext.keyTopics.join(', ')}.
The emotional tone of our previous interactions has been: ${memoryContext.emotionalTone}.
User preferences: ${memoryContext.userPreferences?.communicationStyle || 'standard'} communication style, interested in: ${memoryContext.userPreferences?.preferredTopics?.join(', ') || 'general topics'}.

Please reference relevant previous discussions when appropriate and maintain consistency with our conversation history.`;
      
      systemPrompt += memoryContextPrompt;
    }
    
    // Add advanced objection-specific guidance
    if (objectionAnalysis.primaryType === 'logical' && objectionAnalysis.keyThemes.includes('problem of evil')) {
      const evilPrompt = advancedPrompts.problemOfEvil(objectionAnalysis.intensity);
      systemPrompt += `\n\n${evilPrompt.systemPrompt}`;
    } else if (objectionAnalysis.primaryType === 'moral') {
      const moralPrompt = advancedPrompts.moralObjections(objectionAnalysis.intensity);
      systemPrompt += `\n\n${moralPrompt.systemPrompt}`;
    } else if (objectionAnalysis.primaryType === 'scientific') {
      const scientificPrompt = advancedPrompts.scientificObjections(objectionAnalysis.intensity);
      systemPrompt += `\n\n${scientificPrompt.systemPrompt}`;
    } else if (objectionAnalysis.primaryType === 'historical') {
      const historicalPrompt = advancedPrompts.historicalObjections(objectionAnalysis.intensity);
      systemPrompt += `\n\n${historicalPrompt.systemPrompt}`;
    } else if (objectionAnalysis.primaryType === 'emotional' || objectionAnalysis.primaryType === 'personal') {
      const pastoralPrompt = advancedPrompts.personalStruggles(objectionAnalysis.intensity);
      systemPrompt += `\n\n${pastoralPrompt.systemPrompt}`;
    } else if (objectionAnalysis.primaryType === 'cultural') {
      const culturalPrompt = advancedPrompts.culturalEngagement(objectionAnalysis.intensity);
      systemPrompt += `\n\n${culturalPrompt.systemPrompt}`;
    }

    // Use different models and settings based on mode and subscription
    let model = mode === 'gentle' ? 'gpt-5.2' : 'gpt-5.4';
    let maxTokens = mode === 'gentle' ? 2000 : 4000; // Increased token limits for scholarly/debate modes
    let temperature = mode === 'gentle' ? 0.7 : 0.8;

    // Check if user has access to advanced models
    const advancedModelAccess = await SubscriptionMiddleware.checkApiFeatureAccess(user.id, 'advanced_ai_models');
    if (!advancedModelAccess.allowed && (mode === 'scholarly' || mode === 'debate')) {
      // Fallback to basic model for users without premium
      model = 'gpt-5.2';
      maxTokens = 800;
      temperature = 0.7;
    }

    // Build messages array with conversation history and similar messages
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

        // Add similar messages as context if found
    if (similarMessages.length > 0) {
      const contextMessage = `Based on similar previous conversations, here are relevant examples:\n${similarMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nPlease use this context to provide a more informed response.`;
      messages.splice(-1, 0, { role: 'system', content: contextMessage });
    }

    // Add Bible verse suggestions as context if found
    if (verseSuggestions.length > 0) {
      const verseContext = `\n\nRelevant Bible verses for this conversation:\n${verseSuggestions.map(verse => `${verse.reference}: "${verse.text}"`).join('\n')}\n\nPlease incorporate these relevant Bible verses naturally into your response when appropriate, providing context and explanation for how they relate to the user's question.`;
      messages.splice(-1, 0, { role: 'system', content: verseContext });
    }

    // Add Bible vector search results as enhanced Scripture context
    if (bibleVectorResults.length > 0) {
      const vectorContext = `\n\nENHANCED SCRIPTURE CONTEXT FROM VECTOR DATABASE:
I have access to semantically relevant Bible content that directly relates to your question. Here are the most relevant Scripture passages:

${bibleVectorResults.map(result => `${result.reference} (${result.book} ${result.chapter}:${result.verse}): "${result.text}"`).join('\n')}

Please use these Scripture passages as your primary biblical foundation when responding. Highlight them in blue and explain how they specifically address the user's question. These verses have been selected using advanced semantic search to ensure maximum relevance.`;
      
      messages.splice(-1, 0, { role: 'system', content: vectorContext });
    }

    // Add relevant video content as multimedia context
    if (relevantVideos.length > 0) {
      const videoContext = `\n\nMULTIMEDIA CONTEXT - RELEVANT VIDEOS:
I have found relevant video content that can enhance your understanding of this topic. Here are the most relevant videos:

${relevantVideos.map(video => `📹 ${video.title} (${video.duration}) - ${video.channel}
${video.description}
Watch: ${video.url}`).join('\n\n')}

Please mention these relevant videos in your response and explain how they can help the user better understand the topic. Include the video titles and brief descriptions to give context. These videos have been selected for their relevance to your question and include scripture references where applicable.`;
      
      messages.splice(-1, 0, { role: 'system', content: videoContext });
    }

    // If streaming requested, stream tokens as they arrive
    if (shouldStream) {
      // Prepare headers for chunked streaming
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no'
      });

      let fullText = '';

      try {
        logger.info('Streaming start', { cid, model, maxTokens, temperature });
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

        // Analytics and persistence after completion
        logger.info('Streaming end', { cid, ms: Date.now() - startedAt, bytes: fullText.length });
        if (user) {
          try {
            AnalyticsService.trackResponse(
              user.id,
              fullText,
              objectionAnalysis.responseStrategy,
              objectionAnalysis.primaryType,
              sessionId,
              conversationId
            );
          } catch (e) {
            logger.error('Track streamed response failed', { cid }, e);
          }
        }

        // Enhanced video search after AI response for better context matching
        try {
          let videosToSend = relevantVideos;
          
          // If we have an AI response, do an enhanced video search
          if (fullText && fullText.length > 50) {
            try {
              // Enhanced development logging for enhanced video search
              devLogger.chat.videoSearch(`Enhanced search for: ${message}`, cid);
              
              const enhancedVideoResults = await VideoService.searchRelevantVideos({
                query: message,
                maxResults: 3,
                relevanceThreshold: 0.05,
                includeScripture: true,
                userContext: {
                  objectionType: objectionAnalysis.primaryType,
                  userStance: objectionAnalysis.userStance,
                  intensity: objectionAnalysis.intensity,
                  mode: mode,
                  previousTopics: memoryContext?.keyTopics || [],
                  emotionalTone: memoryContext?.emotionalTone
                },
                aiResponse: fullText
              });
              
              // Use enhanced results if they're better, otherwise keep original
              if (enhancedVideoResults.length > 0) {
                videosToSend = enhancedVideoResults;
                logger.debug('Enhanced video search completed', { 
                  cid, 
                  enhancedCount: enhancedVideoResults.length,
                  originalCount: relevantVideos.length
                });
              }
            } catch (enhancedError) {
              logger.warn('Enhanced video search failed, using original results', { cid }, enhancedError);
            }
          }
          
          // Ensure we have video data - if none found, use fallback
          if (!videosToSend || videosToSend.length === 0) {
            logger.warn('No videos found, using fallback', { cid });
            videosToSend = [
              {
                id: '6xJwCaSXnvE', // Real YouTube video ID
                title: 'Evidence for Christianity - Dr. William Lane Craig',
                description: 'A comprehensive overview of the evidence for the Christian faith',
                thumbnail: 'https://img.youtube.com/vi/6xJwCaSXnvE/maxresdefault.jpg',
                url: 'https://www.youtube.com/watch?v=6xJwCaSXnvE',
                duration: '1:23:45',
                channel: 'Reasonable Faith',
                publishedAt: '2023-01-15T00:00:00Z',
                relevance: 0.9,
                source: 'youtube' as any
              },
              {
                id: '8VeQHh8vZqE', // Real YouTube video ID
                title: 'The Case for Christ - Lee Strobel',
                description: 'Investigative journalist examines the evidence for Jesus',
                thumbnail: 'https://img.youtube.com/vi/8VeQHh8vZqE/maxresdefault.jpg',
                url: 'https://www.youtube.com/watch?v=8VeQHh8vZqE',
                duration: '1:15:30',
                channel: 'Zondervan',
                publishedAt: '2022-06-20T00:00:00Z',
                relevance: 0.85,
                source: 'youtube' as any
              },
              {
                id: '9BZ0D6PJUPQ', // Real YouTube video ID
                title: 'Mere Christianity - C.S. Lewis',
                description: 'Classic apologetics work defending the Christian worldview',
                thumbnail: 'https://img.youtube.com/vi/9BZ0D6PJUPQ/maxresdefault.jpg',
                url: 'https://www.youtube.com/watch?v=9BZ0D6PJUPQ',
                duration: '1:08:15',
                channel: 'HarperOne',
                publishedAt: '2022-03-10T00:00:00Z',
                relevance: 0.8,
                source: 'youtube' as any
              }
            ];
          }
          
          const videoData = {
            type: 'video_data',
            videos: videosToSend,
            bibleVerses: bibleVectorResults || []
          };
          
          // Debug logging
          logger.debug('Preparing enhanced video data for stream', { 
            cid, 
            videoCount: videosToSend.length,
            videoDataStructure: JSON.stringify(videoData),
            firstVideo: videosToSend[0] ? {
              id: videosToSend[0].id,
              title: videosToSend[0].title,
              url: videosToSend[0].url
            } : null,
            enhancedSearch: fullText ? 'yes' : 'no'
          });
          
          // Send video data as a separate chunk with clear separation
          res.write('\n'); // Ensure separation from AI response
          res.write('VIDEO_DATA_START\n');
          res.write(JSON.stringify(videoData));
          res.write('\nVIDEO_DATA_END\n');
          logger.debug('Sent enhanced video data in stream', { 
            cid, 
            videoCount: videosToSend.length,
            dataLength: JSON.stringify(videoData).length
          });
        } catch (e) {
          logger.error('Failed to send enhanced video data in stream', { cid }, e);
        }

        let currentConvId = conversationId as string | undefined;
        let isNewConversation = false;
        if (user) {
          try {
            if (!currentConvId) {
              const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
              const conversation = await ChatService.createConversation(title, serverSupabase);
              currentConvId = conversation.id;
              isNewConversation = true;
              logger.info('Created conversation (stream)', { cid, convId: currentConvId, title: conversation.title });
            }

            await ChatService.addMessage(currentConvId!, message, 'user', mode, serverSupabase);
            if (fullText) {
              await ChatService.addMessage(
                currentConvId!, 
                fullText, 
                'assistant', 
                mode, 
                serverSupabase,
                relevantVideos,
                bibleVectorResults,
                {
                  searchQuery: message,
                  searchTimestamp: new Date().toISOString(),
                  videoCount: relevantVideos?.length || 0,
                  bibleVerseCount: bibleVectorResults?.length || 0
                }
              );
            }

            try {
              // Add timeout protection for memory operations in streaming mode
              const memoryPromise = (async () => {
                const messagesToStore = await ChatService.getMessages(currentConvId!, serverSupabase);
                await MemoryService.storeConversationMemory(
                  currentConvId!,
                  user.id,
                  messagesToStore.map(msg => ({
                    content: msg.content,
                    role: msg.role as any,
                    timestamp: msg.created_at,
                  })),
                  {
                    mode,
                    objectionType: objectionAnalysis.primaryType,
                    emotionalTone: objectionAnalysis.intensity,
                    keyThemes: objectionAnalysis.keyThemes,
                  }
                );
                logger.info('Memory stored (stream)', { cid, convId: currentConvId });
              })();

              // Set a 10-second timeout for memory operations
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Memory operation timeout (stream)')), 10000);
              });

              await Promise.race([memoryPromise, timeoutPromise]);
            } catch (memoryError) {
              logger.error('Memory store (stream) failed', { cid }, memoryError);
              // Don't fail the main flow if memory storage fails
            }
          } catch (error) {
            logger.error('Save streamed messages failed', { cid }, error);
          }
        }

        // Update in-memory conversation history
        conversationHistory.push(
          { role: 'user', content: message },
          { role: 'assistant', content: fullText || 'No response generated' }
        );
        conversationStore.set(sessionId, conversationHistory);

        // Enhanced development logging for response completion
        devLogger.chat.response(fullText?.length || 0, relevantVideos?.length || 0, cid);
        
        res.end();
        return; // Important: stop further JSON response handling
      } catch (streamErr) {
        logger.error('Streaming error', { cid }, streamErr);
        try {
          res.write('\n');
        } catch (_) {}
        res.end();
        return;
      }
    }

    // Fallback: non-streaming response
    const response = await getOpenAI().chat.completions.create({
      model: model,
      max_tokens: maxTokens,
      temperature: temperature,
      messages: messages,
    });
    logger.info('Non-stream completion', { cid, ms: Date.now() - startedAt });

    const aiResponse = response.choices[0].message.content;

    // Enhance response with apologetics knowledge base content
    let enhancedResponse = aiResponse;
    if (relevantContent.length > 0 && aiResponse) {
      const content = relevantContent[0];
      enhancedResponse = `${aiResponse}

**Additional Resources:**
${content.title}

${content.content.substring(0, 200)}...

**Key Scriptures:** ${content.scriptures.join(', ')}
**Further Reading:** ${content.sources.join(', ')}`;
    }

    // Track analytics for the response
    if (user) {
      AnalyticsService.trackResponse(
        user.id,
        enhancedResponse || aiResponse || '',
        objectionAnalysis.responseStrategy,
        objectionAnalysis.primaryType,
        sessionId,
        conversationId
      );
    }

    let currentConvId = conversationId;
    let isNewConversation = false;

    // Handle conversation creation and message saving if user is authenticated
    if (user) {
      try {
        // If no conversation ID, create a new conversation
        if (!currentConvId) {
          const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
          const conversation = await ChatService.createConversation(title, serverSupabase);
          currentConvId = conversation.id;
          isNewConversation = true;
          logger.info('Created conversation', { cid, convId: currentConvId, title: conversation.title });
        }

        // Save user message to database and Pinecone
        await ChatService.addMessage(currentConvId, message, 'user', mode, serverSupabase);
        logger.debug('Saved user message', { cid, convId: currentConvId });
        
        // Save AI response to database and Pinecone
        if (aiResponse) {
          await ChatService.addMessage(
            currentConvId, 
            aiResponse, 
            'assistant', 
            mode, 
            serverSupabase,
            relevantVideos,
            bibleVectorResults,
            {
              searchQuery: message,
              searchTimestamp: new Date().toISOString(),
              videoCount: relevantVideos?.length || 0,
              bibleVerseCount: bibleVectorResults?.length || 0
            }
          );
          logger.debug('Saved AI response with videos', { cid, convId: currentConvId, videoCount: relevantVideos?.length || 0 });
        }
        
        // Store conversation memory with enhanced metadata (only if service is healthy)
        if (!memoryServiceDisabled) {
          try {
            // Add timeout protection for memory operations
            const memoryPromise = (async () => {
              const messages = await ChatService.getMessages(currentConvId, serverSupabase);
              await MemoryService.storeConversationMemory(
                currentConvId,
                user.id,
                messages.map(msg => ({
                  content: msg.content,
                  role: msg.role,
                  timestamp: msg.created_at,
                })),
                {
                  mode,
                  objectionType: objectionAnalysis.primaryType,
                  emotionalTone: objectionAnalysis.intensity,
                  keyThemes: objectionAnalysis.keyThemes,
                }
              );
              logger.info('Memory stored', { cid, convId: currentConvId });
              
              // Reset failure count on success
              memoryServiceFailureCount = 0;
            })();

            // Set a 10-second timeout for memory operations
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Memory operation timeout')), 10000);
            });

            await Promise.race([memoryPromise, timeoutPromise]);
          } catch (memoryError) {
            logger.error('Memory store failed', { cid }, memoryError);
            memoryServiceFailureCount++;
            
            // Disable memory service if it fails too many times
            if (memoryServiceFailureCount >= MAX_MEMORY_FAILURES) {
              memoryServiceDisabled = true;
              logger.warn('Memory service disabled', { cid, failures: memoryServiceFailureCount });
            }
            
            // Don't fail the main flow if memory storage fails
            // Continue with the response
          }
        } else {
          logger.warn('Memory disabled (previous failures)', { cid });
        }
        
        logger.info('Messages saved', { cid, convId: currentConvId });
      } catch (error) {
        logger.error('Save messages failed', { cid }, error);
        // Continue even if database save fails
      }
    } else {
      logger.warn('Unauthenticated user; skip persistence', { cid });
    }

    // Update conversation history
    conversationHistory.push(
      { role: 'user', content: message },
      { role: 'assistant', content: aiResponse || 'No response generated' }
    );
    conversationStore.set(sessionId, conversationHistory);

    return res.status(200).json({
      response: enhancedResponse || 'No response generated',
      mode: mode,
      timestamp: new Date().toISOString(),
      sessionId: sessionId,
      conversationId: currentConvId,
      isNewConversation: isNewConversation,
      relevantVideos: relevantVideos,
      bibleVerses: bibleVectorResults,
      subscription: {
        isInTrial: false, // TODO: Add trial status to FeatureCheckResult
        hasActiveSubscription: featureAccess?.allowed || false,
        messageLimit: featureAccess?.limit || 0,
        remainingMessages: featureAccess?.remaining || 0
      }
    });

  } catch (error) {
    logger.error('Chat API error', { cid }, error);
    return res.status(500).json({ 
      error: 'An error occurred while processing your request' 
    });
  }
} 