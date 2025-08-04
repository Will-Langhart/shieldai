import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { analyzeQuestion, generateSpecializedPrompt } from '../../lib/prompt-engineering';

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
    const { message, mode = 'fast', sessionId = 'default' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
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

    // Generate specialized prompt based on context
    const systemPrompt = generateSpecializedPrompt(questionContext, mode);

    // Use different models and settings based on mode
    const model = mode === 'fast' ? 'gpt-3.5-turbo' : 'gpt-4-turbo-preview';
    const maxTokens = mode === 'fast' ? 800 : 1500;
    const temperature = mode === 'fast' ? 0.7 : 0.8;

    // Build messages array with conversation history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    const response = await openai.chat.completions.create({
      model: model,
      max_tokens: maxTokens,
      temperature: temperature,
      messages: messages,
    });

    const aiResponse = response.choices[0].message.content;

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