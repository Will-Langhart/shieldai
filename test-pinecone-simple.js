#!/usr/bin/env node

// Simple test to verify Pinecone API key
const fetch = require('node-fetch');

async function testPineconeSimple() {
  const apiKey = 'pcsk_3MJJaR_EjBt6ktRBUfLAmCTa8DTtQpRBKtwDKB657XofsBYVY6S9aWXxrLCtpvkUGuCULy';
  
  try {
    console.log('🔍 Testing Pinecone API key...');
    console.log('API Key:', apiKey.substring(0, 20) + '...');
    
    const response = await fetch('https://api.pinecone.io/indexes', {
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

testPineconeSimple();
