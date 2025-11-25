# 🧪 اختبار متغيرات البيئة والاتصالات
# Environment Variables & Connections Test

## 📋 نظرة عامة / Overview

هذا السكربت يختبر جميع متغيرات البيئة والاتصالات في منصة Adham AgriTech.

This script tests all environment variables and connections in the Adham AgriTech platform.

## 🚀 الاستخدام / Usage

```bash
node scripts/test-env-and-connections.js
```

أو في PowerShell:
```powershell
node scripts/test-env-and-connections.js
```

## ✅ ما يتم اختباره / What is Tested

### متغيرات البيئة / Environment Variables

#### مطلوبة / Required:
- `NEXT_PUBLIC_SUPABASE_URL` - رابط قاعدة البيانات
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - مفتاح Supabase العام

#### اختيارية / Optional:
- `SUPABASE_SERVICE_ROLE_KEY` - مفتاح خدمة Supabase
- `OPENAI_API_KEY` - مفتاح OpenAI
- `GROQ_API_KEY` - مفتاح Groq AI
- `PLANT_ID_API_KEY` - مفتاح Plant ID
- `OPENWEATHER_API_KEY` - مفتاح OpenWeather
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` - رمز Mapbox
- `EOSDA_API_KEY` - مفتاح EOSDA
- `NEXT_PUBLIC_EOSDA_API_KEY` - مفتاح EOSDA العام
- `ESD_CLIENT_ID` - معرف عميل ESD
- `ESD_CLIENT_SECRET` - سر عميل ESD
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - معرف مشروع Firebase
- `NEXT_PUBLIC_FIREBASE_API_KEY` - مفتاح Firebase
- `VERCEL_TOKEN` - رمز Vercel
- `VERCEL_PROJECT_ID` - معرف مشروع Vercel
- `VERCEL_ORG_ID` - معرف منظمة Vercel
- `INSFORGE_API_KEY` - مفتاح Insforge
- `INSFORGE_BASE_URL` - رابط Insforge

### الاتصالات / Connections

#### ✅ الخدمات المختبرة:
1. **Supabase** - قاعدة البيانات والمصادقة
2. **OpenAI** - خدمة الذكاء الاصطناعي
3. **Groq** - خدمة الذكاء الاصطناعي السريعة
4. **OpenWeather** - بيانات الطقس
5. **Mapbox** - الخرائط والجغرافيا
6. **EOSDA** - بيانات الأقمار الصناعية
7. **ESD** - بيانات الأقمار الصناعية (احتياطي)
8. **Firebase** - خدمات السحابة
9. **Vercel** - النشر والتوزيع
10. **Insforge** - الخدمات الخلفية
11. **Plant ID** - تحديد النباتات

## 📊 النتائج / Results

السكربت يعرض:
- ✅ **متغيرات البيئة الموجودة** - عدد المتغيرات المكونة
- ⚠️ **المتغيرات المفقودة** - قائمة المتغيرات غير المكونة
- ✅ **الاتصالات الناجحة** - الخدمات التي تعمل بنجاح
- ❌ **الاتصالات الفاشلة** - الخدمات التي فشلت في الاتصال
- ⚠️ **الاتصالات المتخطاة** - الخدمات غير المكونة

The script displays:
- ✅ **Found Environment Variables** - Number of configured variables
- ⚠️ **Missing Variables** - List of unconfigured variables
- ✅ **Successful Connections** - Services working successfully
- ❌ **Failed Connections** - Services that failed to connect
- ⚠️ **Skipped Connections** - Unconfigured services

## 🔍 مثال على النتائج / Example Output

```
======================================================================
📊 TEST SUMMARY / ملخص الاختبار
======================================================================

Environment Variables / متغيرات البيئة:
   ✅ Found: 9
   ⚠️  Missing: 19

Connections / الاتصالات:
   ✅ Passed: 2
      • Supabase Connection
      • Firebase Configuration

   ❌ Failed: 2
      • Mapbox - Status: 401
      • EOSDA - Status: 403

   ⚠️  Skipped: 7
      • OpenAI - Not configured
      • Groq - Not configured
      • OpenWeather - Not configured
      ...

Total Connections Tested: 11
Success Rate: 18.2%
```

## 🛠️ استكشاف الأخطاء / Troubleshooting

### إذا فشل اتصال Supabase:
- تحقق من `NEXT_PUBLIC_SUPABASE_URL`
- تحقق من `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- تأكد من أن Supabase يعمل

### إذا فشل اتصال OpenAI:
- تحقق من `OPENAI_API_KEY`
- تأكد من وجود رصيد في الحساب
- تحقق من حدود الاستخدام

### إذا فشل اتصال Mapbox:
- تحقق من `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
- تأكد من أن الرمز صالح وغير منتهي الصلاحية

### إذا فشل اتصال EOSDA:
- تحقق من `EOSDA_API_KEY`
- تأكد من صحة المفتاح
- تحقق من أن المفتاح له الصلاحيات المطلوبة

## 📝 ملاحظات / Notes

- السكربت يقرأ المتغيرات من `.env.local` إذا كان موجوداً
- المتغيرات الموجودة في النظام لها الأولوية
- بعض الخدمات اختيارية ولا تؤثر على عمل التطبيق الأساسي
- الخدمات المطلوبة فقط: Supabase (URL و ANON_KEY)

## 🔗 روابط مفيدة / Useful Links

- [Supabase Dashboard](https://supabase.com/dashboard)
- [OpenAI Platform](https://platform.openai.com)
- [Mapbox Account](https://account.mapbox.com)
- [EOSDA Documentation](https://doc.eos.com)
- [Vercel Dashboard](https://vercel.com/dashboard)

---

**آخر تحديث / Last Updated:** 2025-01-11


