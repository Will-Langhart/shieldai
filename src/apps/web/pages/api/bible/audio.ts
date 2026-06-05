import { NextApiRequest, NextApiResponse } from 'next'
import { bibleService } from '../../../lib/bible-service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const { audioBibleId, chapterId, language } = req.query

  // ?audioBibleId=...&chapterId=... → fetch audio URL for a chapter
  if (audioBibleId && chapterId) {
    try {
      const url = await bibleService.getAudioChapter(audioBibleId as string, chapterId as string)
      if (!url) return res.status(404).json({ error: 'Audio not available for this chapter' })
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
      return res.status(200).json({ url })
    } catch {
      return res.status(500).json({ error: 'Failed to fetch audio chapter' })
    }
  }

  // ?language=eng → list available audio bibles
  try {
    const audioBibles = await bibleService.getAudioBibles((language as string) || 'eng')
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    return res.status(200).json({ audioBibles })
  } catch {
    return res.status(500).json({ error: 'Failed to fetch audio bibles' })
  }
}
