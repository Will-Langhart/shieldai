const fs = require('fs');
const path = require('path');

console.log('🔧 Personal Pinecone Setup Helper\n');

console.log('📋 Steps to set up your personal Pinecone account:');
console.log('1. Go to https://app.pinecone.io/');
console.log('2. Log in with theholotrout@gmail.com');
console.log('3. Create a new project (or use existing)');
console.log('4. Create a serverless index named "shieldai" with:');
console.log('   - Dimensions: 1024');
console.log('   - Metric: cosine');
console.log('   - Cloud: GCP (us-west1) or AWS (us-east-1)');
console.log('5. Copy your API key from the project settings');
console.log('6. Note the environment (us-west1-gcp or us-east-1-aws)');
console.log('\n');

// Function to update env file with new API key
function updateEnvWithNewKey(apiKey, environment) {
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
    .replace(/PINECONE_API_KEY=.*/g, `PINECONE_API_KEY=${apiKey}`)
    .replace(/PINECONE_ENVIRONMENT=.*/g, `PINECONE_ENVIRONMENT=${environment}`)
    .replace(/PINECONE_INDEX_NAME=.*/g, 'PINECONE_INDEX_NAME=shieldai');

  // Add if not present
  if (!newEnvContent.includes('PINECONE_API_KEY=')) {
    newEnvContent += `\nPINECONE_API_KEY=${apiKey}`;
  }
  if (!newEnvContent.includes('PINECONE_ENVIRONMENT=')) {
    newEnvContent += `\nPINECONE_ENVIRONMENT=${environment}`;
  }
  if (!newEnvContent.includes('PINECONE_INDEX_NAME=')) {
    newEnvContent += '\nPINECONE_INDEX_NAME=shieldai';
  }

  // Write updated env file
  fs.writeFileSync(envPath, newEnvContent);
  
  console.log('✅ Updated .env.local with your personal Pinecone configuration');
  console.log('📝 Environment variables set:');
  console.log(`   PINECONE_API_KEY=${apiKey}`);
  console.log(`   PINECONE_ENVIRONMENT=${environment}`);
  console.log('   PINECONE_INDEX_NAME=shieldai');
}

// Check if API key was provided as command line argument
const args = process.argv.slice(2);
if (args.length >= 2) {
  const apiKey = args[0];
  const environment = args[1];
  
  console.log(`🔑 Using provided API key: ${apiKey.substring(0, 10)}...`);
  console.log(`🌍 Using environment: ${environment}`);
  
  updateEnvWithNewKey(apiKey, environment);
} else {
  console.log('💡 To update automatically, run:');
  console.log('   node scripts/update-personal-pinecone.js YOUR_API_KEY ENVIRONMENT');
  console.log('   Example: node scripts/update-personal-pinecone.js pcsk_abc123... us-west1-gcp');
  console.log('\n');
  
  console.log('📝 Or manually update your .env.local file with:');
  console.log('   PINECONE_API_KEY=your_personal_api_key_here');
  console.log('   PINECONE_ENVIRONMENT=us-west1-gcp (or us-east-1-aws)');
  console.log('   PINECONE_INDEX_NAME=shieldai');
}

