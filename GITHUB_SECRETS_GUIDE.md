# 🔐 دليل إضافة GitHub Secrets - خطوة بخطوة

## 📍 الرابط المباشر
```
https://github.com/adham-younes/Adham-AgriTech-Full-Stack/settings/secrets/actions
```

---

## 📝 كيفية الإضافة

1. افتح الرابط أعلاه
2. انقر على **"New repository secret"**
3. انسخ **Name** والصقه
4. انسخ **Value** والصقه
5. انقر على **"Add secret"**
6. كرر للمتغير التالي

---

## 🔑 المتغيرات المطلوبة (17)

### 1. قاعدة البيانات - Supabase

#### Secret #1
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://mxnkwudqxtgduhenrgvm.supabase.co
```

#### Secret #2
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bmt3dWRxeHRnZHVoZW5yZ3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODkwMDUsImV4cCI6MjA2ODk2NTAwNX0.yVugFF3oc0aRry4UddG8pGdarX0iNUq6g_ZrZJdz3gc
```

#### Secret #3
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bmt3dWRxeHRnZHVoZW5yZ3ZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM4OTAwNSwiZXhwIjoyMDY4OTY1MDA1fQ.7iSorPwuXP2i7ry7PKAW9WjS7vNR1Gjl5htndn6A7KQ
```

---

### 2. خدمات الذكاء الاصطناعي - AI

#### Secret #4
```
Name: OPENAI_API_KEY
Value: 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
```

#### Secret #5
```
Name: GROQ_API_KEY
Value: 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
```

---

### 3. الطقس - Weather

#### Secret #6
```
Name: OPENWEATHER_API_KEY
Value: bf14cf140dd3f8ddfd62b4fd9f6f9795
```

---

### 4. الخرائط - Maps

#### Secret #7
```
Name: NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
Value: sk.eyJ1IjoiYWRoYW15b3VuZXMiLCJhIjoiY21oNG9hazRhMXU3ZDJtcjQ3dHRuc294eCJ9.HxS1sq3AKWkeq4r_Yx73MA
```

---

### 5. الأقمار الصناعية - ESD Platform

#### Secret #8
```
Name: ESD_CLIENT_ID
Value: your-esd-client-id
```

#### Secret #9
```
Name: ESD_CLIENT_SECRET
Value: your-esd-client-secret
```

#### Secret #10
```
Name: ESD_AUTH_URL
Value: https://auth.esd.earth/oauth/token
```

#### Secret #11
```
Name: ESD_API_BASE_URL
Value: https://api.esd.earth/v1
```

---

### 6. Firebase

#### Secret #11
```
Name: NEXT_PUBLIC_FIREBASE_API_KEY
Value: AIzaSyC3xSrW3F8ib0DztV4WPVWtG_7qLpEOlPY
```

#### Secret #12
```
Name: NEXT_PUBLIC_FIREBASE_PROJECT_ID
Value: adham-agritech-529b0
```

#### Secret #13
```
Name: FIREBASE_PROJECT_ID
Value: adham-agritech-529b0
```

---

### 7. Vercel

#### Secret #14
```
Name: VERCEL_TOKEN
Value: SYFwzABFRXzKTB7uMAyDOPP4
```

#### Secret #15
```
Name: VERCEL_ORG_ID
Value: team_FWfSZ1vGknqWNQ52Y4bmoHlU
```

#### Secret #16
```
Name: VERCEL_PROJECT_ID
Value: prj_PgnyG7cJb4coRJCUV19FTrOBVE7X
```

---

### 8. التطبيق - Application

#### Secret #17
```
Name: NEXT_PUBLIC_APP_URL
Value: https://adham-agritech.vercel.app
```

---

## ✅ قائمة التحقق

بعد إضافة كل secret، ضع علامة:

- [ ] 1. NEXT_PUBLIC_SUPABASE_URL
- [ ] 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] 3. SUPABASE_SERVICE_ROLE_KEY
- [ ] 4. OPENAI_API_KEY
- [ ] 5. GROQ_API_KEY
- [ ] 6. OPENWEATHER_API_KEY
- [ ] 7. NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
- [ ] 8. ESD_CLIENT_ID
- [ ] 9. ESD_CLIENT_SECRET
- [ ] 10. ESD_AUTH_URL
- [ ] 11. ESD_API_BASE_URL
- [ ] 11. NEXT_PUBLIC_FIREBASE_API_KEY
- [ ] 12. NEXT_PUBLIC_FIREBASE_PROJECT_ID
- [ ] 13. FIREBASE_PROJECT_ID
- [ ] 14. VERCEL_TOKEN
- [ ] 15. VERCEL_ORG_ID
- [ ] 16. VERCEL_PROJECT_ID
- [ ] 17. NEXT_PUBLIC_APP_URL

---

## 🎯 بعد الانتهاء

عند إضافة جميع الـ 17 secrets، انتقل إلى:
**VERCEL_ENVIRONMENT_GUIDE.md** لإضافة المتغيرات في Vercel

---

**الوقت المتوقع:** 10-15 دقيقة  
**عدد المتغيرات:** 17
