import { NextApiRequest, NextApiResponse } from 'next'
import { bibleService } from '../../../lib/bible-service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const { versionId, bookId } = req.query
  if (!versionId || !bookId || typeof versionId !== 'string' || typeof bookId !== 'string')
    return res.status(400).json({ error: 'versionId and bookId required' })
  try {
    const chapters = await bibleService.getChaptersForBook(versionId, bookId)
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800')
    res.status(200).json({ chapters })
  } catch {
    res.status(500).json({ error: 'Failed to fetch chapters' })
  }
}
