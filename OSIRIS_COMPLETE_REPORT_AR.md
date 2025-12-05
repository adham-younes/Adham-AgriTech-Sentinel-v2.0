# 📊 تقرير شامل: نظام OSIRIS - الوكيل السيادي الذكي

## 🎯 نظرة عامة

**OSIRIS** (Omniscient Sovereign Intelligence for Revolutionary Irrigation & Sentinel systems) هو وكيل ذكاء اصطناعي سيادي مصمم لإدارة وتحسين منصة Adham AgriTech بشكل استباقي ومستقل.

---

## 🏗️ المعمارية التقنية

### 1. البنية الأساسية (Core Architecture)

```
┌─────────────────────────────────────────────────────────┐
│                    OSIRIS ECOSYSTEM                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐      ┌──────────────┐                │
│  │   Frontend   │◄────►│  Cloud Func  │                │
│  │  (Vercel)    │      │  (GCP Gen2)  │                │
│  └──────────────┘      └──────┬───────┘                │
│         │                      │                         │
│         │              ┌───────▼────────┐               │
│         │              │  OSIRIS Brain  │               │
│         │              │ (Gemini Flash) │               │
│         │              └───────┬────────┘               │
│         │                      │                         │
│         │         ┌────────────┼────────────┐           │
│         │         │            │            │           │
│         │    ┌────▼───┐  ┌────▼───┐  ┌────▼───┐       │
│         │    │BigQuery│  │ Earth  │  │ Email  │       │
│         │    │  Tool  │  │Engine  │  │  Tool  │       │
│         │    └────────┘  └────────┘  └────────┘       │
│         │                                               │
│         └──────────────► Supabase (Data Layer)         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 2. المكونات الرئيسية

#### أ. الدماغ (The Brain)
- **الملف**: `backend/osiris-core/core/brain.py`
- **النموذج**: Gemini 1.5 Flash (`gemini-1.5-flash-001`)
- **القدرات**:
  - معالجة اللغة الطبيعية (عربي/إنجليزي)
  - استدعاء الأدوات الديناميكي (Function Calling)
  - البحث المتجهي (Vector Search/RAG)
  - حلقة التفكير الإلهية (Divine Cycle)

#### ب. الأدوات (The Hands)

1. **BigQuery Tool** (`tools/bigquery.py`)
   - تحليل بيانات المزارع الضخمة
   - تنفيذ استعلامات SQL معقدة
   - استخراج رؤى من البيانات التاريخية

2. **Earth Engine Tool** (`tools/earth_engine.py`)
   - جلب صور الأقمار الصناعية
   - تحليل مؤشرات NDVI, EVI, SAVI
   - مراقبة صحة المحاصيل

3. **Vercel Deploy Tool** (`tools/vercel.py`)
   - نشر تحديثات الواجهة الأمامية تلقائياً
   - إدارة دورة حياة التطبيق

4. **Email Tool** (`tools/email.py`)
   - إرسال تقارير للمزارعين
   - تنبيهات الري والأمراض
   - استخدام Resend API

#### ج. الذاكرة (Memory/RAG)
- **الملف**: `tools/vector_search.py`
- **الوظيفة**: استرجاع المعرفة من قاعدة بيانات الكود
- **التقنية**: Vertex AI Vector Search

---

## 📁 الملفات المُنشأة

### Backend (Cloud Function)

```
backend/osiris-core/
├── main.py                      # نقطة الدخول الرئيسية
├── requirements.txt             # المكتبات المطلوبة
├── deploy.sh                    # سكريبت النشر الآلي
├── create_scheduler.sh          # إعداد الجدولة الدورية
│
├── core/
│   ├── brain.py                 # العقل الرئيسي (Gemini + Tools)
│   └── directive.py             # التعليمات السيادية
│
└── tools/
    ├── registry.py              # سجل الأدوات المركزي
    ├── bigquery.py              # أداة تحليل البيانات
    ├── earth_engine.py          # أداة الأقمار الصناعية
    ├── vercel.py                # أداة النشر
    ├── email.py                 # أداة البريد الإلكتروني
    └── vector_search.py         # أداة البحث المتجهي
```

### Frontend (Next.js)

```
frontend/src/
├── app/api/osiris/
│   └── route.ts                 # API Route للاتصال بـ OSIRIS
│
└── components/dashboard/
    └── ai-agronomist-widget.tsx # واجهة المحادثة مع OSIRIS
```

### Infrastructure

```
project-root/
├── deploy_with_local_gcloud.sh  # سكريبت النشر المحلي
├── .vercelignore                # استبعاد ملفات من Vercel
└── secrets/
    └── service-account-key.json # مفتاح حساب الخدمة
```

---

## ⚙️ التكوين والإعدادات

### 1. متغيرات البيئة (Environment Variables)

#### Google Cloud Function
```bash
GCP_PROJECT=adham-agritech-sentinel
GCP_REGION=us-central1
SUPABASE_URL=https://nptpmiljdljxjbgoxyqn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=***
EOSDA_API_KEY=***
VERCEL_TOKEN=***
RESEND_API_KEY=***
```

#### Vercel (Frontend)
```bash
OSIRIS_URL=https://osiris-core-262ufxjwqq-uc.a.run.app
NEXT_PUBLIC_SUPABASE_URL=***
NEXT_PUBLIC_SUPABASE_ANON_KEY=***
```

### 2. الأذونات (Permissions)

**Service Account**: `ai-agent-admin@adham-agritech-sentinel.iam.gserviceaccount.com`

**الأدوار**:
- Editor
- AI Platform Admin
- Secret Manager Secret Accessor
- BigQuery Data Viewer
- Storage Object Viewer

---

## 🔄 دورة العمل (Workflow)

### 1. طلب من المستخدم (User Request)
```
المستخدم → الواجهة الأمامية → /api/osiris → Cloud Function → OSIRIS Brain
```

### 2. حلقة التفكير الإلهية (Divine Cycle)
```python
1. PERCEIVE (الإدراك)
   ↓
   - استقبال السؤال
   - البحث في قاعدة المعرفة (RAG)
   - جمع السياق

2. REASON (التفكير)
   ↓
   - تحليل السؤال
   - تحديد الأداة المناسبة
   - صياغة الاستراتيجية

3. CRITIQUE (النقد الذاتي)
   ↓
   - هل الحل آمن؟
   - هل هو الأمثل؟
   - هل يحتاج تحسين؟

4. ACT (التنفيذ)
   ↓
   - استدعاء الأداة
   - تنفيذ الإجراء
   - جمع النتائج

5. VERIFY (التحقق)
   ↓
   - التأكد من النجاح
   - صياغة الرد النهائي
   - إرجاع النتيجة للمستخدم
```

### 3. الأتمتة (Automation)

**Cloud Scheduler Job**: `osiris-heartbeat`
- **التكرار**: كل ساعة (`0 * * * *`)
- **المهمة**: فحص النظام وتحليل البيانات استباقياً
- **الطريقة**: HTTP POST مع OIDC Authentication

---

## 🚀 عملية النشر (Deployment Process)

### 1. النشر على Google Cloud

```bash
# الخطوة 1: المصادقة
gcloud auth activate-service-account \
  --key-file=./secrets/service-account-key.json

# الخطوة 2: تفعيل APIs
gcloud services enable \
  cloudfunctions.googleapis.com \
  aiplatform.googleapis.com \
  secretmanager.googleapis.com

# الخطوة 3: إنشاء/تحديث الأسرار
gcloud secrets create SUPABASE_URL --data-file=-
gcloud secrets add-iam-policy-binding SUPABASE_URL \
  --member="serviceAccount:ai-agent-admin@..." \
  --role="roles/secretmanager.secretAccessor"

# الخطوة 4: نشر Cloud Function
gcloud functions deploy osiris-core \
  --gen2 \
  --region=us-central1 \
  --runtime=python311 \
  --source=backend/osiris-core \
  --entry-point=osiris_core \
  --trigger-http \
  --allow-unauthenticated \
  --service-account=ai-agent-admin@... \
  --set-secrets=SUPABASE_URL=SUPABASE_URL:latest,...
```

### 2. النشر على Vercel

```bash
# الخطوة 1: ربط المشروع
npx vercel link --project adham-agritech

# الخطوة 2: إضافة متغيرات البيئة
echo "https://osiris-core-..." | npx vercel env add OSIRIS_URL production

# الخطوة 3: النشر
npx vercel --prod --yes
```

---

## 🐛 المشاكل الحالية والحلول

### المشكلة الرئيسية: نموذج Gemini غير متاح

**الخطأ**:
```
404 Publisher Model `projects/.../gemini-1.5-flash-001` was not found
```

**السبب المحتمل**:
1. المشروع لا يملك صلاحية الوصول لـ Vertex AI
2. النموذج غير مفعّل في المنطقة `us-central1`
3. الفوترة غير مفعّلة

**الحلول المقترحة**:

#### الحل 1: استخدام Groq بدلاً من Vertex AI
```python
# في brain.py
from groq import Groq

class OsirisBrain:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "llama-3.3-70b-versatile"
```

#### الحل 2: تفعيل Vertex AI API
```bash
# 1. تفعيل الفوترة في GCP Console
# 2. تفعيل Vertex AI API
gcloud services enable aiplatform.googleapis.com

# 3. منح الصلاحيات
gcloud projects add-iam-policy-binding adham-agritech-sentinel \
  --member="serviceAccount:ai-agent-admin@..." \
  --role="roles/aiplatform.user"
```

#### الحل 3: استخدام OpenAI API
```python
from openai import OpenAI

class OsirisBrain:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = "gpt-4-turbo-preview"
```

---

## 📊 الحالة الحالية (Current Status)

### ✅ مكتمل
- [x] بنية الكود الأساسية
- [x] جميع الأدوات (BigQuery, Earth Engine, Vercel, Email)
- [x] واجهة المحادثة في Frontend
- [x] API Route للاتصال
- [x] Cloud Scheduler للأتمتة
- [x] النشر على Vercel
- [x] إعداد Secrets في GCP

### ⚠️ يحتاج إصلاح
- [ ] **نموذج Gemini غير متاح** (المشكلة الحرجة)
- [ ] اختبار Function Calling
- [ ] اختبار Vector Search/RAG
- [ ] مراقبة الأداء والتكاليف

### 🔮 مستقبلي
- [ ] تكامل مع BigQuery الفعلي
- [ ] ملء قاعدة المعرفة (Vector Search)
- [ ] تقارير دورية تلقائية
- [ ] تحسين الأداء والتكاليف

---

## 💰 التكاليف المتوقعة

### Google Cloud
- **Cloud Functions**: ~$0.40/مليون طلب
- **Vertex AI (Gemini Flash)**: ~$0.000125/1K حرف
- **Cloud Scheduler**: $0.10/شهر لكل وظيفة
- **Secret Manager**: $0.06/سر/شهر

### Vercel
- **Hobby Plan**: مجاني (حتى 100GB Bandwidth)
- **Pro Plan**: $20/شهر (إذا احتجت أكثر)

### التقدير الشهري
- **الحد الأدنى**: $5-10/شهر
- **الاستخدام المتوسط**: $20-50/شهر
- **الاستخدام الكثيف**: $100+/شهر

---

## 🔐 الأمان (Security)

### 1. إدارة الأسرار
- جميع المفاتيح في Google Secret Manager
- لا توجد مفاتيح مكشوفة في الكود
- Service Account محدود الصلاحيات

### 2. المصادقة
- Cloud Function: OIDC Authentication
- Vercel: Environment Variables
- Supabase: RLS Policies

### 3. العزل
- كل مزارع لديه بيانات معزولة
- Row Level Security في Supabase
- Service Account منفصل لكل خدمة

---

## 📚 الموارد والمراجع

### الوثائق
- [Vertex AI Gemini](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini)
- [Cloud Functions Gen 2](https://cloud.google.com/functions/docs/2nd-gen/overview)
- [Vercel Deployment](https://vercel.com/docs/deployments/overview)

### الأدوات
- [Google Cloud Console](https://console.cloud.google.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://supabase.com/dashboard)

---

## 🎯 الخطوات التالية الموصى بها

### الأولوية القصوى (الآن)
1. **حل مشكلة Gemini**:
   - الخيار أ: تفعيل Vertex AI + الفوترة
   - الخيار ب: التحويل إلى Groq (أسرع)
   - الخيار ج: استخدام OpenAI

2. **اختبار شامل**:
   - اختبار كل أداة على حدة
   - اختبار Function Calling
   - اختبار من الواجهة الأمامية

### الأولوية المتوسطة (هذا الأسبوع)
3. **ملء قاعدة المعرفة**:
   - تشغيل `consecrate_codebase.ts`
   - إضافة وثائق علمية عن الزراعة
   - اختبار RAG

4. **التحسينات**:
   - إضافة معالجة أخطاء أفضل
   - تحسين رسائل الخطأ للمستخدم
   - إضافة Logging شامل

### الأولوية المنخفضة (الشهر القادم)
5. **المراقبة والتحليل**:
   - إعداد Cloud Monitoring
   - تتبع التكاليف
   - تحليل الأداء

6. **الميزات الإضافية**:
   - تقارير PDF تلقائية
   - تكامل WhatsApp
   - لوحة تحكم OSIRIS مخصصة

---

## 📞 الدعم والصيانة

### السجلات (Logs)
```bash
# Cloud Function Logs
gcloud functions logs read osiris-core --region=us-central1 --limit=50

# Vercel Logs
npx vercel logs https://adham-agritech.com
```

### التشخيص
```bash
# اختبار Cloud Function
curl -X POST https://osiris-core-262ufxjwqq-uc.a.run.app \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello OSIRIS"}'

# اختبار Frontend API
curl -X POST https://adham-agritech.com/api/osiris \
  -H "Content-Type: application/json" \
  -d '{"prompt": "كيف حال القمح؟"}'
```

---

**تم إنشاء هذا التقرير في**: 2025-12-04  
**الحالة**: النظام منشور لكن يحتاج إصلاح نموذج AI  
**الأولوية**: حرجة - يجب حل مشكلة Gemini API فوراً
