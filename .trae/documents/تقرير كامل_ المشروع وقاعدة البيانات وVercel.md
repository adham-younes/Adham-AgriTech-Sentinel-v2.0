**نظرة عامة على المشروع**

* تطبيق رئيسي مبني على `Next.js (App Router)` داخل `frontend/` مع واجهات ولوحات وتحويلات PWA.

* نقاط نهاية API مدمجة ضمن `Next.js` عبر مسارات `src/app/api/**` دون خادم Express منفصل.

* مشاريع إضافية: مثال مبسط `adham-agritech-v2/` وموقع توثيقي ثابت `eleventy/`.

* نقطة دخول الواجهة: `frontend/src/app/page.tsx` و`frontend/src/app/layout.tsx`؛ التحليلات عبر Vercel مضمنة في الواجهة.

**البنية الأمامية (Frontend)**

* تنظيم الصفحات: `src/app/dashboard/**`, `src/app/auth/**`, `src/app/vision/**`.

* المكونات: `frontend/src/components/**` تشمل الخرائط، عناصر الواجهة، واللافتات الخاصة بـ PWA.

* وسيط الجلسة: `frontend/middleware.ts:5` يستدعي `updateSession` لضبط جلسات Supabase، والمُحدِّد `config.matcher` في `frontend/middleware.ts:9`.

* محدِّث الجلسة: `frontend/src/lib/supabase/middleware.ts:4` ينشئ عميل Supabase ويطبق إعادة التوجيه وفق حالة المستخدم.

* Manifest وPWA: `frontend/src/app/manifest.ts` وتهيئة عبر `next-pwa` في `next.config.mjs`.

**الواجهات البرمجية (API)**

* ذكاء اصطناعي: `frontend/src/app/api/ai/chat/route.ts` يحدد `runtime="nodejs"` في `frontend/src/app/api/ai/chat/route.ts:2` ويعالج مزودي AI، مع رسائل خطأ واضحة عند نقص المفاتيح `frontend/src/app/api/ai/chat/route.ts:793-806`.

* EOSDA بحث: `frontend/src/app/api/eosda/search/route.ts` يحدد `runtime="nodejs"` في `frontend/src/app/api/eosda/search/route.ts:11` ويطبق كاش 5 دقائق في `frontend/src/app/api/eosda/search/route.ts:152`.

* بلاطات وصور EOSDA وSentinel: مسارات متعددة تحت `frontend/src/app/api/eosda/**` و`frontend/src/app/api/sentinel/**` مع ترويسات كاش مناسبة.

* صحة النظام: `frontend/src/app/api/system/health/route.ts` و`frontend/src/app/api/services/health/route.ts` لفحوصات المنصة.

* كرون: `frontend/src/app/api/cron/field-analytics/route.ts` يفرض `runtime` ويستخدم `CRON_SECRET` للتحقق `frontend/src/app/api/cron/field-analytics/route.ts:2,13-17`.

* وكيل النظام: `frontend/src/app/api/system/agent/run/route.ts` يشغل `SovereignAgent` مع تحقق من `CRON_SECRET` `frontend/src/app/api/system/agent/run/route.ts:4,6-12,15-18`.

**إعداد Supabase (العملاء والاتصال)**

* عميل المتصفح: `createClient` في `frontend/src/lib/supabase/client.ts:98-135` يعتمد على `NEXT_PUBLIC_SUPABASE_URL` و`NEXT_PUBLIC_SUPABASE_ANON_KEY` مع عميل محاكٍ عند نقص البيئة.

* عميل الخادم: `createClient` في `frontend/src/lib/supabase/server.ts:99-141` يستخدم `cookies` لتمرير الجلسات ويعود لمحاكٍ عند البناء/نقص البيئة.

* عميل الدور الخدمي: `createServiceSupabaseClient` في `frontend/src/lib/supabase/service-client.ts:3-93` يعتمد على `SUPABASE_SERVICE_ROLE_KEY` للأعمال الإدارية.

**قاعدة البيانات (Postgres على Supabase)**

* التقنية: Postgres مع امتداد PostGIS وRLS؛ لا توجد دلائل لاستخدام MongoDB أو Prisma في الكود.

* مهاجرات أساسية:

  * مواءمة كاملة للمخطط وتفعيل PostGIS وإضافة `organizations` وربطها بـ`profiles` و`farms`، وإضافة `geom` لـ`fields` مع فهارس أداء في `supabase/migrations/complete_schema_alignment.sql:18-31,61-77,83-109,115-127,133-152`.

  * خرائط الإنتاجية المرتبطة بالحقول مع سياسات RLS وفهارس في `supabase/migrations/20251201_create_productivity_maps.sql:4-17,20-27,30-85`.

* كيانات وعلاقات رئيسية:

  * `profiles(id) ↔ auth.users` مع `organization_id`؛ ربط بـ`farms` و`farm_owners` للجسر.

  * `farms(owner_id, organization_id) ↔ fields(farm_id)`؛ `fields.geom` مدعوم بفهرس GIST.

  * تحليلات الحقول، صور الأقمار، مؤشرات NDVI، بيانات الطقس، أنظمة الري والجداول، مهام المستخدمين.

  * معرفة زراعية: `crops`, `growth_stages`, `diseases`, `fertilizer_types`, `pesticide_types`، وجداول المعالجة المرجعية.

* السياسات الأمنية: تفعيل RLS على معظم الجداول؛ الوصول عبر `auth.uid()`، وجسر الملكية `farm_owners`، ووظيفة `get_current_org_id()` متعددة المستأجرين.

**تدفق البيانات واستخدام Supabase في الكود**

* أمثلة استعلامات: إدراج تحليلات حقول في كرون `frontend/src/app/api/cron/field-analytics/route.ts:49-60`؛ تحميل سياق الحقل في مساعد الذكاء `frontend/src/app/api/ai/chat/route.ts:353-607`.

* حفظ نتائج تحليل الصور في `plant_disease_analyses` ضمن `frontend/src/app/api/ai/chat/route.ts:612-709`.

**إعدادات Next.js وPWA**

* الإخراج: `output: 'standalone'` في `frontend/next.config.mjs:35` ملائم لـ Vercel.

* التحسينات: تعطيل أخطاء `eslint`/`typescript` أثناء البناء، وضبط صور غير محسّنة `frontend/next.config.mjs:36-41`.

* ترويسات الأمن: `Content-Security-Policy` عبر `headers()` `frontend/next.config.mjs:59-71`.

* إعادة التوجيه: `/satellite → /dashboard/satellite` `frontend/next.config.mjs:72-79`.

* التحليلات: تضمين `<Analytics />` في `frontend/src/app/layout.tsx:3,40`.

**النشر على Vercel**

* تهيئة المشروع: `frontend/vercel.json:2-6` مع مهام كرون مجدولة يومياً `frontend/vercel.json:7-15`.

* سكربتات البناء والتشغيل عبر `frontend/package.json` (`build`, `dev`, `start`).

* بيئات مطلوبة موثقة في `VERCEL_ENVIRONMENT_GUIDE.md`، مع أمثلة مفاتيح لمتغيرات مثل `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, مفاتيح AI والطقس والخرائط.

* التشغيل الخادمي: جميع مسارات API تعرّف `export const runtime = 'nodejs'`؛ لا استخدام لـ Edge حالياً.

* التخزين المؤقت: ضبط `Cache-Control` في مسارات EOSDA/Sentinel، وتعطيل كاش لبعض المسارات عبر `dynamic`/`revalidate`.

**تشغيل وصيانة**

* دلائل النشر: `DEPLOYMENT_GUIDE.md` يشرح ربط المستودع بـ Vercel، إعداد المتغيرات، وربط النطاق.

* مراقبة وتحليلات: Vercel Analytics مفعلة؛ سجلات النشر والكرون قابلة للمراجعة.

* سياسات الأمان: عدم تسريب المفاتيح الخاصة للمتصفح؛ استخدام `NEXT_PUBLIC_*` بحذر، والسرية لمفاتيح الخادم.

**الخلاصة**

* التطبيق يعتمد بالكامل على Next.js مع API مدمجة، Supabase/Postgres كقاعدة أساسية، وتكاملات أقمار صناعية وذكاء اصطناعي.

* النشر مُهيأ على Vercel مع كرون يومية، وسياسات أمن وكاش مضبوطة، وPWA نشطة.

**الخطوة التالية المقترحة**

* إذا رغبت، يمكنني توليد ملف تقرير PDF يتضمن الرسوم البيانية لعلاقة الجداول وقائمة نقاط النهاية، أو إضافة صفحة "About/Systems" داخل التطبيق تعرض هذا الملخص ديناميكياً.

