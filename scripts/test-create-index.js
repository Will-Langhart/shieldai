const { Pinecone } = require('@pinecone-database/pinecone');

async function testCreateIndex() {
  const apiKey = process.env.PINECONE_API_KEY;
  const environment = process.env.PINECONE_ENVIRONMENT || 'us-west1-gcp';
  
  console.log('Testing index creation...');
  console.log('Environment:', environment);
  
  const pc = new Pinecone({ apiKey, environment });
  
  try {
    // Try different API formats
    console.log('Attempting to create index...');
    
    const result = await pc.createIndex({
      name: 'shieldai-test',
      dimension: 1024,
      metric: 'cosine'
    });
    
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

testCreateIndex();

