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
    
    // Test authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Authentication failed', details: authError });
    }

    // Test 1: Try to insert a message with mode = 'gentle' to see the exact error
    console.log('🔍 Testing message insert with mode = "gentle"...');
    
    // Get a conversation to test with
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (convError || !conversation) {
      return res.status(500).json({ 
        error: 'No conversation found to test with',
        details: convError?.message 
      });
    }

    // Try to insert a test message
    const { data: testMsg, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        role: 'user',
        content: 'Test message to check enum',
        mode: 'gentle'
      })
      .select()
      .single();

    if (insertError) {
      console.log('❌ Insert failed:', insertError);
      return res.status(500).json({
        success: false,
        test: 'Message insert with mode = "gentle"',
        error: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        suggestion: 'The response_mode enum type does not exist in your database'
      });
    } else {
      console.log('✅ Insert succeeded:', testMsg.id);
      
      // Clean up test message
      await supabase
        .from('messages')
        .delete()
        .eq('id', testMsg.id);
      
      return res.status(200).json({
        success: true,
        message: 'Database schema is correct! Messages can be inserted with mode = "gentle"',
        testMessageId: testMsg.id
      });
    }

  } catch (error) {
    console.error('❌ Test error:', error);
    return res.status(500).json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

