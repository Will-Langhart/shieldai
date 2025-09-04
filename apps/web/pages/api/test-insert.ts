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

    // Test 1: Try to insert with mode = 'gentle'
    console.log('🔍 Testing insert with mode = "gentle"...');
    try {
      const { data: testMsg1, error: insertError1 } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          role: 'user',
          content: 'Test message with gentle mode',
          mode: 'gentle'
        })
        .select()
        .single();

      if (insertError1) {
        console.log('❌ Insert with "gentle" failed:', insertError1);
        return res.status(500).json({
          success: false,
          test: 'Insert with mode = "gentle"',
          error: insertError1.message,
          code: insertError1.code,
          details: insertError1.details,
          hint: insertError1.hint
        });
      } else {
        console.log('✅ Insert with "gentle" succeeded:', testMsg1.id);
        
        // Clean up test message
        await supabase
          .from('messages')
          .delete()
          .eq('id', testMsg1.id);
        
        return res.status(200).json({
          success: true,
          message: 'Database schema is correct - messages can be inserted with mode = "gentle"',
          testMessageId: testMsg1.id
        });
      }
    } catch (insertError: any) {
      console.log('❌ Insert with "gentle" threw exception:', insertError);
      return res.status(500).json({
        success: false,
        test: 'Insert with mode = "gentle"',
        error: insertError.message,
        stack: insertError.stack
      });
    }

  } catch (error) {
    console.error('❌ Test insert error:', error);
    return res.status(500).json({ 
      error: 'Test insert failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

