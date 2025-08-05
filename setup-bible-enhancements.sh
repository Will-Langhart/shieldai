#!/bin/bash

# Bible Enhancements Setup Script for Shield AI
# This script helps configure and test all the new Bible features

echo "📖 Bible Enhancements Setup for Shield AI"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "🔍 Checking current setup..."

# Check if Bible API key is set
if grep -q "BIBLE_API_KEY" .env.local 2>/dev/null; then
    echo "✅ Bible API key found in .env.local"
else
    echo "⚠️  Bible API key not found in .env.local"
    echo "   Please add: BIBLE_API_KEY=your_api_key_here"
fi

# Check if server is running
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Development server is running on port 3001"
else
    echo "⚠️  Development server not running"
    echo "   Starting server..."
    npm run dev &
    sleep 5
fi

echo ""
echo "🧪 Testing Bible API endpoints..."

# Test basic endpoints
echo "Testing Bible versions..."
if curl -s http://localhost:3001/api/bible/versions > /dev/null; then
    echo "✅ Bible versions endpoint working"
else
    echo "❌ Bible versions endpoint failed"
fi

echo "Testing Bible search..."
if curl -s "http://localhost:3001/api/bible/search?query=love&limit=3" > /dev/null; then
    echo "✅ Bible search endpoint working"
else
    echo "❌ Bible search endpoint failed"
fi

echo "Testing Bible passage..."
if curl -s "http://localhost:3001/api/bible/passage?reference=John%203:16" > /dev/null; then
    echo "✅ Bible passage endpoint working"
else
    echo "❌ Bible passage endpoint failed"
fi

echo ""
echo "📊 Database Setup"
echo "================="

# Check if Supabase is configured
if [ -f ".env.local" ] && grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
    echo "✅ Supabase configuration found"
    echo ""
    echo "📝 To set up the database tables, run this SQL in your Supabase dashboard:"
    echo ""
    echo "1. Go to your Supabase project dashboard"
    echo "2. Navigate to SQL Editor"
    echo "3. Copy and paste the contents of database/bible-notes.sql"
    echo "4. Run the SQL to create all tables"
    echo ""
else
    echo "⚠️  Supabase configuration not found"
    echo "   Please add to .env.local:"
    echo "   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key"
fi

echo ""
echo "🎯 New Features Available"
echo "========================"
echo ""
echo "✅ Enhanced Bible Interface"
echo "   - Multiple search modes (Quick, Advanced, Comparison, Study)"
echo "   - Recent searches and favorites"
echo "   - Copy/share functionality"
echo ""
echo "✅ Advanced Search & Filtering"
echo "   - Filter by book, chapter, verse"
echo "   - Multiple Bible translations"
echo "   - Case-sensitive search options"
echo "   - Quick search topics"
echo ""
echo "✅ Verse Comparison Tool"
echo "   - Compare verses across translations"
echo "   - Expandable/collapsible displays"
echo "   - Version selection (NIV, KJV, ESV, NLT, NKJV, NASB)"
echo ""
echo "✅ Bible Study Tools"
echo "   - Concordance analysis"
echo "   - Cross-references"
echo "   - Study notes with tags"
echo "   - Personal study sessions"
echo ""

echo "🧪 Testing Interface"
echo "==================="
echo ""
echo "Visit these URLs to test the new features:"
echo ""
echo "🔗 Main App: http://localhost:3001"
echo "   - Click the Bible icon in the header"
echo "   - Try the enhanced interface with all features"
echo ""
echo "🔗 Test Page: http://localhost:3001/test-bible-enhancements"
echo "   - Comprehensive testing of all components"
echo "   - API endpoint testing"
echo "   - Individual feature testing"
echo ""

echo "📚 Usage Examples"
echo "================="
echo ""
echo "1. Quick Search:"
echo "   - Click Bible icon → Quick Search → Type 'love'"
echo ""
echo "2. Advanced Search:"
echo "   - Click Bible icon → Advanced Search → Use filters"
echo ""
echo "3. Verse Comparison:"
echo "   - Click Bible icon → Verse Comparison → Enter 'John 3:16'"
echo ""
echo "4. Study Tools:"
echo "   - Click Bible icon → Study Tools → Enter verse reference"
echo ""

echo "🔧 Troubleshooting"
echo "=================="
echo ""
echo "If you encounter issues:"
echo ""
echo "1. Check API key: Ensure BIBLE_API_KEY is set in .env.local"
echo "2. Check server: Ensure npm run dev is running"
echo "3. Check database: Run the SQL schema in Supabase"
echo "4. Check console: Look for errors in browser developer tools"
echo ""

echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Your Bible enhancements are ready to use!"
echo ""
echo "Next steps:"
echo "1. Visit http://localhost:3001 to use the enhanced Bible interface"
echo "2. Visit http://localhost:3001/test-bible-enhancements to test all features"
echo "3. Set up the database tables in Supabase for full functionality"
echo ""

# Open the test page in browser if possible
if command -v open > /dev/null; then
    echo "🌐 Opening test page in browser..."
    open http://localhost:3001/test-bible-enhancements
elif command -v xdg-open > /dev/null; then
    echo "🌐 Opening test page in browser..."
    xdg-open http://localhost:3001/test-bible-enhancements
fi

echo ""
echo "Happy Bible studying! 📖✨" 