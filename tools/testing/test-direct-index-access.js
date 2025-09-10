const { Pinecone } = require('@pinecone-database/pinecone');

async function testDirectIndexAccess() {
  console.log('🧪 Direct Index Access Test with Working Environment\n');
  
  try {
    const apiKey = 'pcsk_6La4fD_KxUwby6c62E93h7pPAdgjhSG5szTKgqh9Pych3nSwCPVx1Ze5mFEzuFixbqszw1';
    const environment = 'us-east-1-aws'; // This environment worked
    const indexName = 'shieldai';
    
    console.log('Using credentials:');
    console.log(`  API Key: ${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`);
    console.log(`  Environment: ${environment}`);
    console.log(`  Index: ${indexName}\n`);
    
    console.log('Connecting to Pinecone...');
    const pc = new Pinecone({ apiKey, environment });
    
    // Try to access the index directly without listing
    console.log('Attempting direct index access...');
    const index = pc.index(indexName);
    
    console.log('Getting index stats...');
    const stats = await index.describeIndexStats();
    console.log(`✅ Index accessible!`);
    console.log(`   Total vectors: ${stats.totalVectorCount}`);
    console.log(`   Index dimension: ${stats.dimension}`);
    console.log(`   Index metric: ${stats.metric}`);
    
    // Test vector storage
    if (stats.totalVectorCount === 0) {
      console.log('\n📝 Testing vector storage...');
      const testId = `direct_access_test_${Date.now()}`;
      const testVector = new Array(1024).fill(0.1);
      
      console.log('Upserting test vector...');
      const upsertResult = await index.upsert([{
        id: testId,
        values: testVector,
        metadata: {
          content: 'Direct access test message for Shield AI',
          role: 'user',
          conversationId: 'direct_access_test_conversation',
          userId: 'direct_access_test_user',
          timestamp: new Date().toISOString(),
          test: true
        }
      }]);
      
      console.log('✅ Test vector stored successfully');
      console.log(`   Upserted: ${upsertResult.upsertedCount} vectors`);
      
      // Verify storage
      console.log('Verifying storage with query...');
      const queryResponse = await index.query({
        vector: testVector,
        topK: 1,
        filter: { test: true },
        includeMetadata: true
      });
      
      if (queryResponse.matches && queryResponse.matches.length > 0) {
        console.log('✅ Vector retrieval working correctly');
        console.log(`   Found ${queryResponse.matches.length} matches`);
        console.log(`   First match ID: ${queryResponse.matches[0].id}`);
        console.log(`   First match score: ${queryResponse.matches[0].score}`);
        console.log(`   First match content: ${queryResponse.matches[0].metadata?.content}`);
      }
      
      // Clean up
      console.log('Cleaning up test data...');
      await index.deleteMany({ filter: { test: true } });
      console.log('✅ Test data cleaned up');
      
      // Check final stats
      const finalStats = await index.describeIndexStats();
      console.log(`Final index stats: ${finalStats.totalVectorCount} vectors`);
    }
    
    console.log('\n🎉 Direct index access test completed successfully!');
    console.log('\n🔧 Configuration Found:');
    console.log(`Use this in your .env.local:`);
    console.log(`PINECONE_ENVIRONMENT=${environment}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('Index not found')) {
      console.log('\n🔧 The index "shieldai" does not exist or is not accessible');
      console.log('You may need to:');
      console.log('1. Create the index in your Pinecone console');
      console.log('2. Check if the index name is correct');
      console.log('3. Verify the API key has access to this index');
    } else if (error.message.includes('Unauthorized')) {
      console.log('\n🔧 API key does not have access to this index');
      console.log('Check if:');
      console.log('1. The API key is correct');
      console.log('2. The API key has the right permissions');
      console.log('3. The index belongs to the same project as the API key');
    } else if (error.message.includes('Request failed to reach Pinecone')) {
      console.log('\n🔧 Network or configuration issue');
      console.log('The environment format might be wrong or there might be a network issue');
    }
  }
}

testDirectIndexAccess();
