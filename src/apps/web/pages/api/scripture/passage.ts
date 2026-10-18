import type { NextApiRequest, NextApiResponse } from 'next';
import { applyBibleRateLimit } from '../../../lib/rate-limit';
import { scripture } from '../../../lib/scripture/engine';

/**
 * GET /api/scripture/passage?reference=John%203:16&translation=NET
 *
 * One passage through the Scripture engine — what the chat's passage card calls
 * when the reader switches translation. Public text only, so no auth.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await applyBibleRateLimit(req, res))) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const reference = typeof req.query.reference === 'string' ? req.query.reference : '';
  const translation = typeof req.query.translation === 'string' ? req.query.translation : undefined;
  if (!reference) return res.status(400).json({ error: 'reference is required' });

  const passage = await scripture.getPassage(reference, translation);
  if (!passage) return res.status(404).json({ error: `Could not find ${reference}${translation ? ` in ${translation}` : ''}` });

  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  return res.status(200).json({ passage, translations: scripture.translations() });
}
