# GitHub App + OIDC Hardening Guide

## 🎯 الهدف
- التخلص من الرموز طويلة الأمد (PAT / Vercel token ثابت).
- تفعيل أقل صلاحية ممكنة لحساب الأتمتة (CODEX).
- استخدام OIDC للحصول على صلاحيات سحابية مؤقتة أثناء النشر.

## 1. إنشاء GitHub App مخصص
1. انتقل إلى **Settings → Developer settings → GitHub Apps**.
2. أنشئ تطبيقًا جديدًا باسم `codex-bot`.
3. فعّل الصلاحيات التالية فقط:
   - **Metadata:** read
   - **Contents:** read
   - **Pull requests:** write (لإنشاء PR فقط)
   - **Actions:** write (لتفعيل workflow dispatch)
4. حدّد Webhook (اختياري) مع سر قوي.
5. بعد الإنشاء، ثبّت التطبيق على المستودع وحدد الفروع المسموح بها (`codex/*`).

## 2. إعداد مفاتيح التطبيق في Actions
1. نزّل مفتاح التطبيق الخاص (private key) واحفظه في GitHub Secrets باسم `CODEX_APP_PRIVATE_KEY`.
2. أضف معرف التطبيق `CODEX_APP_ID` ومعرف التنصيب `CODEX_APP_INSTALLATION_ID`.
3. استخدم Action مثل [`tibdex/github-app-token`](https://github.com/tibdex/github-app-token) للحصول على رمز مؤقت داخل الـ workflow:

```yaml
- name: Generate CODEX token
  id: codex_token
  uses: tibdex/github-app-token@v2
  with:
    app_id: ${{ secrets.CODEX_APP_ID }}
    installation_id: ${{ secrets.CODEX_APP_INSTALLATION_ID }}
    private_key: ${{ secrets.CODEX_APP_PRIVATE_KEY }}
```

## 3. تهيئة OIDC للنشر إلى Vercel أو السحابة
1. فعّل خيار **Workload Identity** في Vercel (أو المزوّد السحابي المطلوب).
2. في GitHub، أنشئ `Environment` باسم `production` وحدد سياسات الموافقة.
3. أضف إعداد OIDC داخل البيئة:
   - Audience: `https://vercel.com`
   - Subject: `repo:adham-younes/Adham-AgriTech-Full-Stack:ref:refs/heads/main`
4. استخدم Action [`actions/github-token`](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-github-actions) للحصول على هوية مؤقتة.

## 4. تحديث Workflow `deploy.yml`
- استبدل استخدام `VERCEL_TOKEN` الثابت بمكالمة OIDC:
```yaml
- name: Authenticate with Vercel
  id: vercel_auth
  uses: vercel/actions/oidc@v1
  with:
    client-id: ${{ secrets.VERCEL_OIDC_CLIENT_ID }}
    team-id: ${{ secrets.VERCEL_TEAM_ID }}
```
- استخدم الرمز المؤقت الناتج في خطوة النشر بدلاً من المتغير الثابت.

## 5. سياسات إضافية
- دوّر مفاتيح التطبيق كل 90 يومًا على الأكثر.
- اربط الـ workflows المهمة ببيئة مع موافقة بشرية (Branch protection + Required reviewers).
- فعل `secret-scan` workflow (موجود في هذا المستودع) كحماية إضافية قبل الدمج.

> بمجرد اكتمال الخطوات أعلاه يمكن حذف `VERCEL_TOKEN` من Secrets والاعتماد على GitHub App + OIDC بالكامل.
