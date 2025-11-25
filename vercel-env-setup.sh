#!/bin/bash
# ===========================================
# Adham AgriTech - Vercel Environment Setup
# ===========================================
# Run this script to upload all environment variables to Vercel
# Usage: bash vercel-env-setup.sh

echo "🚀 Setting up Vercel Environment Variables..."
echo ""

# Database & Authentication
echo "📦 Setting Supabase variables..."
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview <<< "https://mxnkwudqxtgduhenrgvm.supabase.co"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bmt3dWRxeHRnZHVoZW5yZ3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MjM4NzAsImV4cCI6MjA1MDQ5OTg3MH0.YLbYwqN8BQ3wXqLzQkRvK7J9X2mP1nR4sT5vU6wX8yA"

# Weather API
echo "🌤️ Setting Weather API..."
vercel env add OPENWEATHER_API_KEY production preview <<< "bf14cf140dd3f8ddfd62b4fd9f6f9795"

# AI Services
echo "🤖 Setting AI Services..."
vercel env add GROQ_API_KEY production preview <<< "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"
vercel env add OPENAI_API_KEY production preview <<< "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"
vercel env add GOOGLE_AI_API_KEY production preview <<< "AIzaSyCjVqxv4vy8gXy3O0BNEp9dAB_UBKI2mh0"

# Mapping Service
echo "🗺️ Setting Mapbox..."
vercel env add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN production preview <<< "sk.eyJ1IjoiYWRoYW15b3VuZXMiLCJhIjoiY21oNG9hazRhMXU3ZDJtcjQ3dHRuc294eCJ9.HxS1sq3AKWkeq4r_Yx73MA"

# Satellite Data
echo "🛰️ Setting ESD Platform..."
vercel env add ESD_CLIENT_ID production preview <<< "your-esd-client-id"
vercel env add ESD_CLIENT_SECRET production preview <<< "your-esd-client-secret"
vercel env add ESD_AUTH_URL production preview <<< "https://auth.esd.earth/oauth/token"
vercel env add ESD_API_BASE_URL production preview <<< "https://api.esd.earth/v1"

# Firebase Services
echo "🔥 Setting Firebase..."
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production preview <<< "AIzaSyC3xSrW3F8ib0DztV4WPVWtG_7qLpEOlPY"
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production preview <<< "adham-agritech-529b0.firebaseapp.com"
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production preview <<< "adham-agritech-529b0"
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production preview <<< "adham-agritech-529b0.firebasestorage.app"
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production preview <<< "937637426118"
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production preview <<< "1:937637426118:web:3eee8eb98a316c114d78c7"
vercel env add FIREBASE_PROJECT_ID production preview <<< "adham-agritech-529b0"
vercel env add FIREBASE_CLIENT_EMAIL production preview <<< "firebase-adminsdk-tgizh@adham-agritech-529b0.iam.gserviceaccount.com"
vercel env add FIREBASE_STORAGE_BUCKET production preview <<< "adham-agritech-529b0.firebasestorage.app"

# Application Configuration
echo "⚙️ Setting App Config..."
vercel env add NEXT_PUBLIC_APP_URL production preview <<< "https://adham-agritech.vercel.app"

echo ""
echo "✅ All environment variables have been set!"
echo "🔄 Now redeploy your application:"
echo "   vercel --prod"
echo ""
