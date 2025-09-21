#!/usr/bin/env node

const axios = require('axios');

async function testConversationCreation() {
  console.log('🧪 Testing conversation creation with test token...');
  
  try {
    // Call conversations API with test token
    const response = await axios.get('http://localhost:3000/api/conversations', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('✅ Conversations API response:', response.data);
    
    // Check if conversation exists
    const conversations = response.data.conversations || [];
    console.log(`📊 Found ${conversations.length} conversations`);
    
    if (conversations.length > 0) {
      const conversation = conversations[0];
      console.log('📝 First conversation:', conversation);
      
      // Try to create a message in this conversation
      console.log('🧪 Testing message creation...');
      
      const messageResponse = await axios.post('http://localhost:3000/api/messages', {
        conversationId: conversation.id,
        content: 'Test message',
        role: 'user'
      }, {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Message creation response:', messageResponse.data);
      
    } else {
      console.log('❌ No conversations found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testConversationCreation();
