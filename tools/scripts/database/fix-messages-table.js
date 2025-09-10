const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMessagesTable() {
  try {
    console.log('Fixing messages table structure...\n');

    // First, let's try to add the user_id column if it doesn't exist
    console.log('Adding user_id column to messages table...');
    
    // We'll use a direct SQL query to add the column
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add user_id column if it doesn't exist
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'messages' AND column_name = 'user_id'
          ) THEN
            ALTER TABLE messages ADD COLUMN user_id UUID;
          END IF;
        END $$;
      `
    });

    if (error) {
      console.log('❌ Error adding user_id column:', error.message);
      
      // Alternative approach - try to recreate the table
      console.log('\nTrying alternative approach - recreating messages table...');
      
      const { data: dropData, error: dropError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Drop and recreate messages table with correct structure
          DROP TABLE IF EXISTS messages CASCADE;
          
          CREATE TABLE messages (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
            user_id UUID NOT NULL,
            content TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Create indexes
          CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
          CREATE INDEX idx_messages_user_id ON messages(user_id);
          CREATE INDEX idx_messages_created_at ON messages(created_at);
          
          -- Enable RLS
          ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
          
          -- Create RLS policies
          CREATE POLICY "Users can view their own messages" ON messages
            FOR SELECT USING (auth.uid() = user_id);
          
          CREATE POLICY "Users can create their own messages" ON messages
            FOR INSERT WITH CHECK (auth.uid() = user_id);
          
          CREATE POLICY "Users can update their own messages" ON messages
            FOR UPDATE USING (auth.uid() = user_id);
          
          CREATE POLICY "Users can delete their own messages" ON messages
            FOR DELETE USING (auth.uid() = user_id);
          
          -- Grant permissions
          GRANT ALL ON messages TO authenticated;
        `
      });

      if (dropError) {
        console.log('❌ Error recreating messages table:', dropError.message);
      } else {
        console.log('✅ Messages table recreated successfully');
      }
    } else {
      console.log('✅ user_id column added successfully');
    }

    // Test the table structure
    console.log('\nTesting table structure...');
    const { data: testData, error: testError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);

    if (testError) {
      console.log('❌ Test query failed:', testError.message);
    } else {
      console.log('✅ Messages table is working correctly');
    }

  } catch (error) {
    console.error('Error fixing messages table:', error);
  }
}

fixMessagesTable();
