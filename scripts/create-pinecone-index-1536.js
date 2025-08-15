require('dotenv').config({ path: '.env.local', override: true });
const fetch = global.fetch || require('node-fetch');

(async function main() {
  try {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) throw new Error('Missing PINECONE_API_KEY');

    const indexName = process.env.PINECONE_INDEX_NAME || 'shieldai-1536';
    console.log(`Creating serverless index '${indexName}' (1536 dims, cosine, us-east-1/aws)...`);

    // Create index
    const createRes = await fetch('https://api.pinecone.io/indexes', {
      method: 'POST',
      headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: indexName,
        dimension: 1536,
        metric: 'cosine',
        spec: { serverless: { cloud: 'aws', region: 'us-east-1' } }
      })
    });

    if (!createRes.ok) {
      const text = await createRes.text();
      throw new Error(`Create failed: ${createRes.status} ${text}`);
    }

    console.log('✅ Index creation requested. It may take ~1-2 minutes to be ready.');
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
