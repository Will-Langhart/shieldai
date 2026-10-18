import type { NextApiRequest } from 'next';

/**
 * Graph rollout routing (shared).
 *
 * `GRAPH_ROLLOUT_PCT` routes a bucketed fraction of chat traffic to the
 * multi-agent graph. This lived only inside `chat.ts`, but the production client
 * hits `/api/chat-rag` directly — so the rollout never took effect. Extracting it
 * here lets `chat-rag` (the real entry point) honor the same rollout with the
 * SAME bucketing, so a client lands in the same arm regardless of route.
 *
 * NOTE: `chat.ts` still has its own inline copy of this logic (for its combined
 * graph+agentic routing). Both read the same env and bucket the same token, so
 * they agree; keep them in sync if the algorithm changes.
 */

export const GRAPH_ROLLOUT_PCT = Math.min(Math.max(Number(process.env.GRAPH_ROLLOUT_PCT || 0), 0), 100);

// Explicit per-request override: ?graph=1|0, x-shield-graph header, body {graph}.
export function graphFlag(req: NextApiRequest): boolean | undefined {
  const header = req.headers['x-shield-graph'];
  const raw =
    (Array.isArray(header) ? header[0] : header) ??
    (typeof req.query.graph === 'string' ? req.query.graph : undefined) ??
    (typeof (req.body as any)?.graph === 'boolean' ? String((req.body as any).graph) : undefined);
  if (raw === undefined) return undefined;
  if (raw === '1' || raw === 'true') return true;
  if (raw === '0' || raw === 'false') return false;
  return undefined;
}

// Deterministic 0-99 bucket from the bearer token (stable within a session) so a
// given client lands consistently in one arm of the experiment.
export function rolloutBucket(req: NextApiRequest): number {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  let h = 0;
  for (let i = 0; i < token.length; i++) h = (h * 31 + token.charCodeAt(i)) >>> 0;
  return h % 100;
}

export function shouldRouteToGraph(req: NextApiRequest): boolean {
  const flag = graphFlag(req);
  if (flag !== undefined) return flag;
  return GRAPH_ROLLOUT_PCT > 0 && rolloutBucket(req) < GRAPH_ROLLOUT_PCT;
}

/**
 * Scripture-agent rollout (`AGENT_ROLLOUT_PCT`), same bucketing as the graph
 * but taken from the TOP of the 0-99 range so the two arms don't overlap while
 * both run. Override per request with ?agent=1|0 or the x-shield-agent header.
 * Only fresh streaming turns qualify: the agent has no JSON response shape and
 * no regenerate support yet, so those stay on chat-rag.
 */
export const AGENT_ROLLOUT_PCT = Math.min(Math.max(Number(process.env.AGENT_ROLLOUT_PCT || 0), 0), 100);

export function shouldRouteToAgent(req: NextApiRequest): boolean {
  if (!(req.body as any)?.stream || (req.body as any)?.regenerate) return false;
  const header = req.headers['x-shield-agent'];
  const raw = (Array.isArray(header) ? header[0] : header) ?? (typeof req.query.agent === 'string' ? req.query.agent : undefined);
  if (raw === '1' || raw === 'true') return true;
  if (raw === '0' || raw === 'false') return false;
  return AGENT_ROLLOUT_PCT > 0 && rolloutBucket(req) >= 100 - AGENT_ROLLOUT_PCT;
}
