# 🔍 تحليل مشكلة CODEx Write Workflow

## المشكلة الحالية

الـ workflows تفشل عند بدء التشغيل (`startup_failure`) ولا تظهر في قائمة التشغيلات.

## الأعراض

```bash
gh run list --workflow=codex-write.yml
# النتيجة: no runs found

gh run list --limit 5
# النتيجة: X (Unknown event) - startup_failure
```

## التحقيقات التي تمت

### 1. ✅ ملف YAML صحيح
- تم التحقق من صحة YAML syntax
- الملف موجود على `main` branch
- البنية صحيحة

### 2. ✅ الصلاحيات تم إصلاحها
```json
{
  "default_workflow_permissions": "write",  // كان "read"
  "can_approve_pull_request_reviews": false
}
```

### 3. ✅ Actions مُفعّل
```json
{
  "allowed_actions": "all",
  "enabled": true
}
```

### 4. ✅ CODEX_PAT موجود
```bash
gh secret list | grep CODEX_PAT
# النتيجة: CODEX_PAT found
```

## الأسباب المحتملة المتبقية

### 1. مشكلة في Branch Protection Rules
قد تكون هناك قواعد حماية على `main` تمنع الـ workflow من الكتابة.

**الحل:**
```bash
# التحقق من قواعد الحماية
gh api repos/adham-younes/Adham-AgriTech-Full-Stack/branches/main/protection

# إذا كانت موجودة، قد تحتاج إلى:
# - إضافة "codex-bot" كـ bypass actor
# - أو السماح للـ workflows بالكتابة
```

### 2. مشكلة في CODEX_PAT Token Scopes
قد لا يملك الـ PAT الصلاحيات الكافية.

**المطلوب:**
- ✅ `repo` (full control)
- ✅ `workflow` (update workflows)

**التحقق:**
```bash
# إنشاء PAT جديد مع الصلاحيات الصحيحة
# https://github.com/settings/tokens/new
```

### 3. مشكلة في Workflow Syntax (غير محتمل)
على الرغم من أن YAML يبدو صحيحاً، قد تكون هناك مشكلة خفية.

**الحل:**
استخدام workflow بسيط جداً للاختبار (تم إنشاؤه: `codex-write-simple.yml`)

### 4. مشكلة في GitHub Actions نفسها
قد تكون هناك مشكلة مؤقتة في GitHub Actions.

**الحل:**
الانتظار وإعادة المحاولة لاحقاً.

## الحلول المقترحة

### الحل 1: استخدام Personal Access Token في Checkout
بدلاً من الاعتماد على `GITHUB_TOKEN` الافتراضي:

```yaml
steps:
  - uses: actions/checkout@v4
    with:
      token: ${{ secrets.CODEX_PAT }}  # استخدام PAT مباشرة
```

### الحل 2: تبسيط الـ Workflow
إزالة كل الخطوات غير الضرورية والاحتفاظ بالأساسيات فقط.

### الحل 3: استخدام GitHub App بدلاً من PAT
إنشاء GitHub App مع صلاحيات محددة.

### الحل 4: التحقق من Branch Protection
```bash
# عرض قواعد الحماية
gh api repos/adham-younes/Adham-AgriTech-Full-Stack/branches/main/protection

# إذا كانت موجودة، تعديلها للسماح للـ workflows
```

## الخطوات التالية

1. **التحقق من Branch Protection Rules**
   ```bash
   gh api repos/adham-younes/Adham-AgriTech-Full-Stack/branches/main/protection
   ```

2. **التحقق من صلاحيات CODEX_PAT**
   - الذهاب إلى https://github.com/settings/tokens
   - التأكد من أن الـ token يملك `repo` و `workflow`

3. **اختبار workflow بسيط جداً**
   ```yaml
   name: test-simple
   on: workflow_dispatch
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - run: echo "Hello World"
   ```

4. **التحقق من سجلات GitHub Actions**
   - الذهاب إلى https://github.com/adham-younes/Adham-AgriTech-Full-Stack/actions
   - البحث عن أي رسائل خطأ

## الحل المؤقت

حتى يتم حل المشكلة، يمكن تحديث الملفات يدوياً:

```bash
# تحديث vision document يدوياً
cat > docs/architecture/adham-agritech-vision.md << 'EOF'
# محتوى الملف
EOF

git add docs/
git commit -m "docs: update vision document"
git push
```

## الحالة الحالية

- ❌ Workflow يفشل عند بدء التشغيل
- ✅ الصلاحيات تم تحديثها إلى `write`
- ✅ CODEX_PAT موجود
- ✅ Actions مُفعّل
- ❓ السبب الدقيق غير معروف بعد

## الموارد

- [GitHub Actions Permissions](https://docs.github.com/en/actions/security-guides/automatic-token-authentication)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Troubleshooting Workflows](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows)

---

**آخر تحديث:** 2025-11-02  
**الحالة:** قيد التحقيق
