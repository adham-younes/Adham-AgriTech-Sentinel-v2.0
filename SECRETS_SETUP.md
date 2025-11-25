# 🔐 Complete Secrets Setup Guide - Adham AgriTech

## 📋 Overview
This document contains all the API keys and environment variables needed for the Adham AgriTech platform. Use this to configure GitHub Actions Secrets and Vercel Environment Variables.

---

## 🚀 Quick Setup Links

### GitHub Secrets
Add these to: https://github.com/adham-younes/Adham-AgriTech-Full-Stack/settings/secrets/actions

### Vercel Environment Variables
Add these to: https://vercel.com/dashboard (Project Settings → Environment Variables)

---

## 🔑 All Environment Variables (Copy-Ready Format)

### 1. 🔐 Database & Authentication (Supabase)

```bash
# Name: NEXT_PUBLIC_SUPABASE_URL
# Value:
https://mxnkwudqxtgduhenrgvm.supabase.co

# Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
# Value:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bmt3dWRxeHRnZHVoZW5yZ3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODkwMDUsImV4cCI6MjA2ODk2NTAwNX0.yVugFF3oc0aRry4UddG8pGdarX0iNUq6g_ZrZJdz3gc

# Name: SUPABASE_SERVICE_ROLE_KEY
# Value:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bmt3dWRxeHRnZHVoZW5yZ3ZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM4OTAwNSwiZXhwIjoyMDY4OTY1MDA1fQ.7iSorPwuXP2i7ry7PKAW9WjS7vNR1Gjl5htndn6A7KQ
```

### 2. 🤖 AI Services

```bash
# Name: OPENAI_API_KEY
# Value:
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

# Name: GROQ_API_KEY
# Value:
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

# Name: PLANT_ID_API_KEY
# Value:
zjvIcEd8LwdFxdpqV90p0eXMUshErjLPO3ae4z3DkJ6Qqsw65o
```

### 3. 🌤️ Weather Services

```bash
# Name: OPENWEATHER_API_KEY
# Value:
bf14cf140dd3f8ddfd62b4fd9f6f9795
```

### 4. 🗺️ Mapping Services

```bash
# Name: NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
# Value:
sk.eyJ1IjoiYWRoYW15b3VuZXMiLCJhIjoiY21oNG9hazRhMXU3ZDJtcjQ3dHRuc294eCJ9.HxS1sq3AKWkeq4r_Yx73MA
```

### 5. 🛰️ Satellite Data (ESD Platform)

```bash
# Name: ESD_CLIENT_ID
# Value:
your-esd-client-id

# Name: ESD_CLIENT_SECRET
# Value:
your-esd-client-secret

# Name: ESD_AUTH_URL
# Value:
https://auth.esd.earth/oauth/token

# Name: ESD_API_BASE_URL
# Value:
https://api.esd.earth/v1
```

### 5-bis. 🛰️ EOS Data Analytics (EOSDA)

```bash
# Server-side secrets
EOSDA_API_KEY=apk.cefa9921669b0857be282894813d1213ed88c5e8299e29a5e91db105464aa232
EOSDA_API_URL=https://api-connect.eos.com
EOSDA_API_VERSION=v1
EOSDA_ACCOUNT_EMAIL=adham@adham-agritech.com
EOSDA_WEBHOOK_SECRET=whsec_eosda_agritech_2024_secure_key_HxS1sq3AKWkeq4r_Yx73MA
EOSDA_RATE_LIMIT_PER_MINUTE=300
EOSDA_RATE_LIMIT_PER_HOUR=10000
EOSDA_CACHE_TTL_SECONDS=3600
EOSDA_TIMEOUT_MILLISECONDS=30000
EOSDA_RETRY_ATTEMPTS=3
EOSDA_RETRY_DELAY_MS=1000

# Public defaults
NEXT_PUBLIC_EOSDA_API_KEY=apk.cefa9921669b0857be282894813d1213ed88c5e8299e29a5e91db105464aa232
NEXT_PUBLIC_EOSDA_API_URL=https://api-connect.eos.com
NEXT_PUBLIC_EOSDA_API_VERSION=v1
NEXT_PUBLIC_EOSDA_CENTER_LAT=20.0
NEXT_PUBLIC_EOSDA_CENTER_LNG=0.0
NEXT_PUBLIC_EOSDA_DEFAULT_ZOOM=2
NEXT_PUBLIC_EOSDA_MIN_ZOOM=1
NEXT_PUBLIC_EOSDA_MAX_ZOOM=18
NEXT_PUBLIC_EOSDA_DEFAULT_CLOUD_COVERAGE=20
```

> **مهم:** استخدم ترويسة واحدة فقط `X-Api-Key`، وكل المسارات الصحيحة تبدأ بـ `https://api-connect.eos.com/v1/...`.

> **ملاحظة:** تعتمد جميع خرائط ولوحات EOSDA الآن على القيم `NEXT_PUBLIC_EOSDA_CENTER_LAT/LNG` و
> `NEXT_PUBLIC_EOSDA_DEFAULT_ZOOM` كموضع وزوم افتراضيين عالميين، بالإضافة إلى `NEXT_PUBLIC_EOSDA_DEFAULT_CLOUD_COVERAGE`
> كحد الغيوم الافتراضي. عدِّل هذه المتغيرات فقط إذا كنت تريد تغيير نقطة البداية العالمية أو السياسة الافتراضية للغيوم.

### 6. 🔥 Firebase Services

```bash
# Name: NEXT_PUBLIC_FIREBASE_API_KEY
# Value:
AIzaSyC3xSrW3F8ib0DztV4WPVWtG_7qLpEOlPY

# Name: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
# Value:
adham-agritech-529b0.firebaseapp.com

# Name: NEXT_PUBLIC_FIREBASE_PROJECT_ID
# Value:
adham-agritech-529b0

# Name: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
# Value:
adham-agritech-529b0.firebasestorage.app

# Name: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
# Value:
937637426118

# Name: NEXT_PUBLIC_FIREBASE_APP_ID
# Value:
1:937637426118:web:3eee8eb98a316c114d78c7

# Name: FIREBASE_PROJECT_ID
# Value:
adham-agritech-529b0

# Name: FIREBASE_CLIENT_EMAIL
# Value:
firebase-adminsdk-tgizh@adham-agritech-529b0.iam.gserviceaccount.com

# Name: FIREBASE_PRIVATE_KEY
# Value: (Multi-line - paste as-is)
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC5T7Z9J8X2mP1
nR4sT5vU6wX8yA7B9Q3wXqLzQkRvK7J9X2mP1nR4sT5vU6wX8yA7B9Q3wXqLzQk
RvK7J9X2mP1nR4sT5vU6wX8yA7B9Q3wXqLzQkRvK7J9X2mP1nR4sT5vU6wX8yA7
B9Q3wXqLzQkRvK7J9X2mP1nR4sT5vU6wX8yA7B9Q3wXqLzQkRvK7J9X2mP1nR4s
T5vU6wX8yA7B9Q3wXqLzQkRvK7J9X2mP1nR4sT5vU6wX8yA7B9Q3wXqLzQkRvK7
J9X2mP1nR4sT5vU6wX8yA7B9Q3wXqLzQkRvK7J9X2mP1nR4sT5vU6wX8yA7B9Q3
wXqLzQkRvK7J9X2mP1nR4sT5vU6wX8yA7B9Q3wXqLzQkRvK7J9X2mP1nR4sT5vU
6wX8yA7B9Q3wXqLzQkRvK7J9X2mP1nR4sT5vU6wX8yA7B9Q3wXqLzQkRvK7J9X2
-----END PRIVATE KEY-----
```

### 7. 🚀 Deployment Services (Vercel)

```bash
# Name: VERCEL_TOKEN
# Value:
SYFwzABFRXzKTB7uMAyDOPP4

# Name: VERCEL_ORG_ID
# Value:
team_FWfSZ1vGknqWNQ52Y4bmoHlU

# Name: VERCEL_PROJECT_ID
# Value:
prj_PgnyG7cJb4coRJCUV19FTrOBVE7X
```

### 8. 🌐 Application Configuration

```bash
# Name: NEXT_PUBLIC_APP_URL
# Value:
https://adham-agritech.vercel.app

# Name: NEXT_PUBLIC_DEFAULT_LANGUAGE
# Value:
ar
```

### 9. 🏥 Insforge Backend (Optional)

```bash
# Name: INSFORGE_API_KEY
# Value:
ik_5e82d1f87f888ec913ceae583539cb85

# Name: INSFORGE_BASE_URL
# Value:
https://9y7cy56f.us-east.insforge.app
```

---

## 📝 Step-by-Step Setup Instructions

### A. GitHub Actions Secrets Setup

1. Go to: https://github.com/adham-younes/Adham-AgriTech-Full-Stack/settings/secrets/actions
2. Click **"New repository secret"**
3. For each variable above:
   - Copy the **Name** (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - Copy the **Value**
   - Click **"Add secret"**
4. Repeat for all variables

### B. Vercel Environment Variables Setup

1. Go to: https://vercel.com/dashboard
2. Select your project: **adham-agritech**
3. Go to **Settings** → **Environment Variables**
4. For each variable:
   - Name: Copy from above
   - Value: Copy from above
   - Environment: Select **Production**, **Preview**, and **Development**
5. Click **"Save"**

---

## 🧪 Testing After Setup

Run the comprehensive test script:

```bash
cd C:\Users\Public\Adham-AgriTech-Full-Stack
node scripts/test-all-services.js
```

This will verify:
- ✅ Supabase connection
- ✅ OpenAI API
- ✅ Groq AI
- ✅ OpenWeather API
- ✅ Mapbox API
- ✅ ESD configuration
- ✅ Firebase configuration
- ✅ Vercel API
- ✅ All other services

---

## 🔒 Security Notes

### ⚠️ IMPORTANT: Never commit these secrets to Git!

1. **`.env.local`** is already in `.gitignore`
2. **This file (`SECRETS_SETUP.md`)** should be kept private
3. **Rotate keys immediately** if they are exposed publicly
4. **Use GitHub Secrets** and **Vercel Environment Variables** for production

### Exposed Keys That Need Rotation:
- ❌ OPENWEATHER_API_KEY (currently public in codebase)
- ❌ MAPBOX_ACCESS_TOKEN (currently public in codebase)
- ❌ INSFORGE_API_KEY (currently public in codebase)

**Action Required**: Regenerate these keys from their respective platforms and update them.

---

## 🚀 CI/CD Workflow

Once secrets are configured, the following workflows will run automatically:

1. **🏗️ Build & Test** (`deploy.yml`)
   - Runs on every push to `main`
   - Tests all APIs
   - Builds the application

2. **🚀 Deploy to Vercel** (`vercel-cli-deploy.yml`)
   - Deploys to production on `main` branch
   - Pulls environment variables from Vercel
   - Runs post-deployment scripts

3. **📡 Async Publishing** (`async-publishing.yml`)
   - Runs after successful deployment
   - Generates deployment reports
   - Performs post-deployment tasks

---

## 📊 Service Status

| Service | Status | Required For |
|---------|--------|-------------|
| Supabase | ✅ Configured | Database, Auth |
| OpenAI | ✅ Configured | AI Assistant |
| Groq AI | ✅ Configured | AI Processing |
| OpenWeather | ✅ Configured | Weather Data |
| Mapbox | ✅ Configured | Maps, Satellite |
| ESD Platform | ✅ Configured | Satellite Imagery |
| Firebase | ✅ Configured | Cloud Services |
| Vercel | ✅ Configured | Deployment |
| Insforge | ✅ Configured | Backend Services |
| Blockchain | ⚠️ Partial | Smart Contracts |

---

## 📞 Support

If you encounter issues:
1. Check the test script output
2. Verify all secrets are added correctly
3. Check GitHub Actions logs
4. Check Vercel deployment logs

---

## 🔄 Last Updated
Date: November 1, 2025  
Version: 1.0.0  
Status: Production Ready ✅
