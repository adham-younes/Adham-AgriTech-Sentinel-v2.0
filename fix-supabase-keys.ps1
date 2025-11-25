# ===========================================
# Fix Supabase Keys on Vercel
# ===========================================

Write-Host "🔧 Fixing Supabase environment variables on Vercel..." -ForegroundColor Green
Write-Host ""

# Remove old keys
Write-Host "🗑️  Removing old Supabase keys..." -ForegroundColor Yellow
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production --yes 2>$null
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY preview --yes 2>$null

Write-Host ""
Write-Host "📦 Adding correct Supabase keys..." -ForegroundColor Cyan

# Add NEXT_PUBLIC_SUPABASE_URL
Write-Host "   → NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor White
"https://mxnkwudqxtgduhenrgvm.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production --force
"https://mxnkwudqxtgduhenrgvm.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL preview --force

# Add NEXT_PUBLIC_SUPABASE_ANON_KEY
Write-Host "   → NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor White
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bmt3dWRxeHRnZHVoZW5yZ3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODkwMDUsImV4cCI6MjA2ODk2NTAwNX0.yVugFF3oc0aRry4UddG8pGdarX0iNUq6g_ZrZJdz3gc" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bmt3dWRxeHRnZHVoZW5yZ3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODkwMDUsImV4cCI6MjA2ODk2NTAwNX0.yVugFF3oc0aRry4UddG8pGdarX0iNUq6g_ZrZJdz3gc" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview

Write-Host ""
Write-Host "✅ Supabase keys have been updated!" -ForegroundColor Green
Write-Host ""
Write-Host "🔄 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Commit changes" -ForegroundColor White
Write-Host "   2. Deploy: vercel --prod" -ForegroundColor White
Write-Host "   3. Test login" -ForegroundColor White
Write-Host ""
Write-Host "📧 Test User Credentials:" -ForegroundColor Cyan
Write-Host "   Email: adhamlouxor@gmail.com" -ForegroundColor White
Write-Host "   Password: 12345678" -ForegroundColor White
Write-Host ""
