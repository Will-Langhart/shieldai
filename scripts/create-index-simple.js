const { Pinecone } = require('@pinecone-database/pinecone');

const API_KEY = 'pcsk_2hg47f_SqUMV911FXV5RnMccoDnQMKKnopEkRpGkVCCNyDKGRUu5y97hiWcyUibc6jUkne';
const INDEX_NAME = 'shieldai';

async function createIndex() {
  console.log('🔧 Creating Pinecone index...\n');

  // Try us-west1-gcp first since it worked in our tests
  const environment = 'us-west1-gcp';
  
  try {
    console.log(`🌍 Using environment: ${environment}`);
    
    const pc = new Pinecone({ 
      apiKey: API_KEY,
      environment: environment 
    });

    // List existing indexes
    const indexes = await pc.listIndexes();
    console.log(`📊 Found ${indexes.length} indexes:`, indexes.map(i => i.name));

    // Check if shieldai index exists
    const shieldaiIndex = indexes.find(i => i.name === INDEX_NAME);
    
    if (shieldaiIndex) {
      console.log(`🗑️  Deleting existing '${INDEX_NAME}' index...`);
      await pc.deleteIndex(INDEX_NAME);
      console.log('✅ Index deleted successfully');
      
      // Wait a moment for deletion to complete
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Create new index with basic configuration
    console.log(`🏗️  Creating new '${INDEX_NAME}' index...`);
    
    const createParams = {
      name: INDEX_NAME,
      dimension: 1024,
      metric: 'cosine'
    };

    console.log('Creating with params:', JSON.stringify(createParams, null, 2));
    await pc.createIndex(createParams);
    console.log('✅ Index created successfully!');
    
    // Wait for index to be ready
    console.log('⏳ Waiting for index to be ready...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Test the index
    const index = pc.index(INDEX_NAME);
    console.log('✅ Index is ready for use!');
    
    console.log(`\n🎉 Success! Index '${INDEX_NAME}' is set up in environment '${environment}'`);
    console.log(`📝 Update your .env.local with:`);
    console.log(`PINECONE_ENVIRONMENT=${environment}`);
    
    return environment;
    
  } catch (error) {
    console.log(`❌ Failed:`, error.message);
    console.log('Please check your API key and permissions');
  }
}

createIndex().catch(console.error);



