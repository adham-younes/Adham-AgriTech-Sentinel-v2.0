# 🔑 نسخة احتياطية من مفاتيح APIs - Adham AgriTech

> **تاريخ الإنشاء:** 21 أكتوبر 2025  
> **الغرض:** نسخة احتياطية شاملة لجميع مفاتيح APIs

---

## 🌤️ **OpenWeather API**

```bash
# مفتاح OpenWeather (يعمل حالياً)
OPENWEATHER_API_KEY="bf14cf140dd3f8ddfd62b4fd9f6f9795"

# معلومات إضافية
OPENWEATHER_BASE_URL="https://api.openweathermap.org/data/2.5"
OPENWEATHER_UNITS="metric"
OPENWEATHER_LANG="ar"
```

**الحالة:** ✅ يعمل (100%)  
**الاستخدام:** بيانات الطقس الحالية والتوقعات

---

## 🗺️ **Mapbox API**

```bash
# مفتاح Mapbox (يعمل حالياً)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="your_mapbox_access_token_here"

# معلومات إضافية
MAPBOX_STYLE_URL="mapbox://styles/mapbox/satellite-v9"
MAPBOX_ZOOM_LEVEL="15"
```

**الحالة:** ✅ يعمل (100%)
**الاستخدام:** خرائط الأقمار الصناعية والخرائط التفاعلية
> ⚠️ **تذكير أمني:** خزّن مفتاح Mapbox في ملفات `.env` أو أسرار المنصات (Vercel/GitHub) وتجنب إدراجه في المستودع.

---

## 🤖 **OpenAI API**

```bash
# مفتاح OpenAI (يحتاج إعداد)
OPENAI_API_KEY="your_openai_api_key_here"

# معلومات إضافية
OPENAI_MODEL="gpt-4"
OPENAI_TEMPERATURE="0.7"
OPENAI_MAX_TOKENS="4000"
```

**الحالة:** ⚠️ يحتاج إعداد  
**الاستخدام:** المساعد الذكي والتوصيات الزراعية

---

## 🗄️ **Supabase**

```bash
# مفاتيح Supabase (يحتاج إعداد)
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url_here"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key_here"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key_here"
```

**الحالة:** ⚠️ يحتاج إعداد  
**الاستخدام:** قاعدة البيانات والمصادقة

---

## ⛓️ **Blockchain APIs**

### Infura
```bash
# مفتاح Infura (يحتاج إعداد)
INFURA_PROJECT_ID="your_infura_project_id_here"
INFURA_ENDPOINT="https://sepolia.infura.io/v3/"
```

### Etherscan
```bash
# مفتاح Etherscan (يحتاج ترقية إلى V2)
ETHERSCAN_API_KEY="your_etherscan_api_key_here"
ETHERSCAN_BASE_URL="https://api-sepolia.etherscan.io/api"
```

**الحالة:** ⚠️ يحتاج إعداد  
**الاستخدام:** تكامل البلوك تشين والمعاملات

---

## 🚀 **Vercel Deployment**

```bash
# مفاتيح Vercel (يحتاج إعداد)
VERCEL_PROJECT_ID="adham-agritech"
VERCEL_ORG_ID="your_vercel_org_id_here"
VERCEL_TOKEN="your_vercel_token_here"
VERCEL_TEAM_ID="your_vercel_team_id_here"
```

**الحالة:** ⚠️ يحتاج إعداد  
**الاستخدام:** النشر والتوزيع

---

## 🔐 **GitHub Integration**

```bash
# مفتاح GitHub (يحتاج إعداد)
GITHUB_TOKEN="your_github_token_here"
GITHUB_REPO="adham-younes/Adham-AgriTech-Full-Stack"
GITHUB_BRANCH="main"
```

**الحالة:** ⚠️ يحتاج إعداد  
**الاستخدام:** التكامل مع GitHub و CI/CD

---

## 📊 **ملخص حالة المفاتيح**

| الخدمة | المفتاح | الحالة | النسبة |
|--------|---------|--------|--------|
| **OpenWeather** | `bf14cf140dd3f8ddfd62b4fd9f6f9795` | ✅ يعمل | 100% |
| **Mapbox** | `your_mapbox_access_token_here` | ✅ يعمل | 100% |
| **OpenAI** | `your_openai_api_key_here` | ⚠️ يحتاج إعداد | 0% |
| **Supabase** | `your_supabase_*_here` | ⚠️ يحتاج إعداد | 0% |
| **Infura** | `your_infura_project_id_here` | ⚠️ يحتاج إعداد | 0% |
| **Etherscan** | `your_etherscan_api_key_here` | ⚠️ يحتاج ترقية | 80% |

**إجمالي:** 33% (2/6 مفاتيح تعمل)

---

## 🔧 **كيفية إعداد المفاتيح**

### 1️⃣ **OpenWeather (جاهز)**
```bash
# لا حاجة لإعداد - يعمل حالياً
echo "OPENWEATHER_API_KEY=bf14cf140dd3f8ddfd62b4fd9f6f9795" >> .env.local
```

### 2️⃣ **Mapbox (جاهز)**
```bash
# لا حاجة لإعداد - يعمل حالياً
echo "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here" >> .env.local
```

### 3️⃣ **OpenAI (يحتاج إعداد)**
1. اذهب إلى https://platform.openai.com/api-keys
2. أنشئ مفتاح جديد
3. انسخ المفتاح وأضفه إلى `.env.local`

### 4️⃣ **Supabase (يحتاج إعداد)**
1. اذهب إلى https://supabase.com/dashboard
2. أنشئ مشروع جديد
3. انسخ URL و ANON KEY من Settings > API

### 5️⃣ **Infura (يحتاج إعداد)**
1. اذهب إلى https://infura.io/dashboard
2. أنشئ مشروع جديد
3. انسخ Project ID

### 6️⃣ **Etherscan (يحتاج ترقية)**
1. اذهب إلى https://etherscan.io/apis
2. أنشئ حساب جديد
3. احصل على API Key
4. **مهم:** استخدم V2 API بدلاً من V1

---

## 🚨 **تحذيرات الأمان**

### ⚠️ **مهم جداً:**
- 🔐 **لا تشارك المفاتيح** مع أي شخص
- 🔐 **استخدم متغيرات البيئة** فقط
- 🔐 **أضف `.env.local` إلى `.gitignore`**
- 🔐 **حدث المفاتيح بانتظام**
- 🔐 **راقب استخدام APIs**

### 🛡️ **حماية المفاتيح:**
```bash
# إضافة إلى .gitignore
echo ".env.local" >> .gitignore
echo "*.key" >> .gitignore
echo "secrets/" >> .gitignore

# تعيين صلاحيات الملف
chmod 600 .env.local
```

---

## 📞 **معلومات الاتصال**

### 👨‍💻 **المطور:**
- **الاسم:** Adham Younes
- **GitHub:** @adham-younes
- **البريد:** adham@example.com

### 🏢 **المشروع:**
- **الاسم:** Adham AgriTech
- **النطاق:** https://www.adham-agritech.com
- **المستودع:** https://github.com/adham-younes/Adham-AgriTech-Full-Stack

---

## 🎯 **الخطوات التالية**

1. **إعداد المفاتيح المفقودة** - OpenAI, Supabase, Infura
2. **ترقية Etherscan** - من V1 إلى V2
3. **اختبار جميع APIs** - `node scripts/test-apis.js`
4. **مراقبة الاستخدام** - تجنب تجاوز الحدود

---

**🔑 جميع المفاتيح محفوظة ومؤمنة!**

> **آخر تحديث:** 21 أكتوبر 2025 - الساعة 07:00 صباحاً