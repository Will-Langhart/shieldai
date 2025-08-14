const { Pinecone } = require('@pinecone-database/pinecone');

async function testPineconeDirect() {
  console.log('🧪 Direct Pinecone Connection Test\n');
  
  try {
    // Use the credentials directly from your .env.local file
    const apiKey = 'pcsk_6La4fD_KxUwby6c62E93h7pPAdgjhSG5szTKgqh9Pych3nSwCPVx1Ze5mFEzuFixbqszw1';
    const environment = 'us-east-1';
    const indexName = 'shieldai';
    
    console.log('Using credentials:');
    console.log(`  API Key: ${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`);
    console.log(`  Environment: ${environment}`);
    console.log(`  Index: ${indexName}\n`);
    
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
    
    // Test vector storage
    if (stats.totalVectorCount === 0) {
      console.log('\n📝 Testing vector storage...');
      const testId = `direct_test_${Date.now()}`;
      const testVector = new Array(1024).fill(0.1);
      
      const upsertResult = await index.upsert([{
        id: testId,
        values: testVector,
        metadata: {
          content: 'Direct test message for Shield AI',
          role: 'user',
          conversationId: 'direct_test_conversation',
          userId: 'direct_test_user',
          timestamp: new Date().toISOString(),
          test: true
        }
      }]);
      
      console.log('✅ Test vector stored successfully');
      console.log(`   Upserted: ${upsertResult.upsertedCount} vectors`);
      
      // Verify storage
      const queryResponse = await index.query({
        vector: testVector,
        topK: 1,
        filter: { test: true },
        includeMetadata: true
      });
      
      if (queryResponse.matches && queryResponse.matches.length > 0) {
        console.log('✅ Vector retrieval working correctly');
        console.log(`   Found ${queryResponse.matches.length} matches`);
      }
      
      // Clean up
      await index.deleteMany({ filter: { test: true } });
      console.log('✅ Test data cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('Request failed to reach Pinecone')) {
      console.log('\n🔧 This usually means:');
      console.log('1. Incorrect environment/region configuration');
      console.log('2. Network connectivity issues');
      console.log('3. Pinecone service outage');
      console.log('4. API key permissions issue');
      
      console.log('\n💡 Try these solutions:');
      console.log('1. Check if your Pinecone account is active');
      console.log('2. Verify the environment region matches your index');
      console.log('3. Check Pinecone status: https://status.pinecone.io/');
      console.log('4. Try a different network connection');
    }
  }
}

testPineconeDirect();
