import { NextApiRequest, NextApiResponse } from 'next';
import { classifyObjection } from '../../lib/objection-classifier';
import { AnalyticsService } from '../../lib/analytics-service';
import { ChatService } from '../../lib/chat-service';
import { MemoryService } from '../../lib/memory-service';
import { createServerSupabaseClient } from '../../lib/supabase';
import { SubscriptionMiddleware } from '../../lib/subscription-middleware';
import { logger, withCorrelationId, devLogger } from '../../lib/logger';
import { applyChatRateLimit } from '../../lib/rate-limit';
import { runApologeticsGraph } from '../../lib/graph/apologetics-graph';

/**
 * Graph chat route (LangGraph.js, experimental — Step 2/A).
 *
 * The multi-agent successor to `chat-agentic.ts`: instead of a flat tool loop,
 * orchestration runs through the compiled `StateGraph` in
 * `lib/graph/apologetics-graph.ts` (analyze → parallel specialists → writer →
 * citation critic w/ reflection loop). Auth, subscription gating, conversation
 * save and memory store mirror chat-agentic exactly, so A/B comparison is
 * apples-to-apples.
 *
 * Reached explicitly (opt-in) via `?graph=1`, `x-shield-graph: 1`, or body
 * `{ graph: true }` on `/api/chat`, or by hitting `/api/chat-graph` directly.
 *
 * The graph buffers its answer (the critic must run before the answer is final),
 * so streaming here emits the finished answer in one write — the client's
 * streaming contract (chunked + X-Conversation-Id) is preserved.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cid = withCorrelationId(req, `chat_graph_${Date.now()}`);
  const startedAt = Date.now();
  if (!(await applyChatRateLimit(req, res))) return;
  if (req.method !== 'POST') {
    logger.warn('Method not allowed', { cid, path: '/api/chat-graph', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, mode = 'gentle', sessionId = 'default', conversationId, bibleVersion, stream } = req.body || {};
    const shouldStream = Boolean(stream) || req.query.stream === '1' || req.query.stream === 'true';

    if (!message) {
      logger.warn('Missing message', { cid });
      return res.status(400).json({ error: 'Message is required' });
    }

    // --- Auth (mirrors chat-agentic.ts) ---
    const authHeader = req.headers.authorization;
    let user: any = null;
    let serverSupabase: any = undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        serverSupabase = createServerSupabaseClient(token);
        const { data: { user: authUser }, error: authError } = await serverSupabase.auth.getUser();
        if (authError || !authUser) {
          return res.status(401).json({ error: 'Invalid authentication token' });
        }
        user = authUser;
      } catch (error) {
        logger.error('Supabase client create failed', { cid }, error);
        return res.status(401).json({ error: 'Authentication failed' });
      }
    } else {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    devLogger.chat.request(message, user.id, mode, cid);

    const developerEmails = (process.env.DEVELOPER_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
    const isDeveloper = process.env.NODE_ENV !== 'production' && developerEmails.includes(user.email);

    // --- Subscription / feature gating (mirrors chat-agentic.ts) ---
    const featureAccess = await SubscriptionMiddleware.checkChatAccess(user.id, mode);
    if (!isDeveloper && !featureAccess.allowed) {
      return res.status(403).json({
        error: 'Feature not available',
        message: `${mode === 'scholarly' ? 'GPT-4 Scholarly mode' : mode === 'debate' ? 'GPT-4 Debate mode' : 'AI conversations'} not available on your current plan`,
        upgrade_required: featureAccess.upgrade_required,
        current_tier: featureAccess.current_tier,
        required_tier: featureAccess.required_tier,
        remaining: featureAccess.remaining,
        limit: featureAccess.limit,
      });
    }

    // Objection analysis in the route drives analytics; the graph re-derives its
    // own (deterministic, cheap) for prompt construction and the Scripture floor.
    const objectionAnalysis = classifyObjection(message);
    if (user) {
      AnalyticsService.trackQuestion(
        user.id, message, objectionAnalysis.primaryType,
        objectionAnalysis.userStance, objectionAnalysis.intensity, sessionId, conversationId
      );
    }

    // Denomination preference (drives system-prompt framing inside the graph).
    const userDenomination = await serverSupabase
      .from('users').select('preferences').eq('id', user.id).single()
      .then(({ data }: { data: any }) => (data?.preferences?.denomination ?? null) as string | null)
      .catch(() => null as string | null);

    // Prior conversation history (last 20 turns) seeds the writer.
    const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> =
      conversationId && typeof conversationId === 'string'
        ? await ChatService.getMessages(conversationId, serverSupabase)
            .then(msgs => msgs.slice(-20).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })))
            .catch(() => [])
        : [];

    // Create the conversation up front so streaming can return its id in a header.
    let currentConvId = conversationId;
    if (user && !currentConvId) {
      try {
        const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
        const conversation = await ChatService.createConversation(title, serverSupabase);
        currentConvId = conversation.id;
        logger.info('Created conversation', { cid, convId: currentConvId });
      } catch (error) {
        logger.error('Failed to create conversation', { cid }, error);
      }
    }

    // --- Run the graph ---
    const result = await runApologeticsGraph({
      message,
      mode,
      versionId: bibleVersion?.id || 'de4e12af7f28f599-02',
      userId: user.id,
      conversationId: typeof currentConvId === 'string' ? currentConvId : undefined,
      denomination: userDenomination,
      history: conversationHistory,
      cid,
    });
    const aiResponse = result.answer;

    // --- Analytics ---
    if (user) {
      AnalyticsService.trackResponse(
        user.id, aiResponse || '', objectionAnalysis.responseStrategy,
        objectionAnalysis.primaryType, sessionId, conversationId
      );
    }

    // --- Persist messages + memory ---
    if (user && currentConvId) {
      try {
        await ChatService.addMessage(currentConvId, message, 'user', mode, serverSupabase);
        if (aiResponse) {
          await ChatService.addMessage(currentConvId, aiResponse, 'assistant', mode, serverSupabase, undefined, undefined, {
            searchQuery: message,
            searchTimestamp: new Date().toISOString(),
            graph: true,
            corrections: result.corrections,
            evidence: result.evidence,
            citations: result.verification
              ? {
                  checked: result.verification.checked,
                  hallucinated: result.verification.hallucinated,
                  misquoted: result.verification.misquoted,
                }
              : null,
          });
        }

        try {
          const stored = await ChatService.getMessages(currentConvId, serverSupabase);
          await MemoryService.storeConversationMemory(
            currentConvId,
            user.id,
            stored.map(m => ({ content: m.content, role: m.role, timestamp: m.created_at })),
            {
              mode,
              objectionType: objectionAnalysis.primaryType,
              emotionalTone: objectionAnalysis.intensity,
              keyThemes: objectionAnalysis.keyThemes,
            }
          );
        } catch (memoryError) {
          logger.error('Memory store failed', { cid }, memoryError);
        }
      } catch (error) {
        logger.error('Failed to persist conversation', { cid }, error);
      }
    }

    // --- Per-turn instrumentation (compare against chat-agentic's trace) ---
    logger.info('Graph chat complete', {
      cid,
      ms: Date.now() - startedAt,
      objectionType: result.objectionType,
      corrections: result.corrections,
      evidence: result.evidence,
      streamed: shouldStream,
      responseLength: aiResponse?.length || 0,
      citations: result.verification
        ? {
            checked: result.verification.checked,
            hallucinated: result.verification.hallucinated,
            misquoted: result.verification.misquoted,
          }
        : null,
    });

    // --- Respond (streamed answer is buffered, then emitted) ---
    if (shouldStream) {
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
        'X-Conversation-Id': currentConvId || '',
        'Access-Control-Expose-Headers': 'X-Conversation-Id',
      });
      res.write(aiResponse || '');
      res.end();
      return;
    }

    return res.status(200).json({
      response: aiResponse,
      mode,
      conversationId: currentConvId,
      timestamp: new Date().toISOString(),
      graph: {
        objectionType: result.objectionType,
        corrections: result.corrections,
        evidence: result.evidence,
        citations: result.verification,
      },
      metadata: {
        orchestrator: 'langgraph',
        processing_time_ms: Date.now() - startedAt,
      },
    });
  } catch (error) {
    logger.error('Graph chat API error', { cid }, error);
    if (res.headersSent) {
      res.end();
      return;
    }
    return res.status(500).json({
      error: 'An error occurred while processing your request',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
