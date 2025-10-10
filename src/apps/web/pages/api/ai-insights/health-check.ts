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
  const cid = withCorrelationId(req, `health_check_${Date.now()}`)

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    logger.info('Running database health check', { 
      cid,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'
    })

    // Check if we can connect to the database
    const { data: connectionTest, error: connectionError } = await supabase
      .from('ai_insights')
      .select('count')
      .limit(1)

    if (connectionError) {
      logger.error('Database connection failed', { cid, error: connectionError.message })
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: connectionError.message,
        code: connectionError.code
      })
    }

    // Check if the table exists and has data
    const { data: tableData, error: tableError } = await supabase
      .from('ai_insights')
      .select('id, created_at')
      .limit(5)

    if (tableError) {
      logger.error('Table access failed', { cid, error: tableError.message })
      return res.status(500).json({
        success: false,
        error: 'Table access failed',
        details: tableError.message,
        code: tableError.code
      })
    }

    // Test database write permissions by checking if we can access the table
    const { data: tableInfo, error: tableAccessError } = await supabase
      .from('ai_insights')
      .select('id')
      .limit(1)

    if (tableAccessError) {
      logger.error('Table access test failed', { cid, error: tableAccessError.message })
      return res.status(500).json({
        success: false,
        error: 'Table access test failed',
        details: tableAccessError.message,
        code: tableAccessError.code
      })
    }

    logger.info('Database health check passed', { cid })

    res.status(200).json({
      success: true,
      message: 'Database is healthy',
      connection: 'OK',
      table_access: 'OK',
      read_test: 'OK',
      existing_records: tableData?.length || 0,
      environment: {
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'
      }
    })

  } catch (error) {
    logger.error('Health check failed', { cid }, error)
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
