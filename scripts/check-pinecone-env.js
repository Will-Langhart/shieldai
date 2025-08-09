// Simple script to check Pinecone environment variables
require('dotenv').config();

console.log('\n=== Pinecone Environment Variables ===');
console.log('PINECONE_ENVIRONMENT:', process.env.PINECONE_ENVIRONMENT || '(not set)');
console.log('PINECONE_INDEX_NAME:', process.env.PINECONE_INDEX_NAME || '(not set)');
console.log('PINECONE_API_KEY:', process.env.PINECONE_API_KEY ? 
  `${process.env.PINECONE_API_KEY.substring(0, 8)}...${process.env.PINECONE_API_KEY.slice(-4)}` : 
  '(not set)');
console.log('=====================================\n');

