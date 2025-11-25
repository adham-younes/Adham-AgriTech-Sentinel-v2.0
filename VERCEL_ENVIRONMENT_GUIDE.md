# 🚀 دليل إضافة Vercel Environment Variables - خطوة بخطوة

## 📍 الرابط المباشر
```
https://vercel.com/dashboard
```

ثم:
1. اختر المشروع: **adham-agritech**
2. اذهب إلى: **Settings**
3. اختر: **Environment Variables**

---

## 📝 كيفية الإضافة

1. انقر على **"Add New"** أو **"Add Variable"**
2. انسخ **Key** (الاسم) والصقه
3. انسخ **Value** (القيمة) والصقه
4. اختر البيئات:
   - ✅ **Production**
   - ✅ **Preview**
   - ✅ **Development**
5. انقر على **"Save"**
6. كرر للمتغير التالي

---

## 🔑 المتغيرات المطلوبة (نفس GitHub Secrets)

### 1. قاعدة البيانات - Supabase

#### Variable #1
```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://mxnkwudqxtgduhenrgvm.supabase.co
Environments: Production, Preview, Development
```

#### Variable #2
```
Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bmt3dWRxeHRnZHVoZW5yZ3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODkwMDUsImV4cCI6MjA2ODk2NTAwNX0.yVugFF3oc0aRry4UddG8pGdarX0iNUq6g_ZrZJdz3gc
Environments: Production, Preview, Development
```

#### Variable #3
```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bmt3dWRxeHRnZHVoZW5yZ3ZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM4OTAwNSwiZXhwIjoyMDY4OTY1MDA1fQ.7iSorPwuXP2i7ry7PKAW9WjS7vNR1Gjl5htndn6A7KQ
Environments: Production, Preview, Development
```

---

### 2. خدمات الذكاء الاصطناعي - AI

#### Variable #4
```
Key: OPENAI_API_KEY
Value: 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
Environments: Production, Preview, Development
```

#### Variable #5
```
Key: GROQ_API_KEY
Value: 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
Environments: Production, Preview, Development
```

---

### 3. الطقس - Weather

#### Variable #6
```
Key: OPENWEATHER_API_KEY
Value: bf14cf140dd3f8ddfd62b4fd9f6f9795
Environments: Production, Preview, Development
```

---

### 4. الخرائط - Maps

#### Variable #7
```
Key: NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
Value: sk.eyJ1IjoiYWRoYW15b3VuZXMiLCJhIjoiY21oNG9hazRhMXU3ZDJtcjQ3dHRuc294eCJ9.HxS1sq3AKWkeq4r_Yx73MA
Environments: Production, Preview, Development
```

---

### 5. الأقمار الصناعية - ESD Platform

#### Variable #8
```
Key: ESD_CLIENT_ID
Value: your-esd-client-id
Environments: Production, Preview, Development
```

#### Variable #9
```
Key: ESD_CLIENT_SECRET
Value: your-esd-client-secret
Environments: Production, Preview, Development
```

#### Variable #10
```
Key: ESD_AUTH_URL
Value: https://auth.esd.earth/oauth/token
Environments: Production, Preview, Development
```

#### Variable #11
```
Key: ESD_API_BASE_URL
Value: https://api.esd.earth/v1
Environments: Production, Preview, Development
```

---

### 6. Firebase

#### Variable #11
```
Key: NEXT_PUBLIC_FIREBASE_API_KEY
Value: AIzaSyC3xSrW3F8ib0DztV4WPVWtG_7qLpEOlPY
Environments: Production, Preview, Development
```

#### Variable #12
```
Key: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
Value: adham-agritech-529b0.firebaseapp.com
Environments: Production, Preview, Development
```

#### Variable #13
```
Key: NEXT_PUBLIC_FIREBASE_PROJECT_ID
Value: adham-agritech-529b0
Environments: Production, Preview, Development
```

#### Variable #14
```
Key: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
Value: adham-agritech-529b0.firebasestorage.app
Environments: Production, Preview, Development
```

#### Variable #15
```
Key: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
Value: 937637426118
Environments: Production, Preview, Development
```

#### Variable #16
```
Key: NEXT_PUBLIC_FIREBASE_APP_ID
Value: 1:937637426118:web:3eee8eb98a316c114d78c7
Environments: Production, Preview, Development
```

---

### 7. التطبيق - Application

#### Variable #17
```
Key: NEXT_PUBLIC_APP_URL
Value: https://adham-agritech.vercel.app
Environments: Production, Preview, Development
```

#### Variable #18
```
Key: NEXT_PUBLIC_DEFAULT_LANGUAGE
Value: ar
Environments: Production, Preview, Development
```

---

## ✅ قائمة التحقق

بعد إضافة كل variable، ضع علامة:

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
- [ ] 12. NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- [ ] 13. NEXT_PUBLIC_FIREBASE_PROJECT_ID
- [ ] 14. NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- [ ] 15. NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- [ ] 16. NEXT_PUBLIC_FIREBASE_APP_ID
- [ ] 17. NEXT_PUBLIC_APP_URL
- [ ] 18. NEXT_PUBLIC_DEFAULT_LANGUAGE

---

## 💡 نصائح مهمة

### 1. اختيار البيئات
دائماً اختر الثلاث بيئات:
- ✅ Production (الإنتاج)
- ✅ Preview (المعاينة)
- ✅ Development (التطوير)

### 2. المتغيرات الحساسة
المتغيرات التي تبدأ بـ `NEXT_PUBLIC_` ستكون مرئية في الكود المُنشأ.  
المتغيرات الأخرى (مثل `SUPABASE_SERVICE_ROLE_KEY`) ستبقى سرية.

### 3. إعادة النشر
بعد إضافة المتغيرات، قد تحتاج لإعادة نشر المشروع:
- اذهب إلى **Deployments**
- انقر على **Redeploy** للنشر الأخير

---

## 🎯 بعد الانتهاء

عند إضافة جميع المتغيرات:

1. ✅ تحقق من أن جميع المتغيرات مضافة
2. ✅ تأكد من اختيار الثلاث بيئات لكل متغير
3. ✅ انتقل إلى الخطوة التالية: دفع التغييرات

---

**الوقت المتوقع:** 15-20 دقيقة  
**عدد المتغيرات:** 18  
**البيئات:** 3 (Production, Preview, Development)
