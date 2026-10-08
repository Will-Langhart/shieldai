import { NextApiRequest, NextApiResponse } from 'next';
import { isTestToken } from '../../lib/test-token';
import { flushLangeval } from '../../lib/observability/langeval';
import { complete, completeStream, MODELS, type ChatMessage, type Effort } from '../../lib/llm';
import { rewriteQuery } from '../../lib/query-rewrite';
import { createServerSupabaseClient } from '../../lib/supabase';
import { logger, withCorrelationId } from '../../lib/logger';
import { applyChatRateLimit } from '../../lib/rate-limit';
import { bibleService } from '../../lib/bible-service';
import { hybridBibleSearch } from '../../lib/bible-hybrid';
import { ChatService } from '../../lib/chat-service';
import { shouldRouteToGraph } from '../../lib/graph-routing';
import { checkChatAccess, chatAccessDeniedBody } from '../../lib/chat-access';
import graphHandler from './chat-graph';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Spans are batched and a serverless instance can freeze the moment the response is
  // sent, so the trace this request produced is flushed when the socket closes.
  res.on('close', () => { void flushLangeval(); });

  // A/B: route the GRAPH_ROLLOUT_PCT bucket (or explicit ?graph=1) through the
  // multi-agent graph before any work here. This is the real production entry
  // point (the client calls /api/chat-rag), so the rollout takes effect here.
  // graphHandler runs its own rate-limit + auth, so we delegate first.
  if (shouldRouteToGraph(req)) {
    return graphHandler(req, res);
  }

  const cid = withCorrelationId(req, `chat_rag_${Date.now()}`);
  const startedAt = Date.now();
  if (!(await applyChatRateLimit(req, res))) return;
  if (req.method !== 'POST') {
    logger.warn('Method not allowed', { cid, path: '/api/chat-rag', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, conversationId, mode = 'gentle', stream = false, regenerate = false } = req.body || {};

    if (!message) {
      logger.warn('Missing message', { cid });
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get authenticated user (with fallback for testing)
    const authHeader = req.headers.authorization;
    let user = null;
    let serverSupabase: any = undefined;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Check for test token first
      if (isTestToken(token)) {
        user = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          name: 'Test User'
        };
        logger.info('Using test user for RAG API', { cid, userId: user.id });
      } else {
        try {
          serverSupabase = createServerSupabaseClient(token);
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

    logger.info('Processing RAG chat request', { cid, userId: user.id, messageLength: message.length, regenerate });

    const access = await checkChatAccess(serverSupabase, user.id, mode, !conversationId, Boolean((user as any).is_anonymous));
    if (!access.allowed) {
      logger.info('Chat blocked by plan', { cid, userId: user.id, plan: access.plan, reason: access.reason });
      return res.status(403).json(chatAccessDeniedBody(access));
    }

    // The text used to drive retrieval + the final user turn. On regenerate we
    // derive it from the stored history rather than trusting the client.
    let queryText: string = message;

    // Step 0 (regenerate): drop the previous assistant reply so we can produce a
    // fresh one from the same user turn. Requires a persisted conversation.
    if (regenerate) {
      if (!conversationId || !serverSupabase) {
        logger.warn('Regenerate requires a saved conversation', { cid, hasConvId: !!conversationId });
        return res.status(400).json({ error: 'Regenerate requires an existing conversation' });
      }
      try {
        const existing = await ChatService.getMessages(conversationId, serverSupabase);
        // Delete the contiguous trailing assistant message(s).
        let i = existing.length - 1;
        const toDelete: string[] = [];
        while (i >= 0 && existing[i].role === 'assistant') {
          toDelete.push(existing[i].id);
          i--;
        }
        if (i < 0 || existing[i].role !== 'user') {
          return res.status(400).json({ error: 'Nothing to regenerate' });
        }
        queryText = existing[i].content;
        for (const id of toDelete) {
          await ChatService.deleteMessage(id, serverSupabase);
        }
        logger.info('Cleared previous assistant reply for regenerate', { cid, conversationId, deleted: toDelete.length });
      } catch (error) {
        logger.error('Failed to prepare regenerate', { cid }, error);
        return res.status(500).json({ error: 'Failed to prepare regeneration' });
      }
    }

    // Step 1: Retrieve relevant verses from the integrated `bible-verses` index.
    // Text in / text out — Pinecone embeds the query with llama-text-embed-v2, so
    // there is NO OpenAI embedding call here and no 1536->1024 averaging. Namespace
    // is the ingested KJV version id.
    const BIBLE_VERSES_NAMESPACE = 'de4e12af7f28f599-02';
    // Rewrite the retrieval query (term expansion; no-op when disabled). Message-only
    // here — history isn't loaded until Step 4; the graph path does the full
    // history-aware rewrite.
    const retrievalQuery = await rewriteQuery({ message: queryText, cid });
    let relevantVerses: any[] = [];
    try {
      relevantVerses = await hybridBibleSearch(BIBLE_VERSES_NAMESPACE, retrievalQuery, 5);
      logger.debug('bible-verses search results', { cid, count: relevantVerses.length });
    } catch (error) {
      logger.error('bible-verses search failed', { cid }, error);
      // Continue without vector results
    }

    // Step 2: Search Bible API for additional context
    let bibleSearchResults: any[] = [];
    try {
      const searchResults = await bibleService.searchBible('de4e12af7f28f599-02', retrievalQuery, 5);
      bibleSearchResults = searchResults?.passages || [];
      logger.debug('Bible API search results', { cid, count: bibleSearchResults.length });
    } catch (error) {
      logger.error('Bible API search failed', { cid }, error);
      // Continue without Bible API results
    }

    // Step 3: Create conversation in Supabase if none exists
    let currentConversationId = conversationId;
    if (!currentConversationId && user && serverSupabase) {
      try {
        const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
        const conversation = await ChatService.createConversation(title, serverSupabase);
        currentConversationId = conversation.id;
        logger.info('Created conversation in Supabase', { cid, conversationId: currentConversationId, title });
      } catch (error) {
        logger.error('Failed to create conversation', { cid }, error);
      }
    }

    // Step 4: Get conversation history from Supabase
    let conversationHistory: any[] = [];
    try {
      if (currentConversationId && serverSupabase) {
        const messages = await ChatService.getMessages(currentConversationId, serverSupabase);
        conversationHistory = messages.slice(-10);
        logger.debug('Conversation history retrieved from Supabase', { cid, count: conversationHistory.length });
      }
    } catch (error) {
      logger.error('Failed to get conversation history', { cid }, error);
      // Continue without conversation history
    }

    // Step 4a: Fetch user's denomination preference
    let denomination: string | null = null;
    if (serverSupabase && user) {
      try {
        const { data: userData } = await serverSupabase
          .from('users')
          .select('preferences')
          .eq('id', user.id)
          .maybeSingle();
        denomination = userData?.preferences?.denomination ?? null;
        logger.debug('User denomination', { cid, denomination });
      } catch {
        // Continue without denomination
      }
    }

    // Denomination-specific theological framing (highest priority in system prompt)
    const denominationGuidance: Record<string, string> = {
      'Protestant': `DENOMINATION: Protestant
The user identifies as Protestant. You MUST frame all theological responses through Protestant tradition:
- Apply Sola Scriptura: Scripture alone is the supreme authority in all matters of faith and practice
- Apply Sola Fide and Sola Gratia: salvation by grace alone through faith alone in Christ alone
- Draw from Reformed, Lutheran, Baptist, and evangelical scholarship (Luther, Calvin, Spurgeon, Wesley, Piper, etc.)
- When referencing tradition or church history, always subordinate it to Scripture
- Acknowledge Catholic/Orthodox perspectives only when directly relevant, while clearly presenting the Protestant view`,

      'Catholic': `DENOMINATION: Roman Catholic
The user identifies as Roman Catholic. You MUST frame all theological responses through Catholic tradition:
- Scripture AND Sacred Tradition together constitute the one deposit of faith
- The Magisterium (Pope and bishops in communion) holds the authority to interpret Scripture and Tradition
- Reference the Catechism of the Catholic Church (CCC), papal encyclicals, and Church Fathers
- Affirm the seven sacraments, the role of Mary and the saints, purgatory, and apostolic succession
- Draw from Aquinas, Augustine, Newman, and other Catholic theologians`,

      'Eastern Orthodox': `DENOMINATION: Eastern Orthodox
The user identifies as Eastern Orthodox. You MUST frame all theological responses through Orthodox tradition:
- Holy Tradition (Scripture, Ecumenical Councils, Church Fathers, Liturgy) is the living deposit of faith
- Emphasize theosis (deification) as the goal of the Christian life
- Reference the Seven Ecumenical Councils, the Philokalia, and Patristic writings
- Draw from Athanasius, Basil the Great, Gregory Palamas, John Chrysostom, and other Church Fathers
- Reflect the mystical, apophatic theological approach of the Orthodox tradition`,

      'Oriental Orthodox': `DENOMINATION: Oriental Orthodox
The user identifies as Oriental Orthodox (Coptic, Ethiopian, Armenian, or Syriac tradition). You MUST frame all theological responses accordingly:
- Hold to the Miaphysite Christology affirmed at the Council of Ephesus (431) — one united divine-human nature in Christ
- Draw from the Coptic, Ethiopian, Armenian, and Syriac Church Fathers and their distinct theological heritage
- Reference the ancient liturgical and monastic traditions of these churches (e.g., St. Anthony, St. Pachomius, St. Frumentius)
- Distinguish from both Chalcedonian (Catholic/Orthodox) and Nestorian positions where relevant`,
    };

    const denominationBlock = denomination && denominationGuidance[denomination]
      ? `${denominationGuidance[denomination]}\n\n`
      : '';

    // Step 4b: Build system prompt
    const systemPrompt = `${denominationBlock}You are Shield AI, a Christian AI assistant that provides biblically-grounded responses.

Your role is to:
1. Provide accurate, scripture-based answers to questions about Christianity, the Bible, and faith
2. Use the provided Bible verses and context to support your responses
3. Be respectful, compassionate, and encouraging
4. Always ground your responses in biblical truth
5. When appropriate, reference specific Bible verses and explain their relevance
${denomination ? `6. Always respond through the lens of the user's ${denomination} tradition — this is the highest priority` : ''}

IMPORTANT: Always include relevant Bible verses in your responses and explain how they relate to the user's question. Use the provided context to give accurate, helpful answers.`;

    // Build context from retrieved information
    let contextMessage = '';
    
    if (relevantVerses.length > 0) {
      contextMessage += `\n\nRELEVANT BIBLE VERSES (from vector search):
${relevantVerses.map((verse, index) =>
  `${index + 1}. ${verse.reference || verse.metadata?.reference || 'Unknown'}: "${verse.text || verse.metadata?.text || 'No text available'}"`
).join('\n')}`;
    }

    if (bibleSearchResults.length > 0) {
      contextMessage += `\n\nADDITIONAL BIBLE CONTEXT (from API search):
${bibleSearchResults.map((verse, index) => 
  `${index + 1}. ${verse.reference || 'Unknown'}: "${verse.text || 'No text available'}"`
).join('\n')}`;
    }

    if (conversationHistory.length > 0) {
      contextMessage += `\n\nCONVERSATION HISTORY:
${conversationHistory.slice(-6).map((msg: any) => 
  `${msg.role}: ${msg.content}`
).join('\n')}`;
    }

    // The system prompt (with retrieved context) is hoisted to Claude's top-level
    // `system` param inside the helper; `messages` carries conversation turns only.
    const systemContent = systemPrompt + contextMessage;
    const messages: ChatMessage[] = [
      ...conversationHistory.slice(-10), // Last 10 messages for context
      // On regenerate the stored history already ends with the user turn, so we
      // must not append it a second time.
      ...(regenerate ? [] : [{ role: 'user' as const, content: message }])
    ];

    // Tiered model by mode. No `temperature` (rejected on the 5-series). Thinking
    // is ON by default, so `maxTokens` leaves headroom above the visible answer.
    const model = mode === 'gentle' ? MODELS.gentle : MODELS.deep;
    const maxTokens = mode === 'gentle' ? 3000 : 6000;
    const effort: Effort = mode === 'gentle' ? 'medium' : 'high';

    // Step 5: Generate response from OpenAI
    if (stream) {
      // Streaming response — include conversationId in header so client can track it
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
        'X-Conversation-Id': currentConversationId || '',
        'Access-Control-Expose-Headers': 'X-Conversation-Id'
      });

      let fullText = '';

      try {
        fullText = await completeStream(
          { system: systemContent, messages, model, maxTokens, effort },
          (delta) => { res.write(delta); }
        );

        // Save messages to Supabase. On regenerate the user turn already exists,
        // so we only persist the new assistant reply.
        if (user && currentConversationId && serverSupabase) {
          try {
            if (!regenerate) {
              await ChatService.addMessage(currentConversationId, message, 'user', mode, serverSupabase, undefined, undefined, undefined, user);
            }
            if (fullText) {
              await ChatService.addMessage(currentConversationId, fullText, 'assistant', mode, serverSupabase, undefined, undefined, undefined, user);
            }
            logger.info('Conversation saved to Supabase', { cid, conversationId: currentConversationId, regenerate });
          } catch (error) {
            logger.error('Failed to save conversation', { cid }, error);
          }
        }

        res.end();
        return;
      } catch (streamErr) {
        logger.error('Streaming error', { cid }, streamErr);
        res.end();
        return;
      }
    } else {
      // Non-streaming response
      const aiResponse = await complete({ system: systemContent, messages, model, maxTokens, effort });

      // Save messages to Supabase. On regenerate the user turn already exists,
      // so we only persist the new assistant reply.
      if (user && currentConversationId && serverSupabase) {
        try {
          if (!regenerate) {
            await ChatService.addMessage(currentConversationId, message, 'user', mode, serverSupabase, undefined, undefined, undefined, user);
          }
          await ChatService.addMessage(
            currentConversationId,
            aiResponse || 'I apologize, but I was unable to generate a response at this time.',
            'assistant',
            mode,
            serverSupabase,
            undefined, undefined, undefined, user
          );
          logger.info('Conversation saved to Supabase', { cid, conversationId: currentConversationId, regenerate });
        } catch (error) {
          logger.error('Failed to save conversation', { cid }, error);
        }
      }

      logger.info('RAG chat response generated', { 
        cid, 
        ms: Date.now() - startedAt, 
        responseLength: aiResponse?.length || 0,
        relevantVerses: relevantVerses.length,
        bibleSearchResults: bibleSearchResults.length
      });

      return res.status(200).json({
        response: aiResponse,
        mode: mode,
        timestamp: new Date().toISOString(),
        conversationId: currentConversationId,
        context: {
          relevant_verses: relevantVerses,
          bible_search_results: bibleSearchResults,
          conversation_history_length: conversationHistory.length
        },
        metadata: {
          model: model,
          max_tokens: maxTokens,
          effort: effort,
          processing_time_ms: Date.now() - startedAt
        }
      });
    }

  } catch (error) {
    logger.error('RAG chat API error', { cid }, error);
    return res.status(500).json({ 
      error: 'An error occurred while processing your request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
