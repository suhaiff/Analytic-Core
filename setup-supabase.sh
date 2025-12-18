#!/bin/bash

# Supabase Setup Script for InsightAI
# This script helps you configure your local development environment for Supabase

set -e  # Exit on error

echo "=================================================="
echo "InsightAI - Supabase Configuration Setup"
echo "=================================================="
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "✓ .env file already exists"
    echo ""
    echo "Current configuration:"
    grep -E "SUPABASE_URL|SUPABASE_KEY|PORT" .env || echo "  No Supabase configuration found"
    echo ""
    read -p "Do you want to reconfigure? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping configuration..."
        exit 0
    fi
else
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "✓ .env created"
    echo ""
fi

echo "=================================================="
echo "Enter your Supabase credentials:"
echo "=================================================="
echo ""
echo "Find these in:"
echo "  1. Go to https://app.supabase.com"
echo "  2. Select your project"
echo "  3. Click 'Project Settings' → 'API' tab"
echo ""

read -p "SUPABASE_URL (https://xxxxx.supabase.co): " supabase_url
read -p "SUPABASE_KEY (paste your Service Role Key): " supabase_key
read -p "PORT (default 3001): " port

# Use defaults if empty
port=${port:-3001}

# Update .env file
echo "Updating .env file..."

# Use sed to update the values
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|SUPABASE_URL=.*|SUPABASE_URL=$supabase_url|" .env
    sed -i '' "s|SUPABASE_KEY=.*|SUPABASE_KEY=$supabase_key|" .env
    sed -i '' "s|PORT=.*|PORT=$port|" .env
else
    # Linux
    sed -i "s|SUPABASE_URL=.*|SUPABASE_URL=$supabase_url|" .env
    sed -i "s|SUPABASE_KEY=.*|SUPABASE_KEY=$supabase_key|" .env
    sed -i "s|PORT=.*|PORT=$port|" .env
fi

echo "✓ .env updated successfully"
echo ""

echo "=================================================="
echo "Checking dependencies..."
echo "=================================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
    echo "✓ Dependencies installed"
else
    echo "✓ Dependencies already installed"
fi

echo ""
echo "=================================================="
echo "✨ Setup Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Create tables in Supabase:"
echo "   - Go to https://app.supabase.com"
echo "   - Select your project"
echo "   - Go to 'SQL Editor' → 'New Query'"
echo "   - Copy and run the SQL from: MIGRATION_DATAVERSE_TO_SUPABASE.md"
echo ""
echo "2. Verify .env configuration:"
echo "   - Check that SUPABASE_URL and SUPABASE_KEY are set"
echo ""
echo "3. Start the development server:"
echo "   npm run dev"
echo ""
echo "4. Test the API:"
echo "   POST http://localhost:$port/api/signup"
echo "   { \"name\": \"Test\", \"email\": \"test@example.com\", \"password\": \"password\" }"
echo ""
echo "For more details, see: MIGRATION_DATAVERSE_TO_SUPABASE.md"
echo ""
