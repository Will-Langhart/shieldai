#!/bin/bash

# Shield AI Development Startup Script
# This script starts the Next.js development server

echo "🚀 Starting Shield AI Development Environment"
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm 8+ and try again."
    exit 1
fi

# Create .env.local file if it doesn't exist
if [ ! -f src/apps/web/.env.local ]; then
    echo "📝 Creating .env.local file from template..."
    cp src/config/env.example src/apps/web/.env.local
    echo "⚠️  Please edit src/apps/web/.env.local with your actual API keys before continuing."
    echo "   Press Enter when ready to continue..."
    read
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Start Next.js development server
echo "🎨 Starting Next.js development server..."
cd src/apps/web && npm run dev



