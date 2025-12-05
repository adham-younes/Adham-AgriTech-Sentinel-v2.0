#!/bin/bash
set -e

PROJECT_ID="adham-agritech-sentinel"
REGION="us-central1"
FUNCTION_NAME="osiris-core"
SERVICE_ACCOUNT="ai-agent-admin@${PROJECT_ID}.iam.gserviceaccount.com"

# Get Function URL
FUNCTION_URL=$(gcloud functions describe $FUNCTION_NAME --gen2 --region=$REGION --format='value(serviceConfig.uri)')

echo "⏰ Creating Cloud Scheduler Job for OSIRIS Heartbeat..."

# Create Scheduler Job (Hourly)
# Invokes the HTTP endpoint with OIDC authentication (using the service account)
gcloud scheduler jobs create http osiris-heartbeat \
    --schedule="0 * * * *" \
    --uri="$FUNCTION_URL" \
    --http-method=POST \
    --message-body='{"prompt": "Perform hourly system check and optimization analysis."}' \
    --oidc-service-account-email="$SERVICE_ACCOUNT" \
    --location="$REGION" \
    --attempt-deadline=30m \
    --quiet || echo "Job likely already exists. Updating..."

if [ $? -ne 0 ]; then
    gcloud scheduler jobs update http osiris-heartbeat \
        --schedule="0 * * * *" \
        --uri="$FUNCTION_URL" \
        --http-method=POST \
        --message-body='{"prompt": "Perform hourly system check and optimization analysis."}' \
        --oidc-service-account-email="$SERVICE_ACCOUNT" \
        --location="$REGION" \
        --attempt-deadline=30m
fi

echo "✅ Scheduler Job 'osiris-heartbeat' configured."
