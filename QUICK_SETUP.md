# 🚀 إعداد سريع للمفاتيح

> **للنسخ واللصق المباشر**

---

## 🔗 **روابط سريعة**

### 🤖 **OpenAI**
- **الرابط:** https://platform.openai.com/api-keys
- **الخطوات:** Create new secret key → Copy key
- **المفتاح:** `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 🗄️ **Supabase**
- **الرابط:** https://supabase.com/dashboard
- **الخطوات:** New Project → Settings → API → Copy keys
- **المفاتيح:** 
  - URL: `https://xxxxxxxxxxxxxxxx.supabase.co`
  - ANON KEY: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### ⛓️ **Infura**
- **الرابط:** https://infura.io/dashboard
- **الخطوات:** Create New Key → Web3 API → Copy Project ID
- **المفتاح:** `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### ⛓️ **Etherscan**
- **الرابط:** https://etherscan.io/apis
- **الخطوات:** Create Account → API-KEYs → Add → Copy key
- **المفتاح:** `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 🚀 **Vercel**
- **الرابط:** https://vercel.com/dashboard
- **الخطوات:** New Project → Import GitHub → Settings → Copy IDs
- **المفاتيح:**
  - Project ID: `adham-agritech`
  - Team ID: `team_xxxxxxxx`

### 🔐 **GitHub**
- **الرابط:** https://github.com/settings/tokens
- **الخطوات:** Generate new token → Select permissions → Copy
- **المفتاح:** `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 📋 **نسخ سريع - جميع المفاتيح**

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

## 🔧 **إضافة المفاتيح**

### 1️⃣ **إضافة إلى .env.local:**
```bash
# انسخ المفاتيح أعلاه وأضفها إلى .env.local
echo "OPENAI_API_KEY=your_key_here" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=your_url_here" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here" >> .env.local
echo "SUPABASE_SERVICE_ROLE_KEY=your_key_here" >> .env.local
echo "INFURA_PROJECT_ID=your_key_here" >> .env.local
echo "ETHERSCAN_API_KEY=your_key_here" >> .env.local
echo "VERCEL_PROJECT_ID=adham-agritech" >> .env.local
echo "VERCEL_ORG_ID=your_team_id_here" >> .env.local
echo "VERCEL_TOKEN=your_token_here" >> .env.local
echo "VERCEL_TEAM_ID=your_team_id_here" >> .env.local
echo "GITHUB_TOKEN=your_token_here" >> .env.local
```

### 2️⃣ **اختبار المفاتيح:**
```bash
cd /workspace && node scripts/test-apis.js
```

### 3️⃣ **بناء التطبيق:**
```bash
cd /workspace && npm run build
```

### 4️⃣ **نشر التطبيق:**
```bash
cd /workspace && npx vercel --prod
```

---

## 💰 **التكلفة**

- **الخطة المجانية:** $5/شهر (OpenAI فقط)
- **الخطة المدفوعة:** $128+/شهر

---

**🚀 اتبع هذا الدليل السريع للحصول على جميع المفاتيح!**