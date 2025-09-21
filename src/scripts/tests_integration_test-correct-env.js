require('dotenv').config({ path: '.env.local' });
const { Pinecone } = require('@pinecone-database/pinecone');

async function testCorrectEnvironment() {
  console.log('🧪 Testing Pinecone with Correct Environment (us-east-1)\n');

  try {
    // Use the correct environment for serverless Pinecone
    const environment = 'us-east-1';
    const apiKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX_NAME || 'shieldai';

    console.log('Environment variables:');
    console.log(`  PINECONE_API_KEY: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET'}`);
    console.log(`  PINECONE_ENVIRONMENT: ${environment} (forced)`);
    console.log(`  PINECONE_INDEX_NAME: ${indexName}\n`);

    if (!apiKey) {
      throw new Error('PINECONE_API_KEY not set');
    }

    console.log(`🔍 Testing with ${environment}...`);
    
    // Initialize Pinecone with correct environment
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

testCorrectEnvironment();
