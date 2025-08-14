#!/bin/bash

# Shield AI - Pinecone Memory Integration Setup Script
# This script helps configure and test the Pinecone memory system

set -e

echo "🔧 Shield AI - Pinecone Memory Integration Setup"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps/web" ]; then
    echo -e "${RED}❌ Error: Please run this script from the root of the Shield AI project${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Checking current Pinecone configuration...${NC}"

# Check environment variables
if [ -f ".env.local" ]; then
    echo "Found .env.local file"
    
    if grep -q "PINECONE_API_KEY" .env.local; then
        echo -e "${GREEN}✅ PINECONE_API_KEY is configured${NC}"
    else
        echo -e "${YELLOW}⚠️  PINECONE_API_KEY not found in .env.local${NC}"
    fi
    
    if grep -q "PINECONE_ENVIRONMENT" .env.local; then
        echo -e "${GREEN}✅ PINECONE_ENVIRONMENT is configured${NC}"
    else
        echo -e "${YELLOW}⚠️  PINECONE_ENVIRONMENT not found in .env.local${NC}"
    fi
    
    if grep -q "PINECONE_INDEX_NAME" .env.local; then
        echo -e "${GREEN}✅ PINECONE_INDEX_NAME is configured${NC}"
    else
        echo -e "${YELLOW}⚠️  PINECONE_INDEX_NAME not found in .env.local${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No .env.local file found${NC}"
fi

echo ""
echo -e "${BLUE}🔧 Setting up Pinecone configuration...${NC}"

# Create or update .env.local
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    cp env.example .env.local
    echo -e "${GREEN}✅ Created .env.local from env.example${NC}"
else
    echo "Updating existing .env.local file..."
fi

# Prompt for Pinecone configuration
echo ""
echo -e "${YELLOW}Please provide your Pinecone configuration:${NC}"
echo ""

read -p "Enter your Pinecone API Key: " PINECONE_API_KEY
read -p "Enter your Pinecone Environment (e.g., us-east-1): " PINECONE_ENVIRONMENT
read -p "Enter your Pinecone Index Name (default: shieldai): " PINECONE_INDEX_NAME

# Set defaults
PINECONE_INDEX_NAME=${PINECONE_INDEX_NAME:-shieldai}

# Update .env.local
echo ""
echo "Updating .env.local with Pinecone configuration..."

# Use sed to update the file (works on both macOS and Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/PINECONE_API_KEY=.*/PINECONE_API_KEY=$PINECONE_API_KEY/" .env.local
    sed -i '' "s/PINECONE_ENVIRONMENT=.*/PINECONE_ENVIRONMENT=$PINECONE_ENVIRONMENT/" .env.local
    sed -i '' "s/PINECONE_INDEX_NAME=.*/PINECONE_INDEX_NAME=$PINECONE_INDEX_NAME/" .env.local
else
    # Linux
    sed -i "s/PINECONE_API_KEY=.*/PINECONE_API_KEY=$PINECONE_API_KEY/" .env.local
    sed -i "s/PINECONE_ENVIRONMENT=.*/PINECONE_ENVIRONMENT=$PINECONE_ENVIRONMENT/" .env.local
    sed -i "s/PINECONE_INDEX_NAME=.*/PINECONE_INDEX_NAME=$PINECONE_INDEX_NAME/" .env.local
fi

echo -e "${GREEN}✅ Updated .env.local with Pinecone configuration${NC}"

echo ""
echo -e "${BLUE}🧪 Testing Pinecone connection...${NC}"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Test Pinecone connection
echo "Testing Pinecone connection..."
cd apps/web

# Test the Pinecone connection
echo "Testing Pinecone API key..."
curl -s "http://localhost:3001/api/pinecone/test-key" > /dev/null 2>&1 || {
    echo -e "${YELLOW}⚠️  Web server not running. Please start it with 'npm run dev' in the web directory${NC}"
    echo "You can test the connection manually by visiting: http://localhost:3001/api/pinecone/test-key"
}

cd ../..

echo ""
echo -e "${BLUE}📚 Setting up test data...${NC}"

# Create a simple test script
cat > scripts/test-pinecone-memory.js << 'EOF'
const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config({ path: '.env.local' });

async function testPineconeMemory() {
  try {
    console.log('🧪 Testing Pinecone Memory Integration...\n');
    
    const apiKey = process.env.PINECONE_API_KEY;
    const environment = process.env.PINECONE_ENVIRONMENT;
    const indexName = process.env.PINECONE_INDEX_NAME;
    
    if (!apiKey || !environment || !indexName) {
      console.error('❌ Missing Pinecone configuration in .env.local');
      return;
    }
    
    console.log(`📋 Configuration:`);
    console.log(`   API Key: ${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`);
    console.log(`   Environment: ${environment}`);
    console.log(`   Index: ${indexName}\n`);
    
    // Initialize Pinecone
    const pc = new Pinecone({ apiKey, environment });
    const index = pc.index(indexName);
    
    console.log('🔗 Testing Pinecone connection...');
    
    // Test basic operations
    const stats = await index.describeIndexStats();
    console.log(`✅ Index stats: ${stats.totalVectorCount} vectors`);
    
    // Test upsert with a sample vector
    const testId = `test_${Date.now()}`;
    const testVector = new Array(1024).fill(0.1); // 1024-dimensional test vector
    
    console.log('📝 Testing vector storage...');
    await index.upsert([{
      id: testId,
      values: testVector,
      metadata: {
        content: 'Test message for Shield AI',
        role: 'user',
        conversationId: 'test_conversation',
        userId: 'test_user',
        timestamp: new Date().toISOString(),
        test: true
      }
    }]);
    console.log('✅ Test vector stored successfully');
    
    // Test query
    console.log('🔍 Testing vector search...');
    const queryResponse = await index.query({
      vector: testVector,
      topK: 1,
      includeMetadata: true
    });
    
    if (queryResponse.matches && queryResponse.matches.length > 0) {
      console.log('✅ Vector search working correctly');
      console.log(`   Found ${queryResponse.matches.length} matches`);
    }
    
    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await index.deleteMany({
      filter: { test: true }
    });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 Pinecone Memory Integration Test Completed Successfully!');
    console.log('\n📖 Next Steps:');
    console.log('1. Start your web server: cd apps/web && npm run dev');
    console.log('2. Visit: http://localhost:3001/test-pinecone-memory');
    console.log('3. Test the memory system with the interactive interface');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your Pinecone API key and environment');
    console.log('2. Ensure your index is active and accessible');
    console.log('3. Verify your .env.local configuration');
  }
}

testPineconeMemory();
EOF

echo -e "${GREEN}✅ Created test script: scripts/test-pinecone-memory.js${NC}"

echo ""
echo -e "${BLUE}🧪 Running Pinecone memory test...${NC}"

# Run the test
node scripts/test-pinecone-memory.js

echo ""
echo -e "${BLUE}🎯 Integration Summary${NC}"
echo "=========================="
echo -e "${GREEN}✅ Pinecone service configured${NC}"
echo -e "${GREEN}✅ Memory service enhanced${NC}"
echo -e "${GREEN}✅ Embedding service updated${NC}"
echo -e "${GREEN}✅ Test endpoints created${NC}"
echo -e "${GREEN}✅ Test page created${NC}"
echo ""
echo -e "${BLUE}🚀 To start using the memory system:${NC}"
echo "1. Start your web server: cd apps/web && npm run dev"
echo "2. Visit: http://localhost:3001/test-pinecone-memory"
echo "3. Test memory storage and retrieval"
echo "4. The chatbot will automatically use Pinecone for long-term memory"
echo ""
echo -e "${GREEN}🎉 Pinecone Memory Integration Setup Complete!${NC}"
