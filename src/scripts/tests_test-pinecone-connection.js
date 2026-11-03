#!/usr/bin/env node

// Test Pinecone connection directly
const fetch = require('node-fetch');

async function testPineconeConnection() {
  const apiKey = process.env.PINECONE_API_KEY;
  
  try {
    console.log('Testing Pinecone connection...');
    
    // Test 1: List indexes
    const indexesResponse = await fetch('https://api.pinecone.io/indexes', {
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!indexesResponse.ok) {
      throw new Error(`HTTP ${indexesResponse.status}: ${indexesResponse.statusText}`);
    }

    const indexesData = await indexesResponse.json();
    const shieldaiIndex = indexesData.indexes?.find((idx) => idx.name === 'shieldai');
    
    if (!shieldaiIndex) {
      throw new Error('shieldai index not found');
    }

    console.log('✅ Pinecone connection successful!');
    console.log('ShieldAI Index:', {
      name: shieldaiIndex.name,
      status: shieldaiIndex.status,
      host: shieldaiIndex.host,
      dimension: shieldaiIndex.dimension,
      metric: shieldaiIndex.metric
    });

    // Test 2: Get index stats
    const statsResponse = await fetch(`https://${shieldaiIndex.host}/describe_index_stats`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!statsResponse.ok) {
      throw new Error(`Stats request failed: ${statsResponse.status}`);
    }

    const stats = await statsResponse.json();
    console.log('✅ Index stats retrieved successfully!');
    console.log('Stats:', JSON.stringify(stats, null, 2));

    return true;
  } catch (error) {
    console.error('❌ Pinecone connection failed:', error.message);
    return false;
  }
}

testPineconeConnection();
