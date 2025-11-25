# 🐧 تعليمات استخدام WSL - WSL Instructions

## الخطوات الصحيحة للعمل في WSL

### 1️⃣ الانتقال إلى مجلد المشروع
```bash
# من أي مكان في WSL، نفذ:
cd /mnt/c/Users/Public/Adham-AgriTech-Full-Stack

# تحقق أنك في المكان الصحيح:
pwd
# يجب أن يظهر: /mnt/c/Users/Public/Adham-AgriTech-Full-Stack

# تحقق من وجود .git:
ls -la .git
# يجب أن ترى مجلد .git
```

### 2️⃣ تحديث Vision Document

#### الطريقة 1: استخدام السكريبت (موصى به)
```bash
# إعطاء صلاحية التنفيذ (مرة واحدة فقط)
chmod +x update-vision.sh

# تشغيل السكريبت
./update-vision.sh

# ستحصل على رسالة نجاح مثل:
# ✓ Vision document updated successfully!
# File: docs/architecture/adham-agritech-vision.md
# Timestamp: 2025-11-02 10:30:00 UTC
```

#### الطريقة 2: يدوياً
```bash
# إنشاء المجلد
mkdir -p docs/architecture

# إنشاء الملف
cat > docs/architecture/adham-agritech-vision.md << 'EOF'
# Adham AgriTech Platform - Vision Document

**Last Updated:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Updated By:** Manual Update

## Platform Vision

The Adham AgriTech platform revolutionizes precision agriculture through:

- Satellite-based crop monitoring
- AI-powered analytics
- Blockchain integration
- Sustainability focus

---
*Last update: $(date -u)*
EOF
```

### 3️⃣ Commit و Push

```bash
# إضافة الملفات
git add docs/

# Commit
git commit -m "docs: update vision document [manual]"

# Push إلى GitHub
git push
```

### 4️⃣ التحقق من النجاح

```bash
# عرض الملف
cat docs/architecture/adham-agritech-vision.md

# عرض آخر commit
git log -1 --oneline

# عرض حالة Git
git status
```

## ❌ الأخطاء الشائعة وحلولها

### خطأ: "not a git repository"
```bash
# السبب: أنت ليس في مجلد المشروع
# الحل:
cd /mnt/c/Users/Public/Adham-AgriTech-Full-Stack
```

### خطأ: "No such file or directory"
```bash
# السبب: المسار خاطئ
# الحل: تأكد من المسار الكامل
pwd  # يجب أن يكون: /mnt/c/Users/Public/Adham-AgriTech-Full-Stack
```

### خطأ: "Permission denied"
```bash
# السبب: السكريبت لا يملك صلاحية التنفيذ
# الحل:
chmod +x update-vision.sh
```

### خطأ: "fatal: not a git repository"
```bash
# السبب: أنت في مجلد خاطئ
# الحل:
cd /mnt/c/Users/Public/Adham-AgriTech-Full-Stack
ls -la .git  # يجب أن ترى مجلد .git
```

## 📝 أوامر مفيدة

### التنقل
```bash
# الانتقال إلى المشروع
cd /mnt/c/Users/Public/Adham-AgriTech-Full-Stack

# العودة إلى home
cd ~

# عرض المجلد الحالي
pwd

# عرض محتويات المجلد
ls -la
```

### Git
```bash
# حالة Git
git status

# عرض آخر 5 commits
git log --oneline -5

# عرض التغييرات
git diff

# سحب آخر التحديثات
git pull
```

### ملفات
```bash
# عرض محتوى ملف
cat docs/architecture/adham-agritech-vision.md

# تعديل ملف
nano docs/architecture/adham-agritech-vision.md

# إنشاء مجلد
mkdir -p docs/architecture

# حذف ملف
rm filename
```

## 🎯 سير العمل الكامل

```bash
# 1. الانتقال إلى المشروع
cd /mnt/c/Users/Public/Adham-AgriTech-Full-Stack

# 2. سحب آخر التحديثات
git pull

# 3. تشغيل سكريبت التحديث
./update-vision.sh

# 4. Commit التغييرات
git add docs/
git commit -m "docs: update vision document [manual]"

# 5. Push إلى GitHub
git push

# 6. التحقق
git log -1 --oneline
```

## 💡 نصائح

1. **استخدم Tab للإكمال التلقائي:**
   ```bash
   cd /mnt/c/Users/Pub[TAB]  # سيكمل تلقائياً
   ```

2. **استخدم history لعرض الأوامر السابقة:**
   ```bash
   history | grep git
   ```

3. **استخدم alias للاختصارات:**
   ```bash
   # أضف في ~/.bashrc:
   alias agri='cd /mnt/c/Users/Public/Adham-AgriTech-Full-Stack'
   
   # ثم استخدم:
   agri  # للانتقال مباشرة إلى المشروع
   ```

## 🔧 إعداد Git في WSL (إذا لزم الأمر)

```bash
# تكوين اسم المستخدم
git config --global user.name "Your Name"

# تكوين البريد الإلكتروني
git config --global user.email "your.email@example.com"

# عرض الإعدادات
git config --list
```

## ✅ الخلاصة

**الأمر الأساسي:**
```bash
cd /mnt/c/Users/Public/Adham-AgriTech-Full-Stack && ./update-vision.sh
```

هذا كل ما تحتاجه! 🎉

---

**آخر تحديث:** 2025-11-02  
**الحالة:** ✅ جاهز للاستخدام
