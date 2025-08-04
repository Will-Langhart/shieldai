import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { analyzeQuestion, generateSpecializedPrompt } from '../../lib/prompt-engineering';
import { ChatService } from '../../lib/chat-service';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In-memory conversation store (in production, use a database)
const conversationStore = new Map();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, mode = 'fast', sessionId = 'default', conversationId, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get conversation history for this session
    let conversationHistory = conversationStore.get(sessionId) || [];
    
    // Limit conversation history to last 10 messages to manage context
    if (conversationHistory.length > 10) {
      conversationHistory = conversationHistory.slice(-10);
    }

    // Search for similar messages using vector similarity if user is authenticated
    let similarMessages: Array<{ content: string; role: string; score: number }> = [];
    if (userId && conversationId && typeof conversationId === 'string') {
      try {
        similarMessages = await ChatService.searchSimilarMessages(message, userId, conversationId, 3);
        console.log('Found similar messages:', similarMessages.length);
      } catch (error) {
        console.error('Error searching similar messages:', error);
      }
    }

    // Analyze the question to determine context
    const questionContext = analyzeQuestion(message);
    questionContext.sessionLength = conversationHistory.length / 2; // Each exchange is 2 messages

    // Generate specialized prompt based on context
    const systemPrompt = generateSpecializedPrompt(questionContext, mode);

    // Use different models and settings based on mode
    const model = mode === 'fast' ? 'gpt-3.5-turbo' : 'gpt-4-turbo-preview';
    const maxTokens = mode === 'fast' ? 800 : 1500;
    const temperature = mode === 'fast' ? 0.7 : 0.8;

    // Build messages array with conversation history and similar messages
    const messages = [
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

    // Save messages to database and Pinecone if user is authenticated
    if (userId && conversationId && typeof conversationId === 'string') {
      const convId = conversationId;
      try {
        // Save user message
        await ChatService.addMessage(convId, message, 'user', mode);
        
        // Save AI response
        await ChatService.addMessage(convId, aiResponse, 'assistant', mode);
        
        console.log('Messages saved to database and Pinecone');
      } catch (error) {
        console.error('Error saving messages to database:', error);
        // Continue even if database save fails
      }
    }

    // Update conversation history
    conversationHistory.push(
      { role: 'user', content: message },
      { role: 'assistant', content: aiResponse }
    );
    conversationStore.set(sessionId, conversationHistory);

    return res.status(200).json({
      response: aiResponse,
      mode: mode,
      timestamp: new Date().toISOString(),
      sessionId: sessionId
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ 
      error: 'An error occurred while processing your request' 
    });
  }
} 