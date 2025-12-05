#!/bin/bash
set -e

PROJECT_ID="adham-agritech-sentinel"
REGION="us-central1"
FUNCTION_NAME="osiris-core"
SERVICE_ACCOUNT="osiris-commander"
DATASET="agri_sovereign_data"
BUCKET="osiris-brain-dump"

echo "🚀 OSIRIS SUPREME DEPLOYMENT"

# Phase 1: Enable APIs
echo "⚡ Phase 1: Enabling Divine Services..."
gcloud services enable \
  aiplatform.googleapis.com \
  earthengine.googleapis.com \
  bigquery.googleapis.com \
  maps-backend.googleapis.com \
  cloudfunctions.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com

# Create Service Account
echo "👤 Creating OSIRIS Commander..."
gcloud iam service-accounts create ${SERVICE_ACCOUNT} \
  --display-name="OSIRIS Commander" || echo "Service account exists"

# Grant Roles
SA_EMAIL="${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com"
gcloud projects add-iam-policy-binding ${PROJECT_ID} --member="serviceAccount:${SA_EMAIL}" --role="roles/bigquery.admin"
gcloud projects add-iam-policy-binding ${PROJECT_ID} --member="serviceAccount:${SA_EMAIL}" --role="roles/storage.admin"
gcloud projects add-iam-policy-binding ${PROJECT_ID} --member="serviceAccount:${SA_EMAIL}" --role="roles/earthengine.writer"

# Phase 2: Infrastructure
echo "🏗️  Phase 2: Forging Infrastructure..."
bq mk --dataset --location=${REGION} ${PROJECT_ID}:${DATASET} || echo "Dataset exists"
gsutil mb -p ${PROJECT_ID} -l ${REGION} gs://${BUCKET} || echo "Bucket exists"

# Create API Key
echo "🔑 Generating API Key..."
API_KEY=$(gcloud beta services api-keys create \
  --display-name="osiris-master-key" \
  --api-target=service=generativelanguage.googleapis.com \
  --api-target=service=maps-backend.googleapis.com \
  --format="value(keyString)" 2>/dev/null || \
  gcloud beta services api-keys get-key-string $(gcloud beta services api-keys list --filter="displayName=osiris-master-key" --format="value(name)") --format="value(keyString)")

echo "✅ API Key: ${API_KEY:0:15}..."

# Phase 3: Deploy Function
echo "🧠 Phase 3: Deploying The Brain..."
gcloud functions deploy ${FUNCTION_NAME} \
  --gen2 \
  --region=${REGION} \
  --runtime=python311 \
  --source=backend/osiris-core \
  --entry-point=osiris_core \
  --trigger-http \
  --allow-unauthenticated \
  --timeout=300s \
  --memory=1GiB \
  --service-account=${SA_EMAIL} \
  --set-env-vars=GOOGLE_API_KEY=${API_KEY},GCP_PROJECT=${PROJECT_ID},BQ_DATASET=${DATASET}

FUNCTION_URL=$(gcloud functions describe ${FUNCTION_NAME} --gen2 --region=${REGION} --format='value(serviceConfig.uri)')

echo ""
echo "✅ OSIRIS DEPLOYMENT COMPLETE!"
echo "🌐 URL: ${FUNCTION_URL}"
echo "🧪 Test: curl -X POST ${FUNCTION_URL} -H 'Content-Type: application/json' -d '{\"prompt\":\"analyze cairo\"}'"
