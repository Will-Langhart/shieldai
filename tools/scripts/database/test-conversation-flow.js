#!/usr/bin/env node

// Test script to verify conversation and message persistence
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_TOKEN = 'test-token';

async function testConversationFlow() {
  console.log('🧪 Testing conversation and message persistence...\n');

  try {
    // Test 1: Create a conversation
    console.log('1️⃣ Creating a new conversation...');
    const createResponse = await axios.post(`${API_BASE_URL}/api/conversations`, {
      title: 'Test Conversation'
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const conversation = createResponse.data;
    console.log('✅ Conversation created:', conversation.id);

    // Test 2: Add a user message
    console.log('\n2️⃣ Adding a user message...');
    const userMessageResponse = await axios.post(`${API_BASE_URL}/api/messages`, {
      conversationId: conversation.id,
      content: 'Hello, this is a test message!',
      role: 'user',
      mode: 'gentle'
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ User message added:', userMessageResponse.data.id);

    // Test 3: Add an assistant message
    console.log('\n3️⃣ Adding an assistant message...');
    const assistantMessageResponse = await axios.post(`${API_BASE_URL}/api/messages`, {
      conversationId: conversation.id,
      content: 'Hello! I received your test message. How can I help you today?',
      role: 'assistant',
      mode: 'gentle'
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Assistant message added:', assistantMessageResponse.data.id);

    // Test 4: Retrieve conversation messages
    console.log('\n4️⃣ Retrieving conversation messages...');
    const messagesResponse = await axios.get(`${API_BASE_URL}/api/conversations/${conversation.id}`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });

    const messages = messagesResponse.data.messages;
    console.log('✅ Retrieved messages:', messages.length);
    messages.forEach((msg, index) => {
      console.log(`   ${index + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
    });

    // Test 5: Get all conversations
    console.log('\n5️⃣ Retrieving all conversations...');
    const conversationsResponse = await axios.get(`${API_BASE_URL}/api/conversations`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });

    const conversations = conversationsResponse.data.conversations;
    console.log('✅ Retrieved conversations:', conversations.length);
    conversations.forEach((conv, index) => {
      console.log(`   ${index + 1}. ${conv.title} (${conv.id})`);
    });

    console.log('\n🎉 All tests passed! Conversation and message persistence is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testConversationFlow();
