# قاعدة البيانات - دليل سريع للترحيل
# Database Migration - Quick Guide

## خطوة 1: الوصول إلى Supabase
## Step 1: Access Supabase

افتح لوحة تحكم Supabase:
Open Supabase Dashboard:

https://app.supabase.com/project/vqawbzhtrcxojkgzvqit

انتقل إلى: **SQL Editor**
Navigate to: **SQL Editor**

## خطوة 2: تطبيق الترحيل الرئيسي
## Step 2: Apply Main Migration

1. افتح الملف: `supabase/migrations/complete_schema_alignment.sql`
   Open file: `supabase/migrations/complete_schema_alignment.sql`

2. انسخ المحتوى بالكامل
   Copy all content

3. الصق في محرر SQL
   Paste in SQL Editor

4. اضغط **Run** أو **تشغيل**
   Click **Run**

5. انتظر حتى ترى: "MIGRATION COMPLETE!"
   Wait until you see: "MIGRATION COMPLETE!"

## خطوة 3: تطبيق الإصلاحات الأمنية
## Step 3: Apply Security Fixes

1. افتح الملف: `supabase/migrations/fix_security_warnings.sql`
   Open file: `supabase/migrations/fix_security_warnings.sql`

2. انسخ المحتوى بالكامل
   Copy all content

3. الصق في محرر SQL
   Paste in SQL Editor

4. اضغط **Run** أو **تشغيل**
   Click **Run**

## خطوة 4: التحقق من النجاح
## Step 4: Verify Success

قم بتشغيل هذا الاستعلام للتحقق:
Run this query to verify:

```sql
-- Check organizations
SELECT COUNT(*) AS org_count FROM public.organizations;

-- Check profiles linked
SELECT COUNT(*) AS profiles_linked 
FROM public.profiles 
WHERE organization_id IS NOT NULL;

-- Check farms linked
SELECT COUNT(*) AS farms_linked 
FROM public.farms 
WHERE organization_id IS NOT NULL;

-- Check fields with geometry
SELECT COUNT(*) AS fields_with_geom 
FROM public.fields 
WHERE geom IS NOT NULL;

-- Check RLS policies
SELECT COUNT(*) AS policy_count 
FROM pg_policies 
WHERE schemaname = 'public';
```

## النتيجة المتوقعة
## Expected Result

يجب أن ترى:
You should see:

- org_count: 1 أو أكثر (1 or more)
- profiles_linked: عدد المستخدمين (number of users)
- farms_linked: عدد المزارع (number of farms)
- fields_with_geom: عدد الحقول (number of fields)
- policy_count: 9 أو أكثر (9 or more)

## ملاحظات مهمة
## Important Notes

✅ **آمن**: الترحيل آمن ويمكن تشغيله عدة مرات
   **Safe**: Migration is idempotent and can be run multiple times

✅ **البيانات**: لن يتم حذف أي بيانات موجودة
   **Data**: No existing data will be deleted

✅ **الوقت**: يستغرق حوالي 30-60 ثانية
   **Time**: Takes about 30-60 seconds

## للمساعدة التفصيلية
## For Detailed Help

راجع: `supabase/MIGRATION_GUIDE.md`
See: `supabase/MIGRATION_GUIDE.md`
