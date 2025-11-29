# ✅ قائمة التحقق الشاملة لمتغيرات البيئة في Vercel

## 🎯 الهدف
تأكد من أن جميع المتغيرات المطلوبة موجودة في Vercel Production Environment

## 📍 الرابط المباشر
```
https://vercel.com/adhamlouxors-projects/adham-agritech/settings/environment-variables
```

---

## 🔑 المتغيرات المطلوبة (Production)

### 1️⃣ قاعدة البيانات - Supabase (مطلوب)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://mxnkwudqxtgduhenrgvm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bmt3dWRxeHRnZHVoZW5yZ3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODkwMDUsImV4cCI6MjA2ODk2NTAwNX0.yVugFF3oc0aRry4UddG8pGdarX0iNUq6g_ZrZJdz3gc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bmt3dWRxeHRnZHVoZW5yZ3ZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM4OTAwNSwiZXhwIjoyMDY4OTY1MDA1fQ.7iSorPwuXP2i7ry7PKAW9WjS7vNR1Gjl5htndn6A7KQ
```

### 2️⃣ الذكاء الاصطناعي - AI Assistants (مطلوب - المساعدين متوقفين!)

```bash
# Groq (Primary)
GROQ_API_KEY=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
GROQ_MODEL=llama-3.3-70b-versatile

# Google Gemini (Fallback)
GOOGLE_AI_API_KEY=AIzaSyCjVqxv4vy8gXy3O0BNEp9dAB_UBKI2mh0
GOOGLE_AI_MODEL=gemini-2.0-flash

# OpenAI (Optional)
OPENAI_API_KEY=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
```

### 3️⃣ الأقمار الصناعية - EOSDA (مطلوب)

```bash
# Server-side
EOSDA_API_KEY=apk.cefa9921669b0857be282894813d1213ed88c5e8299e29a5e91db105464aa232
EOSDA_API_URL=https://api-connect.eos.com
EOSDA_API_BASE_URL=https://api-connect.eos.com
EOSDA_API_VERSION=v1

# Client-side (Public)
NEXT_PUBLIC_EOSDA_API_KEY=apk.cefa9921669b0857be282894813d1213ed88c5e8299e29a5e91db105464aa232
NEXT_PUBLIC_EOSDA_API_URL=https://api-connect.eos.com
NEXT_PUBLIC_EOSDA_API_BASE_URL=https://api-connect.eos.com
NEXT_PUBLIC_EOSDA_API_VERSION=v1
NEXT_PUBLIC_EOSDA_CENTER_LAT=25.30084
NEXT_PUBLIC_EOSDA_CENTER_LNG=32.55524
NEXT_PUBLIC_EOSDA_DEFAULT_ZOOM=6
NEXT_PUBLIC_EOSDA_MIN_ZOOM=1
NEXT_PUBLIC_EOSDA_MAX_ZOOM=18
NEXT_PUBLIC_EOSDA_DEFAULT_CLOUD_COVERAGE=20
```

### 4️⃣ الطقس - Weather (مطلوب)

```bash
OPENWEATHER_API_KEY=bf14cf140dd3f8ddfd62b4fd9f6f9795
```

### 5️⃣ الخرائط - Maps (اختياري)

```bash
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=sk.eyJ1IjoiYWRoYW15b3VuZXMiLCJhIjoiY21oNG9hazRhMXU3ZDJtcjQ3dHRuc294eCJ9.HxS1sq3AKWkeq4r_Yx73MA
NEXT_PUBLIC_MAPBOX_STYLE=satellite-v9
```

### 6️⃣ Firebase (اختياري)

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC3xSrW3F8ib0DztV4WPVWtG_7qLpEOlPY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=adham-agritech-529b0.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=adham-agritech-529b0
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=adham-agritech-529b0.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=937637426118
NEXT_PUBLIC_FIREBASE_APP_ID=1:937637426118:web:3eee8eb98a316c114d78c7
```

### 7️⃣ التطبيق - Application

```bash
NEXT_PUBLIC_APP_URL=https://adham-agritech.vercel.app
NEXT_PUBLIC_DEFAULT_LANGUAGE=ar
```

---

## ✅ قائمة التحقق

### متغيرات Supabase
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY

### متغيرات AI (المساعدين متوقفين!)
- [ ] GROQ_API_KEY ⚠️ **مهم جداً**
- [ ] GROQ_MODEL
- [ ] GOOGLE_AI_API_KEY ⚠️ **مهم جداً**
- [ ] GOOGLE_AI_MODEL
- [ ] OPENAI_API_KEY (اختياري)

### متغيرات EOSDA
- [ ] EOSDA_API_KEY
- [ ] EOSDA_API_URL
- [ ] NEXT_PUBLIC_EOSDA_API_KEY
- [ ] NEXT_PUBLIC_EOSDA_API_URL

### متغيرات أخرى
- [ ] OPENWEATHER_API_KEY
- [ ] NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN (اختياري)

---

## 🔍 كيفية التحقق

1. اذهب إلى: https://vercel.com/adhamlouxors-projects/adham-agritech/settings/environment-variables
2. تحقق من كل متغير في القائمة أعلاه
3. تأكد من أن **Production** مفعّل لكل متغير
4. إذا كان متغير مفقود → **Add** → انسخ القيمة من القائمة أعلاه
5. بعد إضافة/تعديل المتغيرات → **Redeploy** من Deployments

---

## ⚠️ ملاحظات مهمة

1. **المساعدين متوقفين**: تأكد من وجود `GROQ_API_KEY` و `GOOGLE_AI_API_KEY`
2. **EOSDA URL**: يجب أن يكون `https://api-connect.eos.com` (ليس `api.eosda.com`)
3. **البيئات**: تأكد من تفعيل **Production** لكل متغير
4. **بعد التعديل**: يجب إعادة النشر (Redeploy)

---

## 🚀 بعد إضافة المتغيرات

```bash
# من Vercel Dashboard:
1. اذهب إلى Deployments
2. انقر على آخر deployment
3. انقر على "Redeploy"
4. انتظر حتى يكتمل النشر
```

---

**تاريخ الإنشاء**: 2025-11-29  
**آخر تحديث**: 2025-11-29


