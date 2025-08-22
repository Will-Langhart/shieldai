#!/bin/bash

# YouTube API Setup Script for Shield AI
# This script helps configure the YouTube Data API v3 for video integration

set -e

echo "🎥 Setting up YouTube API for Shield AI Video Integration"
echo "========================================================"
echo ""

# Check if running in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps/web" ]; then
    echo "❌ Error: Please run this script from the Shield AI root directory"
    exit 1
fi

echo "📋 Prerequisites:"
echo "   - Google Cloud Console account"
echo "   - YouTube Data API v3 enabled"
echo "   - API key with appropriate quotas"
echo ""

# Check if .env.local exists
if [ ! -f "apps/web/.env.local" ]; then
    echo "📝 Creating .env.local file..."
    cp apps/web/env.example apps/web/.env.local
    echo "✅ Created apps/web/.env.local"
    echo ""
fi

echo "🔑 YouTube API Configuration Steps:"
echo ""
echo "1. Go to Google Cloud Console: https://console.cloud.google.com/"
echo "2. Create a new project or select existing one"
echo "3. Enable YouTube Data API v3:"
echo "   - Go to 'APIs & Services' > 'Library'"
echo "   - Search for 'YouTube Data API v3'"
echo "   - Click 'Enable'"
echo ""
echo "4. Create API Key:"
echo "   - Go to 'APIs & Services' > 'Credentials'"
echo "   - Click 'Create Credentials' > 'API Key'"
echo "   - Copy the generated API key"
echo ""
echo "5. Configure API Key restrictions:"
echo "   - Click on the created API key"
echo "   - Under 'Application restrictions', select 'HTTP referrers'"
echo "   - Add your domain (e.g., *.shieldai.cloud, localhost:3001)"
echo "   - Under 'API restrictions', select 'Restrict key'"
echo "   - Select 'YouTube Data API v3'"
echo ""
echo "6. Set quotas (recommended):"
echo "   - Go to 'APIs & Services' > 'Quotas'"
echo "   - Find 'Queries per day' for YouTube Data API v3"
echo "   - Set to 10,000 or higher for production use"
echo ""

# Prompt for API key
read -p "🔑 Enter your YouTube API key (or press Enter to skip): " YOUTUBE_API_KEY

if [ ! -z "$YOUTUBE_API_KEY" ]; then
    # Add to .env.local
    if grep -q "YOUTUBE_API_KEY" apps/web/.env.local; then
        # Update existing key
        sed -i.bak "s/YOUTUBE_API_KEY=.*/YOUTUBE_API_KEY=$YOUTUBE_API_KEY/" apps/web/.env.local
        echo "✅ Updated YouTube API key in .env.local"
    else
        # Add new key
        echo "" >> apps/web/.env.local
        echo "# YouTube API (for video search)" >> apps/web/.env.local
        echo "YOUTUBE_API_KEY=$YOUTUBE_API_KEY" >> apps/web/.env.local
        echo "✅ Added YouTube API key to .env.local"
    fi
    
    # Remove backup file
    rm -f apps/web/.env.local.bak
    
    echo ""
    echo "🎯 Next Steps:"
    echo "   1. Restart your development server"
    echo "   2. Test video integration by sending a message to Shield AI"
    echo "   3. Check browser console for any API errors"
    echo ""
    echo "💡 Tip: You can test the API key with:"
    echo "   curl 'https://www.googleapis.com/youtube/v3/search?part=snippet&q=apologetics&key=$YOUTUBE_API_KEY'"
    echo ""
else
    echo ""
    echo "⚠️  No API key provided. Video integration will use fallback curated content."
    echo "   You can add the key later by editing apps/web/.env.local"
    echo ""
fi

echo "🔧 Testing Video Service..."
cd apps/web

# Check if video service can be imported
if node -e "
try {
  require('./lib/video-service');
  console.log('✅ Video service imported successfully');
} catch (e) {
  console.log('❌ Video service import failed:', e.message);
}
" 2>/dev/null; then
    echo "✅ Video service is ready"
else
    echo "❌ Video service has issues - check the implementation"
fi

echo ""
echo "🎉 YouTube API setup complete!"
echo ""
echo "📚 For more information, see: docs/features/VIDEO_INTEGRATION.md"
echo ""
echo "🚀 Happy coding with Shield AI Video Integration!"
