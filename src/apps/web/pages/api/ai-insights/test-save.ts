import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { logger, withCorrelationId } from '../../../lib/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `test_save_${Date.now()}`)

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Test data - using real user ID from database
    const testInsight = {
      user_id: 'ec74002e-1801-40b7-a166-fe75c4b14d9f', // Real user ID from database
      passage_reference: 'John 3:16',
      passage_text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
      bible_version: 'NIV',
      explanation: 'This is a test insight to verify the save functionality is working properly.',
      key_themes: ['love', 'salvation', 'eternal life'],
      cross_references: [],
      study_questions: [],
      historical_context: 'Test historical context',
      theological_meaning: 'Test theological meaning',
      practical_application: 'Test practical application',
      prayer_points: ['Test prayer point'],
      ai_model: 'gpt-4-turbo-preview',
      tags: ['test'],
      notes: 'This is a test insight created via API'
    }

    logger.info('Testing insight save', { cid, testInsight })

    // Ensure test user exists first
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', testInsight.user_id)
      .single();

    if (userCheckError && userCheckError.code === 'PGRST116') {
      // User doesn't exist, create them
      const { error: userCreateError } = await supabase
        .from('users')
        .insert({
          id: testInsight.user_id,
          email: 'test@shieldai.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (userCreateError) {
        logger.error('Failed to create test user', { cid, error: userCreateError.message });
        return res.status(500).json({ 
          error: 'Failed to create test user',
          details: userCreateError.message 
        });
      }
      
      logger.info('Created test user for test save', { cid, user_id: testInsight.user_id });
    }

    // Insert the test insight
    const { data: savedInsight, error: insertError } = await supabase
      .from('ai_insights')
      .insert(testInsight)
      .select()
      .single()

    if (insertError) {
      logger.error('Failed to save test insight', { cid, error: insertError.message })
      return res.status(500).json({ 
        error: 'Failed to save test insight',
        details: insertError.message 
      })
    }

    logger.info('Test insight saved successfully', { cid, insight_id: savedInsight.id })

    // Now try to retrieve it
    const { data: retrievedInsights, error: retrieveError } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('user_id', '550e8400-e29b-41d4-a716-446655440001')
      .order('created_at', { ascending: false })
      .limit(10)

    if (retrieveError) {
      logger.error('Failed to retrieve test insights', { cid, error: retrieveError.message })
      return res.status(500).json({ 
        error: 'Failed to retrieve test insights',
        details: retrieveError.message 
      })
    }

    res.status(200).json({
      success: true,
      message: 'Test insight saved and retrieved successfully',
      saved_insight: savedInsight,
      all_insights: retrievedInsights,
      total_count: retrievedInsights?.length || 0
    })

  } catch (error) {
    logger.error('Error in test save', { cid }, error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
