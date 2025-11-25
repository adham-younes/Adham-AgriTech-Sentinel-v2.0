Write-Host "Updating Supabase keys on Vercel..." -ForegroundColor Green

# Remove old keys
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production --yes
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY preview --yes

# Add new keys - Production
Write-Host "Adding to Production..." -ForegroundColor Cyan
echo "https://mxnkwudqxtgduhenrgvm.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production --force
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bmt3dWRxeHRnZHVoZW5yZ3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODkwMDUsImV4cCI6MjA2ODk2NTAwNX0.yVugFF3oc0aRry4UddG8pGdarX0iNUq6g_ZrZJdz3gc" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# Add new keys - Preview
Write-Host "Adding to Preview..." -ForegroundColor Cyan
echo "https://mxnkwudqxtgduhenrgvm.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL preview --force
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bmt3dWRxeHRnZHVoZW5yZ3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODkwMDUsImV4cCI6MjA2ODk2NTAwNX0.yVugFF3oc0aRry4UddG8pGdarX0iNUq6g_ZrZJdz3gc" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview

Write-Host "Done!" -ForegroundColor Green
