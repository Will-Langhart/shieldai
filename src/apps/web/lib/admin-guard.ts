import type { NextApiRequest, NextApiResponse } from 'next';
import { timingSafeEqual } from 'crypto';

/**
 * Guard for operator-only routes (Pinecone admin/seed/import, debug endpoints).
 * These can read, write or delete any user's data, so they fail closed:
 *
 * - The caller must send `x-admin-token` matching ADMIN_API_TOKEN
 *   (PINECONE_IMPORT_TOKEN is accepted as a fallback secret).
 * - If no secret is configured, the route is open only under `next dev`.
 *
 * Returns true when the request may proceed; otherwise it has already responded.
 */
export function requireAdmin(req: NextApiRequest, res: NextApiResponse): boolean {
  const secret = process.env.ADMIN_API_TOKEN || process.env.PINECONE_IMPORT_TOKEN;

  if (!secret) {
    if (process.env.NODE_ENV === 'development') return true;
    res.status(404).json({ error: 'Not found' });
    return false;
  }

  const provided = req.headers['x-admin-token'] ?? req.headers['x-import-token'];
  if (typeof provided === 'string' && safeEqual(provided, secret)) return true;

  res.status(401).json({ error: 'Unauthorized' });
  return false;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
