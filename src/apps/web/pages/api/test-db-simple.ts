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
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    const supabase = createServerSupabaseClient(token);
    
    // Test 1: Basic authentication
    console.log('🔍 Testing authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError);
      return res.status(401).json({ error: 'Authentication failed', details: authError });
    }
    console.log('✅ Authentication successful for user:', user.email);

    // Test 2: Check if messages table exists
    console.log('🔍 Checking messages table...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'messages')
      .eq('table_schema', 'public');

    if (tableError) {
      console.log('❌ Failed to query table schema:', tableError);
      return res.status(500).json({ 
        error: 'Failed to query table schema',
        details: tableError.message 
      });
    }
    console.log('✅ Messages table schema retrieved:', tableInfo?.length, 'columns');

    // Test 3: Check specific columns
    const hasRelevantVideos = tableInfo?.some(col => col.column_name === 'relevant_videos');
    const hasBibleVerses = tableInfo?.some(col => col.column_name === 'bible_verses');
    const hasVideoMetadata = tableInfo?.some(col => col.column_name === 'video_metadata');
    const hasMode = tableInfo?.some(col => col.column_name === 'mode');

    console.log('📊 Column status:');
    console.log('  - relevant_videos:', hasRelevantVideos ? '✅' : '❌');
    console.log('  - bible_verses:', hasBibleVerses ? '✅' : '❌');
    console.log('  - video_metadata:', hasVideoMetadata ? '✅' : '❌');
    console.log('  - mode:', hasMode ? '✅' : '❌');

    // Test 4: Try to get conversations
    console.log('🔍 Testing conversations table...');
    const { data: conversations, error: convsError } = await supabase
      .from('conversations')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (convsError) {
      console.log('❌ Failed to get conversations:', convsError);
      return res.status(500).json({ 
        error: 'Failed to get conversations',
        details: convsError.message 
      });
    }
    console.log('✅ Conversations retrieved:', conversations?.length || 0);

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
        hasMode,
        conversations: conversations || [],
        conversationsError: null
      }
    });

  } catch (error) {
    console.error('❌ Database test error:', error);
    return res.status(500).json({ 
      error: 'Database test failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

