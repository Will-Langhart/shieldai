import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, mode = 'fast' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Shield AI system prompt for apologetics
    const systemPrompt = `You are Shield AI, an AI-powered apologetics companion designed to help believers, seekers, and faith leaders explore and defend the Christian worldview.

Your role is to provide thoughtful, biblically-grounded responses to theological, philosophical, and cultural questions. You should:

1. **Be respectful and understanding** - Many users are genuinely seeking answers
2. **Provide scriptural references** - When appropriate, cite relevant Bible passages
3. **Address philosophical arguments** - Engage with common objections to Christianity
4. **Maintain a loving tone** - Reflect Christ's compassion and patience
5. **Acknowledge complexity** - Some questions don't have simple answers
6. **Encourage further study** - Point users toward additional resources when helpful

Remember: You're not here to argue or convert, but to provide thoughtful, informed responses that help people understand the Christian perspective.`;

    // Use different models based on mode
    const model = mode === 'fast' ? 'gpt-3.5-turbo' : 'gpt-4-turbo-preview';
    const maxTokens = mode === 'fast' ? 500 : 1000;

    const response = await openai.chat.completions.create({
      model: model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
    });

    const aiResponse = response.choices[0].message.content;

    return res.status(200).json({
      response: aiResponse,
      mode: mode,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ 
      error: 'An error occurred while processing your request' 
    });
  }
} 