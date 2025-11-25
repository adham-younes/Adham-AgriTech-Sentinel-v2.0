#!/usr/bin/env bash
set -euo pipefail

BASE_URL="https://adham-agritech-eusxav3dk-adhamlouxors-projects.vercel.app"
FIELD_ID="cea08853-4145-455f-b17a-7d96382aac48" # override if needed
LOG_FILE="smoke-test.log"

echo "Smoke test run at $(date)" | tee "$LOG_FILE"

check_page() {
  local path="$1"
  echo -e "\n[PAGE] $path" | tee -a "$LOG_FILE"
  if curl -fsSL "$BASE_URL$path" -o /dev/null; then
    echo "  ✅ OK" | tee -a "$LOG_FILE"
  else
    echo "  ❌ FAIL" | tee -a "$LOG_FILE"
  fi
}

check_api() {
  local path="$1"
  echo -e "\n[API] $path" | tee -a "$LOG_FILE"
  curl -s -D - "$BASE_URL$path" -o >(head -n 20 | tee -a "$LOG_FILE")
  echo "  ---" | tee -a "$LOG_FILE"
}

for page in "/" "/dashboard" "/dashboard/fields" "/dashboard/ai-assistant"; do
  check_page "$page"
done

for endpoint in "/api/fields" \
  "/api/fields/$FIELD_ID" \
  "/api/fields/$FIELD_ID/metrics" \
  "/api/fields/$FIELD_ID/weather" \
  "/api/ai-assistant"; do
  check_api "$endpoint"
done

echo -e "\nTest completed at $(date)" | tee -a "$LOG_FILE"
