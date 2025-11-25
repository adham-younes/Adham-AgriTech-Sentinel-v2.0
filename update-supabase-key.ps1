# Update Supabase ANON KEY on Vercel
Write-Host "Updating NEXT_PUBLIC_SUPABASE_ANON_KEY..." -ForegroundColor Cyan

# Remove old key from production
Write-Host "Removing old key from production..." -ForegroundColor Yellow
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production --yes

# Remove old key from preview
Write-Host "Removing old key from preview..." -ForegroundColor Yellow
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY preview --yes

# Add new key to production
Write-Host "Adding new key to production..." -ForegroundColor Green
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bmt3dWRxeHRnZHVoZW5yZ3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODkwMDUsImV4cCI6MjA2ODk2NTAwNX0.yVugFF3oc0aRry4UddG8pGdarX0iNUq6g_ZrZJdz3gc" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# Add new key to preview
Write-Host "Adding new key to preview..." -ForegroundColor Green
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bmt3dWRxeHRnZHVoZW5yZ3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODkwMDUsImV4cCI6MjA2ODk2NTAwNX0.yVugFF3oc0aRry4UddG8pGdarX0iNUq6g_ZrZJdz3gc" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview

Write-Host ""
Write-Host "✅ Supabase key updated successfully!" -ForegroundColor Green
Write-Host "Now redeploy: vercel --prod" -ForegroundColor Yellow
