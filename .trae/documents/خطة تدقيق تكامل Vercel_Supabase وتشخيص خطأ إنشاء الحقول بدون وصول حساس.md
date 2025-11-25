# تدقيق التكامل وتشخيص الخطأ

## الأهداف
- التحقق من أن التطبيق المنشور على Vercel مرتبط فعليًا بقاعدة Supabase الصحيحة.
- تحديد السبب الدقيق لفشل إنشاء الحقل (Field) في الإنتاج.
- إنجاز ذلك بقراءة/فحوصات غير معطِّلة ودون استخدام وصول حساس.

## دلائل الربط الحالية
- تطبيق يقرأ `NEXT_PUBLIC_SUPABASE_URL` كـ `https://nptpmiljdljxjbgoxyqn.supabase.co` (.env.local.backup-20251115-134008:20).
- المفتاح العام في نفس النسخة الاحتياطية لا يطابق مرجع المشروع (ref مختلف) (.env.local.backup-20251115-134008:19)، بينما سكربت الفحص يستخدم المفتاح الصحيح (check-supabase-db.js:8-12).
- هذا التعارض غالبًا يسبب فشل المصادقة/الإدراج.

## نطاق الفحوصات (قراءة فقط)
1. فحص بيئة Vercel:
   - توحيد `NEXT_PUBLIC_SUPABASE_URL` و`NEXT_PUBLIC_SUPABASE_ANON_KEY` على مشروع Supabase المذكور.
   - مراجعة إعدادات `vercel.json` و`next.config.mjs` للتأكد من عدم وجود إعادة كتابة تُخفي مسارات الصحة.
2. فحص مخطط Supabase:
   - التحقق من أعمدة جدول `public.fields`:
     - الكود يرسل: `boundary_coordinates`, `centroid`, `latitude`, `longitude`, ويحتوي منطق `user_id` (app/api/fields/route.ts:280-293, 295-305).
     - المخطط القديم: `boundaries` فقط وبدون `user_id` (scripts/003_create_fields.sql:14-18).
     - المخطط الأحدث: جميع الأعمدة + `user_id` (scripts/013_supabase_schema.sql:282-301).
   - التحقق من سياسات RLS:
     - القديمة تعتمد `farms.owner_id` (scripts/003_create_fields.sql:25-63).
     - الحديثة تعتمد `fields.user_id` وتريغر `ensure_current_user_id` (scripts/013_supabase_schema.sql:309-338).
3. فحص منطق الملكية في التطبيق:
   - يتحقق عبر `farm_owners` مع fallback لـ`farms.owner_id/user_id` (app/api/fields/route.ts:106-163).
4. جمع رسالة الخطأ بدقة:
   - أثناء POST `/api/fields` يُعاد `message` و`details` من Supabase (app/api/fields/route.ts:297-305). سنلتقط نص الرسالة لتحديد
type: أعمدة/سياسات/مصادقة.

## منهجية التقرير
- توثيق بيئة Vercel الحالية للقيم المفتاحية (URL/anon key).
- جرد مخطط `fields` الفعلي وسياسات RLS في Supabase.
- مطابقة الحمولة الفعلية من الواجهة مع المخطط وسياسات RLS.
- تحديد السبب المرجّح مع مراجع `file_path:line` وإعطاء توصيات إصلاح آمنة.

## توصيات إصلاح آمنة (بعد التشخيص)
- توحيد مفاتيح Supabase على Vercel (Production/Preview) لتطابق URL.
- جعل الإدراج متوافقًا مع كلا المخططين:
  - عدم إرسال `user_id` وترك التريغر يملؤه إن وُجد.
  - استخدام `boundaries` إذا كان `boundary_coordinates` غير موجود في المخطط.
  - تجاهل أعمدة `centroid/latitude/longitude` إن كانت غير معرّفة.
- سياسات RLS متوافقة لكلا النهجين (owner_id وuser_id) لتفادي الرفض.
- توحيد وحدة المساحة (الفدان/الهكتار) لتفادي التباس البيانات.

## مخرجات متوقعة
- تقرير تكامل مفصل (Vercel/Supabase) وأسباب الخطأ بدقة مع خطوات إصلاح غير معطِّلة.

## قيود وأمان
- لن نستخدم أي وصول حساس أو نُجري نشرات؛ سنكتفي بالفحوصات والاقتراحات. إذا احتجنا تنفيذ إصلاحات، سنبدأ ببيئة Staging أولاً.