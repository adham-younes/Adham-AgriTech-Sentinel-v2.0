#!/bin/bash

# Deployment script for Adham AgriTech Sentinel v2.0
# This script deploys the latest changes to Vercel production

echo "🚀 Starting deployment of Adham AgriTech Sentinel v2.0..."
echo ""

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found"
    echo "Please run this script from the project root"
    exit 1
fi

# Get current commit
CURRENT_COMMIT=$(git rev-parse --short HEAD)
echo "📝 Current commit: $CURRENT_COMMIT"
echo ""

# Navigate to frontend
cd frontend

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to production
echo "🌐 Deploying to production..."
echo ""

vercel --prod --yes

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo "🌍 Your site is live at: https://adham-agritech.com"
    echo ""
    echo "📊 Deployment details:"
    echo "   - Commit: $CURRENT_COMMIT"
    echo "   - Time: $(date)"
    echo ""
else
    echo ""
    echo "❌ Deployment failed!"
    echo "Please check the error messages above"
    exit 1
fi
