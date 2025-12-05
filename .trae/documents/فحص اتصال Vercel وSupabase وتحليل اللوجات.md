**هدف الفحص**

* التأكد من الاتصال الفعلي بـ Supabase وتهيئة مفاتيحه، والتحقق من نشر المشروع وربطه بـ Vercel، وجمع اللوجات والأخطاء الشائعة خلال آخر 24 ساعة.

**خطوات تشخيصية (بعد موافقةك سننفذها)**

* Supabase:

  * قراءة `frontend/.env.local` و`frontend/.env.production.local` للتحقق من وجود `NEXT_PUBLIC_SUPABASE_URL` و`NEXT_PUBLIC_SUPABASE_ANON_KEY` دون عرض القيم.

  * تنفيذ `GET /api/debug/database` محلياً للتأكد من قدرة القراءة لجداول `fields/farms/farm_owners/profiles`.

  * تنفيذ `GET /api/system/health` والتأكد من نتيجة قسم Supabase والزمن.

* Vercel:

  * قراءة `frontend/.vercel/project.json` و`/.vercel/project.json` للتأكد من الربط (وجود `orgId`, `projectId`).

  * استخدام أوامر CLI: `vercel whoami`, `vercel pull`, و`vercel logs --since 24h` للحصول على اللوجات (إن توفّر `VERCEL_TOKEN`).

  * التحقق من تفعيل كرون عبر `frontend/vercel.json` ومراجعة نتائج نقاط `/api/cron/*` في اللوجات.

* خدمات خارجية:

  * تشغيل `GET /api/platform-test` و`GET /api/services/health` لمراجعة حالة EOSDA والطقس والحساسات.

**تحليل المخرجات**

* سنلخّص الحالة: متصل/غير متصل، المشاكل، زمن الاستجابة، وسياسات الكاش.

* سنقترح إصلاحات عملية: نقص مفاتيح، حماية مسارات، أو ضبط الكاش/الـ runtime.

**مخرجات التسليم**

* تقرير مختصر بالحالة الحالية مع قائمة مشاكل وإجراءات إصلاح مقترحة.

* إن رغبت، تجهيز سكربت تشخيص موحد لتشغيله لاحقاً (اختياري).

