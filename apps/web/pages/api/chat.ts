import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { analyzeQuestion, generateSpecializedPrompt } from '../../lib/prompt-engineering';
import { classifyObjection, generateSpecializedResponse, objectionHandlers } from '../../lib/objection-classifier';
import { advancedPrompts, responseEnhancers } from '../../lib/advanced-prompts';
import { searchApologeticsContent, enhanceResponseWithContent } from '../../lib/apologetics-knowledge';
import { AnalyticsService } from '../../lib/analytics-service';
import { ChatService } from '../../lib/chat-service';
import { MemoryService } from '../../lib/memory-service';
import { createServerSupabaseClient } from '../../lib/supabase';
import { SubscriptionMiddleware } from '../../lib/subscription-middleware';
import { bibleService } from '../../lib/bible-service';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In-memory conversation store (for development/testing)
const conversationStore = new Map<string, Array<{ role: 'system' | 'user' | 'assistant'; content: string }>>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, mode = 'fast', sessionId = 'default', conversationId, stream } = req.body || {};
    const shouldStream = Boolean(stream) || req.query.stream === '1' || req.query.stream === 'true';

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get authenticated user from Authorization header
    const authHeader = req.headers.authorization;
    let user = null;
    let serverSupabase: any = undefined;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('Received token:', token.substring(0, 20) + '...');
      
      try {
        serverSupabase = createServerSupabaseClient(token);
        const { data: { user: authUser }, error: authError } = await serverSupabase.auth.getUser();
        
        if (authError) {
          console.error('Auth error:', authError);
          return res.status(401).json({ error: 'Invalid authentication token' });
        }
        
        if (authUser) {
          user = authUser;
          console.log('Authenticated user:', user.id, user.email);
        } else {
          console.error('No user found in token');
          return res.status(401).json({ error: 'No user found in token' });
        }
      } catch (error) {
        console.error('Error creating Supabase client:', error);
        return res.status(401).json({ error: 'Authentication failed' });
      }
    } else {
      console.error('No authorization header or invalid format');
      return res.status(401).json({ error: 'Authorization header required' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Developer bypass for langhartcw@gmail.com
    const isDeveloper = user.email === 'langhartcw@gmail.com';
    const developerMode = req.body.developerMode === true;

    // Check subscription access for AI conversations
    const featureAccess = await SubscriptionMiddleware.checkChatAccess(user.id, mode);

    // Apply restrictions for non-developers
    if (!isDeveloper) {
      
      if (!featureAccess.allowed) {
        return res.status(403).json({ 
          error: 'Feature not available',
          message: `${mode === 'accurate' ? 'GPT-4 Accurate mode' : 'AI conversations'} not available on your current plan`,
          upgrade_required: featureAccess.upgrade_required,
          current_tier: featureAccess.current_tier,
          required_tier: featureAccess.required_tier,
          remaining: featureAccess.remaining,
          limit: featureAccess.limit
        });
      }
    } else {
      console.log('Developer mode enabled for:', user.email);
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
    console.log('Objection analysis:', objectionAnalysis);

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
        
        console.log('Found enhanced memory context with', memoryContext.messages.length, 'messages');
        console.log('Key topics detected:', memoryContext.keyTopics);
        console.log('Emotional tone:', memoryContext.emotionalTone);
      } catch (error) {
        console.error('Error getting enhanced memory context:', error);
        
        // Fallback to basic similarity search
        try {
          similarMessages = await ChatService.searchSimilarMessages(message, user.id, conversationId, 3, serverSupabase);
          console.log('Fallback: Found similar messages:', similarMessages.length);
        } catch (fallbackError) {
          console.error('Error in fallback similarity search:', fallbackError);
        }
      }
    }

    // Search apologetics knowledge base for relevant content
    const relevantContent = searchApologeticsContent(message, objectionAnalysis.primaryType);
    console.log('Found relevant apologetics content:', relevantContent.length);

    // Get Bible verse suggestions based on conversation context
    let verseSuggestions: any[] = [];
    try {
      const suggestions = await bibleService.getVerseSuggestions(message, 'de4e12af7f28f599-02');
      verseSuggestions = suggestions.slice(0, 3); // Limit to 3 suggestions
      console.log('Found verse suggestions:', verseSuggestions.length);
    } catch (error) {
      console.error('Error getting verse suggestions:', error);
    }

    // Generate specialized prompt based on context and objection type
    let systemPrompt = generateSpecializedPrompt(questionContext, mode);
    
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
    let model = mode === 'fast' ? 'gpt-3.5-turbo' : 'gpt-4-turbo-preview';
    let maxTokens = mode === 'fast' ? 800 : 1500;
    let temperature = mode === 'fast' ? 0.7 : 0.8;

    // Check if user has access to advanced models
    const advancedModelAccess = await SubscriptionMiddleware.checkApiFeatureAccess(user.id, 'advanced_ai_models');
    if (!advancedModelAccess.allowed && mode === 'accurate') {
      // Fallback to basic model for users without premium
      model = 'gpt-3.5-turbo';
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

        // Analytics and persistence after completion
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
            console.error('Error tracking streamed response:', e);
          }
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
              console.log('Created new conversation (stream):', currentConvId, conversation.title);
            }

            await ChatService.addMessage(currentConvId!, message, 'user', mode, serverSupabase);
            if (fullText) {
              await ChatService.addMessage(currentConvId!, fullText, 'assistant', mode, serverSupabase);
            }

            try {
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
            } catch (memoryError) {
              console.error('Error storing conversation memory (stream):', memoryError);
            }
          } catch (error) {
            console.error('Error saving streamed messages to database:', error);
          }
        }

        // Update in-memory conversation history
        conversationHistory.push(
          { role: 'user', content: message },
          { role: 'assistant', content: fullText || 'No response generated' }
        );
        conversationStore.set(sessionId, conversationHistory);

        res.end();
        return; // Important: stop further JSON response handling
      } catch (streamErr) {
        console.error('Streaming error:', streamErr);
        try {
          res.write('\n');
        } catch (_) {}
        res.end();
        return;
      }
    }

    // Fallback: non-streaming response
    const response = await openai.chat.completions.create({
      model: model,
      max_tokens: maxTokens,
      temperature: temperature,
      messages: messages,
    });

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
          console.log('Created new conversation:', currentConvId, conversation.title);
        }

        // Save user message to database and Pinecone
        await ChatService.addMessage(currentConvId, message, 'user', mode, serverSupabase);
        console.log('Saved user message to database and Pinecone');
        
        // Save AI response to database and Pinecone
        if (aiResponse) {
          await ChatService.addMessage(currentConvId, aiResponse, 'assistant', mode, serverSupabase);
          console.log('Saved AI response to database and Pinecone');
        }
        
        // Store conversation memory with enhanced metadata
        try {
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
          console.log('Stored conversation memory with enhanced metadata');
        } catch (memoryError) {
          console.error('Error storing conversation memory:', memoryError);
          // Don't fail the main flow if memory storage fails
        }
        
        console.log('All messages saved to database, Pinecone, and memory successfully');
      } catch (error) {
        console.error('Error saving messages to database:', error);
        // Continue even if database save fails
      }
    } else {
      console.log('No authenticated user - messages will not be saved to database');
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
      subscription: {
        isInTrial: false, // TODO: Add trial status to FeatureCheckResult
        hasActiveSubscription: featureAccess?.allowed || false,
        messageLimit: featureAccess?.limit || 0,
        remainingMessages: featureAccess?.remaining || 0
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ 
      error: 'An error occurred while processing your request' 
    });
  }
} 