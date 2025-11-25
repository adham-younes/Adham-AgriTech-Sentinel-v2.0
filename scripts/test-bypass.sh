#!/usr/bin/env bash
set -euo pipefail

HOST="https://adham-agritech-esccqh7ip-adhamlouxors-projects.vercel.app"
TOKEN="${VERCEL_AUTOMATION_BYPASS_SECRET:?VERCEL_AUTOMATION_BYPASS_SECRET is not set}"

curl -I "$HOST/?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=$TOKEN" -c /tmp/v.log
curl -b /tmp/v.log "$HOST/api/fields/cea08853-4145-455f-b17a-7d96382aac48/metrics"
