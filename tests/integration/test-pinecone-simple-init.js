const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config({ path: 'config/env/.env.local' });

async function testPineconeSimpleInit() {
  console.log('🧪 Pinecone Test with Simple Initialization\n');
  
  try {
    const apiKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX_NAME || 'shieldai';
    
    if (!apiKey) {
      console.error('❌ PINECONE_API_KEY not set in config/env/.env.local');
      return;
    }
    
    console.log('Using configuration:');
    console.log(`  API Key: ${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`);
    console.log(`  Index: ${indexName}\n`);
    
    // Try the simple initialization without environment
    console.log('🔍 Testing simple initialization (no environment parameter)...');
    try {
      const pc = new Pinecone({ apiKey });
      const index = pc.index(indexName);
      
      console.log('✅ Simple initialization successful!');
      console.log('Getting index stats...');
      
      const stats = await index.describeIndexStats();
      console.log(`✅ Index accessible!`);
      console.log(`   Total vectors: ${stats.totalVectorCount}`);
      console.log(`   Index dimension: ${stats.dimension}`);
      console.log(`   Index metric: ${stats.metric}`);
      
      // Test vector storage
      if (stats.totalVectorCount === 0) {
        console.log('\n📝 Testing vector storage...');
        const testId = `simple_init_test_${Date.now()}`;
        const testVector = new Array(1024).fill(0.1);
        
        const upsertResult = await index.upsert([{
          id: testId,
          values: testVector,
          metadata: {
            content: 'Simple init test message for Shield AI',
            role: 'user',
            conversationId: 'simple_init_test_conversation',
            userId: 'simple_init_test_user',
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
      
      console.log('\n🎉 SUCCESS! Use simple initialization without environment parameter');
      console.log('Update your Pinecone service to use:');
      console.log('const pc = new Pinecone({ apiKey });');
      console.log('const index = pc.index(indexName);');
      
    } catch (simpleError) {
      console.log('❌ Simple initialization failed:', simpleError.message);
      
      // Fallback to environment-based initialization
      console.log('\n🔄 Trying with environment parameter...');
      const environment = process.env.PINECONE_ENVIRONMENT || 'us-east-1-aws';
      
      const pc = new Pinecone({ apiKey, environment });
      const index = pc.index(indexName);
      
      console.log('✅ Environment-based initialization successful!');
      console.log('Getting index stats...');
      
      const stats = await index.describeIndexStats();
      console.log(`✅ Index accessible!`);
      console.log(`   Total vectors: ${stats.totalVectorCount}`);
      
      console.log('\n🔧 Use environment-based initialization:');
      console.log(`const pc = new Pinecone({ apiKey, environment: '${environment}' });`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPineconeSimpleInit();
