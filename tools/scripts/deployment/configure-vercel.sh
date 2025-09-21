#!/bin/bash

# Script to configure Vercel for automatic domain linking
# This ensures shieldai.cloud always points to the latest deployment

set -e

echo "🔧 Configuring Vercel for automatic domain linking..."

# Check if we're in the right directory
if [ ! -f "config/vercel.json" ]; then
    echo "❌ Error: This script must be run from the project root directory"
    exit 1
fi

echo "📋 Current Vercel project configuration:"
vercel project ls

echo ""
echo "🔗 Current domain configuration:"
vercel domains ls

echo ""
echo "📊 Current deployment status:"
vercel ls | head -10

echo ""
echo "🔄 Setting up automatic domain linking..."

# Link the project to the current directory if not already linked
if [ ! -f ".vercel/project.json" ]; then
    echo "🔗 Linking project to current directory..."
    vercel link --yes
else
    echo "✅ Project already linked"
fi

# Configure the project to automatically alias the custom domain
echo "🔧 Configuring automatic domain aliasing..."

# Create a .vercel/project.json with auto-alias enabled
cat > .vercel/project.json << EOF
{
  "projectId": "$(vercel project ls | grep shieldai | awk '{print $1}')",
  "orgId": "$(vercel whoami --json | jq -r '.teams[0].id // .user.id')",
  "projectName": "shieldai",
  "settings": {
    "framework": "nextjs",
    "nodeVersion": "22.x"
  },
  "domains": [
    "shieldai.cloud"
  ],
  "autoAlias": true,
  "git": {
    "deploymentEnabled": {
      "main": true,
      "ios-app": true,
      "dev": true,
      "prod": true,
      "staging": true
    }
  }
}
EOF

echo "✅ Vercel configuration updated"

# Test the configuration
echo ""
echo "🧪 Testing configuration..."

# Deploy a test build
echo "🚀 Deploying test build..."
vercel --prod --yes

# Get the latest deployment
LATEST_DEPLOYMENT=$(vercel ls | grep "Production" | head -1 | awk '{print $3}')

if [ -n "$LATEST_DEPLOYMENT" ]; then
    echo "✅ Latest deployment: $LATEST_DEPLOYMENT"
    
    # Ensure domain is aliased
    echo "🔗 Ensuring domain is aliased..."
    vercel alias "$LATEST_DEPLOYMENT" shieldai.cloud
    
    echo "✅ Domain aliased successfully"
    
    # Verify the alias
    echo "🔍 Verifying domain alias..."
    sleep 10
    
    CURRENT_ALIAS=$(vercel inspect shieldai.cloud 2>/dev/null | grep "url" | awk '{print $2}' || echo "none")
    
    if [ "$CURRENT_ALIAS" = "$LATEST_DEPLOYMENT" ]; then
        echo "✅ Domain sync verified successfully"
        echo "🌐 shieldai.cloud now points to: $LATEST_DEPLOYMENT"
    else
        echo "⚠️ Domain sync verification failed"
        echo "Expected: $LATEST_DEPLOYMENT"
        echo "Got: $CURRENT_ALIAS"
    fi
else
    echo "❌ No production deployment found"
fi

echo ""
echo "🎉 Vercel configuration complete!"
echo ""
echo "📋 Next steps:"
echo "1. Push to any branch (ios-app, main, dev, prod, staging)"
echo "2. GitHub Actions will automatically deploy and sync the domain"
echo "3. shieldai.cloud will always point to the latest deployment"
echo ""
echo "🔗 Manual domain sync: npm run sync-domain"
echo "🚀 Manual deploy + sync: npm run deploy"
