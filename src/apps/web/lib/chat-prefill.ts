import type { ParsedUrlQuery } from 'querystring';

export interface PrefillQuery {
  prefill: string;
  rest: ParsedUrlQuery;
}

/**
 * Reads the `?q=` composer prefill from a Next.js router query.
 * Returns null when `q` is missing, not a single string, or blank; otherwise
 * the prefill (truncated to `maxLength`) and the query without `q`.
 */
export function takePrefillQuery(query: ParsedUrlQuery, maxLength = 500): PrefillQuery | null {
  const q = query.q;
  if (typeof q !== 'string' || !q.trim()) return null;
  const rest: ParsedUrlQuery = { ...query };
  delete rest.q;
  return { prefill: q.slice(0, maxLength), rest };
}
