# 🚀 دليل النشر - Adham AgriTech Sentinel v2.0

## نظرة عامة

هذا الدليل يشرح كيفية نشر تطبيق Adham AgriTech Sentinel v2.0 على Vercel وإعداد النشر التلقائي.

---

## 📋 المتطلبات الأساسية

### 1. حسابات مطلوبة
- ✅ حساب GitHub
- ✅ حساب Vercel
- ✅ حساب Supabase
- ✅ مفاتيح API للخدمات الخارجية

### 2. أدوات مطلوبة
- Node.js 18+
- Git
- npm أو yarn

---

## 🔧 إعداد GitHub Repository

### الخطوة 1: التأكد من Repository الصحيح

```bash
# التحقق من Remote Repository
git remote -v

# يجب أن يظهر:
# origin  https://github.com/adham-younes/Adham-AgriTech-Sentinel-v2.0.git
```

### الخطوة 2: إعداد GitHub Secrets

انتقل إلى: `Settings → Secrets and variables → Actions → New repository secret`

**Secrets المطلوبة:**

#### Vercel Configuration
```
VERCEL_TOKEN=<your_vercel_token>
VERCEL_ORG_ID=<your_vercel_org_id>
VERCEL_PROJECT_ID=<your_vercel_project_id>
```

#### Database Configuration
```
SUPABASE_URL=<your_supabase_url>
SUPABASE_ANON_KEY=<your_supabase_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_supabase_service_role_key>
```

#### API Keys
```
OPENAI_API_KEY=<your_openai_key>
OPENWEATHER_API_KEY=<your_openweather_key>
MAPBOX_TOKEN=<your_mapbox_token>
INFURA_PROJECT_ID=<your_infura_id>
ETHERSCAN_API_KEY=<your_etherscan_key>
```

---

## 🌐 إعداد Vercel

### الخطوة 1: الحصول على Vercel Credentials

#### 1.1 الحصول على VERCEL_TOKEN

```bash
# تثبيت Vercel CLI
npm install -g vercel

# تسجيل الدخول
vercel login

# إنشاء Token
# اذهب إلى: https://vercel.com/account/tokens
# اضغط "Create Token"
# انسخ الـ Token
```

#### 1.2 الحصول على VERCEL_ORG_ID و VERCEL_PROJECT_ID

```bash
# في مجلد المشروع
cd /Users/adham/ai_agriculture_projects/Adham-AgriTech-Full-Stack

# ربط المشروع
vercel link

# سيتم إنشاء ملف .vercel/project.json
cat .vercel/project.json
```

سيظهر:
```json
{
  "orgId": "team_xxxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxxx"
}
```

### الخطوة 2: ربط Repository بـ Vercel

1. اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard)
2. اضغط "Add New Project"
3. اختر "Import Git Repository"
4. اختر `adham-younes/Adham-AgriTech-Sentinel-v2.0`
5. **مهم:** اختر `frontend` كـ Root Directory
6. اضغط "Deploy"

### الخطوة 3: إعداد Environment Variables في Vercel

في Vercel Dashboard → Project Settings → Environment Variables:

```bash
# Frontend Variables (Production)
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_supabase_anon_key>
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=<your_mapbox_token>

# Server Variables (Production)
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
OPENAI_API_KEY=<your_openai_key>
OPENWEATHER_API_KEY=<your_openweather_key>
```

### الخطوة 4: إعداد Custom Domain

1. في Vercel Dashboard → Project Settings → Domains
2. اضغط "Add Domain"
3. أدخل: `adham-agritech.com`
4. اتبع التعليمات لتحديث DNS records

---

## ⚙️ إعداد النشر التلقائي

### الطريقة 1: GitHub Actions (موصى بها)

#### الملف: `.github/workflows/deploy.yml`

هذا الملف موجود بالفعل ويقوم بـ:
- ✅ تشغيل الاختبارات عند Push
- ✅ بناء التطبيق
- ✅ النشر على Vercel تلقائياً
- ✅ إجراء Health Check

**كيفية التفعيل:**

1. تأكد من إضافة جميع GitHub Secrets (انظر أعلاه)
2. قم بعمل Push لـ main branch:

```bash
git push origin main
```

3. راقب التنفيذ:
   - اذهب إلى: https://github.com/adham-younes/Adham-AgriTech-Sentinel-v2.0/actions
   - شاهد workflow "Deploy to Vercel"

### الطريقة 2: Vercel Git Integration

Vercel يقوم بالنشر التلقائي عند:
- ✅ Push إلى main branch → Production deployment
- ✅ Push إلى develop branch → Preview deployment
- ✅ Pull Request → Preview deployment

**لا حاجة لإعداد إضافي** - يعمل تلقائياً بعد ربط Repository

---

## 🧪 اختبار النشر

### 1. اختبار محلي قبل النشر

```bash
cd frontend

# تثبيت Dependencies
npm install

# اختبار البناء
npm run build

# تشغيل محلياً
npm run dev
```

### 2. اختبار النشر على Vercel

```bash
# نشر تجريبي
vercel

# نشر إنتاج
vercel --prod
```

### 3. التحقق من النشر المباشر

```bash
# Health Check
curl https://adham-agritech.com/api/services/health

# Cron Job Endpoint
curl https://adham-agritech.com/api/cron/analytics
```

---

## 🔄 سير العمل للنشر

### نشر تحديث جديد

```bash
# 1. إجراء التغييرات
git add .
git commit -m "feat: add new feature"

# 2. Push إلى GitHub
git push origin main

# 3. GitHub Actions يبدأ تلقائياً
# 4. Vercel ينشر التحديث تلقائياً
# 5. تحقق من النشر على adham-agritech.com
```

### مراقبة النشر

#### في GitHub:
```
https://github.com/adham-younes/Adham-AgriTech-Sentinel-v2.0/actions
```

#### في Vercel:
```
https://vercel.com/dashboard
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: GitHub Actions يفشل

**الحل:**
1. تحقق من GitHub Secrets
2. راجع Logs في Actions tab
3. تأكد من صحة VERCEL_TOKEN

### المشكلة: Build يفشل

**الحل:**
```bash
# اختبر محلياً
cd frontend
npm run build

# راجع الأخطاء
npm run lint
```

### المشكلة: Environment Variables مفقودة

**الحل:**
1. تحقق من Vercel Dashboard → Settings → Environment Variables
2. تأكد من إضافة جميع المتغيرات المطلوبة
3. Redeploy بعد إضافة المتغيرات

### المشكلة: Domain لا يعمل

**الحل:**
1. تحقق من DNS settings
2. انتظر حتى 48 ساعة لانتشار DNS
3. تحقق من SSL certificate في Vercel

---

## 📊 مراقبة الأداء

### Vercel Analytics

تفعيل تلقائياً - راجع في:
```
https://vercel.com/dashboard → Analytics
```

### Logs

```bash
# عرض Logs في الوقت الفعلي
vercel logs adham-agritech.com --follow
```

---

## 🔐 الأمان

### Best Practices

1. ✅ **لا تضع Secrets في الكود**
2. ✅ استخدم Environment Variables
3. ✅ فعّل 2FA على GitHub و Vercel
4. ✅ راجع Access Logs بانتظام
5. ✅ قم بتدوير API Keys دورياً

### تدوير Secrets

```bash
# 1. إنشاء Secret جديد
# 2. تحديث في GitHub Secrets
# 3. تحديث في Vercel Environment Variables
# 4. Redeploy
vercel --prod
```

---

## 📞 الدعم

### الموارد المفيدة

- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

### الحصول على المساعدة

1. راجع Logs في GitHub Actions
2. راجع Deployment Logs في Vercel
3. تحقق من [Vercel Status](https://www.vercel-status.com/)

---

## ✅ Checklist للنشر الأول

- [ ] إنشاء حساب Vercel
- [ ] ربط GitHub Repository
- [ ] إضافة GitHub Secrets
- [ ] إعداد Vercel Environment Variables
- [ ] إعداد Custom Domain
- [ ] اختبار Build محلياً
- [ ] Push إلى main branch
- [ ] مراقبة GitHub Actions
- [ ] التحقق من النشر المباشر
- [ ] اختبار جميع الميزات
- [ ] إعداد Monitoring

---

## 🎯 الخطوات التالية

بعد النشر الناجح:

1. ✅ إعداد Monitoring و Alerts
2. ✅ إعداد Backup للبيانات
3. ✅ إعداد CI/CD Pipeline كامل
4. ✅ إعداد Staging Environment
5. ✅ توثيق API Endpoints

---

**تم إنشاء هذا الدليل في:** 2025-11-25  
**الإصدار:** Sentinel v2.0  
**المؤلف:** Adham AgriTech Team
