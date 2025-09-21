const fs = require('fs');
const { Pinecone } = require('@pinecone-database/pinecone');

async function testDirectConnection() {
  console.log('🧪 Testing Direct Pinecone Connection\n');

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
    const environment = 'us-east-1'; // Use correct environment for serverless
    const indexName = 'shieldai';

    console.log('Direct environment values:');
    console.log(`  PINECONE_API_KEY: ${apiKey.substring(0, 10)}...`);
    console.log(`  PINECONE_ENVIRONMENT: ${environment}`);
    console.log(`  PINECONE_INDEX_NAME: ${indexName}\n`);

    console.log(`🔍 Testing with ${environment}...`);
    
    // Initialize Pinecone directly
    const pc = new Pinecone({ apiKey, environment });
    
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
      
      // Try to access the shieldai index specifically
      if (indexes.find(idx => idx.name === indexName)) {
        console.log(`\n🎯 Testing access to ${indexName} index...`);
        const index = pc.index(indexName);
        const stats = await index.describeIndexStats();
        console.log(`  ✅ Successfully connected to ${indexName}`);
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
        
      } else {
        console.log(`\n❌ Index '${indexName}' not found in this project`);
      }
    } else {
      console.log('  ℹ️  No indexes found in this project');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response details:', error.response.data);
    }
  }
}

testDirectConnection();
