const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMessagesInsert() {
  try {
    console.log('Testing messages table insert with proper UUIDs...\n');

    // First, let's create a test conversation
    console.log('Creating test conversation...');
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
        title: 'Test Conversation'
      })
      .select()
      .single();

    if (convError) {
      console.log('❌ Conversation creation error:', convError.message);
      return;
    }

    console.log('✅ Test conversation created:', convData);

    // Now try to insert a message with user_id
    console.log('\nTesting message insert with user_id...');
    const testMessageWithUserId = {
      conversation_id: convData.id,
      user_id: '00000000-0000-0000-0000-000000000000',
      content: 'Test message with user_id',
      role: 'user'
    };

    const { data: msgData1, error: msgError1 } = await supabase
      .from('messages')
      .insert(testMessageWithUserId)
      .select();

    if (msgError1) {
      console.log('❌ Message insert with user_id failed:', msgError1.message);
      
      // Try without user_id
      console.log('\nTrying without user_id...');
      const testMessageWithoutUserId = {
        conversation_id: convData.id,
        content: 'Test message without user_id',
        role: 'user'
      };

      const { data: msgData2, error: msgError2 } = await supabase
        .from('messages')
        .insert(testMessageWithoutUserId)
        .select();

      if (msgError2) {
        console.log('❌ Message insert without user_id also failed:', msgError2.message);
      } else {
        console.log('✅ Message insert without user_id succeeded');
        console.log('Data:', msgData2);
      }
    } else {
      console.log('✅ Message insert with user_id succeeded');
      console.log('Data:', msgData1);
    }

    // Clean up test data
    console.log('\nCleaning up test data...');
    await supabase.from('messages').delete().eq('conversation_id', convData.id);
    await supabase.from('conversations').delete().eq('id', convData.id);
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('Error testing messages insert:', error);
  }
}

testMessagesInsert();
