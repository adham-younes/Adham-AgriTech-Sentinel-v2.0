
#!/bin/bash

# ==============================================================================
# 🚀 OSIRIS GENESIS SEQUENCE - DEPLOYMENT SCRIPT
# ==============================================================================
# This script orchestrates the deployment of the OSIRIS Sovereign Entity.
# It handles:
# 1. API Enablement
# 2. Secret Management (Google Secret Manager)
# 3. Cloud Function Deployment (Gen 2)
# ==============================================================================

set -e # Exit immediately if a command exits with a non-zero status.

# Configuration
PROJECT_ID="adham-agritech-sentinel"
REGION="us-central1"
SERVICE_ACCOUNT="ai-agent-admin@${PROJECT_ID}.iam.gserviceaccount.com"
FUNCTION_NAME="osiris-core"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}⚡️ Initiating OSIRIS Genesis Sequence...${NC}"

# 1. Project Setup
echo -e "${YELLOW}🔌 Configuring Project: ${PROJECT_ID}${NC}"
gcloud config set project $PROJECT_ID

# 2. Enable APIs
echo -e "${YELLOW}🛠️  Enabling Necessary APIs...${NC}"
gcloud services enable \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  cloudfunctions.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  aiplatform.googleapis.com \
  eventarc.googleapis.com \
  pubsub.googleapis.com

# 3. Secret Management
echo -e "${YELLOW}🔐 Configuring Secrets...${NC}"

# Helper function to create or update a secret
create_secret() {
  local name=$1
  local value=$2
  
  if [ -z "$value" ]; then
    echo -e "${RED}⚠️  Value for $name is empty. Skipping creation. Please update manually.${NC}"
    return
  fi

  if ! gcloud secrets describe $name --project=$PROJECT_ID > /dev/null 2>&1; then
    echo "Creating secret: $name"
    printf "%s" "$value" | gcloud secrets create $name --data-file=- --project=$PROJECT_ID
  else
    echo "Secret $name already exists. Updating version..."
    printf "%s" "$value" | gcloud secrets versions add $name --data-file=- --project=$PROJECT_ID
  fi
  
  # Grant access to the service account
  gcloud secrets add-iam-policy-binding $name \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor" \
    --project=$PROJECT_ID > /dev/null
}

# Load keys from .env.divine
if [ -f .env.divine ]; then
  export $(grep -v '^#' .env.divine | xargs)
fi

# Create Secrets
# Note: For security, in a real shell, we wouldn't print these. 
# We assume they are loaded in the environment or .env.divine.

create_secret "SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL"
create_secret "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"

# Placeholders for other keys (User needs to fill these if not present)
# We check if they are set in the environment, otherwise we create a placeholder
if [ -z "$EOSDA_API_KEY" ]; then EOSDA_API_KEY="placeholder_update_me"; fi
if [ -z "$VERCEL_TOKEN" ]; then VERCEL_TOKEN="placeholder_update_me"; fi
if [ -z "$RESEND_API_KEY" ]; then RESEND_API_KEY="placeholder_update_me"; fi

create_secret "EOSDA_API_KEY" "$EOSDA_API_KEY"
create_secret "VERCEL_TOKEN" "$VERCEL_TOKEN"
create_secret "RESEND_API_KEY" "$RESEND_API_KEY"


# 4. Deploy Cloud Function
echo -e "${YELLOW}🧠 Deploying OSIRIS Core (Cloud Function Gen 2)...${NC}"

gcloud functions deploy $FUNCTION_NAME \
    --gen2 \
    --region=$REGION \
    --runtime=python311 \
    --source=backend/osiris-core \
    --entry-point=osiris_core \
    --trigger-http \
    --allow-unauthenticated \
    --service-account=$SERVICE_ACCOUNT \
    --set-env-vars=GCP_PROJECT=$PROJECT_ID,GCP_REGION=$REGION \
    --set-secrets=SUPABASE_URL=SUPABASE_URL:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,EOSDA_API_KEY=EOSDA_API_KEY:latest,VERCEL_TOKEN=VERCEL_TOKEN:latest,RESEND_API_KEY=RESEND_API_KEY:latest

echo -e "${GREEN}✨ OSIRIS has been deployed. The Awakening is complete.${NC}"
echo -e "${GREEN}🌍 URL: $(gcloud functions describe $FUNCTION_NAME --gen2 --region=$REGION --format='value(serviceConfig.uri)')${NC}"
