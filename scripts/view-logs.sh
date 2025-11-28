#!/bin/bash
# ===========================================
# View Vercel Logs Script
# ===========================================

set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-pgAmHvAFC0gScFumJm8zWz1G}"

echo "📊 Vercel Logs Viewer"
echo ""

# Get latest deployment
echo "🔍 Fetching latest deployment..."
LATEST=$(vercel ls --json --token="$VERCEL_TOKEN" 2>/dev/null | jq -r '.[0].url // empty')

if [ -z "$LATEST" ]; then
    echo "❌ No deployments found"
    exit 1
fi

echo "✅ Latest deployment: $LATEST"
echo ""
echo "📋 Showing logs (last 5 minutes)..."
echo ""

# Show logs
vercel logs "$LATEST" --token="$VERCEL_TOKEN" 2>&1 || {
    echo ""
    echo "⚠️  No logs available or deployment not ready"
    echo ""
    echo "💡 Alternative: View logs in Vercel Dashboard:"
    echo "   https://vercel.com/dashboard"
}

