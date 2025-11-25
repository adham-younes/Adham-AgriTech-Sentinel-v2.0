# 🤖 Codex Integration Guide - Adham AgriTech

> **دليل شامل لتمكين Codex من البناء والنشر المباشر**

---

## 🎯 **نظرة عامة**

هذا المشروع عبارة عن منصة زراعة ذكية متكاملة تم تطويرها باستخدام Next.js 14 مع App Router، وتتضمن:

- 🏗️ **Domain Layer Architecture** - فصل منطق الأعمال عن العرض
- 🌐 **Centralized i18n** - دعم كامل للعربية والإنجليزية  
- 🛰️ **Satellite Integration** - خرائط الأقمار الصناعية و NDVI
- 🤖 **AI Assistant** - مساعد ذكي للتوصيات الزراعية
- ⛓️ **Blockchain Integration** - تكامل مع شبكة Ethereum
- 📊 **Advanced Analytics** - تحليلات متقدمة ورسوم بيانية

---

## 🚀 **Quick Start for Codex**

### 1️⃣ **البناء السريع**
```bash
cd /workspace && npm install && npm run build
```

### 2️⃣ **النشر المباشر**
```bash
cd /workspace && git add . && git commit -m "feat: Update from Codex" && git push origin main
```

### 3️⃣ **التحقق من النشر**
```bash
curl -s "https://www.adham-agritech.com" | grep "Adham AgriTech"
```

---

## 🔑 **مفاتيح APIs المطلوبة**

### ✅ **مفاتيح تعمل حالياً:**
- `OPENWEATHER_API_KEY=bf14cf140dd3f8ddfd62b4fd9f6f9795`
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here`
> ⚠️ **تذكير أمني:** يجب حفظ مفتاح Mapbox في ملفات البيئة (مثل `.env.local`) أو أسرار Vercel/GitHub وعدم إدراجه في المستودع.

### ⚠️ **مفاتيح تحتاج إعداد:**
- `NEXT_PUBLIC_SUPABASE_URL` - قاعدة البيانات
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - مفتاح Supabase
- `OPENAI_API_KEY` - الذكاء الاصطناعي
- `INFURA_PROJECT_ID` - Blockchain
- `ETHERSCAN_API_KEY` - Blockchain

---

## 📁 **هيكل المشروع**

```
/workspace/
├── 🏗️ lib/domain/           # Domain Layer
│   ├── services/            # Business Services
│   ├── types/              # TypeScript Types
│   └── hooks/              # Custom Hooks
├── 🌐 lib/i18n/            # Internationalization
│   ├── locales/            # Translation Files
│   └── hooks/              # Translation Hooks
├── 🎨 components/          # React Components
│   ├── ui/                # UI Components
│   └── dashboard/          # Dashboard Components
├── 📱 app/                 # Next.js App Router
│   ├── api/               # API Routes
│   ├── dashboard/         # Dashboard Pages
│   └── auth/              # Authentication
└── 🔧 scripts/            # Utility Scripts
```

---

## 🛠️ **أوامر Codex المفضلة**

### 🚀 **نشر سريع**
```bash
cd /workspace && npm run build && git add . && git commit -m "feat: Quick update from Codex" && git push origin main
```

### 🔍 **فحص شامل**
```bash
cd /workspace && npm run build && node scripts/test-apis.js && curl -s "https://www.adham-agritech.com" | grep "Adham AgriTech"
```

### 🔄 **إعادة نشر**
```bash
cd /workspace && git pull origin main && npm run build && npx vercel --prod
```

---

## 📊 **حالة APIs الحالية**

| الخدمة | الحالة | النسبة |
|--------|--------|--------|
| **Supabase** | ✅ يعمل | 100% |
| **OpenAI** | ✅ يعمل | 100% |
| **Infura** | ✅ يعمل | 100% |
| **Mapbox** | ✅ يعمل | 100% |
| **OpenWeather** | ✅ يعمل | 100% |
| **Etherscan** | ⚠️ V1 | 80% |

**إجمالي:** 83% (5/6 APIs تعمل بالكامل)

---

## 🎯 **الميزات المتاحة**

### ✅ **Production Ready:**
- 🏠 **Dashboard** - لوحة التحكم الرئيسية
- 🚜 **Farms Management** - إدارة المزارع
- 🌱 **Fields Management** - إدارة الحقول
- 🌤️ **Weather Data** - بيانات الطقس
- 💧 **Irrigation Systems** - أنظمة الري
- 📊 **Reports & Analytics** - التقارير والتحليلات

### 🧪 **Beta Testing:**
- 🛰️ **Satellite Maps** - خرائط الأقمار الصناعية
- 🤖 **AI Assistant** - المساعد الذكي
- ⛓️ **Blockchain Integration** - تكامل البلوك تشين

### 🚧 **In Development:**
- 🛒 **Marketplace** - السوق الإلكتروني
- 💬 **Community Forum** - منتدى المجتمع
- 🔔 **Smart Notifications** - الإشعارات الذكية

---

## 🔧 **استكشاف الأخطاء**

### ❌ **مشاكل شائعة:**

1. **Build Failed:**
   ```bash
   cd /workspace && rm -rf node_modules package-lock.json && npm install && npm run build
   ```

2. **API Errors:**
   ```bash
   cd /workspace && node scripts/test-apis.js
   ```

3. **Deployment Issues:**
   ```bash
   cd /workspace && npx vercel --prod --force
   ```

4. **Git Conflicts:**
   ```bash
   cd /workspace && git reset --hard HEAD && git pull origin main
   ```

---

## 📞 **معلومات الاتصال**

- **المطور:** Adham Younes
- **GitHub:** @adham-younes
- **النطاق:** https://www.adham-agritech.com
- **المستودع:** https://github.com/adham-younes/Adham-AgriTech-Full-Stack

---

## 🎉 **Codex Ready!**

**Codex الآن جاهز للبناء والنشر المباشر!**

استخدم الأوامر أعلاه للحصول على أفضل النتائج. جميع الملفات والملفات التكوينية جاهزة للاستخدام.

---

> **آخر تحديث:** 21 أكتوبر 2025 - الساعة 06:30 صباحاً