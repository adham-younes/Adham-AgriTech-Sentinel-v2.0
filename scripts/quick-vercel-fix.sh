#!/bin/bash
# ===========================================
# Quick Vercel Fix Script
# ===========================================
# Uses Vercel API Token to fix deployment issues

set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-pgAmHvAFC0gScFumJm8zWz1G}"
PROJECT_ID="prj_VR6e1D9316QYXv5QeY1xAsHJjj2p"
API_BASE="https://api.vercel.com"

echo "🚀 Vercel Quick Fix"
echo ""

# Function to update env var
update_env() {
    local key=$1
    local value=$2
    local targets=${3:-"production,preview"}
    
    echo "📦 Updating $key..."
    
    # Get existing
    local existing=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
        "$API_BASE/v10/projects/$PROJECT_ID/env" | \
        jq -r ".envs[] | select(.key == \"$key\") | .id")
    
    if [ -n "$existing" ] && [ "$existing" != "null" ]; then
        # Update
        curl -s -X PATCH \
            -H "Authorization: Bearer $VERCEL_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"value\":\"$value\",\"target\":[$(echo $targets | sed 's/,/","/g' | sed 's/^/"/' | sed 's/$/"/')]}" \
            "$API_BASE/v10/projects/$PROJECT_ID/env/$existing" > /dev/null
        echo "✅ Updated $key"
    else
        # Create
        local type="encrypted"
        if [[ "$key" == NEXT_PUBLIC_* ]]; then
            type="plain"
        fi
        
        curl -s -X POST \
            -H "Authorization: Bearer $VERCEL_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"key\":\"$key\",\"value\":\"$value\",\"target\":[$(echo $targets | sed 's/,/","/g' | sed 's/^/"/' | sed 's/$/"/')],\"type\":\"$type\"}" \
            "$API_BASE/v10/projects/$PROJECT_ID/env" > /dev/null
        echo "✅ Created $key"
    fi
}

# Update critical environment variables
update_env "NEXT_PUBLIC_EOSDA_API_URL" "https://api-connect.eos.com" "production,preview"

echo ""
echo "✅ Environment variables updated!"
echo ""
echo "🚀 Creating new deployment..."

# Create deployment
DEPLOYMENT_URL=$(curl -s -X POST \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"projectId\":\"$PROJECT_ID\",\"target\":\"production\"}" \
    "$API_BASE/v13/deployments" | jq -r '.url // "N/A"')

echo "✅ Deployment created: $DEPLOYMENT_URL"
echo ""
echo "📊 Monitor at: https://vercel.com/dashboard"

