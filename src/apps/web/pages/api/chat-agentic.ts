import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { analyzeQuestion, generateSpecializedPrompt, generateDenominationContext } from '../../lib/prompt-engineering';
import { classifyObjection } from '../../lib/objection-classifier';
import { AnalyticsService } from '../../lib/analytics-service';
import { ChatService } from '../../lib/chat-service';
import { MemoryService } from '../../lib/memory-service';
import { createServerSupabaseClient } from '../../lib/supabase';
import { SubscriptionMiddleware } from '../../lib/subscription-middleware';
import { logger, withCorrelationId, devLogger } from '../../lib/logger';
import { applyChatRateLimit } from '../../lib/rate-limit';
import {
  type ToolContext,
  type ToolTrace,
  selectTools,
  executeToolCalls,
  SCRIPTURE_TOOL_NAMES,
} from '../../lib/agent-tools';

/**
 * Agentic chat route (A/B / experimental).
 *
 * Replaces the eager Wave-1/Wave-2 retrieval in `chat.ts` with a bounded
 * tool-use loop: the model decides which retrieval tools to call per turn.
 *
 *   1. Sync pre-step: classifyObjection + analyzeQuestion + denomination + tier.
 *   2. Planning call. When the objection is a theological challenge, a Scripture
 *      search is *forced* (the "Scripture floor") so we keep the
 *      "always ground in Scripture" guarantee. Otherwise tool_choice is "auto".
 *   3. Execute requested tool calls in parallel.
 *   4. Loop, capped at MAX_ROUNDS, for multi-hop / empty-result recovery.
 *   5. Final answer (this route is non-streaming; streaming lands in Phase 3).
 *
 * Non-retrieval behavior (auth, conversation save, memory store) mirrors chat.ts.
 */

const MAX_ROUNDS = Number(process.env.AGENT_MAX_ROUNDS || 2);
const PLANNING_MODEL = process.env.AGENT_PLANNING_MODEL || 'gpt-4o-mini';

let openai: OpenAI | null = null;
const getOpenAI = () => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};

// Objection types where we require at least one Scripture lookup.
const THEOLOGICAL_OBJECTION_TYPES = new Set([
  'logical',
  'moral',
  'scientific',
  'historical',
  'philosophical',
]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cid = withCorrelationId(req, `chat_agentic_${Date.now()}`);
  const startedAt = Date.now();
  if (!(await applyChatRateLimit(req, res))) return;
  if (req.method !== 'POST') {
    logger.warn('Method not allowed', { cid, path: '/api/chat-agentic', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, mode = 'gentle', sessionId = 'default', conversationId, bibleVersion, stream } = req.body || {};
    const shouldStream = Boolean(stream) || req.query.stream === '1' || req.query.stream === 'true';

    if (!message) {
      logger.warn('Missing message', { cid });
      return res.status(400).json({ error: 'Message is required' });
    }

    // --- Auth (mirrors chat.ts) ---
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

    // --- Subscription / feature gating (mirrors chat.ts) ---
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

    // --- Step 1: sync pre-step ---
    const questionContext = analyzeQuestion(message);
    const objectionAnalysis = classifyObjection(message);
    logger.debug('Objection analysis', { cid }, objectionAnalysis);

    if (user) {
      AnalyticsService.trackQuestion(
        user.id, message, objectionAnalysis.primaryType,
        objectionAnalysis.userStance, objectionAnalysis.intensity, sessionId, conversationId
      );
    }

    // Denomination preference (drives system-prompt framing).
    const userDenomination = await serverSupabase
      .from('users').select('preferences').eq('id', user.id).single()
      .then(({ data }: { data: any }) => (data?.preferences?.denomination ?? null) as string | null)
      .catch(() => null as string | null);

    // Prior conversation history seeds the loop (so the model can answer
    // follow-ups with zero retrieval).
    const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> =
      conversationId && typeof conversationId === 'string'
        ? await ChatService.getMessages(conversationId, serverSupabase)
            .then(msgs => msgs.slice(-20).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })))
            .catch(() => [])
        : [];

    // --- Build system prompt ---
    let systemPrompt = generateSpecializedPrompt(questionContext, mode);
    systemPrompt += generateDenominationContext(userDenomination as any);
    if (bibleVersion?.id && bibleVersion?.name) {
      systemPrompt += `\n\nBIBLE VERSION CONTEXT: When referencing Scripture, use the ${bibleVersion.name} (${bibleVersion.id}) translation and note which version you are quoting.`;
    }
    systemPrompt += `\n\nYou have retrieval tools (Scripture search, cross-references, apologetics knowledge base, memory, videos). Call only the tools you actually need to answer well — do not retrieve when the question is conversational or already answerable from context. Ground theological claims in Scripture you retrieve, and cite references explicitly.`;

    // --- Tool selection (tier/context gating) ---
    const includeMemory = Boolean(conversationId && typeof conversationId === 'string');
    // current_tier is the DB plan name ('none' for free/no-subscription users),
    // so gate on a known free-tier set rather than a single string.
    const FREE_TIERS = new Set(['none', 'error', 'free', 'explorer']);
    const includeVideos = isDeveloper || !FREE_TIERS.has(String(featureAccess.current_tier || '').toLowerCase());
    const tools = selectTools({ includeMemory, includeVideos });

    const toolCtx: ToolContext = {
      message,
      bibleVersionId: bibleVersion?.id || 'de4e12af7f28f599-02',
      userId: user.id,
      conversationId: typeof conversationId === 'string' ? conversationId : undefined,
      mode,
      objection: objectionAnalysis,
      cid,
    };

    // --- The bounded tool-gathering loop ---
    // Rounds only DECIDE on and run retrieval tools; the user-facing answer is a
    // separate generation below (so it can stream cleanly).
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message },
    ];

    const isTheological = THEOLOGICAL_OBJECTION_TYPES.has(objectionAnalysis.primaryType);
    const trace: ToolTrace[] = [];
    let roundsUsed = 0;
    // Set when a planning round answers without requesting tools.
    let directAnswer: string | null = null;

    for (let round = 0; round < MAX_ROUNDS; round++) {
      roundsUsed = round + 1;

      // Scripture floor: force a Scripture search on the first round of a
      // theological challenge; otherwise let the model decide.
      const forceScripture = round === 0 && isTheological;
      const toolChoice: OpenAI.Chat.Completions.ChatCompletionToolChoiceOption = forceScripture
        ? { type: 'function', function: { name: SCRIPTURE_TOOL_NAMES[0] } }
        : 'auto';

      const planning = await getOpenAI().chat.completions.create({
        model: PLANNING_MODEL,
        temperature: 0.4,
        messages,
        tools,
        tool_choice: toolChoice,
      });

      const choice = planning.choices[0].message;
      messages.push(choice);

      const toolCalls = choice.tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
        directAnswer = choice.content;
        break;
      }

      logger.info('Tool round', { cid, round: roundsUsed, tools: toolCalls.map(t => t.function.name) });
      const { messages: toolMessages, trace: roundTrace } = await executeToolCalls(toolCalls, toolCtx);
      trace.push(...roundTrace);
      messages.push(...toolMessages);
    }

    // --- Resolve the final answer ---
    const answerModel = mode === 'gentle' ? 'gpt-4o-mini' : 'gpt-4o';
    const answerMaxTokens = mode === 'gentle' ? 2000 : 4000;
    const answerTemperature = mode === 'gentle' ? 0.7 : 0.8;

    // Reuse the planning answer only when it exists AND the planner is already the
    // mode's answer model (gentle). For scholarly/debate, regenerate with gpt-4o
    // for quality; if we hit the round cap (no directAnswer), generate too.
    const needsGeneration = directAnswer === null || answerModel !== PLANNING_MODEL;

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

    // --- Produce the answer (streamed or buffered) ---
    let aiResponse: string | null = directAnswer;

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

      let fullText = '';
      try {
        if (needsGeneration) {
          logger.info('Streaming start', { cid, answerModel });
          const streamResp = await getOpenAI().chat.completions.create({
            model: answerModel,
            max_tokens: answerMaxTokens,
            temperature: answerTemperature,
            messages,
            stream: true,
          });
          for await (const chunk of streamResp) {
            const delta = (chunk as any)?.choices?.[0]?.delta?.content || '';
            if (delta) {
              fullText += delta;
              res.write(delta);
            }
          }
        } else if (directAnswer) {
          // Conversational reply already in hand — emit it directly.
          fullText = directAnswer;
          res.write(directAnswer);
        }
      } catch (streamErr) {
        logger.error('Streaming error', { cid }, streamErr);
      }
      aiResponse = fullText;
    } else if (needsGeneration) {
      const finalResp = await getOpenAI().chat.completions.create({
        model: answerModel,
        max_tokens: answerMaxTokens,
        temperature: answerTemperature,
        messages,
      });
      aiResponse = finalResp.choices[0].message.content;
    }

    // --- Analytics ---
    if (user) {
      AnalyticsService.trackResponse(
        user.id, aiResponse || '', objectionAnalysis.responseStrategy,
        objectionAnalysis.primaryType, sessionId, conversationId
      );
    }

    // --- Persist messages + memory (conversation already created above) ---
    if (user && currentConvId) {
      try {
        await ChatService.addMessage(currentConvId, message, 'user', mode, serverSupabase);
        if (aiResponse) {
          await ChatService.addMessage(currentConvId, aiResponse, 'assistant', mode, serverSupabase, undefined, undefined, {
            searchQuery: message,
            searchTimestamp: new Date().toISOString(),
            agentic: true,
            toolsUsed: trace.map(t => t.name),
            roundsUsed,
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

    // --- Per-turn instrumentation: the go/no-go data vs. the eager pipeline ---
    logger.info('Agentic chat complete', {
      cid,
      ms: Date.now() - startedAt,
      roundsUsed,
      streamed: shouldStream,
      generatedAnswer: needsGeneration,
      toolCount: trace.length,
      tools: trace.map(t => `${t.name}:${t.ok ? 'ok' : 'fail'}:${t.ms}ms`),
      forcedScripture: isTheological,
      responseLength: aiResponse?.length || 0,
    });

    if (shouldStream) {
      res.end();
      return;
    }

    return res.status(200).json({
      response: aiResponse,
      mode,
      conversationId: currentConvId,
      timestamp: new Date().toISOString(),
      agentic: {
        roundsUsed,
        forcedScripture: isTheological,
        generatedAnswer: needsGeneration,
        tools: trace,
      },
      metadata: {
        planningModel: PLANNING_MODEL,
        answerModel,
        processing_time_ms: Date.now() - startedAt,
      },
    });
  } catch (error) {
    logger.error('Agentic chat API error', { cid }, error);
    // If streaming already started, headers are sent — just end the response.
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
