const { Pinecone } = require('@pinecone-database/pinecone');

async function testPinecone() {
  const apiKey = process.env.PINECONE_API_KEY;
  
  if (!apiKey) {
    console.error('❌ PINECONE_API_KEY not set');
    return;
  }

  console.log('🔑 API Key:', apiKey.substring(0, 8) + '...' + apiKey.slice(-4));
  
  // Test different environments
  const environments = [
    'us-east-1',
    'us-west1-gcp', 
    'gcp-starter',
    'us-east-1-aws',
    'us-west-2-aws'
  ];

  for (const env of environments) {
    console.log(`\n🌍 Testing environment: ${env}`);
    
    try {
      const pc = new Pinecone({ apiKey, environment: env });
      const indexes = await pc.listIndexes();
      
      console.log(`✅ Connected to ${env}`);
      console.log(`📊 Found ${indexes.length} indexes:`, indexes.map(i => i.name));
      
      if (indexes.length > 0) {
        console.log('🎉 SUCCESS! Found working environment and indexes');
        return { environment: env, indexes };
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
  
  console.log('\n❌ Could not connect to any environment');
  console.log('Please check:');
  console.log('1. API key is correct and active');
  console.log('2. Project exists and has indexes');
  console.log('3. You have proper permissions');
}

testPinecone().catch(console.error);



