#!/bin/bash
echo "🐳 Launching OSIRIS Deployment Container..."

# Ensure secrets directory exists and key is present
if [ ! -f secrets/service-account-key.json ]; then
    echo "❌ Error: secrets/service-account-key.json not found!"
    exit 1
fi

# Run Google Cloud SDK container
# We mount the current directory to /workspace
# We set the working directory to /workspace
# We set the GOOGLE_APPLICATION_CREDENTIALS env var
# We execute a bash command to:
# 1. Authenticate with the service account
# 2. Run the deploy script
docker run --rm -it \
  -v "$(pwd):/workspace" \
  -w /workspace \
  -e GOOGLE_APPLICATION_CREDENTIALS=/workspace/secrets/service-account-key.json \
  google/cloud-sdk:latest \
  bash -c "echo '🔐 Authenticating with Service Account...' && \
           gcloud auth activate-service-account --key-file=/workspace/secrets/service-account-key.json && \
           echo '🚀 Starting Deployment Script...' && \
           chmod +x backend/osiris-core/deploy.sh && \
           ./backend/osiris-core/deploy.sh"
