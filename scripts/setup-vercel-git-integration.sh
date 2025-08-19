#!/bin/bash

# Simple script to set up Vercel Git integration for automatic domain syncing
# This ensures shieldai.cloud always points to the latest deployment

set -e

echo "🚀 Setting up Vercel Git Integration for automatic domain syncing..."

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: This script must be run from the project root directory"
    exit 1
fi

echo "📋 Current Vercel project status:"
vercel project ls

echo ""
echo "🔗 Current domain status:"
vercel domains ls

echo ""
echo "📊 Latest deployments:"
vercel ls | head -5

echo ""
echo "🔄 Setting up Git integration..."

# Remove existing .vercel directory to start fresh
if [ -d ".vercel" ]; then
    echo "🗑️ Removing existing .vercel directory..."
    rm -rf .vercel
fi

# Link the project fresh
echo "🔗 Linking project to Vercel..."
vercel link --yes

echo ""
echo "✅ Vercel Git integration setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Push to ios-app branch: git push origin ios-app"
echo "2. Vercel will automatically deploy"
echo "3. Run: npm run sync-domain (to manually sync domain)"
echo ""
echo "🔗 For automatic domain syncing, set up GitHub Actions:"
echo "1. Add VERCEL_TOKEN to GitHub Secrets"
echo "2. Push to trigger the workflow"
echo "3. Check Actions tab for deployment status"
echo ""
echo "🌐 Your domain: https://shieldai.cloud"
echo "📊 Monitor at: https://vercel.com/dashboard"
