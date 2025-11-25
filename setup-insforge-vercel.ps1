# ===========================================
# Setup InsForge Environment Variables on Vercel
# ===========================================

Write-Host "🚀 Setting up InsForge environment variables on Vercel..." -ForegroundColor Green
Write-Host ""

# InsForge API Key
Write-Host "📦 Adding NEXT_PUBLIC_INSFORGE_API_KEY..." -ForegroundColor Cyan
"ik_5e82d1f87f888ec913ceae583539cb85" | vercel env add NEXT_PUBLIC_INSFORGE_API_KEY production
"ik_5e82d1f87f888ec913ceae583539cb85" | vercel env add NEXT_PUBLIC_INSFORGE_API_KEY preview

# InsForge Base URL
Write-Host "📦 Adding NEXT_PUBLIC_INSFORGE_BASE_URL..." -ForegroundColor Cyan
"https://9y7cy56f.us-east.insforge.app" | vercel env add NEXT_PUBLIC_INSFORGE_BASE_URL production
"https://9y7cy56f.us-east.insforge.app" | vercel env add NEXT_PUBLIC_INSFORGE_BASE_URL preview

# Server-side API Key
Write-Host "📦 Adding INSFORGE_API_KEY..." -ForegroundColor Cyan
"ik_5e82d1f87f888ec913ceae583539cb85" | vercel env add INSFORGE_API_KEY production
"ik_5e82d1f87f888ec913ceae583539cb85" | vercel env add INSFORGE_API_KEY preview

# Server-side Base URL
Write-Host "📦 Adding INSFORGE_BASE_URL..." -ForegroundColor Cyan
"https://9y7cy56f.us-east.insforge.app" | vercel env add INSFORGE_BASE_URL production
"https://9y7cy56f.us-east.insforge.app" | vercel env add INSFORGE_BASE_URL preview

Write-Host ""
Write-Host "✅ InsForge environment variables have been set!" -ForegroundColor Green
Write-Host ""
Write-Host "🔄 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Commit and push changes: git add . && git commit -m 'feat: migrate to InsForge backend'" -ForegroundColor White
Write-Host "   2. Deploy to production: vercel --prod" -ForegroundColor White
Write-Host "   3. Test login at: https://adham-agritech.vercel.app/auth/login" -ForegroundColor White
Write-Host ""
