import type { NextApiRequest, NextApiResponse } from 'next';
import { isTestToken } from '../../lib/test-token';
import { flushLangeval } from '../../lib/observability/langeval';
import { createServerSupabaseClient } from '../../lib/supabase';
import { logger, withCorrelationId } from '../../lib/logger';
import { applyChatRateLimit } from '../../lib/rate-limit';
import { ChatService } from '../../lib/chat-service';
import { checkChatAccess, chatAccessDeniedBody } from '../../lib/chat-access';
import { classifyObjection } from '../../lib/objection-classifier';
import { scripture } from '../../lib/scripture/engine';
import { runAgent, type ChatMode } from '../../lib/agent/run-agent';
import { buildAgentSystemPrompt } from '../../lib/agent/prompt';
import { AguiSink, PlainTextSink, type AgentSink } from '../../lib/agent/sink';

/**
 * Scripture agent chat route.
 *
 * The model researches with typed Scripture tools (see lib/scripture/tools.ts)
 * instead of chat-rag's eager retrieval. Output depends on the client:
 *   - `Accept: text/event-stream` or `{ protocol: "ag-ui" }` → AG-UI events
 *     (text, tool calls, widgets) for the web chat;
 *   - otherwise plain text, byte-compatible with chat-rag, so mobile and older
 *     clients can be pointed here unchanged.
 *
 * Pre-flight (rate limit, auth, tier gate, conversation create) mirrors chat-rag.
 */

// Objection types where Scripture is retrieved before the model's first turn.
const THEOLOGICAL_OBJECTION_TYPES = new Set(['logical', 'moral', 'scientific', 'historical', 'philosophical']);

/**
 * The Scripture floor: retrieve before the first turn for a real theological
 * challenge. The classifier labels small talk ("hello", "thanks!") as
 * philosophical, so very short messages are left to the model.
 */
export function needsScriptureFloor(message: string, objectionType: string): boolean {
  return THEOLOGICAL_OBJECTION_TYPES.has(objectionType) && message.trim().split(/\s+/).length >= 4;
}
const MODES = new Set<ChatMode>(['gentle', 'scholarly', 'debate']);

export function wantsAgui(req: NextApiRequest): boolean {
  return String(req.headers.accept || '').includes('text/event-stream') || (req.body as any)?.protocol === 'ag-ui';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.on('close', () => { void flushLangeval(); });

  const cid = withCorrelationId(req, `chat_agent_${Date.now()}`);
  const startedAt = Date.now();
  if (!(await applyChatRateLimit(req, res))) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, conversationId } = req.body || {};
  const mode: ChatMode = MODES.has(req.body?.mode) ? req.body.mode : 'gentle';
  if (!message || typeof message !== 'string') return res.status(400).json({ error: 'Message is required' });

  // --- Auth ---
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Authorization header required' });
  const token = authHeader.substring(7);

  let user: { id: string } | null = null;
  let serverSupabase: any = undefined;
  if (isTestToken(token)) {
    user = { id: '550e8400-e29b-41d4-a716-446655440000' };
  } else {
    try {
      serverSupabase = createServerSupabaseClient(token);
      const { data: { user: authUser }, error } = await serverSupabase.auth.getUser();
      if (error || !authUser) return res.status(401).json({ error: 'Invalid authentication token' });
      user = authUser;
    } catch (error) {
      logger.error('Authentication failed', { cid }, error);
      return res.status(401).json({ error: 'Authentication failed' });
    }
  }
  const userId = user!.id;

  const access = await checkChatAccess(serverSupabase, userId, mode, !conversationId);
  if (!access.allowed) {
    logger.info('Chat blocked by plan', { cid, userId, plan: access.plan, reason: access.reason });
    return res.status(403).json(chatAccessDeniedBody(access));
  }

  // --- Conversation, history, denomination ---
  let currentConversationId: string | undefined = typeof conversationId === 'string' ? conversationId : undefined;
  if (!currentConversationId && serverSupabase) {
    try {
      const title = message.length > 50 ? `${message.substring(0, 50)}...` : message;
      currentConversationId = (await ChatService.createConversation(title, serverSupabase)).id;
    } catch (error) {
      logger.error('Failed to create conversation', { cid }, error);
    }
  }

  const [history, denomination] = await Promise.all([
    currentConversationId && serverSupabase
      ? ChatService.getMessages(currentConversationId, serverSupabase)
          .then(msgs => msgs.slice(-10).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })))
          .catch(() => [])
      : Promise.resolve([]),
    serverSupabase
      ? serverSupabase.from('users').select('preferences').eq('id', userId).maybeSingle()
          .then(({ data }: any) => (data?.preferences?.denomination ?? null) as string | null)
          .catch(() => null)
      : Promise.resolve(null),
  ]);

  const scriptureFloor = needsScriptureFloor(message, classifyObjection(message).primaryType);
  const system = buildAgentSystemPrompt({ mode, denomination, translations: scripture.translations().map(t => t.code) });

  // --- Stream ---
  const agui = wantsAgui(req);
  res.writeHead(200, {
    'Content-Type': agui ? 'text/event-stream; charset=utf-8' : 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    'X-Conversation-Id': currentConversationId || '',
    'Access-Control-Expose-Headers': 'X-Conversation-Id',
  });
  const sink: AgentSink = agui ? new AguiSink(res) : new PlainTextSink(res);

  try {
    const result = await runAgent({
      system,
      history,
      message,
      mode,
      scriptureFloor,
      ctx: { message, userId, conversationId: currentConversationId, cid },
      sink,
      threadId: currentConversationId || cid,
      state: { conversationId: currentConversationId ?? null, mode },
    });

    if (currentConversationId && serverSupabase) {
      try {
        await ChatService.addMessage(currentConversationId, message, 'user', mode, serverSupabase, undefined, undefined, undefined, user);
        if (result.text) {
          await ChatService.addMessage(currentConversationId, result.text, 'assistant', mode, serverSupabase, undefined, undefined, undefined, user, {
            agentic: true,
            tools_used: result.trace.map(t => t.name),
            widgets: result.widgets,
          });
        }
      } catch (error) {
        logger.error('Failed to save conversation', { cid }, error);
      }
    }

    logger.info('Agent chat complete', {
      cid,
      mode,
      ms: Date.now() - startedAt,
      rounds: result.rounds,
      tools: result.trace.map(t => `${t.name}:${t.ok ? 'ok' : 'fail'}:${t.ms}ms`),
      widgets: result.widgets.length,
      scriptureFloor,
      citations: result.verification
        ? { checked: result.verification.checked, hallucinated: result.verification.hallucinated, corrected: result.corrected }
        : null,
      agui,
    });
  } catch (error) {
    // The shared logger serializes Error objects as {}, so log the message itself.
    logger.error('Agent chat failed', { cid, error: error instanceof Error ? error.message : String(error) });
    sink.runError('Sorry, I ran into a problem answering that. Please try again.');
  }
  res.end();
}
