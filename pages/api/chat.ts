import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { analyzeQuestion, generateSpecializedPrompt } from '../../lib/prompt-engineering';
import { classifyObjection, generateSpecializedResponse, objectionHandlers } from '../../lib/objection-classifier';
import { advancedPrompts, responseEnhancers } from '../../lib/advanced-prompts';
import { searchApologeticsContent, enhanceResponseWithContent } from '../../lib/apologetics-knowledge';
import { AnalyticsService } from '../../lib/analytics-service';
import { ChatService } from '../../lib/chat-service';
import { createServerSupabaseClient } from '../../lib/supabase';

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
    const { message, mode = 'fast', sessionId = 'default', conversationId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get authenticated user from Authorization header
    const authHeader = req.headers.authorization;
    let user = null;
    let serverSupabase: any = undefined;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      serverSupabase = createServerSupabaseClient(token);
      const { data: { user: authUser }, error: authError } = await serverSupabase.auth.getUser();
      if (!authError && authUser) {
        user = authUser;
        console.log('Authenticated user:', user.id, user.email);
      } else {
        console.error('Auth error:', authError);
      }
    }
    
    if (!user) {
      console.log('No authenticated user found');
      // Continue without authentication for now
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

    // Search for similar messages using vector similarity if user is authenticated
    let similarMessages: Array<{ content: string; role: string; score: number }> = [];
    if (user && conversationId && typeof conversationId === 'string') {
      try {
        similarMessages = await ChatService.searchSimilarMessages(message, user.id, conversationId, 3, serverSupabase);
        console.log('Found similar messages:', similarMessages.length);
      } catch (error) {
        console.error('Error searching similar messages:', error);
      }
    }

    // Search apologetics knowledge base for relevant content
    const relevantContent = searchApologeticsContent(message, objectionAnalysis.primaryType);
    console.log('Found relevant apologetics content:', relevantContent.length);

    // Generate specialized prompt based on context and objection type
    let systemPrompt = generateSpecializedPrompt(questionContext, mode);
    
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

    // Use different models and settings based on mode
    const model = mode === 'fast' ? 'gpt-3.5-turbo' : 'gpt-4-turbo-preview';
    const maxTokens = mode === 'fast' ? 800 : 1500;
    const temperature = mode === 'fast' ? 0.7 : 0.8;

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
        
        console.log('All messages saved to database and Pinecone successfully');
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
      isNewConversation: isNewConversation
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ 
      error: 'An error occurred while processing your request' 
    });
  }
} 