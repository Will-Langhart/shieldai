import { NextApiRequest, NextApiResponse } from 'next';
import { complete, extractJson, MODELS } from '../../../lib/llm';
import { createServerSupabaseClient } from '../../../lib/supabase';
import { logger, withCorrelationId } from '../../../lib/logger';
import { applyBibleRateLimit } from '../../../lib/rate-limit';
import { bibleService } from '../../../lib/bible-service';
import { BiblePineconeService } from '../../../lib/bible-pinecone';
import { EmbeddingService } from '../../../lib/embeddings';
import { generateDenominationContext } from '../../../lib/prompt-engineering';
import { runScriptureGuarded } from '../../../lib/graph/scripture-guard';
import { extractScriptureReferences } from '../../../lib/reference-utils';

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

    // Step 3a: Fetch user's denomination from Supabase
    let userDenomination: string | null = null;
    if (user && authHeader) {
      try {
        const token = (authHeader as string).substring(7);
        if (token !== 'test-token') {
          const prefClient = createServerSupabaseClient(token);
          const { data: userData } = await prefClient
            .from('users')
            .select('preferences')
            .eq('id', (user as any).id)
            .maybeSingle();
          userDenomination = userData?.preferences?.denomination ?? null;
          logger.debug('User denomination for insights', { cid, denomination: userDenomination });
        }
      } catch {
        // Continue without denomination
      }
    }

    // Step 3b: Build comprehensive context for AI analysis
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
    // Resolve denomination: server-fetched value takes priority over anything passed by client
    const resolvedDenomination = userDenomination || denomination || null;
    const denominationContext = generateDenominationContext(resolvedDenomination as any);

    // Church Fathers guidance per denomination
    const churchFathersGuidance: Record<string, string> = {
      Protestant: 'Focus on Martin Luther, John Calvin, William Tyndale, Thomas Cranmer, and John Knox. Reference their commentaries and reformational writings where relevant.',
      Catholic: 'Prioritize Augustine of Hippo, Thomas Aquinas, Jerome, Ambrose of Milan, Gregory the Great, and John Chrysostom. Reference the Catena Aurea and patristic commentaries.',
      'Eastern Orthodox': 'Prioritize John Chrysostom (Homilies), Basil the Great, Gregory of Nazianzus, Gregory of Nyssa, Maximus the Confessor, and Gregory Palamas. Reflect the theotic and apophatic tradition.',
      'Oriental Orthodox': 'Prioritize Cyril of Alexandria, Athanasius the Great, Ephrem the Syrian, Shenoute of Atripe, and the Desert Fathers. Reflect Miaphysite exegetical tradition.',
    };
    const fathersHint = resolvedDenomination && churchFathersGuidance[resolvedDenomination]
      ? `\nChurch Fathers guidance: ${churchFathersGuidance[resolvedDenomination]}`
      : '\nDraw from major Early Church Fathers across traditions: Augustine, John Chrysostom, Origen, Irenaeus, Athanasius, Basil the Great, and Jerome.';

    const systemPrompt = `You are Shield AI, a Christian AI assistant specializing in biblical analysis and study. Your role is to provide comprehensive, biblically-grounded insights about scripture passages.${denominationContext}

IMPORTANT: Always ground your responses in biblical truth and provide accurate, helpful analysis. Use the provided context to give comprehensive insights.${resolvedDenomination ? ` Frame all analysis through the ${resolvedDenomination} theological tradition — this is the highest priority.` : ''}

Analyze the provided Bible passage and generate insights in the following JSON format ONLY — no markdown, no code fences, raw JSON:
{
  "explanation": "A clear, comprehensive explanation of what this passage means through ${resolvedDenomination || 'a Christian'} lens",
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
  "theologicalSignificance": "The theological importance and meaning of this passage from a ${resolvedDenomination || 'Christian'} perspective",
  "practicalApplication": "How this passage applies to modern Christian life in the ${resolvedDenomination || 'Christian'} tradition",
  "prayerPoints": ["prayer point 1", "prayer point 2", "prayer point 3"],
  "churchFathersInterpretation": {
    "overview": "A summary of how the Early Church Fathers interpreted this passage${resolvedDenomination ? ` with emphasis on ${resolvedDenomination} tradition fathers` : ''}",
    "fathers": [
      {
        "name": "Name of Church Father",
        "era": "Century and tradition (e.g., 4th century, Eastern)",
        "interpretation": "Their specific interpretation or teaching on this passage",
        "quote": "A direct quote or close paraphrase from their writings if available, otherwise omit this field"
      }
    ]
  }
}

Guidelines:
- Keep explanations clear and accessible
- Include 3-5 key themes
- Provide 2-4 relevant cross-references with explanations
- Generate 4-6 study questions of different types
- Make historical context informative but concise
- Focus on practical application for believers
- Include 2-4 prayer points based on the passage
- Church Fathers: include 2-4 fathers who specifically commented on this passage.${fathersHint}
- Always reference scripture and maintain biblical accuracy
- Return ONLY valid JSON — no markdown code fences`;

    // Step 5: Generate AI insights, guarded so cross-references that don't
    // resolve to real passages trigger a single corrective regeneration.
    const baseMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt + contextMessage },
      { role: 'user', content: `Please analyze this Bible passage and provide comprehensive insights: ${passageReference}` }
    ];

    const guard = await runScriptureGuarded({
      versionId: version || 'de4e12af7f28f599-02',
      cid,
      generate: async (correctionNote) => {
        const messages = correctionNote
          ? [...baseMessages, { role: 'system' as const, content: correctionNote }]
          : baseMessages;
        // Structured JSON generation → Sonnet 5 at low effort. `complete()` hoists
        // the system + correction-note turns into Claude's `system` param.
        return await complete({ messages, model: MODELS.gentle, maxTokens: 4000, effort: 'low' });
      },
      // Verify the model-generated cross-references (the hallucination-prone field).
      extractReferences: (raw) => {
        try {
          const obj = JSON.parse(extractJson(raw));
          const refs: string[] = [];
          for (const cr of obj.crossReferences || []) {
            if (cr?.reference) refs.push(...extractScriptureReferences(String(cr.reference)));
          }
          return refs;
        } catch {
          return [];
        }
      },
    });

    const aiResponse = guard.raw;

    // Parse the JSON response (extractJson strips fences / preambles Claude may add)
    let insights;
    try {
      insights = JSON.parse(extractJson(aiResponse || '{}'));
      // Normalize field name: API may return theologicalSignificance, frontend expects theologicalMeaning
      if (insights.theologicalSignificance && !insights.theologicalMeaning) {
        insights.theologicalMeaning = insights.theologicalSignificance;
      }
    } catch (parseError) {
      logger.error('Failed to parse AI insights JSON', { cid }, parseError);
      insights = {
        explanation: aiResponse || 'Unable to generate insights at this time.',
        keyThemes: ['Faith', 'Love', 'Hope'],
        crossReferences: [],
        studyQuestions: [],
        historicalContext: '',
        theologicalMeaning: '',
        practicalApplication: '',
        prayerPoints: [],
        churchFathersInterpretation: null
      };
    }
    // Attach denomination so the client can display it
    insights.denomination = resolvedDenomination;

    logger.info('AI insights generated successfully', {
      cid,
      reference: passageReference,
      themesCount: insights.keyThemes?.length || 0,
      questionsCount: insights.studyQuestions?.length || 0,
      citationCorrections: guard.corrections,
      hallucinatedRefs: guard.verification?.hallucinated || [],
    });

    return res.status(200).json({
      insights: insights,
      metadata: {
        passage: passageReference,
        version: version,
        related_verses_count: relatedVerses.length,
        bible_search_results_count: bibleSearchResults.length,
        generated_at: new Date().toISOString(),
        citations: guard.verification,
        citation_corrections: guard.corrections,
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
