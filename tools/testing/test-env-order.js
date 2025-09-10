const fs = require('fs');
const path = require('path');

console.log('🔍 Environment Variable Loading Debug\n');

// Check if .env.local exists and read it
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('📁 .env.local exists');
  const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');
  const pineconeKey = envLocalContent.match(/PINECONE_API_KEY=(.+)/);
  if (pineconeKey) {
    console.log(`  PINECONE_API_KEY: ${pineconeKey[1].substring(0, 10)}...`);
  } else {
    console.log('  PINECONE_API_KEY: NOT FOUND');
  }
} else {
  console.log('❌ .env.local does not exist');
}

// Check if .env exists and read it
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log('📁 .env exists');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const pineconeKey = envContent.match(/PINECONE_API_KEY=(.+)/);
  if (pineconeKey) {
    console.log(`  PINECONE_API_KEY: ${pineconeKey[1].substring(0, 10)}...`);
  } else {
    console.log('  PINECONE_API_KEY: NOT FOUND');
  }
} else {
  console.log('❌ .env does not exist');
}

console.log('\n🔧 Current process.env values:');
console.log(`  PINECONE_API_KEY: ${process.env.PINECONE_API_KEY ? process.env.PINECONE_API_KEY.substring(0, 10) + '...' : 'NOT SET'}`);
console.log(`  PINECONE_ENVIRONMENT: ${process.env.PINECONE_ENVIRONMENT || 'NOT SET'}`);
console.log(`  PINECONE_INDEX_NAME: ${process.env.PINECONE_INDEX_NAME || 'NOT SET'}`);

console.log('\n🧪 Testing dotenv loading...');

// Test loading .env.local first
require('dotenv').config({ path: '.env.local' });
console.log('After loading .env.local:');
console.log(`  PINECONE_API_KEY: ${process.env.PINECONE_API_KEY ? process.env.PINECONE_API_KEY.substring(0, 10) + '...' : 'NOT SET'}`);

// Test loading .env after (should override)
require('dotenv').config({ path: '.env' });
console.log('After loading .env:');
console.log(`  PINECONE_API_KEY: ${process.env.PINECONE_API_KEY ? process.env.PINECONE_API_KEY.substring(0, 10) + '...' : 'NOT SET'}`);

// Test loading .env.local after (should override .env)
require('dotenv').config({ path: '.env.local', override: true });
console.log('After loading .env.local with override:');
console.log(`  PINECONE_API_KEY: ${process.env.PINECONE_API_KEY ? process.env.PINECONE_API_KEY.substring(0, 10) + '...' : 'NOT SET'}`);
