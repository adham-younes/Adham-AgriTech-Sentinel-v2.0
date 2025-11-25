# 🔧 EOSDA URL Configuration Guide

**التاريخ:** 23 نوفمبر 2025  
**الحالة:** ✅ تم التحقق من القيم الصحيحة

---

## 📍 القيم الصحيحة لمتغيرات البيئة

### ✅ **NEXT_PUBLIC_EOSDA_API_URL**
**القيمة الصحيحة:**
```
https://api-connect.eos.com
```

**لماذا هذه القيمة؟**
- هي الـ Base URL لـ EOSDA API Connect
- تعمل مع جميع endpoints التي اختبرناها
- لا تحتاج إضافة version في الـ public variable

---

## 📋 جميع متغيرات EOSDA المطلوبة

### 🔓 **Server-side Variables:**
```bash
EOSDA_API_KEY="apk.cefa9921669b0857be282894813d1213ed88c5e8299e29a5e91db105464aa232"
EOSDA_API_URL="https://api-connect.eos.com"
EOSDA_API_BASE_URL="https://api-connect.eos.com"
```

### 🌐 **Client-side Variables:**
```bash
NEXT_PUBLIC_EOSDA_API_KEY="apk.cefa9921669b0857be282894813d1213ed88c5e8299e29a5e91db105464aa232"
NEXT_PUBLIC_EOSDA_API_URL="https://api-connect.eos.com"
NEXT_PUBLIC_EOSDA_API_BASE_URL="https://api-connect.eos.com"
NEXT_PUBLIC_EOSDA_API_VERSION="v1"
```

---

## 🔍 كيف يعمل الكود

### في `lib/config/eosda.ts`:

```typescript
// Client-side config
export const eosdaPublicConfig = {
  apiKey: getEnv("NEXT_PUBLIC_EOSDA_API_KEY") || "",
  apiUrl: (getEnv("NEXT_PUBLIC_EOSDA_API_URL", "NEXT_PUBLIC_EOSDA_API_BASE_URL") || "https://api-connect.eos.com").replace(/\/$/, ""),
  apiVersion: getEnv("NEXT_PUBLIC_EOSDA_API_VERSION") || "v1",
  // ...
}

// Server-side config  
export const eosdaServerConfig = {
  apiKey: getEnv("EOSDA_API_KEY") || "",
  apiUrl: (
    getEnv("EOSDA_API_URL", "EOSDA_API_BASE_URL", "NEXT_PUBLIC_EOSDA_API_URL", "NEXT_PUBLIC_EOSDA_API_BASE_URL") ||
    "https://api-connect.eos.com"
  ).replace(/\/$/, ""),
  // ...
}
```

### في `lib/services/eosda.ts`:

```typescript
function getEOSDAConfig() {
  const baseUrl = eosdaServerConfig.apiUrl || "https://api-connect.eos.com"
  const version = eosdaServerConfig.apiVersion || "v1"
  const apiBaseUrl = `${baseUrl.replace(/\/$/, "")}/${version.replace(/^\//, "")}`
  
  return {
    apiBaseUrl, // = "https://api-connect.eos.com/v1"
    // ...
  }
}
```

---

## ✅ نتيجة التكوين النهائي

### الـ URL النهائي الذي يستخدمه الكود:
```
https://api-connect.eos.com/v1/api/lms/search/v2/sentinel2
```

### التكوين:
- **Base URL:** `https://api-connect.eos.com`
- **Version:** `v1` (يتم إضافته تلقائياً)
- **Endpoints:** تعمل جميعها

---

## 🚀 خطوات التحديث في Vercel

### 1. **تحديث NEXT_PUBLIC_EOSDA_API_URL:**
```
https://api-connect.eos.com
```

### 2. **تأكيد المتغيرات الأخرى:**
```
EOSDA_API_KEY="apk.cefa9921669b0857be282894813d1213ed88c5e8299e29a5e91db105464aa232"
NEXT_PUBLIC_EOSDA_API_KEY="apk.cefa9921669b0857be282894813d1213ed88c5e8299e29a5e91db105464aa232"
```

### 3. **اختبار التكامل:**
```bash
# اختبر الـ API بعد التحديث
curl -H "x-api-key: apk.cefa9921669b0857be282894813d1213ed88c5e8299e29a5e91db105464aa232" \
     https://api-connect.eos.com/api/lms/search/v2/sentinel2
```

---

## 🔍 التحقق من الصحة

### للتحقق من أن التكامل يعمل:
1. **Health Check:** `GET /api/services/health`
2. **EOSDA Status:** يجب يظهر `operational`
3. **Dashboard:** يجب تظهر بيانات NDVI حقيقية

### علامات النجاح:
- ✅ EOSDA status: `operational` (not degraded)
- ✅ NDVI values: أرقام حقيقية (مثل 0.1215)
- ✅ Map tiles: تظهر بدون أخطاء
- ✅ No synthetic data

---

## 💡 ملاحظات هامة

### 1. **لا تضيف version في public variable:**
- ❌ `NEXT_PUBLIC_EOSDA_API_URL="https://api-connect.eos.com/v1"`
- ✅ `NEXT_PUBLIC_EOSDA_API_URL="https://api-connect.eos.com"`

### 2. **الكود يضيف version تلقائياً:**
- الكود يضيف `/v1` تلقائياً في server-side
- لا تحتاج لإضافته يدوياً

### 3. **نفس القيمة للـ server و public:**
- يمكن استخدام نفس القيمة `https://api-connect.eos.com`
- الكود يعالج الـ version بشكل منفصل

---

## 📞 إذا واجهت مشاكل

### تحقق من:
1. **API Key صحيح:** `apk.cefa9921669b0857be282894813d1213ed88c5e8299e29a5e91db105464aa232`
2. **URL صحيح:** `https://api-connect.eos.com`
3. **لا يوجد /v1 في النهاية:** الكود يضيفه تلقائياً

### للتواصل:
- **EOSDA Support:** api.support@eosda.com
- **Adham Younes:** adhamlouxor@gmail.com

---

## 🎯 الخلاصة

**NEXT_PUBLIC_EOSDA_API_URL = `https://api-connect.eos.com`**

هذه هي القيمة الصحيحة التي يجب وضعها في Vercel. الكود سيعالج إضافة version والـ endpoints بشكل تلقائي.

---

**آخر تحديث:** 23 نوفمبر 2025  
**الحالة:** ✅ جاهز للتنفيذ
