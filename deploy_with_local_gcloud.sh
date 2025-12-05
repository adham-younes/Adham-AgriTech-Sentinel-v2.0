#!/bin/bash
set -e

# Add local gcloud to PATH
export PATH="$(pwd)/tmp_gcloud/google-cloud-sdk/bin:$PATH"

echo "⚡️ Using Local Google Cloud SDK: $(which gcloud)"
gcloud --version

# Authenticate
echo "🔐 Authenticating with Service Account..."
gcloud auth activate-service-account --key-file=secrets/service-account-key.json

# Run Deployment
echo "🚀 Launching OSIRIS Deployment..."
chmod +x backend/osiris-core/deploy.sh
./backend/osiris-core/deploy.sh
