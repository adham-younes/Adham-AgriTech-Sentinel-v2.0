#!/bin/bash
export SUPABASE_URL="https://nptpmiljdljxjbgoxyqn.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wdHBtaWxqZGxqeGpiZ294eXFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxNDE1MiwiZXhwIjoyMDc4NzkwMTUyfQ.kKrC3CS87voa2qlJEokpd4JbKrbGqwaGkMLQy66S1mc"
export VERCEL_TOKEN="wFmL8hhz0KLsuIUyDzC1PPms"
cd "$(dirname "$0")"
node scripts/supabase-mcp.mjs
TOKEN="$VERCEL_TOKEN"
curl -I "https://adham-agritech-eusxav3dk-adhamlouxors-projects.vercel.app/?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=$TOKEN" -c /tmp/v.log
curl -b /tmp/v.log "https://adham-agritech-eusxav3dk-adhamlouxors-projects.vercel.app/api/fields/cea08853-4145-455f-b17a-7d96382aac48/metrics"
