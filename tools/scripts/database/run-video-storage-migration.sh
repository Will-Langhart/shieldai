#!/bin/bash

# Video Storage Migration Script for Shield AI
# This script helps you run the database migration to add video storage capabilities

echo "🎬 Shield AI Video Storage Migration"
echo "====================================="
echo ""

echo "📋 This script will help you add video storage capabilities to your database."
echo ""

echo "🔧 Prerequisites:"
echo "   - You must have access to your Supabase dashboard"
echo "   - You need to be able to run SQL commands in the Supabase SQL editor"
echo ""

echo "📝 Steps to complete the migration:"
echo ""
echo "1. Go to your Supabase dashboard: https://supabase.com/dashboard"
echo "2. Select your Shield AI project"
echo "3. Go to the 'SQL Editor' section"
echo "4. Create a new query"
echo "5. Copy and paste the contents of 'database/add-video-storage.sql'"
echo "6. Click 'Run' to execute the migration"
echo ""

echo "📊 What the migration will add:"
echo "   - relevant_videos column (JSONB) to store video data"
echo "   - bible_verses column (JSONB) to store scripture references"
echo "   - video_metadata column (JSONB) for additional metadata"
echo "   - Performance indexes for video search"
echo ""

echo "⚠️  Important Notes:"
echo "   - This migration is safe to run multiple times"
echo "   - It will not affect existing data"
echo "   - It will add default empty arrays for new columns"
echo ""

echo "🚀 After running the migration:"
echo "   - Conversations should save and load properly"
echo "   - Video data will be persisted in the database"
echo "   - Enhanced video service will work correctly"
echo ""

echo "📁 Migration file location: database/add-video-storage.sql"
echo ""

echo "❓ Need help? Check the documentation at: docs/features/ENHANCED_VIDEO_SERVICE.md"
echo ""

read -p "Press Enter to open the migration file in your editor..."

# Try to open the migration file in the default editor
if command -v code &> /dev/null; then
    code database/add-video-storage.sql
elif command -v nano &> /dev/null; then
    nano database/add-video-storage.sql
elif command -v vim &> /dev/null; then
    vim database/add-video-storage.sql
else
    echo "📄 Migration file contents:"
    echo "============================"
    cat database/add-video-storage.sql
fi

echo ""
echo "✅ Migration script completed!"
echo "🎯 Next steps:"
echo "   1. Run the SQL migration in Supabase"
echo "   2. Test conversation saving/loading"
echo "   3. Test video recommendations"
echo ""
echo "🔗 Production URL: https://shieldai-2v3l2ruqj-wwjd.vercel.app"
