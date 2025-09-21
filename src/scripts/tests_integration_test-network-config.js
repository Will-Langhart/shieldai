const fs = require('fs');
const https = require('https');

async function testNetworkConfig() {
  console.log('🌐 Testing Network Configuration for Pinecone\n');

  try {
    // Read .env.local directly
    const envLocalPath = '.env.local';
    if (!fs.existsSync(envLocalPath)) {
      throw new Error('.env.local file not found');
    }

    const envContent = fs.readFileSync(envLocalPath, 'utf8');
    
    // Parse the API key directly
    const apiKeyMatch = envContent.match(/PINECONE_API_KEY=(.+)/);
    if (!apiKeyMatch) {
      throw new Error('PINECONE_API_KEY not found in .env.local');
    }
    
    const apiKey = apiKeyMatch[1].trim();

    console.log('Direct environment values:');
    console.log(`  PINECONE_API_KEY: ${apiKey.substring(0, 10)}...\n`);

    // Test different Pinecone endpoints
    const endpoints = [
      'https://api.pinecone.io/indexes',
      'https://controller.us-east-1.pinecone.io/databases',
      'https://controller.us-east-1-aws.pinecone.io/databases',
      'https://controller.aped-4627-b74a.pinecone.io/databases'
    ];

    for (const endpoint of endpoints) {
      console.log(`🔍 Testing endpoint: ${endpoint}`);
      
      try {
        const response = await new Promise((resolve, reject) => {
          const req = https.request(endpoint, {
            method: 'GET',
            headers: {
              'Api-Key': apiKey,
              'User-Agent': 'Node.js-Pinecone-Test'
            }
          }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
          });
          
          req.on('error', reject);
          req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
          });
          
          req.end();
        });

        console.log(`  Status: ${response.status}`);
        if (response.status === 200) {
          console.log(`  ✅ Success! Found ${JSON.parse(response.data).indexes?.length || 0} indexes`);
          
          // If this endpoint works, try to parse the response
          try {
            const indexes = JSON.parse(response.data).indexes || [];
            if (indexes.length > 0) {
              console.log('\n📋 Available indexes:');
              indexes.forEach(index => {
                console.log(`  - ${index.name} (${index.dimension}d, ${index.metric})`);
                if (index.host) {
                  console.log(`    Host: ${index.host}`);
                }
              });
              
              // Check if shieldai index exists
              const shieldaiIndex = indexes.find(idx => idx.name === 'shieldai');
              if (shieldaiIndex) {
                console.log(`\n🎯 Found shieldai index!`);
                console.log(`  Host: ${shieldaiIndex.host}`);
                console.log(`  Dimension: ${shieldaiIndex.dimension}`);
                console.log(`  Metric: ${shieldaiIndex.metric}`);
                
                // Extract the environment from the working endpoint
                const envMatch = endpoint.match(/controller\.(.+?)\.pinecone\.io/);
                if (envMatch) {
                  console.log(`\n🔧 Working environment: ${envMatch[1]}`);
                  console.log(`  Use this environment in your Pinecone client configuration`);
                }
              }
            }
          } catch (parseError) {
            console.log(`  ⚠️  Could not parse response: ${parseError.message}`);
          }
        } else {
          console.log(`  ❌ Failed with status ${response.status}`);
        }
        
      } catch (error) {
        console.log(`  ❌ Failed: ${error.message}`);
      }
      
      console.log(''); // Empty line for readability
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testNetworkConfig();
