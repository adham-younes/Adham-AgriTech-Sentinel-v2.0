# 🔐 دليل بسيط: إنشاء Service Account لـ Vertex AI

## الخطوة 1: افتح الرابط التالي
https://console.cloud.google.com/iam-admin/serviceaccounts?project=adham-agritech-529b0

---

## الخطوة 2: اضغط على "+ CREATE SERVICE ACCOUNT" (الزر الأزرق في الأعلى)

---

## الخطوة 3: املأ المعلومات:
```
Service account name: adham-agritech-ai
Service account ID: (سيملأ تلقائياً)
Description: Vertex AI for Adham AgriTech
```
اضغط **CREATE AND CONTINUE**

---

## الخطوة 4: اختر الصلاحية (Role):
في القائمة المنسدلة "Select a role":
1. ابحث عن: `Vertex AI`
2. اختر: **Vertex AI User**
3. اضغط **CONTINUE**

---

## الخطوة 5: اضغط **DONE** (اترك الصفحة الثالثة فارغة)

---

## الخطوة 6: تحميل JSON Key
1. ستظهر قائمة Service Accounts
2. اضغط على `adham-agritech-ai@adham-agritech-529b0.iam.gserviceaccount.com`
3. اذهب لتبويب **KEYS**
4. اضغط **ADD KEY** → **Create new key**
5. اختر **JSON**
6. اضغط **CREATE**
7. سيتم تحميل ملف JSON تلقائياً

---

## الخطوة 7: أرسل لي الملف
بعد التحميل، اسحب الملف JSON هنا في المحادثة، وسأربطه بالتطبيق.

---

**ابدأ من الخطوة 1 الآن!** ✅
