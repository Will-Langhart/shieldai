#!/bin/bash

# Shield AI - API Integration Setup and Verification Script
# This script helps set up and verify all API integrations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if file exists
file_exists() {
    [ -f "$1" ]
}

# Function to check environment variables
check_env_vars() {
    print_status "Checking environment variables..."
    
    local missing_vars=()
    local required_vars=(
        "OPENAI_API_KEY"
        "PINECONE_API_KEY"
        "PINECONE_ENVIRONMENT"
        "PINECONE_INDEX_NAME"
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "STRIPE_SECRET_KEY"
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
        "BIBLE_API_KEY"
        "NEXT_PUBLIC_GOOGLE_PLACES_API_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        print_success "All required environment variables are set"
        return 0
    else
        print_error "Missing environment variables: ${missing_vars[*]}"
        return 1
    fi
}

# Function to setup environment file
setup_env_file() {
    print_status "Setting up environment file..."
    
    if [ ! -f ".env.local" ]; then
        if [ -f "env.example" ]; then
            cp env.example .env.local
            print_success "Created .env.local from env.example"
            print_warning "Please edit .env.local and add your API keys"
        else
            print_error "env.example not found"
            return 1
        fi
    else
        print_status ".env.local already exists"
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if command_exists npm; then
        npm install
        print_success "Dependencies installed"
    else
        print_error "npm not found. Please install Node.js and npm"
        return 1
    fi
}

# Function to check if development server is running
check_dev_server() {
    print_status "Checking if development server is running..."
    
    if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
        print_success "Development server is running"
        return 0
    else
        print_warning "Development server is not running"
        print_status "Starting development server..."
        npm run dev &
        sleep 10
        
        if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
            print_success "Development server started successfully"
            return 0
        else
            print_error "Failed to start development server"
            return 1
        fi
    fi
}

# Function to run API integration tests
run_api_tests() {
    print_status "Running API integration tests..."
    
    if curl -s http://localhost:3001/api/test-api-integration >/dev/null 2>&1; then
        print_success "API integration test endpoint is accessible"
        
        # Get detailed results
        local results=$(curl -s http://localhost:3001/api/test-api-integration)
        echo "$results" | jq '.' 2>/dev/null || echo "$results"
    else
        print_error "API integration test failed"
        return 1
    fi
}

# Function to run verification script
run_verification_script() {
    print_status "Running verification script..."
    
    if file_exists "scripts/verify-api-integration.js"; then
        if command_exists node; then
            node scripts/verify-api-integration.js
        else
            print_error "Node.js not found"
            return 1
        fi
    else
        print_error "Verification script not found"
        return 1
    fi
}

# Function to check individual services
check_individual_services() {
    print_status "Checking individual services..."
    
    local services=(
        "http://localhost:3001/api/health"
        "http://localhost:3001/api/bible/versions"
        "http://localhost:3001/api/subscriptions/plans"
    )
    
    for service in "${services[@]}"; do
        if curl -s "$service" >/dev/null 2>&1; then
            print_success "$(basename "$service"): OK"
        else
            print_error "$(basename "$service"): Failed"
        fi
    done
}

# Function to show next steps
show_next_steps() {
    echo ""
    print_status "Next steps:"
    echo "1. Edit .env.local with your API keys"
    echo "2. Run: npm run dev"
    echo "3. Run: node scripts/verify-api-integration.js"
    echo "4. Test the application at http://localhost:3001"
    echo ""
    print_status "For detailed API documentation, see: docs/api/API_INTEGRATION_GUIDE.md"
}

# Main function
main() {
    echo "🚀 Shield AI - API Integration Setup and Verification"
    echo "=================================================="
    echo ""
    
    # Check prerequisites
    if ! command_exists node; then
        print_error "Node.js is required but not installed"
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is required but not installed"
        exit 1
    fi
    
    # Setup environment
    setup_env_file
    
    # Install dependencies
    install_dependencies
    
    # Check environment variables
    if ! check_env_vars; then
        print_warning "Some environment variables are missing"
        print_status "Please edit .env.local and add your API keys"
    fi
    
    # Check development server
    if check_dev_server; then
        # Run tests
        run_api_tests
        check_individual_services
        
        # Run verification script if available
        if file_exists "scripts/verify-api-integration.js"; then
            run_verification_script
        fi
    else
        print_error "Cannot run tests without development server"
    fi
    
    show_next_steps
}

# Run main function
main "$@"

