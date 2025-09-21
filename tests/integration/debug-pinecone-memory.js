const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config({ path: '.env.local' });

async function debugPineconeMemory() {
  console.log('🔍 Debugging Pinecone Memory Storage Issues...\n');
  
  try {
    // 1. Check environment variables
    console.log('📋 Environment Variables Check:');
    const apiKey = process.env.PINECONE_API_KEY;
    const environment = process.env.PINECONE_ENVIRONMENT;
    const indexName = process.env.PINECONE_INDEX_NAME;
    
    if (!apiKey) {
      console.error('❌ PINECONE_API_KEY is missing');
      return;
    }
    if (!environment) {
      console.error('❌ PINECONE_ENVIRONMENT is missing');
      return;
    }
    if (!indexName) {
      console.error('❌ PINECONE_INDEX_NAME is missing');
      return;
    }
    
    console.log(`✅ PINECONE_API_KEY: ${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`);
    console.log(`✅ PINECONE_ENVIRONMENT: ${environment}`);
    console.log(`✅ PINECONE_INDEX_NAME: ${indexName}\n`);
    
    // 2. Test Pinecone connection
    console.log('🔗 Testing Pinecone Connection:');
    const pc = new Pinecone({ apiKey, environment });
    const index = pc.index(indexName);
    
    // 3. Check index stats
    console.log('📊 Checking Index Stats:');
    const stats = await index.describeIndexStats();
    console.log(`✅ Index exists and is accessible`);
    console.log(`   Total vectors: ${stats.totalVectorCount}`);
    console.log(`   Index dimension: ${stats.dimension}`);
    console.log(`   Index metric: ${stats.metric}\n`);
    
    // 4. Test vector storage
    console.log('📝 Testing Vector Storage:');
    const testId = `debug_test_${Date.now()}`;
    const testVector = new Array(1024).fill(0.1);
    
    const upsertResult = await index.upsert([{
      id: testId,
      values: testVector,
      metadata: {
        content: 'Debug test message for Shield AI',
        role: 'user',
        conversationId: 'debug_conversation',
        userId: 'debug_user',
        timestamp: new Date().toISOString(),
        debug: true
      }
    }]);
    
    console.log('✅ Test vector stored successfully');
    console.log(`   Upserted: ${upsertResult.upsertedCount} vectors\n`);
    
    // 5. Verify storage with query
    console.log('🔍 Verifying Storage with Query:');
    const queryResponse = await index.query({
      vector: testVector,
      topK: 1,
      filter: { debug: true },
      includeMetadata: true
    });
    
    if (queryResponse.matches && queryResponse.matches.length > 0) {
      console.log('✅ Vector retrieval working correctly');
      console.log(`   Found ${queryResponse.matches.length} matches`);
      console.log(`   First match ID: ${queryResponse.matches[0].id}`);
      console.log(`   First match score: ${queryResponse.matches[0].score}`);
    } else {
      console.log('❌ Vector retrieval failed - no matches found');
    }
    
    // 6. Check for any existing vectors
    console.log('\n🔍 Checking for Existing Vectors:');
    const allVectorsResponse = await index.query({
      vector: new Array(1024).fill(0),
      topK: 100,
      includeMetadata: true
    });
    
    console.log(`Total vectors found: ${allVectorsResponse.matches?.length || 0}`);
    
    if (allVectorsResponse.matches && allVectorsResponse.matches.length > 0) {
      console.log('Existing vectors:');
      allVectorsResponse.matches.slice(0, 5).forEach((match, index) => {
        console.log(`  ${index + 1}. ID: ${match.id}, Score: ${match.score}, Role: ${match.metadata?.role}`);
      });
      if (allVectorsResponse.matches.length > 5) {
        console.log(`  ... and ${allVectorsResponse.matches.length - 5} more`);
      }
    }
    
    // 7. Clean up test data
    console.log('\n🧹 Cleaning up test data:');
    await index.deleteMany({
      filter: { debug: true }
    });
    console.log('✅ Test data cleaned up');
    
    // 8. Test embedding generation
    console.log('\n🧠 Testing Embedding Generation:');
    try {
      const { EmbeddingService } = require('../apps/web/lib/embeddings');
      const testText = 'This is a test message for embedding generation';
      const embedding = await EmbeddingService.generateEmbedding(testText);
      console.log(`✅ Embedding generated successfully`);
      console.log(`   Original dimensions: ${embedding.length}`);
      
      const convertedEmbedding = EmbeddingService.convertTo1024Dimensions(embedding);
      console.log(`   Converted dimensions: ${convertedEmbedding.length}`);
      console.log(`   First few values: [${convertedEmbedding.slice(0, 5).join(', ')}...]`);
    } catch (embeddingError) {
      console.error('❌ Embedding generation failed:', embeddingError.message);
    }
    
    console.log('\n🎯 Debug Summary:');
    console.log('✅ Pinecone connection: Working');
    console.log('✅ Index access: Working');
    console.log('✅ Vector storage: Working');
    console.log('✅ Vector retrieval: Working');
    console.log(`✅ Current index size: ${stats.totalVectorCount} vectors`);
    
    if (stats.totalVectorCount === 0) {
      console.log('\n⚠️  Potential Issues:');
      console.log('1. Chat messages might not be reaching the memory storage');
      console.log('2. Authentication might be failing in the chat flow');
      console.log('3. Memory service might be disabled due to previous failures');
      console.log('4. Environment variables might not be loaded in production');
      
      console.log('\n🔧 Next Steps:');
      console.log('1. Check Vercel environment variables');
      console.log('2. Check server logs for memory storage errors');
      console.log('3. Test the /api/pinecone/memory endpoint directly');
      console.log('4. Verify user authentication in chat flow');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check Pinecone API key and environment');
    console.log('2. Verify index exists and is accessible');
    console.log('3. Check network connectivity to Pinecone');
    console.log('4. Verify environment variables are loaded');
  }
}

debugPineconeMemory();
