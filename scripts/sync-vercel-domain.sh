#!/bin/bash

# Script to sync shieldai.cloud with latest Vercel production deployment
# This ensures the custom domain always points to the most recent production build

set -e

echo "🔍 Checking Vercel deployment status..."

# Get the latest production deployment (manual approach)
echo "Please run: vercel ls"
echo "Then copy the latest production deployment URL and run:"
echo "vercel alias [DEPLOYMENT_URL] shieldai.cloud"
echo ""
echo "Example:"
echo "vercel alias https://shieldai-12vj6tocp-wwjd.vercel.app shieldai.cloud"
echo ""
echo "Or use the npm script: npm run deploy (which does both deploy and sync)"
