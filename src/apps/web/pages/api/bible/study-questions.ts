import { NextApiRequest, NextApiResponse } from 'next';
import { isTestToken } from '../../../lib/test-token';
import { complete, extractJson, MODELS } from '../../../lib/llm';
import { createServerSupabaseClient } from '../../../lib/supabase';
import { logger, withCorrelationId } from '../../../lib/logger';
import { applyBibleRateLimit } from '../../../lib/rate-limit';
import { bibleService } from '../../../lib/bible-service';
import { BiblePineconeService } from '../../../lib/bible-pinecone';
import { EmbeddingService } from '../../../lib/embeddings';
import { runScriptureGuarded } from '../../../lib/graph/scripture-guard';
import { extractScriptureReferences } from '../../../lib/reference-utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `bible_study_questions_${Date.now()}`);
  if (!(await applyBibleRateLimit(req, res))) return;
  if (req.method !== 'POST') {
    logger.warn('Method not allowed', { cid, path: '/api/bible/study-questions', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { passage } = req.body || {};

    if (!passage) {
      logger.warn('Missing passage', { cid });
      return res.status(400).json({ error: 'Passage is required' });
    }

    // Get authenticated user (with fallback for testing)
    const authHeader = req.headers.authorization;
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Check for test token first
      if (isTestToken(token)) {
        user = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          name: 'Test User'
        };
        logger.info('Using test user for study questions', { cid, userId: user.id });
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

    logger.info('Generating study questions for passage', { 
      cid, 
      userId: user.id, 
      reference: passage.reference
    });

    // Step 1: Search for related Bible content using Pinecone
    let relatedVerses: any[] = [];
    try {
      const passageText = passage.verses?.map((v: any) => v.text).join(' ') || passage.text;
      const embedding = await EmbeddingService.generateEmbedding(passageText);
      
      const pineconeResults = await BiblePineconeService.searchBibleContent(
        embedding,
        6, // Get related verses for context
        { type: 'bible_verse' }
      );
      
      relatedVerses = pineconeResults || [];
      logger.debug('Pinecone search results for study questions', { cid, count: relatedVerses.length });
    } catch (error) {
      logger.error('Pinecone search failed for study questions', { cid }, error);
      // Continue without Pinecone results
    }

    // Step 2: Search Bible API for additional context
    let bibleSearchResults: any[] = [];
    try {
      const searchResults = await bibleService.searchBible(
        'de4e12af7f28f599-02',
        `${passage.reference} ${passage.text}`, 
        4
      );
      bibleSearchResults = searchResults?.passages || [];
      logger.debug('Bible API search results for study questions', { cid, count: bibleSearchResults.length });
    } catch (error) {
      logger.error('Bible API search failed for study questions', { cid }, error);
      // Continue without Bible API results
    }

    // Step 3: Build context for AI analysis
    const passageText = passage.verses?.map((v: any) => v.text).join(' ') || passage.text;
    const passageReference = passage.reference;

    let contextMessage = `\n\nPASSAGE TO ANALYZE:
Reference: ${passageReference}
Text: "${passageText}"`;

    if (relatedVerses.length > 0) {
      contextMessage += `\n\nRELATED BIBLE VERSES:
${relatedVerses.map((verse, index) => 
  `${index + 1}. ${verse.reference || 'Unknown'}: "${verse.text || 'No text available'}"`
).join('\n')}`;
    }

    if (bibleSearchResults.length > 0) {
      contextMessage += `\n\nADDITIONAL BIBLE CONTEXT:
${bibleSearchResults.map((verse, index) => 
  `${index + 1}. ${verse.reference || 'Unknown'}: "${verse.text || 'No text available'}"`
).join('\n')}`;
    }

    // Step 4: Create specialized prompt for study questions
    const systemPrompt = `You are Shield AI, a Christian AI assistant specializing in creating meaningful Bible study questions. Your role is to generate thoughtful, engaging study questions that help people deepen their understanding of scripture.

IMPORTANT: Create questions that are biblically accurate, thought-provoking, and suitable for personal study or group discussion.

Generate study questions in the following JSON format:
{
  "questions": [
    {
      "id": "unique_id",
      "question": "A thoughtful, engaging question about the passage",
      "type": "reflection|application|theological|historical|practical",
      "difficulty": "beginner|intermediate|advanced",
      "suggestedAnswer": "A helpful suggested answer or guidance for the question",
      "relatedVerses": ["Book Chapter:Verse", "Book Chapter:Verse"],
      "category": "A category like 'Faith', 'Love', 'Salvation', etc."
    }
  ]
}

Guidelines for question creation:
- Create 8-12 diverse questions covering different aspects of the passage
- Mix question types: reflection (personal), application (practical), theological (doctrinal), historical (context), practical (life application)
- Vary difficulty levels: beginner (accessible), intermediate (thoughtful), advanced (deep theological)
- Include suggested answers that are helpful but not exhaustive
- Reference related verses when relevant
- Make questions engaging and relevant to modern believers
- Ensure questions encourage deeper thinking and spiritual growth
- Avoid yes/no questions; prefer open-ended, thought-provoking questions`;

    // Step 5: Generate study questions, guarded so any related verses that
    // don't resolve to real passages trigger a single corrective regeneration.
    const baseMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt + contextMessage },
      { role: 'user', content: `Please generate comprehensive study questions for this Bible passage: ${passageReference}` }
    ];

    const guard = await runScriptureGuarded({
      versionId: 'de4e12af7f28f599-02',
      cid,
      generate: async (correctionNote) => {
        const messages = correctionNote
          ? [...baseMessages, { role: 'system' as const, content: correctionNote }]
          : baseMessages;
        // Structured JSON generation → Sonnet 5 at low effort (system hoisted by complete()).
        return await complete({ messages, model: MODELS.gentle, maxTokens: 3500, effort: 'low' });
      },
      // Verify the model-generated relatedVerses on each question.
      extractReferences: (raw) => {
        try {
          const obj = JSON.parse(extractJson(raw || '{}'));
          const refs: string[] = [];
          for (const q of obj.questions || []) {
            for (const rv of q?.relatedVerses || []) {
              refs.push(...extractScriptureReferences(String(rv)));
            }
          }
          return refs;
        } catch {
          return [];
        }
      },
    });

    const aiResponse = guard.raw;
    
    // Parse the JSON response
    let questionsData;
    try {
      questionsData = JSON.parse(extractJson(aiResponse || '{}'));
    } catch (parseError) {
      logger.error('Failed to parse study questions JSON', { cid }, parseError);
      // Fallback to basic questions
      questionsData = {
        questions: [
          {
            id: 'fallback-1',
            question: 'What is the main message of this passage?',
            type: 'reflection',
            difficulty: 'beginner',
            suggestedAnswer: 'Consider the key themes and what God is communicating through this text.',
            relatedVerses: [],
            category: 'General'
          },
          {
            id: 'fallback-2',
            question: 'How does this passage apply to your life today?',
            type: 'application',
            difficulty: 'intermediate',
            suggestedAnswer: 'Think about practical ways this passage can guide your daily walk with God.',
            relatedVerses: [],
            category: 'Application'
          }
        ]
      };
    }

    // Ensure we have an array of questions
    const questions = Array.isArray(questionsData.questions) ? questionsData.questions : [];

    logger.info('Study questions generated successfully', {
      cid,
      reference: passageReference,
      questionsCount: questions.length,
      citationCorrections: guard.corrections,
      hallucinatedRefs: guard.verification?.hallucinated || [],
    });

    return res.status(200).json({
      questions: questions,
      metadata: {
        passage: passageReference,
        related_verses_count: relatedVerses.length,
        bible_search_results_count: bibleSearchResults.length,
        generated_at: new Date().toISOString(),
        citations: guard.verification,
        citation_corrections: guard.corrections,
      }
    });

  } catch (error) {
    logger.error('Study questions generation error', { cid }, error);
    return res.status(500).json({ 
      error: 'An error occurred while generating study questions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
