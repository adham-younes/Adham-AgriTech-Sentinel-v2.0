# 🔄 InsForge Migration Guide

## Overview
تم تحويل منصة Adham AgriTech من Supabase إلى InsForge كخادم خلفي رئيسي.

## ✅ ما تم تنفيذه

### 1. إنشاء عملاء InsForge
- ✅ `lib/insforge/client.ts` - عميل المتصفح (Browser Client)
- ✅ `lib/insforge/server.ts` - عميل الخادم (Server Client)

### 2. تحديث صفحات المصادقة
- ✅ `app/auth/login/page.tsx` - تسجيل الدخول
- ✅ `app/auth/signup/page.tsx` - التسجيل

### 3. تحديث Dashboard
- ✅ `app/dashboard/layout.tsx` - Layout الرئيسي
- ✅ `app/dashboard/page.tsx` - الصفحة الرئيسية

### 4. متغيرات البيئة
- ✅ إضافة متغيرات InsForge إلى `.env.local`
- ✅ تعطيل متغيرات Supabase القديمة

## 🔑 المتغيرات المطلوبة

### للتطوير المحلي (`.env.local`)
```env
NEXT_PUBLIC_INSFORGE_API_KEY=ik_5e82d1f87f888ec913ceae583539cb85
NEXT_PUBLIC_INSFORGE_BASE_URL=https://9y7cy56f.us-east.insforge.app
INSFORGE_API_KEY=ik_5e82d1f87f888ec913ceae583539cb85
INSFORGE_BASE_URL=https://9y7cy56f.us-east.insforge.app
```

### للإنتاج (Vercel)
```bash
# إضافة المتغيرات
vercel env add NEXT_PUBLIC_INSFORGE_API_KEY production
vercel env add NEXT_PUBLIC_INSFORGE_BASE_URL production
vercel env add INSFORGE_API_KEY production
vercel env add INSFORGE_BASE_URL production

# إضافة للـ Preview أيضاً
vercel env add NEXT_PUBLIC_INSFORGE_API_KEY preview
vercel env add NEXT_PUBLIC_INSFORGE_BASE_URL preview
vercel env add INSFORGE_API_KEY preview
vercel env add INSFORGE_BASE_URL preview
```

## 📋 الملفات المتأثرة

### تم التحديث
1. `app/auth/login/page.tsx`
2. `app/auth/signup/page.tsx`
3. `app/dashboard/layout.tsx`
4. `app/dashboard/page.tsx`
5. `.env.local`

### ملفات جديدة
1. `lib/insforge/client.ts`
2. `lib/insforge/server.ts`
3. `INSFORGE_MIGRATION.md` (هذا الملف)

## 🔄 الملفات التي تحتاج تحديث

### صفحات Dashboard الأخرى
- `app/dashboard/ai-assistant/page.tsx`
- `app/dashboard/farms/page.tsx`
- `app/dashboard/fields/page.tsx`
- `app/dashboard/crop-monitoring/page.tsx`
- `app/dashboard/soil-analysis/page.tsx`
- وجميع الصفحات الأخرى التي تستخدم Supabase

### الخطوات:
1. استبدال `import { createClient } from "@/lib/supabase/client"` بـ `import { insforge } from "@/lib/insforge/client"`
2. استبدال `const supabase = createClient()` بـ استخدام `insforge` مباشرة
3. تحديث استدعاءات API لتتوافق مع InsForge

## 🧪 الاختبار

### محلياً
```bash
npm run dev
```
ثم افتح: http://localhost:3003/auth/login

### على Vercel
بعد إضافة المتغيرات:
```bash
vercel --prod
```

## 📝 ملاحظات مهمة

### 1. إدارة الجلسات
- InsForge يستخدم `localStorage` و `cookies` لإدارة الجلسات
- الجلسات تُخزن في `insforge_session`
- مدة الجلسة: 7 أيام

### 2. قاعدة البيانات
- InsForge يوفر API مبسط لقاعدة البيانات
- الـ endpoints: `/api/db/{table}`
- العمليات: `select`, `insert`, `update`, `delete`

### 3. المصادقة
- تسجيل الدخول: `/api/auth/login`
- التسجيل: `/api/auth/signup`
- تسجيل الخروج: `/api/auth/logout`
- الحصول على المستخدم: `/api/auth/user`

## 🚨 المشاكل المحتملة

### 1. "Invalid API key"
- تأكد من أن `NEXT_PUBLIC_INSFORGE_API_KEY` مضبوط بشكل صحيح
- تحقق من أن المفتاح صالح على InsForge Dashboard

### 2. "Session expired"
- الجلسات تنتهي بعد 7 أيام
- المستخدم يحتاج لتسجيل الدخول مرة أخرى

### 3. مشاكل CORS
- تأكد من إضافة النطاقات المسموحة في InsForge Dashboard
- النطاقات المطلوبة:
  - `http://localhost:3003`
  - `https://adham-agritech.vercel.app`
  - `https://*.vercel.app`

## 🎯 الخطوات التالية

1. ✅ إضافة متغيرات InsForge إلى Vercel
2. ⏳ تحديث باقي صفحات Dashboard
3. ⏳ إنشاء جداول قاعدة البيانات في InsForge
4. ⏳ ترحيل البيانات من Supabase إلى InsForge
5. ⏳ اختبار جميع الوظائف
6. ⏳ إزالة كود Supabase القديم

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تحقق من InsForge Dashboard: https://9y7cy56f.us-east.insforge.app
2. راجع سجلات Vercel
3. تحقق من console المتصفح للأخطاء
