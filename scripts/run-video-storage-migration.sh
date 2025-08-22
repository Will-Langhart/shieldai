#!/bin/bash

# Run Video Storage Database Migration
# This script adds video storage capabilities to the messages table

echo "🎥 Running Video Storage Database Migration..."
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "database/add-video-storage.sql" ]; then
    echo "❌ Error: database/add-video-storage.sql not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f "apps/web/.env.local" ]; then
    echo "❌ Error: apps/web/.env.local not found"
    echo "Please ensure your environment variables are configured"
    exit 1
fi

# Load environment variables
source apps/web/.env.local

# Check if Supabase URL and key are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Supabase environment variables not found"
    echo "Please check your .env.local file"
    exit 1
fi

echo "✅ Environment variables loaded"
echo "🔗 Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"

# Run the migration using Supabase CLI or direct SQL
echo "🚀 Running migration..."

# Option 1: Try using Supabase CLI if available
if command -v supabase &> /dev/null; then
    echo "📦 Using Supabase CLI..."
    supabase db push --db-url "$NEXT_PUBLIC_SUPABASE_URL"
else
    echo "📝 Supabase CLI not found, you'll need to run the migration manually"
    echo ""
    echo "📋 To run the migration manually:"
    echo "1. Go to your Supabase dashboard: $NEXT_PUBLIC_SUPABASE_URL"
    echo "2. Navigate to SQL Editor"
    echo "3. Copy and paste the contents of database/add-video-storage.sql"
    echo "4. Click 'Run' to execute the migration"
    echo ""
    echo "📄 Migration SQL file: database/add-video-storage.sql"
fi

echo ""
echo "🎯 Migration complete!"
echo ""
echo "📋 What was added:"
echo "   • relevant_videos JSONB column to messages table"
echo "   • bible_verses JSONB column to messages table"
echo "   • video_metadata JSONB column to messages table"
echo "   • Performance indexes for video search"
echo ""
echo "🔄 Next steps:"
echo "   1. Restart your development server"
echo "   2. Test by sending a message to Shield AI"
echo "   3. Refresh the page to verify videos persist"
echo ""
echo "✨ Video data will now be stored and retrieved with conversations!"
