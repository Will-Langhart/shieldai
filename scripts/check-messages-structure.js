const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMessagesStructure() {
  try {
    console.log('Checking messages table structure...\n');

    // Try to insert a test message to see what columns are expected
    console.log('Testing message insertion...');
    
    const testMessage = {
      conversation_id: 'test-conv-123',
      content: 'Test message',
      role: 'user'
    };

    const { data, error } = await supabase
      .from('messages')
      .insert(testMessage)
      .select();

    if (error) {
      console.log('❌ Insert error:', error.message);
      console.log('Error details:', error);
      
      // If user_id is missing, let's try without it
      if (error.message.includes('user_id')) {
        console.log('\nTrying without user_id column...');
        
        const testMessageNoUserId = {
          conversation_id: 'test-conv-123',
          content: 'Test message without user_id',
          role: 'user'
        };

        const { data: data2, error: error2 } = await supabase
          .from('messages')
          .insert(testMessageNoUserId)
          .select();

        if (error2) {
          console.log('❌ Insert without user_id also failed:', error2.message);
        } else {
          console.log('✅ Insert without user_id succeeded');
          console.log('Data:', data2);
        }
      }
    } else {
      console.log('✅ Insert succeeded');
      console.log('Data:', data);
    }

    // Try to get existing messages to see the structure
    console.log('\nChecking existing messages...');
    const { data: existingMessages, error: selectError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);

    if (selectError) {
      console.log('❌ Select error:', selectError.message);
    } else {
      console.log('✅ Select succeeded');
      console.log('Sample message structure:', existingMessages);
    }

  } catch (error) {
    console.error('Error checking messages structure:', error);
  }
}

checkMessagesStructure();
