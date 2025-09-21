#!/bin/bash

# Script to run database migration for adding user_id to messages table
# This script should be run in your Supabase SQL editor or via psql

echo "Running database migration to add user_id to messages table..."

# Check if we're in the right directory
if [ ! -f "database/add-user-id-to-messages.sql" ]; then
    echo "Error: Migration file not found. Please run this script from the project root."
    exit 1
fi

# Display the migration SQL
echo "Migration SQL:"
echo "=============="
cat database/add-user-id-to-messages.sql

echo ""
echo "Please copy the above SQL and run it in your Supabase SQL editor."
echo "Or if you have psql configured, you can run:"
echo "psql -h your-host -U your-user -d your-database -f database/add-user-id-to-messages.sql"
