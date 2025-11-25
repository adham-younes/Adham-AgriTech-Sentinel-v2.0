# 🚀 دليل التحديث السريع - Quick Update Guide

## المشكلة
GitHub Actions معطّل حالياً، لذا نستخدم التحديث اليدوي.

## ✅ الحل السريع

### في Windows (PowerShell):
```powershell
# الانتقال إلى مجلد المشروع
cd C:\Users\Public\Adham-AgriTech-Full-Stack

# تشغيل سكريبت التحديث
.\update-vision.ps1

# سيسألك: هل تريد commit و push؟
# اضغط y ثم Enter
```

### في WSL/Linux:
```bash
# الانتقال إلى مجلد المشروع
cd /mnt/c/Users/Public/Adham-AgriTech-Full-Stack

# إعطاء صلاحية التنفيذ (مرة واحدة فقط)
chmod +x update-vision.sh

# تشغيل السكريبت
./update-vision.sh

# ثم commit و push يدوياً:
git add docs/
git commit -m "docs: update vision document [manual]"
git push
```

## 📝 ما يفعله السكريبت

1. ✅ ينشئ مجلد `docs/architecture` إذا لم يكن موجوداً
2. ✅ يُنشئ/يحدّث ملف `adham-agritech-vision.md`
3. ✅ يضيف timestamp حالي
4. ✅ يعرض حالة Git
5. ✅ يسألك إذا كنت تريد commit و push (PowerShell فقط)

## 🎯 الملفات المتاحة

| الملف | الاستخدام | النظام |
|-------|-----------|--------|
| `update-vision.ps1` | تحديث vision document | Windows |
| `update-vision.sh` | تحديث vision document | WSL/Linux |
| `codex-trigger.ps1` | محاولة تشغيل workflow | Windows |

## 💡 نصائح

### إذا كنت في WSL:
```bash
# تأكد أنك في المجلد الصحيح
pwd
# يجب أن يكون: /mnt/c/Users/Public/Adham-AgriTech-Full-Stack

# إذا لم تكن في المجلد الصحيح:
cd /mnt/c/Users/Public/Adham-AgriTech-Full-Stack
```

### إذا واجهت خطأ "not a git repository":
```bash
# تأكد أنك في مجلد المشروع
ls -la .git
# يجب أن ترى مجلد .git

# إذا لم يكن موجوداً، انتقل إلى المجلد الصحيح
cd /mnt/c/Users/Public/Adham-AgriTech-Full-Stack
```

### إذا واجهت خطأ "Permission denied":
```bash
# أعط صلاحية التنفيذ
chmod +x update-vision.sh

# ثم شغّل السكريبت
./update-vision.sh
```

## 🔧 التحديث اليدوي الكامل (بدون سكريبت)

إذا أردت التحديث يدوياً بالكامل:

### 1. إنشاء/تحديث الملف
```bash
# إنشاء المجلد
mkdir -p docs/architecture

# إنشاء الملف (استخدم محرر نصوص مثل nano أو vim)
nano docs/architecture/adham-agritech-vision.md
```

### 2. نسخ المحتوى
انسخ المحتوى من `update-vision.ps1` أو `update-vision.sh`

### 3. Commit و Push
```bash
git add docs/architecture/adham-agritech-vision.md
git commit -m "docs: update vision document [manual]"
git push
```

## ✅ التحقق من النجاح

بعد التحديث، تحقق من:

```bash
# عرض الملف
cat docs/architecture/adham-agritech-vision.md

# التحقق من آخر commit
git log -1 --oneline

# التحقق من GitHub
# اذهب إلى: https://github.com/adham-younes/Adham-AgriTech-Full-Stack/blob/main/docs/architecture/adham-agritech-vision.md
```

## 🎉 الخلاصة

**استخدم `update-vision.ps1` في PowerShell** - أسهل وأسرع طريقة!

```powershell
.\update-vision.ps1
```

---

**آخر تحديث:** 2025-11-02  
**الحالة:** ✅ يعمل بشكل مثالي
