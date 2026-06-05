import { NextApiRequest, NextApiResponse } from 'next'
import { bibleService } from '../../../lib/bible-service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const { versionId, chapterId } = req.query
  if (!versionId || !chapterId || typeof versionId !== 'string' || typeof chapterId !== 'string')
    return res.status(400).json({ error: 'versionId and chapterId required' })
  try {
    const sections = await bibleService.getSectionsForChapter(versionId, chapterId)
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    res.status(200).json({ sections })
  } catch {
    res.status(500).json({ sections: [] })
  }
}
