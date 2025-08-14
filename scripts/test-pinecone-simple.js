const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config({ path: '.env.local' });

async function testPineconeSimple() {
  console.log('🧪 Simple Pinecone Connection Test\n');
  
  try {
    const apiKey = process.env.PINECONE_API_KEY;
    const environment = process.env.PINECONE_ENVIRONMENT;
    const indexName = process.env.PINECONE_INDEX_NAME;
    
    console.log('Environment variables:');
    console.log(`  API Key: ${apiKey ? `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}` : 'NOT SET'}`);
    console.log(`  Environment: ${environment || 'NOT SET'}`);
    console.log(`  Index: ${indexName || 'NOT SET'}\n`);
    
    if (!apiKey || !environment || !indexName) {
      console.error('❌ Missing environment variables');
      return;
    }
    
    console.log('Connecting to Pinecone...');
    const pc = new Pinecone({ apiKey, environment });
    
    console.log('Listing indexes...');
    const indexes = await pc.listIndexes();
    console.log(`Found ${indexes.length} indexes:`);
    indexes.forEach(idx => {
      console.log(`  - ${idx.name} (${idx.dimension}d, ${idx.metric})`);
    });
    
    if (indexes.length === 0) {
      console.log('\n❌ No indexes found. You may need to create the "shieldai" index.');
      return;
    }
    
    const targetIndex = indexes.find(idx => idx.name === indexName);
    if (!targetIndex) {
      console.log(`\n❌ Index "${indexName}" not found. Available indexes:`);
      indexes.forEach(idx => console.log(`  - ${idx.name}`));
      return;
    }
    
    console.log(`\n✅ Found target index: ${targetIndex.name}`);
    console.log(`   Dimensions: ${targetIndex.dimension}`);
    console.log(`   Metric: ${targetIndex.metric}`);
    console.log(`   Status: ${targetIndex.status}`);
    
    // Try to access the index
    console.log('\nTesting index access...');
    const index = pc.index(indexName);
    const stats = await index.describeIndexStats();
    console.log(`✅ Index accessible!`);
    console.log(`   Total vectors: ${stats.totalVectorCount}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('Request failed to reach Pinecone')) {
      console.log('\n🔧 This usually means:');
      console.log('1. Incorrect environment/region configuration');
      console.log('2. Network connectivity issues');
      console.log('3. Pinecone service outage');
      console.log('4. API key permissions issue');
    }
  }
}

testPineconeSimple();
