#!/usr/bin/env bash

set -euo pipefail

# Change to project root (directory containing this script's parent)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/.."

# Load local environment variables if present
if [ -f ".env.local" ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' .env.local | xargs -d '\n' -I {} bash -lc 'printf "%s\n" "{}"' | sed 's/[[:space:]]*$//')
fi

echo "[cron] Running NDVI analytics..."
NODE_ENV=production npx ts-node scripts/update-ndvi.ts

if [ -f "scripts/update-weather-from-eosda.ts" ]; then
  echo "[cron] Running weather/EOSDA sync..."
  NODE_ENV=production npx ts-node scripts/update-weather-from-eosda.ts
fi

echo "[cron] Analytics run completed."
