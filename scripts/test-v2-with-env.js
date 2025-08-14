const fs = require('fs');

async function testV2WithEnv() {
  console.log('🧪 Testing Pinecone v2 with Environment Parameter\n');

  try {
    // Read .env.local directly
    const envLocalPath = '.env.local';
    if (!fs.existsSync(envLocalPath)) {
      throw new Error('.env.local file not found');
    }

    const envContent = fs.readFileSync(envLocalPath, 'utf8');
    
    // Parse the API key directly
    const apiKeyMatch = envContent.match(/PINECONE_API_KEY=(.+)/);
    if (!apiKeyMatch) {
      throw new Error('PINECONE_API_KEY not found in .env.local');
    }
    
    const apiKey = apiKeyMatch[1].trim();
    const indexName = 'shieldai';

    console.log('Direct environment values:');
    console.log(`  PINECONE_API_KEY: ${apiKey.substring(0, 10)}...`);
    console.log(`  PINECONE_INDEX_NAME: ${indexName}\n`);

    // Try different environment configurations
    const configs = [
      { environment: 'us-east-1', description: 'us-east-1 (serverless)' },
      { environment: 'us-east-1-aws', description: 'us-east-1-aws (legacy)' },
      { environment: 'aped-4627-b74a', description: 'aped-4627-b74a (from host URL)' }
    ];

    for (const config of configs) {
      console.log(`\n🔍 Testing with ${config.description}...`);
      console.log(`  Environment: ${config.environment}`);
      
      try {
        // Import and initialize Pinecone v2
        const { Pinecone } = require('@pinecone-database/pinecone');
        const pc = new Pinecone({ apiKey, environment: config.environment });
        
        console.log('  Listing indexes...');
        const indexes = await pc.listIndexes();
        
        console.log(`  ✅ Found ${indexes.length} indexes`);
        
        if (indexes.length > 0) {
          console.log('\n📋 Available indexes:');
          indexes.forEach(index => {
            console.log(`  - ${index.name} (${index.dimension}d, ${index.metric})`);
            if (index.host) {
              console.log(`    Host: ${index.host}`);
            }
          });
          
          // Check if shieldai index exists
          const shieldaiIndex = indexes.find(idx => idx.name === indexName);
          if (shieldaiIndex) {
            console.log(`\n🎯 Found shieldai index!`);
            console.log(`  Host: ${shieldaiIndex.host}`);
            console.log(`  Dimension: ${shieldaiIndex.dimension}`);
            console.log(`  Metric: ${shieldaiIndex.metric}`);
            
            // Test access
            const index = pc.index(indexName);
            const stats = await index.describeIndexStats();
            console.log(`  ✅ Successfully connected to shieldai index`);
            console.log(`  📊 Index stats:`, stats);
            
            // Test storing a simple vector
            console.log(`\n🧪 Testing vector storage...`);
            const testVector = new Array(1024).fill(0.1);
            const upsertResponse = await index.upsert([{
              id: 'test-' + Date.now(),
              values: testVector,
              metadata: { test: true, timestamp: new Date().toISOString() }
            }]);
            console.log(`  ✅ Vector stored successfully:`, upsertResponse);
            
            return; // Success, exit early
          }
        }
        
      } catch (error) {
        console.log(`  ❌ Failed: ${error.message}`);
      }
    }
    
    console.log('\n❌ All environment configurations failed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response details:', error.response.data);
    }
  }
}

testV2WithEnv();
