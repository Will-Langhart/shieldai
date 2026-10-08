import OpenAI from 'openai';
import { bibleService } from './bible-service';
import { BiblePineconeService } from './bible-pinecone';
import { EmbeddingService } from './embeddings';
import { searchApologeticsContent } from './apologetics-knowledge';
import { getOriginalLanguage, formatOriginalLanguage } from './original-language';
import { MemoryService } from './memory-service';
import { VideoService } from './video-service';
import type { ObjectionAnalysis } from './objection-classifier';
import { logger } from './logger';

/**
 * Agent tool registry.
 *
 * Each retrieval source the eager pipeline in `pages/api/chat.ts` fires
 * unconditionally is exposed here as an OpenAI function-calling tool, so a
 * bounded tool-use loop can decide *which* to call per turn instead of running
 * all of them every time. Handlers are thin wrappers over the existing
 * services — no new retrieval logic lives here.
 *
 * A tool's `content` (the string fed back to the model) is kept compact and
 * token-efficient; `raw` carries the structured payload for logging/citations.
 */

// Shared state the handlers need but the model does not provide as arguments.
export interface ToolContext {
  /** Current user message — fallback query for tools called with no explicit query. */
  message: string;
  /** Bible translation id to use for keyword/cross-reference lookups. */
  bibleVersionId: string;
  userId: string;
  conversationId?: string;
  mode: 'gentle' | 'scholarly' | 'debate';
  /** Output of classifyObjection — steers video search relevance. */
  objection: ObjectionAnalysis;
  cid: string;
}

export interface ToolResult {
  content: string;
  raw: unknown;
}

interface ToolDefinition {
  tool: OpenAI.Chat.Completions.ChatCompletionTool;
  handler: (args: Record<string, unknown>, ctx: ToolContext) => Promise<ToolResult>;
}

// Names of tools that satisfy the "Scripture floor" — the route forces the
// model to call one of these when classifyObjection flags a theological challenge.
export const SCRIPTURE_TOOL_NAMES = [
  'search_scripture_semantic',
  'search_scripture_keyword',
] as const;

const TOOL_TIMEOUT_MS = Number(process.env.AGENT_TOOL_TIMEOUT_MS || 8000);

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' && v.trim() ? v : fallback;
}
function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

const REGISTRY: Record<string, ToolDefinition> = {
  search_scripture_semantic: {
    tool: {
      type: 'function',
      function: {
        name: 'search_scripture_semantic',
        description:
          'Semantic (vector) search over the Bible. Use for thematic or conceptual queries where the exact wording is unknown (e.g. "verses about enduring suffering"). Returns the most relevant verses with a similarity score.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Natural-language description of the scriptural theme or concept to find.',
            },
            topK: {
              type: 'integer',
              description: 'How many verses to return (1-10). Default 5.',
            },
          },
          required: ['query'],
        },
      },
    },
    handler: async (args, ctx) => {
      const query = str(args.query, ctx.message);
      const topK = Math.min(Math.max(num(args.topK, 5), 1), 10);
      const embedding = await EmbeddingService.generateEmbeddingForIndex(query);
      const results = await BiblePineconeService.searchBibleContent(embedding, topK, { type: 'bible_verse' });
      const trimmed = results.map(r => ({ reference: r.reference, text: r.text, score: Number(r.score.toFixed(3)) }));
      const content = trimmed.length
        ? trimmed.map((r, i) => `${i + 1}. ${r.reference} (score ${r.score}): "${r.text}"`).join('\n')
        : 'No matching verses found.';
      return { content, raw: trimmed };
    },
  },

  search_scripture_keyword: {
    tool: {
      type: 'function',
      function: {
        name: 'search_scripture_keyword',
        description:
          'Keyword/full-text Bible search via the Bible API. Use when the user references specific words, names, or phrases you expect to appear verbatim in Scripture. Returns matching passages.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Keywords or phrase to search for in Scripture.' },
            limit: { type: 'integer', description: 'Max passages to return (1-10). Default 5.' },
          },
          required: ['query'],
        },
      },
    },
    handler: async (args, ctx) => {
      const query = str(args.query, ctx.message);
      const limit = Math.min(Math.max(num(args.limit, 5), 1), 10);
      const result = await bibleService.searchBible(ctx.bibleVersionId, query, limit);
      const passages = (result?.passages || []).map(p => ({ reference: p.reference, text: p.text }));
      const content = passages.length
        ? passages.map((p, i) => `${i + 1}. ${p.reference}: "${p.text}"`).join('\n')
        : 'No matching passages found.';
      return { content, raw: passages };
    },
  },

  get_cross_references: {
    tool: {
      type: 'function',
      function: {
        name: 'get_cross_references',
        description:
          'Given a specific verse reference (e.g. "John 3:16"), return thematically related cross-reference passages. Use to broaden or corroborate a verse already in scope.',
        parameters: {
          type: 'object',
          properties: {
            reference: { type: 'string', description: 'A specific verse or passage reference, e.g. "Romans 8:28".' },
          },
          required: ['reference'],
        },
      },
    },
    handler: async (args, ctx) => {
      const reference = str(args.reference);
      if (!reference) return { content: 'No reference provided.', raw: [] };
      const result = await bibleService.getCrossReferences(reference, ctx.bibleVersionId);
      const refs = (result?.references || []).map((r: any) => ({ reference: r.reference, text: r.text }));
      const content = refs.length
        ? refs.map((r: any, i: number) => `${i + 1}. ${r.reference}: "${r.text}"`).join('\n')
        : `No cross-references found for ${reference}.`;
      return { content, raw: refs };
    },
  },

  get_original_language: {
    tool: {
      type: 'function',
      function: {
        name: 'get_original_language',
        description:
          'Return the original Greek (NT) or Hebrew (OT) text of a passage word by word: surface form, transliteration, contextual gloss, Strong\'s number, morphology, and lexical form. Use when the meaning of a specific word matters to the answer, or the user claims "the Greek/Hebrew actually says…" (e.g. logos in John 1:1, elohim in Genesis 1:1, almah in Isaiah 7:14). Pass `word` to also get the full lexicon definition for that term. Max 5 verses.',
        parameters: {
          type: 'object',
          properties: {
            reference: { type: 'string', description: 'A specific verse or short range, e.g. "John 1:1" or "Isaiah 7:14".' },
            word: {
              type: 'string',
              description:
                'Optional term to define in depth: an English gloss ("Word"), transliteration ("logos"), or Strong\'s number ("G3056").',
            },
          },
          required: ['reference'],
        },
      },
    },
    handler: async args => {
      const reference = str(args.reference);
      if (!reference) return { content: 'No reference provided.', raw: null };
      const lookup = await getOriginalLanguage(reference);
      if (!lookup) {
        return { content: `Could not parse "${reference}" as a verse reference (expected e.g. "John 1:1").`, raw: null };
      }
      const word = str(args.word) || undefined;
      return {
        content: formatOriginalLanguage(lookup, word),
        raw: { reference: lookup.range.display, verses: lookup.verses.length, word },
      };
    },
  },

  search_apologetics_kb: {
    tool: {
      type: 'function',
      function: {
        name: 'search_apologetics_kb',
        description:
          'Search the curated apologetics knowledge base for structured arguments and responses to common objections (problem of evil, reliability of Scripture, science & faith, etc.). Use for objection-handling beyond raw Scripture.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'The objection, topic, or argument to look up.' },
            category: {
              type: 'string',
              description: 'Optional category filter, e.g. "problem-of-evil", "historical", "scientific".',
            },
          },
          required: ['query'],
        },
      },
    },
    handler: async (args, ctx) => {
      const query = str(args.query, ctx.message);
      const category = str(args.category) || undefined;
      const results = searchApologeticsContent(query, category).slice(0, 3);
      const trimmed = results.map(r => ({
        title: r.title,
        category: r.category,
        scriptures: r.scriptures,
        content: r.content.length > 600 ? `${r.content.slice(0, 600)}…` : r.content,
      }));
      const content = trimmed.length
        ? trimmed
            .map((r, i) => `${i + 1}. [${r.category}] ${r.title}\n${r.content}\nKey scriptures: ${r.scriptures.join(', ') || 'none'}`)
            .join('\n\n')
        : 'No apologetics entries matched.';
      return { content, raw: trimmed };
    },
  },

  recall_memory: {
    tool: {
      type: 'function',
      function: {
        name: 'recall_memory',
        description:
          "Recall relevant context from the user's earlier conversations — prior topics, emotional tone, and related past messages. Use when the question may build on previous discussion or when personalization helps.",
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'What to recall about. Defaults to the current message if omitted.',
            },
          },
          required: [],
        },
      },
    },
    handler: async (args, ctx) => {
      if (!ctx.conversationId || !ctx.userId) {
        return { content: 'No prior conversation memory available.', raw: null };
      }
      const query = str(args.query, ctx.message);
      const memory = await MemoryService.getEnhancedConversationContext(ctx.conversationId, ctx.userId, query, 10);
      if (!memory || !memory.messages?.length) {
        return { content: 'No relevant prior context found.', raw: null };
      }
      const relevant = memory.messages
        .filter((m: any) => m.relevance > 0.7)
        .slice(0, 5)
        .map((m: any) => `- ${m.role}: ${m.content}`);
      const content = [
        `Key topics discussed previously: ${memory.keyTopics?.join(', ') || 'none'}.`,
        `Emotional tone: ${memory.emotionalTone || 'neutral'}.`,
        relevant.length ? `Relevant past messages:\n${relevant.join('\n')}` : '',
      ]
        .filter(Boolean)
        .join('\n');
      return { content, raw: { keyTopics: memory.keyTopics, emotionalTone: memory.emotionalTone, relevant } };
    },
  },

  search_videos: {
    tool: {
      type: 'function',
      function: {
        name: 'search_videos',
        description:
          'Find relevant teaching/apologetics videos to recommend alongside the answer. Use when a visual or longer-form explanation would help the user.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Topic to find videos about.' },
          },
          required: ['query'],
        },
      },
    },
    handler: async (args, ctx) => {
      const query = str(args.query, ctx.message);
      const videos = await VideoService.searchRelevantVideos({
        query,
        maxResults: 3,
        relevanceThreshold: 0.05,
        includeScripture: true,
        userContext: {
          objectionType: ctx.objection.primaryType,
          userStance: ctx.objection.userStance,
          intensity: ctx.objection.intensity,
          mode: ctx.mode,
        },
      });
      const trimmed = videos.map(v => ({
        title: v.title,
        url: v.url,
        channel: v.channel,
        relevance: Number(v.relevance.toFixed(3)),
      }));
      const content = trimmed.length
        ? trimmed.map((v, i) => `${i + 1}. "${v.title}" — ${v.channel} (${v.url})`).join('\n')
        : 'No relevant videos found.';
      return { content, raw: trimmed };
    },
  },
};

export interface ToolSelection {
  /** Free tier hides videos to save cost; enabled for paid tiers. */
  includeVideos?: boolean;
  /** Memory recall requires an existing conversation. */
  includeMemory?: boolean;
}

/** OpenAI `tools` array for a turn, gated by tier/context. */
export function selectTools(opts: ToolSelection = {}): OpenAI.Chat.Completions.ChatCompletionTool[] {
  const { includeVideos = true, includeMemory = true } = opts;
  return Object.entries(REGISTRY)
    .filter(([name]) => {
      if (name === 'search_videos' && !includeVideos) return false;
      if (name === 'recall_memory' && !includeMemory) return false;
      return true;
    })
    .map(([, def]) => def.tool);
}

export interface ToolTrace {
  name: string;
  args: Record<string, unknown>;
  ok: boolean;
  ms: number;
  error?: string;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)),
  ]);
}

/**
 * Run a batch of model-requested tool calls in parallel. Returns the `tool`
 * role messages to append to the conversation plus a trace for logging.
 * A failing or unknown tool yields an error tool-message (never throws), so
 * the loop can continue and the model can recover.
 */
export async function executeToolCalls(
  toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[],
  ctx: ToolContext
): Promise<{
  messages: OpenAI.Chat.Completions.ChatCompletionToolMessageParam[];
  trace: ToolTrace[];
}> {
  const settled = await Promise.all(
    toolCalls.map(async (call): Promise<{
      message: OpenAI.Chat.Completions.ChatCompletionToolMessageParam;
      trace: ToolTrace;
    }> => {
      const name = call.function.name;
      const startedAt = Date.now();
      let args: Record<string, unknown> = {};
      try {
        args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
      } catch {
        // leave args empty; handlers fall back to ctx.message
      }

      const def = REGISTRY[name];
      if (!def) {
        return {
          message: { role: 'tool', tool_call_id: call.id, content: `Unknown tool: ${name}` },
          trace: { name, args, ok: false, ms: Date.now() - startedAt, error: 'unknown_tool' },
        };
      }

      try {
        const result = await withTimeout(def.handler(args, ctx), TOOL_TIMEOUT_MS, name);
        return {
          message: { role: 'tool', tool_call_id: call.id, content: result.content },
          trace: { name, args, ok: true, ms: Date.now() - startedAt },
        };
      } catch (err) {
        const error = err instanceof Error ? err.message : 'unknown_error';
        logger.error('Agent tool failed', { cid: ctx.cid, tool: name }, err);
        return {
          message: {
            role: 'tool',
            tool_call_id: call.id,
            content: `Tool "${name}" failed: ${error}. Proceed without it or try a different approach.`,
          },
          trace: { name, args, ok: false, ms: Date.now() - startedAt, error },
        };
      }
    })
  );

  return {
    messages: settled.map(s => s.message),
    trace: settled.map(s => s.trace),
  };
}
