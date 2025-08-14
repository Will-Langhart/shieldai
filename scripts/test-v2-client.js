const fs = require('fs');

async function testV2Client() {
  console.log('🧪 Testing Pinecone v2 Client\n');

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

    // Try to use the v2 client from the langchain package
    try {
      console.log('🔍 Trying to import Pinecone v2 from @langchain/pinecone...');
      const { Pinecone } = require('@langchain/pinecone');
      
      console.log('✅ Successfully imported Pinecone v2 client');
      console.log('🔍 Testing connection...');
      
      // Initialize Pinecone v2 (no environment parameter needed)
      const pc = new Pinecone({ apiKey });
      
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
          
        } else {
          console.log(`\n❌ Index '${indexName}' not found in this project`);
        }
      } else {
        console.log('  ℹ️  No indexes found in this project');
      }
      
    } catch (importError) {
      console.log(`❌ Failed to import Pinecone v2: ${importError.message}`);
      throw importError;
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response details:', error.response.data);
    }
  }
}

testV2Client();
