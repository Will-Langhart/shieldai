const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config({ path: '.env.local' });

async function testExactApiKey() {
  console.log('🧪 Pinecone Test with API Key from .env.local\n');
  
  try {
    // Read API key from environment file
    const apiKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX_NAME || 'shieldai';
    
    console.log('Environment variables loaded:');
    console.log('  PINECONE_API_KEY:', apiKey ? `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}` : 'NOT SET');
    console.log('  PINECONE_ENVIRONMENT:', process.env.PINECONE_ENVIRONMENT || 'NOT SET');
    console.log('  PINECONE_INDEX_NAME:', process.env.PINECONE_INDEX_NAME || 'NOT SET');
    console.log('');
    
    if (!apiKey) {
      console.error('❌ PINECONE_API_KEY not found in .env.local');
      return;
    }
    
    console.log('Using API key from .env.local:');
    console.log(`  API Key: ${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`);
    console.log(`  Index: ${indexName}\n`);
    
    // Test different environment formats
    const environments = [
      'us-east-1-aws',
      'us-east-1', 
      'us-west1-gcp',
      'gcp-starter'
    ];
    
    for (const environment of environments) {
      console.log(`🔍 Testing environment: ${environment}`);
      
      try {
        const pc = new Pinecone({ apiKey, environment });
        
        // Try to list indexes first
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
    
    console.log('❌ None of the environments worked with this API key.');
    console.log('\n🔧 This suggests:');
    console.log('1. The API key is incorrect or expired');
    console.log('2. The API key belongs to a different project');
    console.log('3. The API key doesn\'t have the right permissions');
    
    console.log('\n💡 Next steps:');
    console.log('1. Go to https://app.pinecone.io/');
    console.log('2. Check your API keys section');
    console.log('3. Verify the API key is active and has the right permissions');
    console.log('4. Check which project/environment the API key belongs to');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testExactApiKey();
