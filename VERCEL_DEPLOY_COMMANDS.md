# 🚀 أوامر النشر على Vercel - دليل كامل

## المرحلة 1️⃣: المصادقة على Vercel CLI

### الخطوة 1: تسجيل الدخول

```bash
# انتقل إلى مجلد frontend
cd /Users/adham/ai_agriculture_projects/Adham-AgriTech-Full-Stack/frontend

# تسجيل الدخول إلى Vercel
vercel login
```

**ماذا سيحدث:**
- سيفتح متصفح تلقائياً
- سجل الدخول بحساب Vercel الخاص بك
- بعد النجاح، ارجع إلى Terminal

---

## المرحلة 2️⃣: ربط المشروع

### الخطوة 2: ربط المشروع الموجود

```bash
# ربط المشروع بـ Vercel
vercel link
```

**الإجابات المطلوبة:**
```
? Set up "~/ai_agriculture_projects/Adham-AgriTech-Full-Stack/frontend"? 
→ Y (نعم)

? Which scope should contain your project?
→ اختر organization/account الخاص بك (adhamlouxor)

? Link to existing project?
→ Y (نعم)

? What's the name of your existing project?
→ adham-agritech
```

سيتم إنشاء ملف `.vercel/project.json` يحتوي على:
- `orgId`: معرف المنظمة
- `projectId`: معرف المشروع

---

## المرحلة 3️⃣: التحقق من متغيرات البيئة (EOSDA API)

### الخطوة 3: عرض متغيرات البيئة الحالية

```bash
# عرض جميع متغيرات البيئة في production
vercel env ls production
```

### الخطوة 4: التحقق من EOSDA API متغيرات

**المتغيرات المطلوبة للـ EOSDA:**

```bash
# التحقق من وجود EOSDA_API_KEY
vercel env pull .env.production

# افتح الملف للمراجعة
cat .env.production | grep EOSDA
```

**يجب أن تجد:**
```
EOSDA_API_KEY=your_eosda_api_key
EOSDA_API_BASE_URL=https://api.eos.com/api/data/v1
EOSDA_API_URL=https://api.eos.com/api/data/v1
NEXT_PUBLIC_EOSDA_API_KEY=your_eosda_api_key (اختياري)
NEXT_PUBLIC_EOSDA_API_BASE_URL=https://api.eos.com/api/data/v1
NEXT_PUBLIC_SATELLITE_PROVIDER=eosda
```

### الخطوة 5: إضافة/تحديث متغيرات EOSDA (إذا لزم الأمر)

**إذا كانت المتغيرات مفقودة أو تحتاج تحديث:**

```bash
# إضافة EOSDA_API_KEY (server-side)
vercel env add EOSDA_API_KEY production

# إضافة EOSDA_API_BASE_URL
vercel env add EOSDA_API_BASE_URL production
# القيمة: https://api.eos.com/api/data/v1

# إضافة EOSDA_API_URL (alias)
vercel env add EOSDA_API_URL production
# القيمة: https://api.eos.com/api/data/v1

# إضافة NEXT_PUBLIC_SATELLITE_PROVIDER
vercel env add NEXT_PUBLIC_SATELLITE_PROVIDER production
# القيمة: eosda

# إضافة NEXT_PUBLIC_EOSDA_API_BASE_URL (client-side)
vercel env add NEXT_PUBLIC_EOSDA_API_BASE_URL production
# القيمة: https://api.eos.com/api/data/v1
```

---

## المرحلة 4️⃣: النشر إلى Production

### الخطوة 6: النشر

```bash
# النشر إلى production
vercel --prod
```

**أو مع تفاصيل أكثر:**

```bash
# النشر مع تأكيد تلقائي
vercel --prod --yes

# النشر مع إظهار logs
vercel --prod --yes --debug
```

---

## المرحلة 5️⃣: التحقق من النشر

### الخطوة 7: التحقق من النشر الناجح

```bash
# الحصول على URL النشر
vercel ls

# اختبار API health
curl https://adham-agritech.com/api/services/health

# اختبار cron endpoint الجديد
curl https://adham-agritech.com/api/cron/analytics
```

---

## 📋 الأوامر الكاملة بالترتيب (نسخ ولصق)

```bash
# 1. الانتقال إلى frontend
cd /Users/adham/ai_agriculture_projects/Adham-AgriTech-Full-Stack/frontend

# 2. تسجيل الدخول
vercel login
# (سيفتح المتصفح - سجل الدخول)

# 3. ربط المشروع
vercel link
# اتبع التعليمات واختر:
# - Y للـ setup
# - اختر scope الخاص بك
# - Y لـ link to existing
# - اكتب: adham-agritech

# 4. التحقق من متغيرات البيئة
vercel env pull .env.production
cat .env.production | grep EOSDA

# 5. النشر
vercel --prod --yes

# 6. التحقق
curl https://adham-agritech.com/api/services/health
```

---

## 🔧 استكشاف الأخطاء

### مشكلة: "No existing credentials found"

```bash
# حذف credentials القديمة
rm -rf ~/.vercel

# إعادة تسجيل الدخول
vercel login
```

### مشكلة: "Project not found"

```bash
# إعادة ربط المشروع
rm -rf .vercel
vercel link
```

### مشكلة: متغيرات البيئة مفقودة

```bash
# إضافة جميع متغيرات EOSDA
vercel env add EOSDA_API_KEY production
vercel env add EOSDA_API_BASE_URL production
vercel env add EOSDA_API_URL production
vercel env add NEXT_PUBLIC_SATELLITE_PROVIDER production
vercel env add NEXT_PUBLIC_EOSDA_API_BASE_URL production

# ثم إعادة النشر
vercel --prod
```

---

## 🎯 التحقق من تكامل EOSDA API

بعد النشر، تحقق من:

### 1. في الكود (Frontend)

```javascript
// يجب أن تكون هذه المتغيرات متاحة
console.log(process.env.NEXT_PUBLIC_EOSDA_API_BASE_URL);
console.log(process.env.NEXT_PUBLIC_SATELLITE_PROVIDER);
```

### 2. في الكود (Backend/API Routes)

```javascript
// يجب أن تكون هذه المتغيرات متاحة
console.log(process.env.EOSDA_API_KEY);
console.log(process.env.EOSDA_API_BASE_URL);
```

### 3. اختبار API مباشرة

```bash
# اختبار endpoint يستخدم EOSDA
curl https://adham-agritech.com/api/satellite/analytics
```

---

## 📝 ملاحظات مهمة

### متغيرات EOSDA المطلوبة:

**Server-side (آمنة):**
- `EOSDA_API_KEY` - مفتاح API (سري)
- `EOSDA_API_BASE_URL` - عنوان API الأساسي
- `EOSDA_API_URL` - alias للعنوان الأساسي

**Client-side (عامة):**
- `NEXT_PUBLIC_EOSDA_API_BASE_URL` - للاستخدام في المتصفح
- `NEXT_PUBLIC_SATELLITE_PROVIDER` - لتحديد المزود

### التحديثات الجديدة التي سيتم نشرها:

1. ✅ **Cron Job للتحديثات اليومية**
   - Endpoint: `/api/cron/analytics`
   - يستخدم EOSDA API للحصول على بيانات الأقمار الصناعية

2. ✅ **Backend Requirements**
   - Python dependencies للـ cron job

3. ✅ **Repository Configuration**
   - تحديثات على metadata

4. ✅ **Deployment Guide**
   - دليل شامل بالعربية

---

## 🚀 النشر السريع (One-liner)

إذا كنت متأكد من كل شيء:

```bash
cd /Users/adham/ai_agriculture_projects/Adham-AgriTech-Full-Stack/frontend && vercel --prod --yes
```

---

**تم إنشاء هذا الدليل:** 2025-11-25 16:02  
**الهدف:** نشر Sentinel v2.0 مع تكامل EOSDA API
