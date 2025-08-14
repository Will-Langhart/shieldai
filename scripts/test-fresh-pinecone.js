const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config({ path: '.env.local', override: true });

async function testFreshPinecone() {
  console.log('🧪 Fresh Pinecone Test\n');
  
  try {
    // Force reload environment variables
    const apiKey = process.env.PINECONE_API_KEY;
    const environment = process.env.PINECONE_ENVIRONMENT;
    const indexName = process.env.PINECONE_INDEX_NAME;
    
    console.log('Environment variables (fresh load):');
    console.log('  PINECONE_API_KEY:', apiKey ? `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}` : 'NOT SET');
    console.log('  PINECONE_ENVIRONMENT:', environment || 'NOT SET');
    console.log('  PINECONE_INDEX_NAME:', indexName || 'NOT SET');
    console.log('');
    
    if (!apiKey) {
      console.error('❌ PINECONE_API_KEY not found');
      return;
    }
    
    // Test with us-east-1-aws first
    console.log('🔍 Testing with us-east-1-aws...');
    try {
      const pc = new Pinecone({ apiKey, environment: 'us-east-1-aws' });
      
      console.log('  Listing indexes...');
      const indexes = await pc.listIndexes();
      console.log(`  ✅ Found ${indexes.length} indexes`);
      
      if (indexes.length > 0) {
        indexes.forEach(idx => {
          console.log(`    - ${idx.name} (${idx.dimension}d, ${idx.metric})`);
        });
        
        // Check if shieldai index exists
        const targetIndex = indexes.find(idx => idx.name === 'shieldai');
        if (targetIndex) {
          console.log(`\n🎯 Found shieldai index!`);
          console.log(`   Dimensions: ${targetIndex.dimension}`);
          console.log(`   Metric: ${targetIndex.metric}`);
          console.log(`   Status: ${targetIndex.status}`);
          
          // Test direct access
          console.log('\n📝 Testing direct index access...');
          const index = pc.index('shieldai');
          const stats = await index.describeIndexStats();
          console.log(`✅ Index accessible!`);
          console.log(`   Total vectors: ${stats.totalVectorCount}`);
          
          console.log('\n🎉 SUCCESS! Your Pinecone connection is working!');
          return;
        } else {
          console.log('  ℹ️  shieldai index not found in this project');
        }
      } else {
        console.log('  ℹ️  No indexes found in this project');
      }
      
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}`);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. The API key might be valid but for a different project');
    console.log('2. The shieldai index might be in a different project');
    console.log('3. Check your Pinecone console for the correct project');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFreshPinecone();
