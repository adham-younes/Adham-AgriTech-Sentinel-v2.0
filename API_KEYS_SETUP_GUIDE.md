# 🔑 دليل إعداد مفاتيح APIs - Adham AgriTech

> **دليل شامل خطوة بخطوة للحصول على جميع المفاتيح المطلوبة**

---

## 🤖 **1. OpenAI API Key**

### 📝 **الخطوات:**
1. اذهب إلى: https://platform.openai.com/api-keys
2. سجل دخول أو أنشئ حساب جديد
3. اضغط على "Create new secret key"
4. اختر اسم للمفتاح (مثل: "Adham AgriTech")
5. انسخ المفتاح واحفظه

### 🔑 **المفتاح:**
```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 💰 **التسعير:**
- **GPT-4:** $0.03/1K tokens (input), $0.06/1K tokens (output)
- **GPT-3.5:** $0.001/1K tokens (input), $0.002/1K tokens (output)
- **الحد المجاني:** $5 شهرياً

---

## 🗄️ **2. Supabase**

### 📝 **الخطوات:**
1. اذهب إلى: https://supabase.com/dashboard
2. اضغط على "New Project"
3. اختر منظمة أو أنشئ واحدة جديدة
4. أدخل اسم المشروع: "Adham AgriTech"
5. اختر كلمة مرور قوية لقاعدة البيانات
6. اختر المنطقة: "Middle East (Bahrain)"
7. اضغط على "Create new project"
8. انتظر حتى يكتمل الإعداد (2-3 دقائق)
9. اذهب إلى Settings > API
10. انسخ URL و ANON KEY

### 🔑 **المفاتيح:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 💰 **التسعير:**
- **الخطة المجانية:** 500MB قاعدة بيانات، 2GB bandwidth
- **Pro:** $25/شهر

---

## ⛓️ **3. Infura (Blockchain)**

### 📝 **الخطوات:**
1. اذهب إلى: https://infura.io/dashboard
2. اضغط على "Create New Key"
3. اختر "Web3 API"
4. أدخل اسم المشروع: "Adham AgriTech"
5. اختر الشبكة: "Ethereum"
6. اضغط على "Create"
7. انسخ Project ID

### 🔑 **المفتاح:**
```bash
INFURA_PROJECT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
INFURA_ENDPOINT=https://sepolia.infura.io/v3/
```

### 💰 **التسعير:**
- **الخطة المجانية:** 100K requests/يوم
- **Growth:** $50/شهر

---

## ⛓️ **4. Etherscan (Blockchain)**

### 📝 **الخطوات:**
1. اذهب إلى: https://etherscan.io/apis
2. اضغط على "Create Account"
3. سجل دخول أو أنشئ حساب
4. اذهب إلى "API-KEYs"
5. اضغط على "Add"
6. أدخل اسم المفتاح: "Adham AgriTech"
7. انسخ API Key

### 🔑 **المفتاح:**
```bash
ETHERSCAN_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ETHERSCAN_BASE_URL=https://api-sepolia.etherscan.io/api
```

### 💰 **التسعير:**
- **الخطة المجانية:** 5 calls/second
- **Standard:** $9/شهر

---

## 🚀 **5. Vercel (Deployment)**

### 📝 **الخطوات:**
1. اذهب إلى: https://vercel.com/dashboard
2. اضغط على "New Project"
3. اربط حساب GitHub
4. اختر المستودع: "Adham-AgriTech-Full-Stack"
5. اضغط على "Import"
6. اذهب إلى Settings > General
7. انسخ Project ID و Team ID
8. اذهب إلى Settings > Tokens
9. اضغط على "Create Token"
10. انسخ Token

### 🔑 **المفاتيح:**
```bash
VERCEL_PROJECT_ID=adham-agritech
VERCEL_ORG_ID=team_xxxxxxxx
VERCEL_TOKEN=vercel_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VERCEL_TEAM_ID=team_xxxxxxxx
```

### 💰 **التسعير:**
- **الخطة المجانية:** 100GB bandwidth/شهر
- **Pro:** $20/شهر

---

## 🔐 **6. GitHub (Integration)**

### 📝 **الخطوات:**
1. اذهب إلى: https://github.com/settings/tokens
2. اضغط على "Generate new token"
3. اختر "Generate new token (classic)"
4. أدخل اسم المفتاح: "Adham AgriTech"
5. اختر الصلاحيات:
   - ✅ repo (Full control of private repositories)
   - ✅ workflow (Update GitHub Action workflows)
   - ✅ write:packages (Upload packages to GitHub Package Registry)
6. اضغط على "Generate token"
7. انسخ المفتاح واحفظه

### 🔑 **المفتاح:**
```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_REPO=adham-younes/Adham-AgriTech-Full-Stack
GITHUB_BRANCH=main
```

### 💰 **التسعير:**
- **مجاني** للاستخدام الشخصي
- **Team:** $4/شهر/مستخدم

---

## 📋 **ملخص جميع المفاتيح**

### ✅ **بعد الحصول على جميع المفاتيح:**

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Infura
INFURA_PROJECT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
INFURA_ENDPOINT=https://sepolia.infura.io/v3/

# Etherscan
ETHERSCAN_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ETHERSCAN_BASE_URL=https://api-sepolia.etherscan.io/api

# Vercel
VERCEL_PROJECT_ID=adham-agritech
VERCEL_ORG_ID=team_xxxxxxxx
VERCEL_TOKEN=vercel_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VERCEL_TEAM_ID=team_xxxxxxxx

# GitHub
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_REPO=adham-younes/Adham-AgriTech-Full-Stack
GITHUB_BRANCH=main
```

---

## 🔧 **كيفية إضافة المفاتيح**

### 1️⃣ **إضافة إلى .env.local:**
```bash
# انسخ المفاتيح أعلاه وأضفها إلى .env.local
echo "OPENAI_API_KEY=your_key_here" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=your_url_here" >> .env.local
# ... وهكذا
```

### 2️⃣ **إضافة إلى Vercel:**
```bash
# استخدم Vercel CLI
npx vercel env add OPENAI_API_KEY
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
# ... وهكذا
```

### 3️⃣ **إضافة إلى GitHub Secrets:**
1. اذهب إلى المستودع
2. Settings > Secrets and variables > Actions
3. اضغط على "New repository secret"
4. أضف كل مفتاح

---

## 🧪 **اختبار المفاتيح**

### 🔍 **بعد إضافة المفاتيح:**
```bash
# اختبار جميع APIs
cd /workspace && node scripts/test-apis.js

# بناء التطبيق
cd /workspace && npm run build

# نشر التطبيق
cd /workspace && npx vercel --prod
```

---

## 💰 **التكلفة الإجمالية**

| الخدمة | الخطة المجانية | الخطة المدفوعة |
|--------|----------------|-----------------|
| **OpenAI** | $5/شهر | $20+/شهر |
| **Supabase** | مجاني | $25/شهر |
| **Infura** | مجاني | $50/شهر |
| **Etherscan** | مجاني | $9/شهر |
| **Vercel** | مجاني | $20/شهر |
| **GitHub** | مجاني | $4/شهر/مستخدم |

**المجموع:** $5/شهر (الخطة المجانية) أو $128+/شهر (الخطة المدفوعة)

---

## 🚨 **تحذيرات مهمة**

### ⚠️ **أمان المفاتيح:**
- 🔐 **لا تشارك المفاتيح** مع أي شخص
- 🔐 **احفظ المفاتيح** في مكان آمن
- 🔐 **استخدم متغيرات البيئة** فقط
- 🔐 **أضف .env.local إلى .gitignore**

### 🛡️ **حماية المفاتيح:**
```bash
# إضافة إلى .gitignore
echo ".env.local" >> .gitignore
echo "*.key" >> .gitignore

# تعيين صلاحيات الملف
chmod 600 .env.local
```

---

## 🎯 **الخطوات التالية**

1. **احصل على المفاتيح** - اتبع الدليل أعلاه
2. **أضف المفاتيح** - إلى .env.local
3. **اختبر المفاتيح** - node scripts/test-apis.js
4. **ابن التطبيق** - npm run build
5. **انشر التطبيق** - npx vercel --prod

---

**🔑 اتبع هذا الدليل للحصول على جميع المفاتيح!**

> **آخر تحديث:** 21 أكتوبر 2025 - الساعة 07:15 صباحاً