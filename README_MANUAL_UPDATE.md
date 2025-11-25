# 📚 دليل التحديث اليدوي - Manual Update Guide

> **ملاحظة:** GitHub Actions معطّل حالياً، لذا نستخدم التحديث اليدوي حتى يتم حل المشكلة.

## 🚀 البداية السريعة

### في Windows PowerShell (الأسهل):
```powershell
.\update-vision.ps1
```
اضغط `y` عندما يسألك عن commit و push.

### في WSL/Linux:
```bash
cd /mnt/c/Users/Public/Adham-AgriTech-Full-Stack
./update-vision.sh
git add docs/
git commit -m "docs: update vision document [manual]"
git push
```

---

## 📁 الملفات المتاحة

| الملف | الوصف | متى تستخدمه |
|-------|-------|-------------|
| `update-vision.ps1` | سكريبت PowerShell لتحديث vision | **موصى به** للاستخدام اليومي |
| `update-vision.sh` | سكريبت Bash لتحديث vision | للاستخدام في WSL/Linux |
| `codex-trigger.ps1` | محاولة تشغيل GitHub Actions | عندما يتم إصلاح Actions |
| `QUICK_UPDATE_GUIDE.md` | دليل سريع | للمرجع السريع |
| `WSL_INSTRUCTIONS.md` | تعليمات WSL مفصلة | إذا كنت تستخدم WSL |
| `CODEX_WORKFLOW_FINAL_STATUS.md` | حالة النظام الكاملة | لفهم المشكلة |

---

## 🎯 الاستخدام التفصيلي

### الطريقة 1: PowerShell (موصى به)

```powershell
# 1. افتح PowerShell في مجلد المشروع
cd C:\Users\Public\Adham-AgriTech-Full-Stack

# 2. شغّل السكريبت
.\update-vision.ps1

# 3. سيسألك: "Do you want to commit and push now? (y/N)"
# اكتب: y
# اضغط: Enter

# ✅ تم! الملف محدّث ومرفوع على GitHub
```

**ماذا يفعل السكريبت:**
- ✅ ينشئ مجلد `docs/architecture` إذا لم يكن موجوداً
- ✅ يُنشئ/يحدّث `adham-agritech-vision.md` بمحتوى كامل
- ✅ يضيف timestamp حالي
- ✅ يعرض حالة Git
- ✅ يسألك إذا كنت تريد commit و push
- ✅ ينفذ commit و push تلقائياً

### الطريقة 2: WSL/Linux

```bash
# 1. انتقل إلى مجلد المشروع
cd /mnt/c/Users/Public/Adham-AgriTech-Full-Stack

# 2. أعط صلاحية التنفيذ (مرة واحدة فقط)
chmod +x update-vision.sh

# 3. شغّل السكريبت
./update-vision.sh

# 4. Commit و Push
git add docs/
git commit -m "docs: update vision document [manual]"
git push
```

### الطريقة 3: يدوياً بالكامل

إذا أردت التحكم الكامل:

```powershell
# 1. إنشاء المجلد
mkdir -Force docs/architecture

# 2. إنشاء الملف
@"
# Adham AgriTech Platform - Vision Document

**Last Updated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC")
**Updated By:** Manual Update

## Platform Vision

[... المحتوى هنا ...]

"@ | Out-File -FilePath docs/architecture/adham-agritech-vision.md -Encoding UTF8

# 3. Commit و Push
git add docs/
git commit -m "docs: update vision document [manual]"
git push
```

---

## 🔍 التحقق من النجاح

بعد التحديث، تحقق من:

### 1. الملف المحلي
```powershell
# عرض الملف
cat docs/architecture/adham-agritech-vision.md

# أو افتحه في محرر نصوص
notepad docs/architecture/adham-agritech-vision.md
```

### 2. Git Status
```bash
# عرض آخر commit
git log -1 --oneline

# عرض الحالة
git status
```

### 3. على GitHub
افتح: https://github.com/adham-younes/Adham-AgriTech-Full-Stack/blob/main/docs/architecture/adham-agritech-vision.md

---

## ❌ حل المشاكل

### المشكلة: "not a git repository"
**الحل:**
```bash
# تأكد أنك في المجلد الصحيح
cd C:\Users\Public\Adham-AgriTech-Full-Stack  # Windows
cd /mnt/c/Users/Public/Adham-AgriTech-Full-Stack  # WSL
```

### المشكلة: "Permission denied" في WSL
**الحل:**
```bash
chmod +x update-vision.sh
```

### المشكلة: "No such file or directory"
**الحل:**
```bash
# تأكد من المسار
pwd  # يجب أن يكون في مجلد المشروع
ls -la  # يجب أن ترى .git و docs/
```

### المشكلة: Git push يطلب username/password
**الحل:**
```bash
# استخدم GitHub CLI للمصادقة
gh auth login

# أو استخدم Personal Access Token
```

---

## 📊 مقارنة الطرق

| الطريقة | السهولة | السرعة | التحكم | موصى به |
|---------|---------|---------|--------|----------|
| `update-vision.ps1` | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ نعم |
| `update-vision.sh` | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ في WSL |
| يدوياً | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | للمتقدمين |

---

## 🎓 أمثلة عملية

### مثال 1: تحديث سريع قبل اجتماع
```powershell
# خطوة واحدة فقط!
.\update-vision.ps1
# اضغط y
# ✅ تم في 10 ثواني
```

### مثال 2: تحديث مع مراجعة
```powershell
# 1. شغّل السكريبت
.\update-vision.ps1

# 2. اضغط N (لا تريد commit الآن)

# 3. راجع الملف
notepad docs/architecture/adham-agritech-vision.md

# 4. عدّل إذا لزم الأمر

# 5. Commit يدوياً
git add docs/
git commit -m "docs: update vision with custom changes"
git push
```

### مثال 3: تحديث في WSL
```bash
# كل شيء في سطر واحد!
cd /mnt/c/Users/Public/Adham-AgriTech-Full-Stack && \
./update-vision.sh && \
git add docs/ && \
git commit -m "docs: update vision" && \
git push
```

---

## 🔄 متى تستخدم كل طريقة

### استخدم `update-vision.ps1` عندما:
- ✅ تريد تحديث سريع
- ✅ تستخدم Windows
- ✅ تريد commit و push تلقائي
- ✅ لا تحتاج تعديلات مخصصة

### استخدم `update-vision.sh` عندما:
- ✅ تستخدم WSL أو Linux
- ✅ تفضل Bash على PowerShell
- ✅ تريد التحكم في commit

### استخدم التحديث اليدوي عندما:
- ✅ تريد محتوى مخصص
- ✅ تريد التحكم الكامل
- ✅ تريد إضافة أقسام جديدة

---

## 📝 ملاحظات مهمة

1. **Timestamp تلقائي:** السكريبتات تضيف timestamp حالي تلقائياً
2. **UTF-8 Encoding:** الملفات تُحفظ بـ UTF-8 لدعم العربية
3. **Git Safe:** السكريبتات تتحقق من وجود تغييرات قبل commit
4. **No Workflow Trigger:** استخدام `[manual]` في commit message لتوضيح أنه تحديث يدوي

---

## 🎉 الخلاصة

**للاستخدام اليومي:**
```powershell
.\update-vision.ps1
```

**هذا كل ما تحتاجه!** 🚀

---

## 📞 المساعدة

- **دليل سريع:** `QUICK_UPDATE_GUIDE.md`
- **تعليمات WSL:** `WSL_INSTRUCTIONS.md`
- **حالة النظام:** `CODEX_WORKFLOW_FINAL_STATUS.md`
- **تحليل المشكلة:** `WORKFLOW_ISSUE_ANALYSIS.md`

---

**آخر تحديث:** 2025-11-02  
**الحالة:** ✅ جاهز للاستخدام  
**الطريقة الموصى بها:** `update-vision.ps1`
