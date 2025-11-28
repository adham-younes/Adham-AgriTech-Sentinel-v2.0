#!/bin/bash
# ===========================================
# Fix Vercel Deployment Script
# ===========================================
# This script ensures all components are properly deployed

set -e

echo "🚀 Starting Vercel Deployment Fix..."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Navigate to frontend directory
cd "$(dirname "$0")/../frontend" || exit

echo "📦 Step 1: Verifying environment variables..."
vercel env ls production | grep -E "(EOSDA|GOOGLE_AI|MAPBOX|SUPABASE)" || echo "⚠️  Some variables may be missing"

echo ""
echo "🔧 Step 2: Pulling latest changes..."
git pull origin main || echo "⚠️  Git pull failed or not in git repo"

echo ""
echo "📝 Step 3: Checking for build errors..."
npm run build 2>&1 | tail -20 || {
    echo "❌ Build failed. Fix errors before deploying."
    exit 1
}

echo ""
echo "🚀 Step 4: Deploying to Vercel Production..."
vercel --prod --yes

echo ""
echo "✅ Deployment initiated!"
echo "📊 Monitor at: https://vercel.com/dashboard"
echo "🌐 Production URL: https://adham-agritech.com"

