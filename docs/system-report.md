# تقرير النظام: المشروع وقاعدة البيانات وVercel

## نظرة عامة على المشروع
- تطبيق رئيسي مبني على Next.js (App Router) داخل `frontend/` مع دعم PWA.
- نقاط نهاية API مدمجة ضمن Next.js عبر مسارات `src/app/api/**`.
- مشاريع إضافية: مثال مبسط `adham-agritech-v2/` وموقع توثيقي ثابت `eleventy/`.

## البنية الأمامية (Frontend)
- الصفحات: `src/app/dashboard/**`, `src/app/auth/**`, `src/app/vision/**`.
- المكونات: `frontend/src/components/**` تشمل الخرائط وعناصر الواجهة.
- وسيط الجلسة: `frontend/middleware.ts:5` يستدعي `updateSession` وضبط المطابقات `frontend/middleware.ts:9-11`.
- محدِّث الجلسة: `frontend/src/lib/supabase/middleware.ts:4-63` لإدارة الجلسات وإعادة التوجيه.
- Manifest وPWA: إعداد عبر `next-pwa` في `frontend/next.config.mjs`.

## الواجهات البرمجية (API)
- ذكاء اصطناعي: `frontend/src/app/api/ai/chat/route.ts:2` يحدد `runtime="nodejs"` ومعالجة المزودين ورسائل الأخطاء `frontend/src/app/api/ai/chat/route.ts:793-806`.
- EOSDA بحث: `frontend/src/app/api/eosda/search/route.ts:11` وكاش 5 دقائق `frontend/src/app/api/eosda/search/route.ts:152`.
- بلاطات وصور EOSDA وSentinel: مسارات تحت `frontend/src/app/api/eosda/**` و`frontend/src/app/api/sentinel/**`.
- صحة النظام: `frontend/src/app/api/system/health/route.ts` و`frontend/src/app/api/services/health/route.ts`.
- كرون: `frontend/src/app/api/cron/field-analytics/route.ts:2,13-17` يستخدم `CRON_SECRET`.
- وكيل النظام: `frontend/src/app/api/system/agent/run/route.ts:4,6-12,15-18` يشغّل `SovereignAgent`.

## إعداد Supabase
- عميل المتصفح: `createClient` في `frontend/src/lib/supabase/client.ts:98-135` يعتمد على `NEXT_PUBLIC_SUPABASE_URL` و`NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- عميل الخادم: `createClient` في `frontend/src/lib/supabase/server.ts:99-141` يستخدم `cookies`.
- عميل الدور الخدمي: `createServiceSupabaseClient` في `frontend/src/lib/supabase/service-client.ts:3-93` يعتمد على `SUPABASE_SERVICE_ROLE_KEY`.

## قاعدة البيانات (Postgres على Supabase)
- التقنية: Postgres مع PostGIS وRLS؛ لا استخدام لـ MongoDB/Prisma في الكود.
- مهاجرات أساسية:
  - مواءمة المخطط وتفعيل PostGIS وإضافة `organizations` وربطها بـ`profiles` و`farms`، وإضافة `geom` لـ`fields` مع فهارس في `supabase/migrations/complete_schema_alignment.sql:18-31,61-77,83-109,115-127,133-152`.
  - خرائط الإنتاجية المرتبطة بالحقول مع سياسات RLS وفهارس في `supabase/migrations/20251201_create_productivity_maps.sql:4-17,20-27,30-85`.
- كيانات وعلاقات:
  - `profiles ↔ auth.users` مع `organization_id`؛ ربط بـ`farms` و`farm_owners`.
  - `farms ↔ fields`؛ دعم `fields.geom` بفهرس GIST.
  - تحليلات، صور، NDVI، طقس، ري، مهام، ومعرفة زراعية (crops, stages, diseases, fertilizers, pesticides).
- سياسات الأمان: RLS مبني على `auth.uid()` وجسر الملكية `farm_owners` ووظيفة `get_current_org_id()`.

## تدفق البيانات
- إدراج تحليلات الحقول في كرون `frontend/src/app/api/cron/field-analytics/route.ts:49-60`.
- تحميل سياق الحقل في مساعد الذكاء `frontend/src/app/api/ai/chat/route.ts:353-607`.
- حفظ نتائج تحليل الصور في `plant_disease_analyses` `frontend/src/app/api/ai/chat/route.ts:612-709`.

## إعدادات Next.js وPWA
- الإخراج: `output: 'standalone'` `frontend/next.config.mjs:35`.
- الصور: `images.unoptimized: true` `frontend/next.config.mjs:39-41`.
- ترويسات الأمن: `Content-Security-Policy` `frontend/next.config.mjs:59-71`.
- إعادة التوجيه: `/satellite → /dashboard/satellite` `frontend/next.config.mjs:72-79`.
- التحليلات: `<Analytics />` `frontend/src/app/layout.tsx:3,40`.

## النشر على Vercel
- تهيئة: `frontend/vercel.json:2-6`؛ كرون يومية `frontend/vercel.json:7-15`.
- سكربتات: `build`, `dev`, `start` في `frontend/package.json`.
- بيئات مطلوبة: موثقة في `VERCEL_ENVIRONMENT_GUIDE.md` (Supabase، AI، طقس، خرائط).
- التشغيل: جميع مسارات API تستخدم `runtime = 'nodejs'`.
- الكاش: `Cache-Control` مضبوط لمسارات EOSDA/Sentinel؛ تعطيل الكاش لبعض المسارات عبر `dynamic/revalidate`.

## تشغيل وصيانة
- دليل النشر: `DEPLOYMENT_GUIDE.md` لربط المشروع بـ Vercel وإعداد المتغيرات والنطاق.
- مراقبة: Vercel Analytics مفعلة؛ سجلات النشر والكرون متاحة.
- الأمان: عدم تسريب مفاتيح خاصة للمتصفح؛ استخدام `NEXT_PUBLIC_*` بحذر.

## خلاصة
- التطبيق يعتمد على Next.js مع API مدمجة، Supabase/Postgres، وتكاملات أقمار صناعية وذكاء اصطناعي.
- النشر على Vercel مع كرون يومية، PWA، وسياسات أمن وكاش مضبوطة.

