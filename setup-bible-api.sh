#!/bin/bash

# Bible API Setup Script for Shield AI
# This script helps configure the Bible API integration

echo "📖 Bible API Setup for Shield AI"
echo "================================"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Creating from template..."
    cp env.example .env.local
    echo "✅ Created .env.local from template"
else
    echo "✅ .env.local found"
fi

echo ""
echo "🔑 Bible API Configuration"
echo "=========================="
echo ""

# Check if Bible API key is already set
if grep -q "BIBLE_API_KEY=your_bible_api_key_here" .env.local; then
    echo "⚠️  Bible API key not configured yet."
    echo ""
    echo "To get your API key:"
    echo "1. Visit https://scripture.api.bible/"
    echo "2. Sign up for a free account"
    echo "3. Get your API key from the dashboard"
    echo ""
    read -p "Enter your Bible API key (or press Enter to skip): " bible_api_key
    
    if [ ! -z "$bible_api_key" ]; then
        # Replace the placeholder with the actual key
        sed -i.bak "s/BIBLE_API_KEY=your_bible_api_key_here/BIBLE_API_KEY=$bible_api_key/" .env.local
        echo "✅ Bible API key configured"
    else
        echo "⏭️  Skipped API key configuration"
        echo "   You can add it later to .env.local"
    fi
else
    echo "✅ Bible API key already configured"
fi

echo ""
echo "🧪 Testing Setup"
echo "================"
echo ""

# Check if npm is available
if command -v npm &> /dev/null; then
    echo "✅ npm found"
    
    # Check if dependencies are installed
    if [ -d "node_modules" ]; then
        echo "✅ Dependencies installed"
    else
        echo "📦 Installing dependencies..."
        npm install
    fi
    
    echo ""
    echo "🚀 Starting development server..."
    echo "   Visit http://localhost:3001 to test the application"
    echo "   Visit http://localhost:3001/test-bible-api to test Bible API"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Start the development server
    npm run dev
else
    echo "❌ npm not found. Please install Node.js and npm first."
    echo "   Visit https://nodejs.org/ to download"
fi

echo ""
echo "📚 Next Steps"
echo "============="
echo ""
echo "1. Get your Bible API key from https://scripture.api.bible/"
echo "2. Add it to .env.local: BIBLE_API_KEY=your_key_here"
echo "3. Start the development server: npm run dev"
echo "4. Test the Bible search functionality"
echo "5. Check the test page: /test-bible-api"
echo ""
echo "📖 For detailed documentation, see BIBLE_API_INTEGRATION.md"
echo "" 