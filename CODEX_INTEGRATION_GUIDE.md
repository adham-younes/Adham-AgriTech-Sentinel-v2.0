# 🔑 دليل تكامل Codex - Adham AgriTech

> **تاريخ الإنشاء:** 21 أكتوبر 2025  
> **الغرض:** تمكين Codex من البناء والنشر المباشر

---

## 📁 **معلومات المستودع**

### 🐙 **GitHub Repository**
```bash
# المستودع الرئيسي
REPO_URL="https://github.com/adham-younes/Adham-AgriTech-Full-Stack"
REPO_OWNER="adham-younes"
REPO_NAME="Adham-AgriTech-Full-Stack"
DEFAULT_BRANCH="main"

# فروع العمل
FEATURE_BRANCH="cursor/generate-report-f83f"
DEVELOPMENT_BRANCH="develop"
```

### 🔐 **GitHub Access**
```bash
# GitHub Token (للمصادقة)
GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# SSH Key (للمصادقة المباشرة)
SSH_KEY_PATH="~/.ssh/id_rsa"
SSH_PUBLIC_KEY="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC..."
```

---

## 🌐 **معلومات النطاق والنشر**

### 🚀 **Vercel Deployment**
```bash
# Vercel Project
VERCEL_PROJECT_ID="adham-agritech"
VERCEL_ORG_ID="team_xxxxxxxx"
VERCEL_DOMAIN="adham-agritech.com"
VERCEL_URL="https://www.adham-agritech.com"

# Vercel CLI
VERCEL_TOKEN="vercel_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
VERCEL_TEAM_ID="team_xxxxxxxx"
```

### 🔧 **Build Configuration**
```bash
# Build Commands
BUILD_COMMAND="npm run build"
DEV_COMMAND="npm run dev"
START_COMMAND="npm start"

# Node.js Version
NODE_VERSION="18.x"
NPM_VERSION="9.x"
```

---

## 🔑 **مفاتيح APIs**

### 🌤️ **OpenWeather API**
```bash
OPENWEATHER_API_KEY="bf14cf140dd3f8ddfd62b4fd9f6f9795"
OPENWEATHER_BASE_URL="https://api.openweathermap.org/data/2.5"
OPENWEATHER_UNITS="metric"
OPENWEATHER_LANG="ar"
```

### 🗺️ **Mapbox API**
```bash
MAPBOX_ACCESS_TOKEN="your_mapbox_access_token_here"
MAPBOX_STYLE_URL="mapbox://styles/mapbox/satellite-v9"
MAPBOX_ZOOM_LEVEL="15"
```
> ⚠️ **تذكير:** خزّن مفتاح Mapbox في ملفات `.env` أو أسرار Vercel/GitHub، ولا تشاركه داخل المستودع العام.

### 🤖 **OpenAI API**
```bash
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
OPENAI_MODEL="gpt-4"
OPENAI_TEMPERATURE="0.7"
OPENAI_MAX_TOKENS="4000"
```

### 🗄️ **Supabase**
```bash
SUPABASE_URL="https://xxxxxxxxxxxxxxxx.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### ⛓️ **Blockchain APIs**
```bash
# Infura
INFURA_PROJECT_ID="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
INFURA_ENDPOINT="https://sepolia.infura.io/v3/"

# Etherscan
ETHERSCAN_API_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
ETHERSCAN_BASE_URL="https://api-sepolia.etherscan.io/api"
```

---

## 🛠️ **أوامر البناء والنشر**

### 📦 **تثبيت التبعيات**
```bash
# تثبيت التبعيات
npm install

# أو باستخدام pnpm
pnpm install

# تثبيت Vercel CLI
npm install -g vercel
```

### 🏗️ **البناء**
```bash
# بناء التطبيق
npm run build

# بناء مع التحقق من الأنواع
npm run build:check

# بناء مع التحقق من الأخطاء
npm run build:lint
```

### 🚀 **النشر**
```bash
# نشر إلى Vercel
vercel --prod

# نشر مع إعادة بناء
vercel --prod --force

# نشر فرع محدد
vercel --prod --target production
```

### 🔄 **Git Operations**
```bash
# إضافة التغييرات
git add .

# عمل commit
git commit -m "feat: Description of changes"

# رفع التغييرات
git push origin main

# إنشاء فرع جديد
git checkout -b feature/new-feature

# دمج الفرع
git merge feature/new-feature
```

---

## 📁 **هيكل المشروع**

### 🏗️ **الملفات الرئيسية**
```
/workspace/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── dashboard/         # Dashboard Pages
│   └── auth/              # Authentication
├── components/            # React Components
│   ├── ui/               # UI Components
│   └── dashboard/        # Dashboard Components
├── lib/                  # Utilities & Services
│   ├── domain/           # Domain Layer
│   ├── i18n/            # Internationalization
│   └── supabase/        # Supabase Client
├── scripts/              # Database Scripts
└── public/               # Static Assets
```

### 🔧 **ملفات التكوين**
```bash
# Next.js
next.config.mjs

# TypeScript
tsconfig.json

# Tailwind CSS
tailwind.config.js

# Environment
.env.local
.env.example
```

---

## 🚨 **أوامر الطوارئ**

### 🔄 **إعادة البناء الكامل**
```bash
# حذف node_modules وإعادة التثبيت
rm -rf node_modules package-lock.json
npm install

# إعادة بناء مع تنظيف الكاش
npm run build -- --no-cache
```

### 🚀 **نشر سريع**
```bash
# نشر فوري مع إعادة بناء
git add . && git commit -m "hotfix: Quick fix" && git push origin main
```

### 🔍 **تشخيص المشاكل**
```bash
# فحص حالة APIs
node scripts/test-apis.js

# فحص حالة البناء
npm run build 2>&1 | tee build.log

# فحص حالة النشر
vercel logs --follow
```

---

## 📊 **مراقبة الأداء**

### 📈 **مؤشرات الأداء**
```bash
# حجم البناء
npm run build -- --analyze

# سرعة التحميل
lighthouse https://www.adham-agritech.com

# حالة APIs
curl -s "https://www.adham-agritech.com/api/services/health"
```

### 🔍 **سجلات الأخطاء**
```bash
# سجلات Vercel
vercel logs --follow

# سجلات GitHub Actions
gh run list --repo adham-younes/Adham-AgriTech-Full-Stack
```

---

## 🎯 **أفضل الممارسات**

### ✅ **قبل النشر**
1. ✅ تشغيل `npm run build` بنجاح
2. ✅ اختبار APIs مع `node scripts/test-apis.js`
3. ✅ فحص التغييرات مع `git status`
4. ✅ عمل commit واضح ومفهوم

### 🚀 **أثناء النشر**
1. 🚀 استخدام `vercel --prod` للنشر
2. 🚀 مراقبة السجلات مع `vercel logs --follow`
3. 🚀 اختبار النطاق بعد النشر

### 🔄 **بعد النشر**
1. 🔄 التحقق من عمل النطاق
2. 🔄 اختبار الميزات الجديدة
3. 🔄 مراقبة الأداء والأخطاء

---

## 📞 **معلومات الاتصال**

### 👨‍💻 **المطور الرئيسي**
- **الاسم:** Adham Younes
- **GitHub:** @adham-younes
- **البريد:** adham@example.com

### 🏢 **المنظمة**
- **الاسم:** Adham AgriTech
- **النطاق:** adham-agritech.com
- **الوصف:** منصة الزراعة الذكية

---

## 🔐 **ملاحظات الأمان**

### ⚠️ **تحذيرات مهمة**
- 🔐 **لا تشارك مفاتيح APIs** مع أي شخص
- 🔐 **استخدم متغيرات البيئة** لتخزين المفاتيح
- 🔐 **حدث المفاتيح** بانتظام
- 🔐 **راقب استخدام APIs** لتجنب التجاوزات

### 🛡️ **حماية المفاتيح**
```bash
# إضافة إلى .gitignore
echo ".env.local" >> .gitignore
echo "*.key" >> .gitignore
echo "secrets/" >> .gitignore
```

---

**🎉 Codex الآن جاهز للبناء والنشر المباشر!**

> **آخر تحديث:** 21 أكتوبر 2025 - الساعة 06:15 صباحاً