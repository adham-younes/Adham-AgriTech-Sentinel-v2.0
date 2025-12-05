#!/bin/bash
set -e

PROJECT_ID="adham-agritech-sentinel"
REGION="us-central1"
FUNCTION_NAME="osiris-core"
API_KEY_NAME="gemini-api-key"

echo "🚀 OSIRIS SIMPLE DEPLOYMENT"

# Enable APIs
echo "⚡ Enabling APIs..."
gcloud services enable cloudfunctions.googleapis.com run.googleapis.com

# Create API Key (if not exists)
echo "🔑 Creating Gemini API Key..."
EXISTING_KEY=$(gcloud beta services api-keys list --filter="displayName=${API_KEY_NAME}" --format="value(name)" 2>/dev/null || true)

if [ -z "$EXISTING_KEY" ]; then
    gcloud beta services api-keys create \
        --display-name="${API_KEY_NAME}" \
        --api-target=service=generativelanguage.googleapis.com
    
    # Wait for key creation
    sleep 5
fi

# Get the key string
API_KEY=$(gcloud beta services api-keys get-key-string $(gcloud beta services api-keys list --filter="displayName=${API_KEY_NAME}" --format="value(name)") --format="value(keyString)")

echo "✅ API Key: ${API_KEY:0:10}..."

# Deploy Function
echo "🧠 Deploying OSIRIS..."
gcloud functions deploy ${FUNCTION_NAME} \
    --gen2 \
    --region=${REGION} \
    --runtime=python311 \
    --source=backend/osiris-core \
    --entry-point=osiris_core \
    --trigger-http \
    --allow-unauthenticated \
    --timeout=120s \
    --memory=512MiB \
    --set-env-vars=GOOGLE_API_KEY=${API_KEY}

echo "✅ OSIRIS DEPLOYED!"
echo "🌐 URL: https://${FUNCTION_NAME}-262ufxjwqq-uc.a.run.app"
