#!/bin/bash

echo "🚀 Setting up Shield AI GitHub repository..."

# Get GitHub username
echo "Enter your GitHub username:"
read GITHUB_USERNAME

# Create branches
echo "📝 Creating branch structure..."
git checkout -b dev
git checkout -b prod
git checkout main

# Add remote origin
echo "🔗 Adding remote origin..."
git remote add origin https://github.com/$GITHUB_USERNAME/shieldai.git

# Push all branches
echo "📤 Pushing to GitHub..."
git push -u origin main
git push -u origin dev
git push -u origin prod

echo "✅ GitHub repository setup complete!"
echo ""
echo "🌐 Next steps:"
echo "1. Go to https://vercel.com"
echo "2. Import your repository: https://github.com/$GITHUB_USERNAME/shieldai"
echo "3. Deploy the 'prod' branch for production"
echo "4. Set environment variables in Vercel dashboard"
echo ""
echo "📋 Environment variables to add in Vercel:"
echo "- OPENAI_API_KEY"
echo "- ANTHROPIC_API_KEY"
echo "- PINECONE_API_KEY"
echo "- PINECONE_ENVIRONMENT"
echo "- PINECONE_INDEX_NAME"
echo "- NEXT_PUBLIC_SUPABASE_URL"
echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "- JWT_SECRET" 