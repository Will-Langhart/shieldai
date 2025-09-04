const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    console.log('Checking database schema...\n');

    // Check if conversations table exists
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);

    if (convError) {
      console.log('❌ Conversations table error:', convError.message);
    } else {
      console.log('✅ Conversations table exists');
    }

    // Check if messages table exists
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);

    if (msgError) {
      console.log('❌ Messages table error:', msgError.message);
    } else {
      console.log('✅ Messages table exists');
    }

    // Try to get table structure
    console.log('\nTrying to get table structure...');
    
    // Check conversations table structure
    try {
      const { data: convStructure } = await supabase.rpc('get_table_columns', { table_name: 'conversations' });
      console.log('Conversations table structure:', convStructure);
    } catch (e) {
      console.log('Could not get conversations structure:', e.message);
    }

    // Check messages table structure  
    try {
      const { data: msgStructure } = await supabase.rpc('get_table_columns', { table_name: 'messages' });
      console.log('Messages table structure:', msgStructure);
    } catch (e) {
      console.log('Could not get messages structure:', e.message);
    }

  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkSchema();
