import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authenticated user from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.substring(7);
    const serverSupabase = createServerSupabaseClient(token);
    
    // Test database connection and schema
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    // Check if messages table exists and get its schema
    const { data: tableInfo, error: tableError } = await serverSupabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'messages')
      .eq('table_schema', 'public');

    if (tableError) {
      return res.status(500).json({ 
        error: 'Failed to query table schema',
        details: tableError.message 
      });
    }

    // Check if specific columns exist
    const hasRelevantVideos = tableInfo?.some(col => col.column_name === 'relevant_videos');
    const hasBibleVerses = tableInfo?.some(col => col.column_name === 'bible_verses');
    const hasVideoMetadata = tableInfo?.some(col => col.column_name === 'video_metadata');

    // Try to insert a test message to see if the columns work
    let insertTest = null;
    try {
      const { data: testConv, error: convError } = await serverSupabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (testConv) {
        const { data: testMsg, error: msgError } = await serverSupabase
          .from('messages')
          .insert({
            conversation_id: testConv.id,
            role: 'assistant',
            content: 'Test message for schema validation',
            relevant_videos: [],
            bible_verses: [],
            video_metadata: {}
          })
          .select()
          .single();

        if (msgError) {
          insertTest = { success: false, error: msgError.message };
        } else {
          insertTest = { success: true, messageId: testMsg.id };
          
          // Clean up test message
          await serverSupabase
            .from('messages')
            .delete()
            .eq('id', testMsg.id);
        }
      }
    } catch (insertError: any) {
      insertTest = { success: false, error: insertError.message };
    }

    // Check conversation loading
    const { data: conversations, error: convsError } = await serverSupabase
      .from('conversations')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      database: {
        tableSchema: tableInfo,
        hasRelevantVideos,
        hasBibleVerses,
        hasVideoMetadata,
        insertTest,
        conversations: conversations || [],
        conversationsError: convsError?.message || null
      }
    });

  } catch (error: any) {
    console.error('Database schema test failed:', error);
    return res.status(500).json({ 
      error: 'Database schema test failed',
      details: error.message 
    });
  }
}
