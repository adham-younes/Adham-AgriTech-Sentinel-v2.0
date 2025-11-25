# ===========================================
# Adham AgriTech - Vercel Environment Setup (PowerShell)
# ===========================================
# Fixed version: Each variable is added separately for production and preview
# Usage: .\vercel-env-setup-fixed.ps1

Write-Host "🚀 Setting up Vercel Environment Variables..." -ForegroundColor Green
Write-Host ""

# Database & Authentication
Write-Host "📦 Setting Supabase variables..." -ForegroundColor Cyan
Write-Host "  → NEXT_PUBLIC_SUPABASE_URL (production)" -ForegroundColor Gray
"https://mxnkwudqxtgduhenrgvm.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
Write-Host "  → NEXT_PUBLIC_SUPABASE_URL (preview)" -ForegroundColor Gray
"https://mxnkwudqxtgduhenrgvm.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL preview

Write-Host "  → NEXT_PUBLIC_SUPABASE_ANON_KEY (production)" -ForegroundColor Gray
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bmt3dWRxeHRnZHVoZW5yZ3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MjM4NzAsImV4cCI6MjA1MDQ5OTg3MH0.YLbYwqN8BQ3wXqLzQkRvK7J9X2mP1nR4sT5vU6wX8yA" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
Write-Host "  → NEXT_PUBLIC_SUPABASE_ANON_KEY (preview)" -ForegroundColor Gray
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bmt3dWRxeHRnZHVoZW5yZ3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MjM4NzAsImV4cCI6MjA1MDQ5OTg3MH0.YLbYwqN8BQ3wXqLzQkRvK7J9X2mP1nR4sT5vU6wX8yA" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview

# Weather API
Write-Host ""
Write-Host "🌤️ Setting Weather API..." -ForegroundColor Cyan
Write-Host "  → OPENWEATHER_API_KEY (production)" -ForegroundColor Gray
"bf14cf140dd3f8ddfd62b4fd9f6f9795" | vercel env add OPENWEATHER_API_KEY production
Write-Host "  → OPENWEATHER_API_KEY (preview)" -ForegroundColor Gray
"bf14cf140dd3f8ddfd62b4fd9f6f9795" | vercel env add OPENWEATHER_API_KEY preview

# AI Services
Write-Host ""
Write-Host "🤖 Setting AI Services..." -ForegroundColor Cyan
Write-Host "  → GROQ_API_KEY (production)" -ForegroundColor Gray
"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" | vercel env add GROQ_API_KEY production
Write-Host "  → GROQ_API_KEY (preview)" -ForegroundColor Gray
"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" | vercel env add GROQ_API_KEY preview

Write-Host "  → OPENAI_API_KEY (production)" -ForegroundColor Gray
"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" | vercel env add OPENAI_API_KEY production
Write-Host "  → OPENAI_API_KEY (preview)" -ForegroundColor Gray
"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" | vercel env add OPENAI_API_KEY preview

Write-Host "  → GOOGLE_AI_API_KEY (production)" -ForegroundColor Gray
"AIzaSyCjVqxv4vy8gXy3O0BNEp9dAB_UBKI2mh0" | vercel env add GOOGLE_AI_API_KEY production
Write-Host "  → GOOGLE_AI_API_KEY (preview)" -ForegroundColor Gray
"AIzaSyCjVqxv4vy8gXy3O0BNEp9dAB_UBKI2mh0" | vercel env add GOOGLE_AI_API_KEY preview

# Mapping Service
Write-Host ""
Write-Host "🗺️ Setting Mapbox..." -ForegroundColor Cyan
Write-Host "  → NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN (production)" -ForegroundColor Gray
"sk.eyJ1IjoiYWRoYW15b3VuZXMiLCJhIjoiY21oNG9hazRhMXU3ZDJtcjQ3dHRuc294eCJ9.HxS1sq3AKWkeq4r_Yx73MA" | vercel env add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN production
Write-Host "  → NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN (preview)" -ForegroundColor Gray
"sk.eyJ1IjoiYWRoYW15b3VuZXMiLCJhIjoiY21oNG9hazRhMXU3ZDJtcjQ3dHRuc294eCJ9.HxS1sq3AKWkeq4r_Yx73MA" | vercel env add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN preview

# Satellite Data
Write-Host "" 
Write-Host "🛰️ Setting ESD Platform..." -ForegroundColor Cyan
Write-Host "  → ESD_CLIENT_ID (production)" -ForegroundColor Gray
"your-esd-client-id" | vercel env add ESD_CLIENT_ID production
Write-Host "  → ESD_CLIENT_ID (preview)" -ForegroundColor Gray
"your-esd-client-id" | vercel env add ESD_CLIENT_ID preview

Write-Host "  → ESD_CLIENT_SECRET (production)" -ForegroundColor Gray
"your-esd-client-secret" | vercel env add ESD_CLIENT_SECRET production
Write-Host "  → ESD_CLIENT_SECRET (preview)" -ForegroundColor Gray
"your-esd-client-secret" | vercel env add ESD_CLIENT_SECRET preview

Write-Host "  → ESD_AUTH_URL (production)" -ForegroundColor Gray
"https://auth.esd.earth/oauth/token" | vercel env add ESD_AUTH_URL production
Write-Host "  → ESD_AUTH_URL (preview)" -ForegroundColor Gray
"https://auth.esd.earth/oauth/token" | vercel env add ESD_AUTH_URL preview

Write-Host "  → ESD_API_BASE_URL (production)" -ForegroundColor Gray
"https://api.esd.earth/v1" | vercel env add ESD_API_BASE_URL production
Write-Host "  → ESD_API_BASE_URL (preview)" -ForegroundColor Gray
"https://api.esd.earth/v1" | vercel env add ESD_API_BASE_URL preview

# Firebase Services
Write-Host ""
Write-Host "🔥 Setting Firebase..." -ForegroundColor Cyan
Write-Host "  → NEXT_PUBLIC_FIREBASE_API_KEY (production)" -ForegroundColor Gray
"AIzaSyC3xSrW3F8ib0DztV4WPVWtG_7qLpEOlPY" | vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
Write-Host "  → NEXT_PUBLIC_FIREBASE_API_KEY (preview)" -ForegroundColor Gray
"AIzaSyC3xSrW3F8ib0DztV4WPVWtG_7qLpEOlPY" | vercel env add NEXT_PUBLIC_FIREBASE_API_KEY preview

Write-Host "  → NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN (production)" -ForegroundColor Gray
"adham-agritech-529b0.firebaseapp.com" | vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
Write-Host "  → NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN (preview)" -ForegroundColor Gray
"adham-agritech-529b0.firebaseapp.com" | vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN preview

Write-Host "  → NEXT_PUBLIC_FIREBASE_PROJECT_ID (production)" -ForegroundColor Gray
"adham-agritech-529b0" | vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
Write-Host "  → NEXT_PUBLIC_FIREBASE_PROJECT_ID (preview)" -ForegroundColor Gray
"adham-agritech-529b0" | vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID preview

Write-Host "  → NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET (production)" -ForegroundColor Gray
"adham-agritech-529b0.firebasestorage.app" | vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
Write-Host "  → NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET (preview)" -ForegroundColor Gray
"adham-agritech-529b0.firebasestorage.app" | vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET preview

Write-Host "  → NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID (production)" -ForegroundColor Gray
"937637426118" | vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
Write-Host "  → NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID (preview)" -ForegroundColor Gray
"937637426118" | vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID preview

Write-Host "  → NEXT_PUBLIC_FIREBASE_APP_ID (production)" -ForegroundColor Gray
"1:937637426118:web:3eee8eb98a316c114d78c7" | vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production
Write-Host "  → NEXT_PUBLIC_FIREBASE_APP_ID (preview)" -ForegroundColor Gray
"1:937637426118:web:3eee8eb98a316c114d78c7" | vercel env add NEXT_PUBLIC_FIREBASE_APP_ID preview

Write-Host "  → FIREBASE_PROJECT_ID (production)" -ForegroundColor Gray
"adham-agritech-529b0" | vercel env add FIREBASE_PROJECT_ID production
Write-Host "  → FIREBASE_PROJECT_ID (preview)" -ForegroundColor Gray
"adham-agritech-529b0" | vercel env add FIREBASE_PROJECT_ID preview

Write-Host "  → FIREBASE_CLIENT_EMAIL (production)" -ForegroundColor Gray
"firebase-adminsdk-tgizh@adham-agritech-529b0.iam.gserviceaccount.com" | vercel env add FIREBASE_CLIENT_EMAIL production
Write-Host "  → FIREBASE_CLIENT_EMAIL (preview)" -ForegroundColor Gray
"firebase-adminsdk-tgizh@adham-agritech-529b0.iam.gserviceaccount.com" | vercel env add FIREBASE_CLIENT_EMAIL preview

Write-Host "  → FIREBASE_STORAGE_BUCKET (production)" -ForegroundColor Gray
"adham-agritech-529b0.firebasestorage.app" | vercel env add FIREBASE_STORAGE_BUCKET production
Write-Host "  → FIREBASE_STORAGE_BUCKET (preview)" -ForegroundColor Gray
"adham-agritech-529b0.firebasestorage.app" | vercel env add FIREBASE_STORAGE_BUCKET preview

# Application Configuration
Write-Host ""
Write-Host "⚙️ Setting App Config..." -ForegroundColor Cyan
Write-Host "  → NEXT_PUBLIC_APP_URL (production)" -ForegroundColor Gray
"https://adham-agritech.vercel.app" | vercel env add NEXT_PUBLIC_APP_URL production
Write-Host "  → NEXT_PUBLIC_APP_URL (preview)" -ForegroundColor Gray
"https://adham-agritech.vercel.app" | vercel env add NEXT_PUBLIC_APP_URL preview

Write-Host ""
Write-Host "✅ All environment variables have been set!" -ForegroundColor Green
Write-Host "🔄 Now redeploy your application:" -ForegroundColor Yellow
Write-Host "   vercel --prod" -ForegroundColor White
Write-Host ""
