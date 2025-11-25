# 🚀 دليل رفع الـ Secrets تلقائياً من الطرفية

## 📋 المتطلبات

### 1. GitHub CLI (gh)
```powershell
# تثبيت GitHub CLI
winget install --id GitHub.cli
```

**أو** حمّله من: https://cli.github.com/

### 2. تسجيل الدخول في GitHub CLI
```powershell
gh auth login
```

اتبع التعليمات لتسجيل الدخول.

---

## 🔐 رفع GitHub Secrets

### الطريقة 1: استخدام GitHub CLI (موصى بها)

```powershell
# انتقل إلى مجلد المشروع
cd C:\Users\Public\Adham-AgriTech-Full-Stack

# رفع كل secret يدوياً
gh secret set NEXT_PUBLIC_SUPABASE_URL --body "https://mxnkwudqxtgduhenrgvm.supabase.co"

gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --body "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bmt3dWRxeHRnZHVoZW5yZ3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODkwMDUsImV4cCI6MjA2ODk2NTAwNX0.yVugFF3oc0aRry4UddG8pGdarX0iNUq6g_ZrZJdz3gc"

gh secret set SUPABASE_SERVICE_ROLE_KEY --body "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bmt3dWRxeHRnZHVoZW5yZ3ZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM4OTAwNSwiZXhwIjoyMDY4OTY1MDA1fQ.7iSorPwuXP2i7ry7PKAW9WjS7vNR1Gjl5htndn6A7KQ"

gh secret set OPENAI_API_KEY --body "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"

gh secret set GROQ_API_KEY --body "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"

gh secret set OPENWEATHER_API_KEY --body "bf14cf140dd3f8ddfd62b4fd9f6f9795"

gh secret set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN --body "sk.eyJ1IjoiYWRoYW15b3VuZXMiLCJhIjoiY21oNG9hazRhMXU3ZDJtcjQ3dHRuc294eCJ9.HxS1sq3AKWkeq4r_Yx73MA"

gh secret set ESD_CLIENT_ID --body "your-esd-client-id"

gh secret set ESD_CLIENT_SECRET --body "your-esd-client-secret"

gh secret set ESD_AUTH_URL --body "https://auth.esd.earth/oauth/token"

gh secret set ESD_API_BASE_URL --body "https://api.esd.earth/v1"

gh secret set NEXT_PUBLIC_FIREBASE_API_KEY --body "AIzaSyC3xSrW3F8ib0DztV4WPVWtG_7qLpEOlPY"

gh secret set NEXT_PUBLIC_FIREBASE_PROJECT_ID --body "adham-agritech-529b0"

gh secret set FIREBASE_PROJECT_ID --body "adham-agritech-529b0"

gh secret set VERCEL_TOKEN --body "SYFwzABFRXzKTB7uMAyDOPP4"

gh secret set VERCEL_ORG_ID --body "team_FWfSZ1vGknqWNQ52Y4bmoHlU"

gh secret set VERCEL_PROJECT_ID --body "prj_PgnyG7cJb4coRJCUV19FTrOBVE7X"

gh secret set NEXT_PUBLIC_APP_URL --body "https://adham-agritech.vercel.app"
```

### الطريقة 2: استخدام السكريبت (تجريبي)

```powershell
# تشغيل السكريبت
.\scripts\upload-github-secrets.ps1
```

**ملاحظة:** يتطلب GitHub CLI مثبت ومسجل دخول.

---

## 🚀 رفع Vercel Environment Variables

### الطريقة 1: استخدام Vercel CLI (موصى بها)

#### 1. تثبيت Vercel CLI
```powershell
npm install -g vercel
```

#### 2. تسجيل الدخول
```powershell
vercel login
```

#### 3. ربط المشروع
```powershell
cd C:\Users\Public\Adham-AgriTech-Full-Stack
vercel link
```

#### 4. رفع المتغيرات
```powershell
# رفع كل متغير
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development
# ثم الصق القيمة: https://mxnkwudqxtgduhenrgvm.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development
# ثم الصق القيمة

vercel env add SUPABASE_SERVICE_ROLE_KEY production preview development
# ثم الصق القيمة

# ... كرر لجميع المتغيرات
```

### الطريقة 2: استخدام Vercel API (السكريبت)

```powershell
# احصل على Vercel Token من:
# https://vercel.com/account/tokens

# شغّل السكريبت
.\scripts\upload-vercel-env.ps1
```

---

## 📝 قائمة المتغيرات الكاملة

### GitHub Secrets (17)
1. NEXT_PUBLIC_SUPABASE_URL
2. NEXT_PUBLIC_SUPABASE_ANON_KEY
3. SUPABASE_SERVICE_ROLE_KEY
4. OPENAI_API_KEY
5. GROQ_API_KEY
6. OPENWEATHER_API_KEY
7. NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
8. ESD_CLIENT_ID
9. ESD_CLIENT_SECRET
10. ESD_AUTH_URL
11. ESD_API_BASE_URL
11. NEXT_PUBLIC_FIREBASE_API_KEY
12. NEXT_PUBLIC_FIREBASE_PROJECT_ID
13. FIREBASE_PROJECT_ID
14. VERCEL_TOKEN
15. VERCEL_ORG_ID
16. VERCEL_PROJECT_ID
17. NEXT_PUBLIC_APP_URL

### Vercel Environment Variables (18)
نفس القائمة أعلاه + إضافة:
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- NEXT_PUBLIC_DEFAULT_LANGUAGE

---

## ✅ التحقق من النجاح

### GitHub Secrets
```powershell
# عرض جميع الـ secrets
gh secret list
```

### Vercel Environment Variables
```powershell
# عرض جميع المتغيرات
vercel env ls
```

---

## 🎯 الطريقة الأسرع (موصى بها)

### 1. GitHub Secrets - استخدم GitHub CLI
```powershell
# تأكد من تسجيل الدخول
gh auth status

# انسخ والصق جميع الأوامر من الأعلى
```

### 2. Vercel - استخدم Dashboard
الطريقة اليدوية أسرع وأكثر موثوقية:
```
https://vercel.com/dashboard
→ adham-agritech
→ Settings
→ Environment Variables
→ Add New
```

---

## 🚨 استكشاف الأخطاء

### GitHub CLI غير مثبت
```powershell
winget install --id GitHub.cli
# أو
choco install gh
```

### Vercel CLI غير مثبت
```powershell
npm install -g vercel@latest
```

### مشكلة في التوثيق
```powershell
# GitHub
gh auth logout
gh auth login

# Vercel
vercel logout
vercel login
```

---

## ⏱️ الوقت المتوقع

- **GitHub Secrets (CLI):** 5-10 دقائق
- **Vercel Environment Variables (Dashboard):** 15-20 دقيقة
- **الإجمالي:** 20-30 دقيقة

---

**الطريقة الموصى بها:**
1. ✅ GitHub: استخدم `gh secret set` (أسرع)
2. ✅ Vercel: استخدم Dashboard (أكثر موثوقية)

**ابدأ الآن!** 🚀
