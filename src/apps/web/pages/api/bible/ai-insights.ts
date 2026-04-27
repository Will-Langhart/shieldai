import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { createServerSupabaseClient } from '../../../lib/supabase';
import { logger, withCorrelationId } from '../../../lib/logger';
import { applyBibleRateLimit } from '../../../lib/rate-limit';
import { bibleService } from '../../../lib/bible-service';
import { BiblePineconeService } from '../../../lib/bible-pinecone';
import { EmbeddingService } from '../../../lib/embeddings';
import { generateDenominationContext } from '../../../lib/prompt-engineering';

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `bible_ai_insights_${Date.now()}`);
  if (!(await applyBibleRateLimit(req, res))) return;
  if (req.method !== 'POST') {
    logger.warn('Method not allowed', { cid, path: '/api/bible/ai-insights', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { passage, version, denomination } = req.body || {};

    // Log the request for monitoring
    logger.info('AI insights request', { 
      cid, 
      hasPassage: !!passage, 
      passageReference: passage?.reference,
      version 
    });

    if (!passage) {
      logger.warn('Missing passage', { cid });
      return res.status(400).json({ error: 'Passage is required' });
    }

    if (!passage.reference) {
      logger.warn('Missing passage reference', { cid, passage });
      return res.status(400).json({ error: 'Passage reference is required' });
    }

    // Get authenticated user (with fallback for testing)
    const authHeader = req.headers.authorization;
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Check for test token first
      if (token === 'test-token') {
        user = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          name: 'Test User'
        };
        logger.info('Using test user for AI insights', { cid, userId: user.id });
      } else {
        try {
          const serverSupabase = createServerSupabaseClient(token);
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

    logger.info('Generating AI insights for passage', { 
      cid, 
      userId: user.id, 
      reference: passage.reference,
      version: version 
    });

    // Step 1: Search for related Bible content using Pinecone
    let relatedVerses: any[] = [];
    try {
      // Generate embedding for the passage text
      const passageText = passage.verses?.map((v: any) => v.text).join(' ') || passage.text;
      const embedding = await EmbeddingService.generateEmbedding(passageText);
      
      // Search for related Bible content
      const pineconeResults = await BiblePineconeService.searchBibleContent(
        embedding,
        8, // Get more verses for comprehensive analysis
        { type: 'bible_verse' }
      );
      
      relatedVerses = pineconeResults || [];
      logger.debug('Pinecone search results for insights', { cid, count: relatedVerses.length });
    } catch (error) {
      logger.error('Pinecone search failed for insights', { cid }, error);
      // Continue without Pinecone results
    }

    // Step 2: Search Bible API for additional context
    let bibleSearchResults: any[] = [];
    try {
      const searchResults = await bibleService.searchBible(
        version || 'de4e12af7f28f599-02',
        `${passage.reference} ${passage.text}`, 
        5
      );
      bibleSearchResults = searchResults?.passages || [];
      logger.debug('Bible API search results for insights', { cid, count: bibleSearchResults.length });
    } catch (error) {
      logger.error('Bible API search failed for insights', { cid }, error);
      // Continue without Bible API results
    }

    // Step 3: Build comprehensive context for AI analysis
    const passageText = passage.verses?.map((v: any) => v.text).join(' ') || passage.text;
    const passageReference = passage.reference;
    const bookName = passage.verses?.[0]?.bookName || passage.reference.split(' ')[0];
    const chapterNumber = passage.verses?.[0]?.chapterNumber || 1;

    let contextMessage = `\n\nPASSAGE TO ANALYZE:
Reference: ${passageReference}
Text: "${passageText}"
Version: ${passage.version?.name || 'Unknown'}`;

    if (relatedVerses.length > 0) {
      contextMessage += `\n\nRELATED BIBLE VERSES (from vector search):
${relatedVerses.map((verse, index) => 
  `${index + 1}. ${verse.reference || 'Unknown'}: "${verse.text || 'No text available'}"`
).join('\n')}`;
    }

    if (bibleSearchResults.length > 0) {
      contextMessage += `\n\nADDITIONAL BIBLE CONTEXT (from API search):
${bibleSearchResults.map((verse, index) => 
  `${index + 1}. ${verse.reference || 'Unknown'}: "${verse.text || 'No text available'}"`
).join('\n')}`;
    }

    // Step 4: Create specialized prompts for different types of analysis
    const denominationContext = generateDenominationContext(denomination);
    const systemPrompt = `You are Shield AI, a Christian AI assistant specializing in biblical analysis and study. Your role is to provide comprehensive, biblically-grounded insights about scripture passages.${denominationContext}

IMPORTANT: Always ground your responses in biblical truth and provide accurate, helpful analysis. Use the provided context to give comprehensive insights.

Analyze the provided Bible passage and generate insights in the following JSON format:
{
  "explanation": "A clear, comprehensive explanation of what this passage means, including key concepts and themes",
  "keyThemes": ["theme1", "theme2", "theme3", "theme4", "theme5"],
  "crossReferences": [
    {
      "reference": "Book Chapter:Verse",
      "text": "The actual verse text",
      "relevance": "How this verse relates to the main passage"
    }
  ],
  "studyQuestions": [
    {
      "question": "A thoughtful question for reflection or study",
      "type": "reflection|application|theological"
    }
  ],
  "historicalContext": "Historical and cultural context that helps understand this passage",
  "theologicalSignificance": "The theological importance and meaning of this passage",
  "practicalApplication": "How this passage applies to modern Christian life",
  "prayerPoints": ["prayer point 1", "prayer point 2", "prayer point 3"]
}

Guidelines:
- Keep explanations clear and accessible
- Include 3-5 key themes
- Provide 2-4 relevant cross-references with explanations
- Generate 4-6 study questions of different types
- Make historical context informative but concise
- Focus on practical application for believers
- Include 2-4 prayer points based on the passage
- Always reference scripture and maintain biblical accuracy`;

    // Step 5: Generate AI insights
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt + contextMessage },
      { role: 'user', content: `Please analyze this Bible passage and provide comprehensive insights: ${passageReference}` }
    ];

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 3000,
      temperature: 0.7,
      messages: messages,
    });

    const aiResponse = response.choices[0].message.content;
    
    // Parse the JSON response
    let insights;
    try {
      insights = JSON.parse(aiResponse || '{}');
    } catch (parseError) {
      logger.error('Failed to parse AI insights JSON', { cid }, parseError);
      // Fallback to a basic structure
      insights = {
        explanation: aiResponse || 'Unable to generate insights at this time.',
        keyThemes: ['Faith', 'Love', 'Hope'],
        crossReferences: [],
        studyQuestions: [],
        historicalContext: 'Historical context not available.',
        theologicalSignificance: 'Theological significance not available.',
        practicalApplication: 'Practical application not available.',
        prayerPoints: []
      };
    }

    logger.info('AI insights generated successfully', { 
      cid, 
      reference: passageReference,
      themesCount: insights.keyThemes?.length || 0,
      questionsCount: insights.studyQuestions?.length || 0
    });

    return res.status(200).json({
      insights: insights,
      metadata: {
        passage: passageReference,
        version: version,
        related_verses_count: relatedVerses.length,
        bible_search_results_count: bibleSearchResults.length,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('AI insights generation error', { cid }, error);
    return res.status(500).json({ 
      error: 'An error occurred while generating AI insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
