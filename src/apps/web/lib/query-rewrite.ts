import { complete, MODELS } from './llm';
import { logger } from './logger';

/**
 * Query rewriting for retrieval (architecture pass).
 *
 * Turns a user's latest message + recent history into a single self-contained
 * search query BEFORE it hits the vector indexes. Two wins:
 *   1. Multi-turn resolution — a follow-up like "what about the Old Testament though?"
 *      retrieves on a standalone query instead of the bare fragment.
 *   2. Term expansion — surfaces the theological/topical terms the answer needs
 *      (doctrines, names, concepts), lifting dense-retrieval recall.
 *
 * The rewrite is used ONLY to drive retrieval; the model still answers the user's
 * actual message. Cheap Haiku hop, env-gated (QUERY_REWRITE_ENABLED), and it
 * fails safe: any error, empty output, or disabled flag returns the raw message.
 */

const ENABLED = /^(true|1)$/i.test(process.env.QUERY_REWRITE_ENABLED || '');

export interface RewriteInput {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  cid?: string;
}

const SYSTEM =
  "You rewrite a user's latest message into ONE self-contained search query for " +
  'retrieving Bible verses and Christian apologetics material. Resolve pronouns and ' +
  'references using the conversation so the query stands alone. Add the key theological ' +
  'and topical terms the answer would need (doctrines, names, concepts), but stay ' +
  'concise — a single line, at most ~30 words. Output ONLY the query text: no quotes, ' +
  'no preamble, no explanation.';

/** True when rewriting is enabled (for callers that want to skip work entirely). */
export const isQueryRewriteEnabled = ENABLED;

/**
 * Return a retrieval-optimized query for `message`. When disabled or on any
 * failure, returns `message` unchanged so callers can use the result directly.
 */
export async function rewriteQuery(input: RewriteInput): Promise<string> {
  const { message, history = [], cid } = input;
  if (!ENABLED || !message.trim()) return message;
  try {
    const convo = history
      .slice(-6)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');
    const user = convo
      ? `Conversation so far:\n${convo}\n\nLatest message: ${message}\n\nSearch query:`
      : `Message: ${message}\n\nSearch query:`;

    const raw = await complete({
      system: SYSTEM,
      messages: [{ role: 'user', content: user }],
      model: MODELS.specialist, // Haiku: fast, cheap, no thinking overhead
      maxTokens: 120,
    });

    // Take the first non-empty line, stripped of wrapping quotes.
    const cleaned = raw.trim().replace(/^["']|["']$/g, '').split('\n')[0].trim();
    if (!cleaned) return message;
    logger.debug('query-rewrite', { cid, from: message.slice(0, 80), to: cleaned.slice(0, 80) });
    return cleaned;
  } catch (err) {
    logger.error('query-rewrite failed', { cid }, err as Error);
    return message;
  }
}
