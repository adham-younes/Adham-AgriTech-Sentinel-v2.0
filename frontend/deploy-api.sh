#!/bin/bash

# Deploy using Vercel API directly
PROJECT_ID="prj_VR6e1D9316QYXv5QeY1xAsHJjj2p"
ORG_ID="team_FWfSZ1vGknqWNQ52Y4bmoHlU"
TOKEN="qQoNEmeJLGL0D7eaGbnl3V6P"

cd /Users/adham/ai_agriculture_projects/Adham-AgriTech-Full-Stack/frontend

# Create tarball
echo "📦 Creating deployment package..."
tar -czf /tmp/deploy.tar.gz --exclude='node_modules' --exclude='.next' --exclude='.git' --exclude='frontend' --exclude='*.tar.gz' .

# Upload and deploy
echo "🚀 Deploying to Vercel..."
curl -X POST "https://api.vercel.com/v13/deployments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"adham-agritech\",
    \"project\": \"$PROJECT_ID\",
    \"target\": \"production\",
    \"files\": []
  }"

rm -f /tmp/deploy.tar.gz



