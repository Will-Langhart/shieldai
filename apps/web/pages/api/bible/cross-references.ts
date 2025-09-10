import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { createServerSupabaseClient } from '../../../lib/supabase';
import { logger, withCorrelationId } from '../../../lib/logger';
import { bibleService } from '../../../lib/bible-service';
import { BiblePineconeService } from '../../../lib/bible-pinecone';
import { EmbeddingService } from '../../../lib/embeddings';

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
  const cid = withCorrelationId(req, `bible_cross_references_${Date.now()}`);

  if (req.method !== 'POST') {
    logger.warn('Method not allowed', { cid, path: '/api/bible/cross-references', method: req.method });
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
      if (token === 'test-token') {
        user = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          name: 'Test User'
        };
        logger.info('Using test user for cross-references', { cid, userId: user.id });
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

    logger.info('Generating cross-references for passage', { 
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
        12, // Get more verses for cross-reference analysis
        { type: 'bible_verse' }
      );
      
      relatedVerses = pineconeResults || [];
      logger.debug('Pinecone search results for cross-references', { cid, count: relatedVerses.length });
    } catch (error) {
      logger.error('Pinecone search failed for cross-references', { cid }, error);
      // Continue without Pinecone results
    }

    // Step 2: Search Bible API for additional context
    let bibleSearchResults: any[] = [];
    try {
      const searchResults = await bibleService.searchBible(
        `${passage.reference} ${passage.text}`, 
        'de4e12af7f28f599-02', 
        8
      );
      bibleSearchResults = searchResults?.passages || [];
      logger.debug('Bible API search results for cross-references', { cid, count: bibleSearchResults.length });
    } catch (error) {
      logger.error('Bible API search failed for cross-references', { cid }, error);
      // Continue without Bible API results
    }

    // Step 3: Build context for AI analysis
    const passageText = passage.verses?.map((v: any) => v.text).join(' ') || passage.text;
    const passageReference = passage.reference;
    const bookName = passage.verses?.[0]?.bookName || passage.reference.split(' ')[0];

    let contextMessage = `\n\nPASSAGE TO ANALYZE:
Reference: ${passageReference}
Text: "${passageText}"
Book: ${bookName}`;

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

    // Step 4: Create specialized prompt for cross-references
    const systemPrompt = `You are Shield AI, a Christian AI assistant specializing in biblical cross-reference analysis. Your role is to identify and analyze meaningful connections between Bible passages.

IMPORTANT: Provide accurate, theologically sound cross-references that help users understand the interconnected nature of scripture.

Generate cross-references in the following JSON format:
{
  "references": [
    {
      "id": "unique_id",
      "reference": "Book Chapter:Verse",
      "text": "The actual verse text",
      "book": "Book name",
      "chapter": chapter_number,
      "verse": verse_number,
      "relevance": "How this verse relates to the main passage",
      "connectionType": "thematic|prophetic|fulfillment|parallel|contrast|explanation",
      "strength": "strong|moderate|weak",
      "context": "Additional context about this connection",
      "theologicalSignificance": "The theological importance of this connection"
    }
  ]
}

Guidelines for cross-reference identification:
- Create 6-10 high-quality cross-references
- Focus on meaningful connections, not just similar words
- Include different types of connections:
  * thematic: Similar themes or topics
  * prophetic: Prophecies and their fulfillments
  * fulfillment: New Testament fulfillments of Old Testament prophecies
  * parallel: Similar events or teachings
  * contrast: Contrasting teachings or examples
  * explanation: Passages that explain or clarify the main passage
- Rate connection strength based on theological and literary significance
- Provide clear explanations of how each reference relates
- Include both Old and New Testament references when relevant
- Focus on connections that enhance understanding of the main passage
- Avoid overly obvious or superficial connections`;

    // Step 5: Generate cross-references
    const messages = [
      { role: 'system' as const, content: systemPrompt + contextMessage },
      { role: 'user' as const, content: `Please identify meaningful cross-references for this Bible passage: ${passageReference}` }
    ];

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4-turbo-preview',
      max_tokens: 3000,
      temperature: 0.7,
      messages: messages,
    });

    const aiResponse = response.choices[0].message.content;
    
    // Parse the JSON response
    let referencesData;
    try {
      referencesData = JSON.parse(aiResponse || '{}');
    } catch (parseError) {
      logger.error('Failed to parse cross-references JSON', { cid }, parseError);
      // Fallback to basic references
      referencesData = {
        references: [
          {
            id: 'fallback-1',
            reference: 'John 3:16',
            text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
            book: 'John',
            chapter: 3,
            verse: 16,
            relevance: 'A foundational verse about God\'s love and salvation',
            connectionType: 'thematic',
            strength: 'strong',
            context: 'This verse provides the theological foundation for understanding God\'s love',
            theologicalSignificance: 'Central to Christian doctrine of salvation'
          }
        ]
      };
    }

    // Ensure we have an array of references
    const references = Array.isArray(referencesData.references) ? referencesData.references : [];

    logger.info('Cross-references generated successfully', { 
      cid, 
      reference: passageReference,
      referencesCount: references.length
    });

    return res.status(200).json({
      references: references,
      metadata: {
        passage: passageReference,
        related_verses_count: relatedVerses.length,
        bible_search_results_count: bibleSearchResults.length,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Cross-references generation error', { cid }, error);
    return res.status(500).json({ 
      error: 'An error occurred while generating cross-references',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}