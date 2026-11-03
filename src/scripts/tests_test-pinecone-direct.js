#!/usr/bin/env node

// Test Pinecone connection directly with the API key
const fetch = require('node-fetch');

async function testPineconeDirect() {
  const apiKey = process.env.PINECONE_API_KEY;
  
  try {
    console.log('🔍 Testing Pinecone connection directly...');
    console.log('API Key:', apiKey.substring(0, 20) + '...');
    
    // Test 1: List indexes
    console.log('\n1. Testing list indexes...');
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

    console.log('✅ List indexes successful!');
    console.log('ShieldAI Index:', {
      name: shieldaiIndex.name,
      status: shieldaiIndex.status,
      host: shieldaiIndex.host,
      dimension: shieldaiIndex.dimension,
      metric: shieldaiIndex.metric
    });

    // Test 2: Get index stats
    console.log('\n2. Testing index stats...');
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
    console.log('✅ Index stats successful!');
    console.log('Stats:', JSON.stringify(stats, null, 2));

    // Test 3: Test a simple query
    console.log('\n3. Testing simple query...');
    const queryResponse = await fetch(`https://${shieldaiIndex.host}/query`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vector: new Array(1024).fill(0.1), // Dummy vector
        topK: 1,
        includeMetadata: true
      })
    });

    if (!queryResponse.ok) {
      throw new Error(`Query request failed: ${queryResponse.status}`);
    }

    const queryData = await queryResponse.json();
    console.log('✅ Query successful!');
    console.log('Query results:', JSON.stringify(queryData, null, 2));

    console.log('\n🎉 All Pinecone tests passed! The API key is working correctly.');
    return true;
  } catch (error) {
    console.error('❌ Pinecone test failed:', error.message);
    return false;
  }
}

testPineconeDirect();
