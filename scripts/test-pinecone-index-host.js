const { Pinecone } = require('@pinecone-database/pinecone');

async function testPineconeIndexHost() {
  console.log('🧪 Pinecone Test with Index Host Environment Format\n');
  
  try {
    const apiKey = 'pcsk_6La4fD_KxUwby6c62E93h7pPAdgjhSG5szTKgqh9Pych3nSwCPVx1Ze5mFEzuFixbqszw1';
    
    // Based on your index host URL: https://shieldai-smb4qh6.svc.aped-4627-b74a.pinecone.io
    // The environment might be: aped-4627-b74a
    const possibleEnvironments = [
      'aped-4627-b74a',           // From host URL
      'us-east-1-aws',            // Standard format
      'us-east-1',                // Short format
      'aped-4627',                // Project ID format
      '4627-b74a'                 // Alternative format
    ];
    
    const indexName = 'shieldai';
    
    console.log('Testing with different environment formats...\n');
    
    for (const environment of possibleEnvironments) {
      console.log(`🔍 Testing environment: ${environment}`);
      
      try {
        const pc = new Pinecone({ apiKey, environment });
        
        // Try to list indexes
        console.log('  Listing indexes...');
        const indexes = await pc.listIndexes();
        console.log(`  ✅ Found ${indexes.length} indexes`);
        
        if (indexes.length > 0) {
          indexes.forEach(idx => {
            console.log(`    - ${idx.name} (${idx.dimension}d, ${idx.metric})`);
          });
          
          // Check if our target index exists
          const targetIndex = indexes.find(idx => idx.name === indexName);
          if (targetIndex) {
            console.log(`\n🎯 Found target index: ${targetIndex.name}`);
            console.log(`   Dimensions: ${targetIndex.dimension}`);
            console.log(`   Metric: ${targetIndex.metric}`);
            console.log(`   Status: ${targetIndex.status}`);
            
            // Test direct access
            console.log('\n📝 Testing direct index access...');
            const index = pc.index(indexName);
            const stats = await index.describeIndexStats();
            console.log(`✅ Index accessible!`);
            console.log(`   Total vectors: ${stats.totalVectorCount}`);
            
            // Test vector storage
            if (stats.totalVectorCount === 0) {
              console.log('\n📝 Testing vector storage...');
              const testId = `index_host_test_${Date.now()}`;
              const testVector = new Array(1024).fill(0.1);
              
              const upsertResult = await index.upsert([{
                id: testId,
                values: testVector,
                metadata: {
                  content: 'Index host test message for Shield AI',
                  role: 'user',
                  conversationId: 'index_host_test_conversation',
                  userId: 'index_host_test_user',
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
            
            console.log(`\n🎉 SUCCESS! Use this environment: ${environment}`);
            console.log(`Update your .env.local with:`);
            console.log(`PINECONE_ENVIRONMENT=${environment}`);
            return;
          }
        }
        
      } catch (error) {
        console.log(`  ❌ Failed: ${error.message}`);
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log('❌ None of the environment formats worked.');
    console.log('\n🔧 Next steps:');
    console.log('1. Check your Pinecone console for the correct environment');
    console.log('2. Verify the API key has access to list indexes');
    console.log('3. Check if the index is in a different project');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPineconeIndexHost();
