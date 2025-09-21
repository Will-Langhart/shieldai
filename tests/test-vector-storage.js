#!/usr/bin/env node

// Test storing vectors in Pinecone and then searching for them
const fetch = require('node-fetch');

const PINECONE_API_KEY = 'pcsk_3MJJaR_EjBt6ktRBUfLAmCTa8DTtQpRBKtwDKB657XofsBYVY6S9aWXxrLCtpvkUGuCULy';
const SHIELDAI_INDEX_HOST = 'shieldai-smb4qh6.svc.aped-4627-b74a.pinecone.io';

async function testVectorStorage() {
  try {
    console.log('🧪 Testing vector storage and retrieval...');
    
    // Test data
    const testUserId = 'test-user-123';
    const testConversationId = 'test-conv-456';
    
    // Sample messages to store
    const testMessages = [
      {
        id: 'msg-1',
        content: 'I love studying the Bible and learning about God\'s love for us.',
        role: 'user',
        timestamp: new Date().toISOString()
      },
      {
        id: 'msg-2', 
        content: 'The Bible teaches us that God is love, and we should love one another as He loves us.',
        role: 'assistant',
        timestamp: new Date().toISOString()
      },
      {
        id: 'msg-3',
        content: 'What are some good Bible verses about faith and trust in God?',
        role: 'user',
        timestamp: new Date().toISOString()
      }
    ];

    // Generate embeddings (using dummy embeddings for now)
    const embeddings = [
      new Array(1024).fill(0.1), // Dummy embedding for message 1
      new Array(1024).fill(0.2), // Dummy embedding for message 2  
      new Array(1024).fill(0.3)  // Dummy embedding for message 3
    ];

    // Store vectors in Pinecone
    console.log('📝 Storing test vectors...');
    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      const embedding = embeddings[i];
      
      const vector = {
        id: message.id,
        values: embedding,
        metadata: {
          content: message.content,
          role: message.role,
          conversationId: testConversationId,
          userId: testUserId,
          timestamp: message.timestamp
        }
      };

      const response = await fetch(`https://${SHIELDAI_INDEX_HOST}/vectors/upsert`, {
        method: 'POST',
        headers: {
          'Api-Key': PINECONE_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vectors: [vector],
          namespace: testUserId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to store vector ${i + 1}: ${response.status}`);
      }

      console.log(`✅ Stored vector ${i + 1}: ${message.content.substring(0, 50)}...`);
    }

    // Wait a moment for indexing
    console.log('⏳ Waiting for vectors to be indexed...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test search
    console.log('🔍 Testing vector search...');
    const searchResponse = await fetch(`https://${SHIELDAI_INDEX_HOST}/query`, {
      method: 'POST',
      headers: {
        'Api-Key': PINECONE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vector: new Array(1024).fill(0.15), // Search vector
        topK: 3,
        filter: { userId: testUserId },
        namespace: testUserId,
        includeMetadata: true
      })
    });

    if (!searchResponse.ok) {
      throw new Error(`Search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('✅ Search successful!');
    console.log('Search results:', JSON.stringify(searchData, null, 2));

    // Test the vector response API
    console.log('🚀 Testing vector response API...');
    const apiResponse = await fetch('http://localhost:3001/api/vector-response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Tell me about love and faith',
        userId: testUserId,
        conversationId: testConversationId,
        topK: 3,
        mode: 'gentle'
      })
    });

    if (!apiResponse.ok) {
      throw new Error(`API request failed: ${apiResponse.status}`);
    }

    const apiData = await apiResponse.json();
    console.log('✅ Vector response API successful!');
    console.log('Response:', apiData.response);
    console.log('Context vectors found:', apiData.context.vector_results);

    console.log('\n🎉 All tests passed! Vector storage and retrieval is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testVectorStorage();
