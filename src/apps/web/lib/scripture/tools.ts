import type Anthropic from '@anthropic-ai/sdk';
import { searchApologeticsContent } from '../apologetics-knowledge';
import { MemoryService } from '../memory-service';
import { logger } from '../logger';
import { scripture, withTimeout, DEFAULT_TRANSLATION } from './engine';
import { canonicalize } from './reference';
import { wordStudy, relatedPassages } from './study';
import type { Passage, VerseHit } from './types';
import type { Widget } from './widgets';

/**
 * Typed Claude tools over the Scripture engine. Each handler returns compact
 * `content` for the model and, where it has one, a `widget` the chat renders
 * as a card. Handlers never throw: a failure becomes a tool_result the model
 * can recover from.
 */

export interface AgentToolContext {
  message: string;
  userId: string;
  conversationId?: string;
  cid: string;
}

export interface AgentToolResult {
  content: string;
  widget?: Widget;
  isError?: boolean;
}

interface AgentTool {
  definition: Anthropic.Tool;
  /** Short present-tense status for the UI, e.g. "Reading John 1:1 in Greek". */
  status(input: Record<string, unknown>): string;
  run(input: Record<string, unknown>, ctx: AgentToolContext): Promise<AgentToolResult>;
}

const TOOL_TIMEOUT_MS = Number(process.env.AGENT_TOOL_TIMEOUT_MS || 10000);

const str = (v: unknown, fallback = '') => (typeof v === 'string' && v.trim() ? v.trim() : fallback);
const int = (v: unknown, fallback: number, min: number, max: number) =>
  Math.min(Math.max(typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : fallback, min), max);

function passageText(p: Passage): string {
  const body = p.verses.map(v => `[${v.num}] ${v.text}`).join(' ');
  return `${p.reference} (${p.translation}): ${body}`;
}

function hitsText(hits: VerseHit[]): string {
  return hits.map((h, i) => `${i + 1}. ${h.reference} (${h.translation}${h.score != null ? `, score ${h.score}` : ''}): "${h.text}"`).join('\n');
}

const TOOLS: Record<string, AgentTool> = {
  search: {
    definition: {
      name: 'search',
      description:
        'Search the Bible. mode "semantic" finds verses by meaning (e.g. "God\'s faithfulness in suffering"); mode "keyword" finds exact words, names, or phrases. Returns ranked verses with references. Use before quoting any verse you are not certain of.',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'What to look for.' },
          mode: { type: 'string', enum: ['semantic', 'keyword'], description: 'Default semantic.' },
          limit: { type: 'integer', description: 'Results to return, 1-10. Default 5.' },
        },
        required: ['query'],
      },
    },
    status: input => `Searching Scripture for "${str(input.query)}"`,
    async run(input, ctx) {
      const query = str(input.query, ctx.message);
      const mode = input.mode === 'keyword' ? 'keyword' : 'semantic';
      const hits = await scripture.search(query, mode, int(input.limit, 5, 1, 10));
      if (!hits.length) return { content: 'No matching verses found.' };
      return { content: hitsText(hits), widget: { type: 'verse_list', data: { query, mode, hits } } };
    },
  },

  get_passage: {
    definition: {
      name: 'get_passage',
      description:
        'Fetch the exact text of a passage, e.g. "Romans 8:28-30" or "Psalm 23". Use to quote Scripture accurately and to read surrounding context. Max 40 verses.',
      input_schema: {
        type: 'object',
        properties: {
          reference: { type: 'string', description: 'Book chapter:verse(-verse), or a whole chapter.' },
          translation: { type: 'string', description: `Translation code. Default ${DEFAULT_TRANSLATION}.` },
        },
        required: ['reference'],
      },
    },
    status: input => `Reading ${str(input.reference)}`,
    async run(input) {
      const reference = str(input.reference);
      if (!canonicalize(reference)) return { content: `"${reference}" is not a valid Bible reference.`, isError: true };
      const translation = str(input.translation, DEFAULT_TRANSLATION).toUpperCase();
      const passage = await scripture.getPassage(reference, translation);
      if (!passage) {
        const available = scripture.translations().map(t => t.code).join(', ');
        return { content: `Could not fetch ${reference} in ${translation}. Available translations: ${available}.`, isError: true };
      }
      return {
        content: passageText(passage),
        widget: { type: 'passage', data: { ...passage, available: scripture.translations() } },
      };
    },
  },

  compare_translations: {
    definition: {
      name: 'compare_translations',
      description:
        'Show one passage side by side in several translations. Use when wording differences matter to the question or the user asks how translations differ.',
      input_schema: {
        type: 'object',
        properties: {
          reference: { type: 'string', description: 'The passage, e.g. "John 1:1".' },
          translations: {
            type: 'array',
            items: { type: 'string' },
            description: 'Translation codes to compare. Defaults to every available translation (up to 4).',
          },
        },
        required: ['reference'],
      },
    },
    status: input => `Comparing translations of ${str(input.reference)}`,
    async run(input) {
      const reference = str(input.reference);
      const available = scripture.translations().map(t => t.code);
      const requested = Array.isArray(input.translations)
        ? input.translations.filter((t): t is string => typeof t === 'string')
        : [];
      const codes = (requested.length ? requested : available).slice(0, 4);
      const passages = await scripture.compare(reference, codes);
      if (!passages.length) return { content: `Could not fetch ${reference}. Available translations: ${available.join(', ')}.`, isError: true };
      return {
        content: passages.map(passageText).join('\n\n'),
        widget: { type: 'translation_compare', data: { reference: passages[0].reference, passages } },
      };
    },
  },

  word_study: {
    definition: {
      name: 'word_study',
      description:
        'Original-language study of a passage: the Greek (NT) or Hebrew (OT) word by word with transliteration, gloss, Strong\'s number, and morphology. Pass `word` to get the full lexicon entry for one term (English gloss like "Word", transliteration like "logos", or Strong\'s like "G3056"). Use whenever a claim depends on what a word means in the original. Max 5 verses.',
      input_schema: {
        type: 'object',
        properties: {
          reference: { type: 'string', description: 'A verse or short range, e.g. "John 1:1" or "Isaiah 7:14".' },
          word: { type: 'string', description: 'Optional focus term.' },
        },
        required: ['reference'],
      },
    },
    status: input => `Reading ${str(input.reference)} in the original language`,
    async run(input) {
      const { content, widget } = await wordStudy(str(input.reference), str(input.word) || undefined);
      return widget ? { content, widget } : { content, isError: true };
    },
  },

  cross_refs: {
    definition: {
      name: 'cross_refs',
      description:
        'Find passages related to a verse elsewhere in Scripture (thematic neighbors). Use to show how Scripture interprets Scripture or to corroborate a point from several books.',
      input_schema: {
        type: 'object',
        properties: { reference: { type: 'string', description: 'The verse to start from, e.g. "Isaiah 53:5".' } },
        required: ['reference'],
      },
    },
    status: input => `Finding passages related to ${str(input.reference)}`,
    async run(input) {
      const reference = str(input.reference);
      const result = await relatedPassages(reference);
      if (!result) return { content: `Could not find ${reference}.`, isError: true };
      if (!result.related.length) return { content: `No related passages found for ${reference}.` };
      return {
        content: `Related to ${result.source.reference}:\n${hitsText(result.related)}`,
        widget: { type: 'cross_refs', data: { reference: result.source.reference, source: result.source, related: result.related } },
      };
    },
  },

  search_apologetics_kb: {
    definition: {
      name: 'search_apologetics_kb',
      description:
        'Search the curated apologetics knowledge base for structured arguments and responses to common objections (problem of evil, reliability of Scripture, science and faith, etc.).',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The objection or topic.' },
          category: { type: 'string', description: 'Optional category, e.g. "historical", "scientific".' },
        },
        required: ['query'],
      },
    },
    status: () => 'Checking the apologetics library',
    async run(input, ctx) {
      const results = searchApologeticsContent(str(input.query, ctx.message), str(input.category) || undefined).slice(0, 3);
      if (!results.length) return { content: 'No apologetics entries matched.' };
      return {
        content: results
          .map((r, i) => `${i + 1}. [${r.category}] ${r.title}\n${r.content.slice(0, 600)}\nKey scriptures: ${r.scriptures.join(', ') || 'none'}`)
          .join('\n\n'),
      };
    },
  },

  recall_memory: {
    definition: {
      name: 'recall_memory',
      description: "Recall relevant context from the user's earlier messages in this conversation.",
      input_schema: {
        type: 'object',
        properties: { query: { type: 'string', description: 'What to recall. Defaults to the current message.' } },
        required: [],
      },
    },
    status: () => 'Recalling earlier conversation',
    async run(input, ctx) {
      if (!ctx.conversationId) return { content: 'No prior conversation memory available.' };
      const memory = await MemoryService.getEnhancedConversationContext(ctx.conversationId, ctx.userId, str(input.query, ctx.message), 10);
      const relevant = (memory?.messages || []).filter((m: any) => m.relevance > 0.7).slice(0, 5);
      if (!relevant.length) return { content: 'No relevant prior context found.' };
      return {
        content: [
          `Key topics discussed previously: ${memory.keyTopics?.join(', ') || 'none'}.`,
          ...relevant.map((m: any) => `- ${m.role}: ${m.content}`),
        ].join('\n'),
      };
    },
  },
};

export const SCRIPTURE_FLOOR_TOOL = 'search';

/** Tool definitions for a turn. Memory needs an existing conversation. */
export function agentTools(opts: { includeMemory: boolean }): Anthropic.Tool[] {
  return Object.entries(TOOLS)
    .filter(([name]) => name !== 'recall_memory' || opts.includeMemory)
    .map(([, t]) => t.definition);
}

export function toolStatus(name: string, input: Record<string, unknown>): string {
  return TOOLS[name]?.status(input) ?? `Running ${name}`;
}

/** Run one tool call with a timeout. Never throws. */
export async function runAgentTool(
  name: string,
  input: Record<string, unknown>,
  ctx: AgentToolContext
): Promise<AgentToolResult & { ms: number }> {
  const startedAt = Date.now();
  const tool = TOOLS[name];
  if (!tool) return { content: `Unknown tool: ${name}`, isError: true, ms: 0 };
  try {
    const result = await withTimeout(tool.run(input, ctx), TOOL_TIMEOUT_MS, name);
    return { ...result, ms: Date.now() - startedAt };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'unknown error';
    logger.error('Agent tool failed', { cid: ctx.cid, tool: name, error });
    return { content: `Tool "${name}" failed: ${error}. Continue without it.`, isError: true, ms: Date.now() - startedAt };
  }
}
