require('dotenv').config({ path: '.env.local', override: true });

async function testUpdatedService() {
  console.log('🧪 Testing Updated Pinecone Service\n');

  try {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY not set');
    }

    console.log('🔍 Testing connection...');
    
    // First, get the index host
    const response = await fetch('https://api.pinecone.io/indexes', {
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get indexes: ${response.status}`);
    }

    const data = await response.json();
    const shieldaiIndex = data.indexes.find((idx) => idx.name === 'shieldai');
    
    if (!shieldaiIndex) {
      throw new Error('shieldai index not found');
    }

    const indexHost = shieldaiIndex.host;
    console.log(`✅ Connected to Pinecone index: ${indexHost}`);
    
    // Test getting index stats
    console.log('\n📊 Getting index stats...');
    const statsResponse = await fetch(`https://${indexHost}/describe_index_stats`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!statsResponse.ok) {
      throw new Error(`Failed to get stats: ${statsResponse.status}`);
    }

    const stats = await statsResponse.json();
    console.log('✅ Index stats:', stats);
    
    // Test storing a message
    console.log('\n🧪 Testing message storage...');
    const testEmbedding = new Array(1024).fill(0.1);
    
    const upsertResponse = await fetch(`https://${indexHost}/vectors/upsert`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vectors: [{
          id: 'test-service-' + Date.now(),
          values: testEmbedding,
          metadata: {
            content: 'This is a test message from the updated service',
            role: 'user',
            conversationId: 'test-conversation',
            userId: 'test-user',
            timestamp: new Date().toISOString(),
            test: true,
            service: 'updated'
          },
        }]
      })
    });

    if (!upsertResponse.ok) {
      throw new Error(`Failed to store message: ${upsertResponse.status}`);
    }

    const upsertData = await upsertResponse.json();
    console.log('✅ Message storage successful:', upsertData);
    
    // Test search
    console.log('\n🔍 Testing search...');
    const searchResponse = await fetch(`https://${indexHost}/query`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vector: testEmbedding,
        topK: 3,
        filter: {
          userId: 'test-user',
          conversationId: 'test-conversation'
        },
        includeMetadata: true,
      })
    });

    if (!searchResponse.ok) {
      throw new Error(`Failed to search: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('✅ Search successful:', searchData);
    
    // Get updated stats
    console.log('\n📊 Getting updated index stats...');
    const updatedStatsResponse = await fetch(`https://${indexHost}/describe_index_stats`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!updatedStatsResponse.ok) {
      throw new Error(`Failed to get updated stats: ${updatedStatsResponse.status}`);
    }

    const updatedStats = await updatedStatsResponse.json();
    console.log('✅ Updated index stats:', updatedStats);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testUpdatedService();
