import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { withCorrelationId } from '../../../../lib/logger'
import { logger } from '../../../../lib/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `toggle_favorite_${Date.now()}`)

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.query
    const { is_favorite } = req.body

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid insight ID' })
    }

    if (typeof is_favorite !== 'boolean') {
      return res.status(400).json({ error: 'is_favorite must be a boolean' })
    }

    // Get user from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header required' })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authentication token' })
    }

    logger.info('Toggling favorite status', { cid, insight_id: id, user_id: user.id, is_favorite })

    // Update the insight
    const { data: updatedInsight, error: updateError } = await supabase
      .from('ai_insights')
      .update({ 
        is_favorite,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      logger.error('Error updating insight favorite status', { cid, error: updateError })
      return res.status(500).json({ error: 'Failed to update insight' })
    }

    if (!updatedInsight) {
      return res.status(404).json({ error: 'Insight not found' })
    }

    logger.info('Successfully updated favorite status', { 
      cid, 
      insight_id: id, 
      user_id: user.id, 
      is_favorite 
    })

    res.status(200).json({
      success: true,
      insight: updatedInsight
    })

  } catch (error) {
    logger.error('Error toggling favorite status', { cid }, error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
