const fs = require('fs');
const path = require('path');

// Update environment variables for the new Pinecone setup
function updateEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  // Read current env file
  let envContent = '';
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    console.log('No .env.local file found, creating new one...');
  }

  // Update Pinecone variables
  const newEnvContent = envContent
    .replace(/PINECONE_API_KEY=.*/g, 'PINECONE_API_KEY=your_pinecone_api_key')
    .replace(/PINECONE_ENVIRONMENT=.*/g, 'PINECONE_ENVIRONMENT=us-west1-gcp')
    .replace(/PINECONE_INDEX_NAME=.*/g, 'PINECONE_INDEX_NAME=shieldai');

  // Add if not present
  if (!newEnvContent.includes('PINECONE_API_KEY=')) {
    newEnvContent += '\nPINECONE_API_KEY=your_pinecone_api_key';
  }
  if (!newEnvContent.includes('PINECONE_ENVIRONMENT=')) {
    newEnvContent += '\nPINECONE_ENVIRONMENT=us-west1-gcp';
  }
  if (!newEnvContent.includes('PINECONE_INDEX_NAME=')) {
    newEnvContent += '\nPINECONE_INDEX_NAME=shieldai';
  }

  // Write updated env file
  fs.writeFileSync(envPath, newEnvContent);
  
  console.log('✅ Updated .env.local with new Pinecone configuration');
  console.log('📝 Environment variables set:');
  console.log('   PINECONE_API_KEY=your_pinecone_api_key');
  console.log('   PINECONE_ENVIRONMENT=us-west1-gcp');
  console.log('   PINECONE_INDEX_NAME=shieldai');
}

updateEnvFile();











