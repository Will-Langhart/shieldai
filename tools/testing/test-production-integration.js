require('dotenv').config({ path: '.env.local', override: true });

async function testProductionIntegration() {
  console.log('🧪 Testing Production Pinecone Integration\n');

  const productionUrl = 'https://shieldai-fpl1lu8me-wwjd.vercel.app';
  
  try {
    console.log(`🔍 Testing production deployment: ${productionUrl}`);
    
    // Test 1: Health check
    console.log('\n1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${productionUrl}/api/health`);
    if (healthResponse.ok) {
      console.log('✅ Health endpoint working');
    } else {
      console.log('❌ Health endpoint failed:', healthResponse.status);
    }
    
    // Test 2: Pinecone environment
    console.log('\n2️⃣ Testing Pinecone environment...');
    const envResponse = await fetch(`${productionUrl}/api/pinecone/env`);
    if (envResponse.ok) {
      const envData = await envResponse.json();
      console.log('✅ Pinecone environment:', envData);
    } else {
      console.log('❌ Pinecone environment failed:', envResponse.status);
    }
    
    // Test 3: Pinecone indexes
    console.log('\n3️⃣ Testing Pinecone indexes...');
    const indexesResponse = await fetch(`${productionUrl}/api/pinecone/indexes`);
    if (indexesResponse.ok) {
      const indexesData = await indexesResponse.json();
      console.log('✅ Pinecone indexes:', indexesData);
    } else {
      console.log('❌ Pinecone indexes failed:', indexesResponse.status);
    }
    
    // Test 4: Pinecone stats
    console.log('\n4️⃣ Testing Pinecone stats...');
    const statsResponse = await fetch(`${productionUrl}/api/pinecone/stats`);
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Pinecone stats:', statsData);
    } else {
      console.log('❌ Pinecone stats failed:', statsResponse.status);
    }
    
    // Test 5: Memory search
    console.log('\n5️⃣ Testing memory search...');
    const searchResponse = await fetch(`${productionUrl}/api/memory/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'test message',
        userId: 'test-user',
        topK: 5
      })
    });
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log('✅ Memory search working:', searchData);
    } else {
      console.log('❌ Memory search failed:', searchResponse.status);
    }
    
    console.log('\n🎯 Production Integration Test Complete!');
    
  } catch (error) {
    console.error('❌ Error testing production:', error.message);
  }
}

testProductionIntegration();
