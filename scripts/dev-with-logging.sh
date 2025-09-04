#!/bin/bash

# Development Server with Enhanced Logging
# This script starts the Shield AI development server with comprehensive logging enabled

set -e

echo "🔍 Starting Shield AI Development Server with Enhanced Logging"
echo "================================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Create logs directory if it doesn't exist
echo "📁 Setting up logging directories..."
mkdir -p logs/dev
mkdir -p logs/server
mkdir -p logs/debug

# Set development environment variables
export NODE_ENV=development
export ENABLE_DEV_LOGGING=true

echo "✅ Logging directories created"
echo "✅ Development environment configured"
echo ""

echo "🚀 Starting development server..."
echo "   - Server will run on http://localhost:3001"
echo "   - Logs will be written to logs/dev/"
echo "   - Use the 🔍 button (bottom-right) to open the logging dashboard"
echo "   - Press Ctrl+C to stop the server"
echo ""

# Start the development server
cd apps/web
npm run dev

