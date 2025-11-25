# 🧪 دليل اختبار الخدمات - Adham AgriTech

## 🔧 ما تم إصلاحه

✅ تم إضافة دالة لتحميل متغيرات البيئة من `.env.local`  
✅ السكريبت الآن يقرأ جميع المتغيرات تلقائياً  
✅ جاهز للاختبار الشامل

---

## 🚀 كيفية تشغيل الاختبار

### الطريقة 1: PowerShell Script (موصى بها)
```powershell
cd C:\Users\Public\Adham-AgriTech-Full-Stack
.\test-services.ps1
```

### الطريقة 2: Node مباشرة
```powershell
cd C:\Users\Public\Adham-AgriTech-Full-Stack
node scripts\test-all-services.js
```

### الطريقة 3: Batch File
```
انقر نقراً مزدوجاً على RUN_TESTS.bat
```

---

## 📊 النتائج المتوقعة

بعد التحديثات، يجب أن ترى:

```
✅ Loaded environment variables from .env.local

============================================================
🧪 ADHAM AGRITECH - COMPREHENSIVE SERVICE TESTING
============================================================

Testing all configured services and integrations...


🔐 Testing Supabase...
✅ Supabase is accessible

🤖 Testing OpenAI...
✅ OpenAI API is accessible
   Models available: X

🤖 Testing Groq AI...
✅ Groq API is accessible

🌤️  Testing OpenWeather...
✅ OpenWeather API is working
   Cairo temp: XX°C
   Weather: ...

🗺️  Testing Mapbox...
✅ Mapbox API is working
   Found X locations

🛰️  Testing ESD Configuration...
✅ ESD credentials configured
   Client ID: your-esd...
   Auth URL: https://auth.esd.earth/oauth/token

🔥 Testing Firebase Configuration...
✅ Firebase API key is valid
   Project ID: adham-agritech-529b0

🚀 Testing Vercel Configuration...
✅ Vercel API is accessible
   Project: adham-agritech

🏥 Testing Insforge Backend...
✅ Insforge backend is accessible

⛓️  Testing Blockchain Configuration...
✅ Blockchain configuration present

============================================================
📊 TEST SUMMARY
============================================================

✅ Passed: 10
   • Supabase Connection
   • OpenAI API
   • Groq API
   • OpenWeather API
   • Mapbox API
   • ESD Configuration
   • Firebase Configuration
   • Vercel API
   • Insforge Backend
   • Blockchain Configuration

⚠️  Skipped: 1
   • Google Earth Engine - Not configured (Future service)

============================================================

Total Services Tested: 11
Success Rate: 90.9%

🎉 All configured services are working!
```

---

## 🔍 إذا واجهت مشاكل

### المشكلة: "Skipped - Missing credentials"

**الحل:**
1. تأكد من وجود ملف `.env.local` في مجلد المشروع
2. تحقق من محتويات الملف

```powershell
Get-Content .env.local | Select-String "SUPABASE"
```

### المشكلة: "Failed - Status: 401/403"

**الحل:**
- المفتاح غير صحيح أو منتهي الصلاحية
- تحقق من المفتاح في لوحة التحكم للخدمة

### المشكلة: "Request timeout"

**الحل:**
- تحقق من اتصال الإنترنت
- قد تكون الخدمة بطيئة، حاول مرة أخرى

---

## 📝 ملاحظات مهمة

1. **ملف `.env.local`** يجب أن يكون في:
   ```
   C:\Users\Public\Adham-AgriTech-Full-Stack\.env.local
   ```

2. **لا تشارك النتائج** التي تحتوي على مفاتيح API

3. **الاختبار الناجح** يعني:
   - ✅ جميع الخدمات الأساسية تعمل
   - ✅ جاهز للنشر
   - ✅ يمكن إضافة Secrets في GitHub/Vercel

---

## 🔄 الخطوة التالية

بعد نجاح الاختبار:

1. ✅ **إضافة Secrets في GitHub**
   - اذهب إلى: Settings → Secrets → Actions
   - أضف جميع المتغيرات من `SECRETS_SETUP.md`

2. ✅ **إضافة Environment Variables في Vercel**
   - اذهب إلى: Project Settings → Environment Variables
   - أضف جميع المتغيرات

3. ✅ **دفع التغييرات**
   ```bash
   git add .
   git commit -m "feat: Configure all services with comprehensive testing"
   git push origin main
   ```

4. ✅ **مراقبة CI/CD**
   - تحقق من GitHub Actions
   - تحقق من Vercel Deployment

---

## 📞 الدعم

إذا استمرت المشاكل:
- راجع `SECRETS_SETUP.md` للقيم الصحيحة
- تحقق من logs الاختبار
- تأكد من صحة جميع المفاتيح

---

**آخر تحديث:** 2025-11-01  
**الإصدار:** 1.0.1  
**الحالة:** ✅ جاهز للاختبار
