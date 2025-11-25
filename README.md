# 🌱 Adham AgriTech - Smart Agriculture Platform 

> *منصة الزراعة الذكية للمزارعين المصريين باستخدام الذكاء الاصطناعي والأقمار الصناعية والبلوكتشين*

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)

## 🚀 الميزات الرئيسية

### 🌾 إدارة المزارع
- **مراقبة المحاصيل:** تتبع صحة المحاصيل باستخدام صور الأقمار الصناعية
- **تحليل التربة:** تحليل شامل للتربة مع توصيات ذكية للأسمدة
- **إدارة الري:** التحكم في أنظمة الري وجدولة الري بناءً على بيانات التربة والطقس
- **توقعات الطقس:** توقعات دقيقة للطقس لمدة 7 أيام

### 🤖 الذكاء الاصطناعي
- **مساعد زراعي ذكي:** يجيب على أسئلة المزارعين بالعربية والإنجليزية
- **تشخيص الأمراض:** تشخيص أمراض النباتات من الصور
- **توصيات مخصصة:** نصائح مخصصة لكل نوع محصول ومنطقة

### 🛰️ التكنولوجيا المتقدمة
- **الأقمار الصناعية:** صور عالية الدقة من Sentinel-2 وGoogle Earth Engine
- **مؤشرات النباتات:** NDVI, EVI, NDWI, SAVI
- **البلوكتشين:** NFTs لملكية الأراضي وسلسلة التوريد

### 📊 التقارير والتحليلات
- **تقارير شاملة:** تقارير مفصلة عن المزرعة والمحاصيل
- **تحليلات متقدمة:** رسوم بيانية وتوقعات
- **تصدير PDF:** إمكانية تصدير التقارير بصيغة PDF

## 🛠️ التقنيات المستخدمة

### Frontend
- **Next.js 14** - إطار عمل React
- **TypeScript** - لغة البرمجة
- **Tailwind CSS** - تصميم الواجهة
- **Shadcn/ui** - مكونات الواجهة
- **Recharts** - الرسوم البيانية

### Backend
- **Supabase** - قاعدة البيانات والمصادقة
- **Next.js API Routes** - APIs الخادم
- **PostgreSQL** - قاعدة البيانات

### External APIs
- **OpenWeather** - بيانات الطقس
- **OpenAI** - الذكاء الاصطناعي
- **Google Earth Engine** - الأقمار الصناعية
- **ESD Platform** - صور الأقمار الصناعية وتحليلات NDVI
- **Infura** - شبكة Ethereum
- **Etherscan** - مستكشف البلوكشين

## 🚀 البدء السريع

### 1. استنساخ المشروع
```bash
git clone https://github.com/your-username/adham-agritech.git
cd adham-agritech
```

### 2. تثبيت التبعيات
```bash
# باستخدام pnpm (موصى به)
pnpm install

# أو باستخدام npm
npm install
```

### 3. إعداد متغيرات البيئة
```bash
# نسخ ملف البيئة
cp .env.example .env.local

# تحرير الملف وإضافة المفاتيح
nano .env.local
```

### 4. تشغيل الخادم
```bash
# باستخدام pnpm
pnpm run dev

# أو باستخدام npm
npm run dev
```

### 5. فتح المتصفح
```
http://localhost:3003
```

## 🔑 إعداد مفاتيح APIs

### المفاتيح المطلوبة

| الخدمة | الحالة | الأولوية | الرابط |
|--------|--------|----------|--------|
| **Supabase** | ✅ يعمل | حرج | [supabase.com](https://supabase.com) |
| **OpenWeather** | ❌ مطلوب | عالي | [openweathermap.org](https://openweathermap.org) |
| **OpenAI** | ❌ مطلوب | عالي | [platform.openai.com](https://platform.openai.com) |
| **Google Earth Engine** | ❌ مطلوب | متوسط | [earthengine.google.com](https://earthengine.google.com) |
| **ESD Platform** | ✅ مُكوّن | عالي | [portal.esd.earth](https://portal.esd.earth) |

### دليل مفاتيح APIs
راجع [API_KEYS_GUIDE.md](./API_KEYS_GUIDE.md) للحصول على دليل شامل لإعداد جميع المفاتيح.

### اختبار APIs
```bash
# تشغيل سكريبت اختبار APIs
node scripts/test-apis.js

# أو تشغيل سكريبت التفعيل
./scripts/activate-services.sh
```

## 📁 هيكل المشروع

```
adham-agritech/
├── app/                    # صفحات Next.js
│   ├── api/               # API routes
│   ├── auth/              # صفحات المصادقة
│   ├── dashboard/         # لوحة التحكم
│   └── globals.css        # الأنماط العامة
├── components/            # مكونات React
│   ├── dashboard/         # مكونات لوحة التحكم
│   └── ui/               # مكونات الواجهة
├── lib/                   # مكتبات مساعدة
│   ├── agronomy-insights/ # تحليلات المحاصيل بالذكاء الاصطناعي
│   ├── satellite/         # خدمات الأقمار الصناعية
│   ├── services/          # خدمات عامة
│   └── supabase/          # إعدادات Supabase
├── scripts/               # سكريبتات مساعدة
│   ├── *.sql             # سكريبتات قاعدة البيانات
│   ├── activate-services.sh # سكريبت التفعيل
│   └── test-apis.js      # اختبار APIs
├── public/                # الملفات العامة
└── styles/                # ملفات الأنماط
```

## 🗄️ قاعدة البيانات

### الجداول الرئيسية
- **profiles** - ملفات المستخدمين
- **farms** - المزارع
- **fields** - الحقول
- **crops** - المحاصيل
- **soil_analysis** - تحليل التربة
- **weather_data** - بيانات الطقس
- **reports** - التقارير
- **notifications** - الإشعارات

### إعداد قاعدة البيانات
```bash
# تشغيل سكريبتات قاعدة البيانات
psql -h your-db-host -U postgres -d postgres -f scripts/000_create_functions.sql
psql -h your-db-host -U postgres -d postgres -f scripts/001_create_profiles.sql
# ... باقي الملفات
```

## 🌐 النشر

### Vercel (موصى به)
```bash
# تثبيت Vercel CLI
npm i -g vercel

# النشر
vercel

# إضافة متغيرات البيئة في Vercel Dashboard
```

### متغيرات البيئة المطلوبة للنشر
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENWEATHER_API_KEY=your-openweather-api-key
OPENAI_API_KEY=your-openai-api-key
GOOGLE_EARTH_ENGINE_API_KEY=your-google-earth-engine-api-key
```

## 🧪 الاختبار

### اختبار الوحدة
```bash
npm run test
```

### اختبار APIs
```bash
node scripts/test-apis.js
```

### اختبار التطبيق
```bash
npm run build
npm run start
```

## 📊 المراقبة

### Supabase Dashboard
- [Database](https://supabase.com/dashboard/project/mxnkwudqxtgduhenrgvm/editor)
- [Auth](https://supabase.com/dashboard/project/mxnkwudqxtgduhenrgvm/auth/users)
- [API](https://supabase.com/dashboard/project/mxnkwudqxtgduhenrgvm/api)

### Vercel Dashboard
- [Deployments](https://vercel.com/dashboard)
- [Analytics](https://vercel.com/analytics)

## 🤝 المساهمة

1. Fork المشروع
2. أنشئ فرع للميزة الجديدة (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للفرع (`git push origin feature/amazing-feature`)
5. افتح Pull Request

## 📝 الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE).

## 📞 الدعم

- **البريد الإلكتروني:** adhamlouxor@gmail.com
- **النطاق:** [adham-agritech.com](https://adham-agritech.com)
- **GitHub Issues:** [Issues](https://github.com/your-username/adham-agritech/issues)

## 🙏 شكر وتقدير

- [Next.js](https://nextjs.org/) - إطار عمل React
- [Supabase](https://supabase.com/) - قاعدة البيانات
- [OpenAI](https://openai.com/) - الذكاء الاصطناعي
- [Google Earth Engine](https://earthengine.google.com/) - الأقمار الصناعية
- [OpenWeather](https://openweathermap.org/) - بيانات الطقس

---

<div align="center">

**🌱 Adham AgriTech - مستقبل الزراعة الذكية 🌱**

*مُطور بـ ❤️ في مصر*

</div>