# Hotfix: إضافة عمود irrigation_type
# Hotfix: Add irrigation_type Column

## المشكلة / Problem

عند إنشاء حقل جديد يظهر خطأ:
When creating a new field, error appears:

```
Could not find the 'irrigation_type' column of 'fields' in the schema cache
```

## الحل / Solution

تطبيق الترحيل السريع لإضافة العمود المفقود:
Apply hotfix migration to add missing column:

### الخطوات / Steps

1. **افتح Supabase Dashboard**
   Open Supabase Dashboard:
   ```
   https://app.supabase.com/project/vqawbzhtrcxojkgzvqit
   ```

2. **انتقل إلى SQL Editor**
   Navigate to SQL Editor

3. **قم بتنفيذ الترحيل**
   Execute migration:
   
   افتح الملف: `supabase/migrations/add_irrigation_type_hotfix.sql`
   Open file: `supabase/migrations/add_irrigation_type_hotfix.sql`
   
   انسخ المحتوى بالكامل
   Copy all content
   
   الصق في SQL Editor
   Paste in SQL Editor
   
   اضغط **Run** أو **تشغيل**
   Click **Run**

4. **تحقق من النجاح**
   Verify success:
   
   يجب أن ترى:
   Should see:
   ```
   NOTICE: Added irrigation_type column to fields table
   NOTICE: Verification successful: irrigation_type column exists
   ```

## التحقق / Verification

قم بتشغيل هذا الاستعلام للتحقق:
Run this query to verify:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'fields' 
  AND column_name = 'irrigation_type';
```

يجب أن ترى نتيجة واحدة مع العمود irrigation_type
Should see one result with irrigation_type column

## بعد التطبيق / After Application

جرب إنشاء حقل جديد مرة أخرى
Try creating a new field again

القيم المسموحة / Allowed values:
- drip (بالتنقيط)
- sprinkler (بالرش)
- flood (بالغمر)
- manual (يدوي)
