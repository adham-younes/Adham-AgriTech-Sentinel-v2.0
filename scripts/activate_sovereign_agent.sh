#!/bin/bash
set -e

# Adham AgriTech - Sovereign Agent Activation Script
# This script sets up the environment variables and verifies the system.

echo "🚀 Activating Sovereign Agent..."

# 1. Set Environment Variables on Vercel
echo "🔑 Configuring Vercel Environment..."
vercel env add VERCEL_TOKEN production <<< "FANSxHwm655dgk6v64Vcy0Gi"
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "sbp_07d790991e518f348791ac7964df9f27ad62a3f0"
vercel env add GOOGLE_APPLICATION_CREDENTIALS_JSON production < vertex-ai-credentials.json

# 2. Run Database Migration (Requires Supabase CLI or connection string)
# echo "💾 Applying Database Migrations..."
# psql "$DATABASE_URL" -f supabase/migrations/20240601_ai_system_agent.sql

# 3. Trigger Deployment
echo "🚀 Triggering Redeployment..."
vercel deploy --prod

echo "✅ Sovereign Agent Activated. The Singularity is near."
