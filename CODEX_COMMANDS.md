# 🚀 أوامر Codex السريعة - Adham AgriTech

> **للنسخ واللصق المباشر في Codex**

---

## 🔧 **أوامر البناء والنشر**

### 📦 **تثبيت التبعيات**
```bash
cd /workspace && npm install
```

### 🏗️ **البناء**
```bash
cd /workspace && npm run build
```

### 🚀 **النشر**
```bash
cd /workspace && git add . && git commit -m "feat: Update from Codex" && git push origin main
```

### 🔄 **إعادة بناء كامل**
```bash
cd /workspace && rm -rf node_modules package-lock.json && npm install && npm run build
```

---

## 🔍 **أوامر التشخيص**

### 📊 **اختبار APIs**
```bash
cd /workspace && node scripts/test-apis.js
```

### 🔍 **فحص حالة النطاق**
```bash
curl -s "https://www.adham-agritech.com" | grep -o "Adham AgriTech\|Dashboard\|Features" | head -5
```

### 📈 **فحص حالة البناء**
```bash
cd /workspace && npm run build 2>&1 | tee build.log && echo "Build completed"
```

---

## 🛠️ **أوامر التطوير**

### 🚀 **تشغيل التطوير**
```bash
cd /workspace && npm run dev
```

### 🔧 **إصلاح الأخطاء**
```bash
cd /workspace && npm run lint --fix
```

### 📦 **تحديث التبعيات**
```bash
cd /workspace && npm update
```

---

## 🔄 **أوامر Git**

### 📝 **إضافة التغييرات**
```bash
cd /workspace && git add .
```

### 💾 **عمل Commit**
```bash
cd /workspace && git commit -m "feat: Description of changes"
```

### 🚀 **رفع التغييرات**
```bash
cd /workspace && git push origin main
```

### 🌿 **إنشاء فرع جديد**
```bash
cd /workspace && git checkout -b feature/new-feature
```

---

## 🌐 **أوامر Vercel**

### 🚀 **نشر إلى Vercel**
```bash
cd /workspace && npx vercel --prod
```

### 🔄 **نشر مع إعادة بناء**
```bash
cd /workspace && npx vercel --prod --force
```

### 📊 **مراقبة السجلات**
```bash
cd /workspace && npx vercel logs --follow
```

---

## 🧪 **أوامر الاختبار**

### ✅ **اختبار الوحدة**
```bash
cd /workspace && npm test
```

### 🔍 **اختبار التكامل**
```bash
cd /workspace && npm run test:integration
```

### 📊 **اختبار الأداء**
```bash
cd /workspace && npm run test:performance
```

---

## 🔧 **أوامر الإصلاح**

### 🔄 **إعادة تعيين Git**
```bash
cd /workspace && git reset --hard HEAD && git clean -fd
```

### 🗑️ **حذف الكاش**
```bash
cd /workspace && rm -rf .next && rm -rf node_modules/.cache
```

### 🔧 **إصلاح التبعيات**
```bash
cd /workspace && rm -rf node_modules package-lock.json && npm install
```

---

## 📊 **أوامر المراقبة**

### 📈 **مراقبة الأداء**
```bash
cd /workspace && npm run analyze
```

### 🔍 **فحص الأمان**
```bash
cd /workspace && npm audit
```

### 📊 **تحليل الحجم**
```bash
cd /workspace && npm run build -- --analyze
```

---

## 🌍 **أوامر البيئة**

### 🔧 **إعداد البيئة**
```bash
cd /workspace && cp .env.example .env.local
```

### 🔍 **فحص المتغيرات**
```bash
cd /workspace && cat .env.local | grep -v "your_"
```

### 🔄 **تحديث البيئة**
```bash
cd /workspace && source .env.local
```

---

## 🚨 **أوامر الطوارئ**

### 🆘 **إعادة تعيين كامل**
```bash
cd /workspace && git reset --hard HEAD && git clean -fd && rm -rf node_modules package-lock.json && npm install && npm run build
```

### 🔄 **نشر فوري**
```bash
cd /workspace && git add . && git commit -m "hotfix: Emergency fix" && git push origin main && npx vercel --prod
```

### 🔍 **تشخيص شامل**
```bash
cd /workspace && echo "=== Git Status ===" && git status && echo "=== Build Test ===" && npm run build && echo "=== API Test ===" && node scripts/test-apis.js
```

---

## 📱 **أوامر الميزات**

### 🛰️ **اختبار الأقمار الصناعية**
```bash
curl -s "https://www.adham-agritech.com/dashboard/satellite" | grep -o "Satellite\|Map\|Leaflet" | head -3
```

### 🤖 **اختبار الذكاء الاصطناعي**
```bash
curl -s "https://www.adham-agritech.com/dashboard/ai-assistant" | grep -o "AI\|Assistant\|Chat" | head -3
```

### 📊 **اختبار التقارير**
```bash
curl -s "https://www.adham-agritech.com/dashboard/reports" | grep -o "Report\|Analytics\|Chart" | head -3
```

---

## 🎯 **أوامر Codex المفضلة**

### 🚀 **نشر سريع**
```bash
cd /workspace && npm run build && git add . && git commit -m "feat: Quick update from Codex" && git push origin main
```

### 🔍 **فحص شامل**
```bash
cd /workspace && echo "=== Building ===" && npm run build && echo "=== Testing APIs ===" && node scripts/test-apis.js && echo "=== Checking Domain ===" && curl -s "https://www.adham-agritech.com" | grep "Adham AgriTech" | head -1
```

### 🔄 **إعادة نشر**
```bash
cd /workspace && git pull origin main && npm run build && npx vercel --prod
```

---

## 🤖 **أوامر CODEx Write Workflow**

### 🚀 **تشغيل Workflow (PowerShell)**
```powershell
# تحديث رؤية المنصة
.\run-codex-write.ps1

# تحديث المعمارية
.\run-codex-write.ps1 -UpdateType architecture

# تحديث مع الانتظار
.\run-codex-write.ps1 -Wait
```

### 🔧 **إعداد CODEX_PAT**
```powershell
# تشغيل معالج الإعداد
.\setup-codex-pat.ps1
```

### 📊 **مراقبة Workflow**
```bash
# عرض قائمة التشغيلات
gh run list --workflow=codex-write.yml

# عرض تشغيل محدد
gh run view

# عرض السجلات
gh run view --log
```

### ✅ **التحقق من التحديثات**
```bash
# سحب التغييرات
git pull

# عرض ملف الرؤية المحدث
cat docs/architecture/adham-agritech-vision.md

# عرض سجل التغييرات
git log --author="codex-bot" --oneline -5
```

---

**🎉 Codex جاهز للعمل!**

> **نصيحة:** انسخ والصق الأوامر مباشرة في Codex للحصول على أفضل النتائج
> 
> **جديد:** استخدم CODEx Write Workflow لتحديث الوثائق تلقائياً! راجع `CODEX_WRITE_GUIDE.md` للتفاصيل