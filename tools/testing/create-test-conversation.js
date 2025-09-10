#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

if (supabaseUrl === 'your-supabase-url' || supabaseKey === 'your-service-role-key') {
  console.log('❌ Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  console.log('   Or update this script with your actual Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestConversation() {
  console.log('🧪 Creating test conversation in database...');
  
  const testConversationId = '550e8400-e29b-41d4-a716-446655440000';
  const testUserId = '550e8400-e29b-41d4-a716-446655440001';
  
  try {
    // Check if conversation already exists
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', testConversationId)
      .single();
    
    if (existingConversation) {
      console.log('✅ Test conversation already exists:', existingConversation);
      return;
    }
    
    // Create the test conversation
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        id: testConversationId,
        title: 'Test Conversation',
        user_id: testUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating conversation:', error);
    } else {
      console.log('✅ Test conversation created successfully:', data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestConversation();
