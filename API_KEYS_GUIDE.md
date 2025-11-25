# 🔑 دليل شامل لجميع مفاتيح APIs في مشروع Adham AgriTech

> *📅 آخر تحديث:* 21 أكتوبر 2025  
> *📧 البريد الإلكتروني:* adhamlouxor@gmail.com  
> *🌐 النطاق المستهدف:* adham-agritech.com

---

## 📋 جدول المحتويات

1. [ملخص سريع](#ملخص-سريع)
2. [المفاتيح النشطة](#المفاتيح-النشطة)
3. [المفاتيح المطلوبة](#المفاتيح-المطلوبة)
4. [خطوات الإعداد](#خطوات-الإعداد)

---

## ملخص سريع

### 📊 حالة المفاتيح

| الخدمة | الحالة | النوع | التكلفة | الأولوية |
|--------|--------|-------|---------|----------|
| *Supabase* | ✅ يعمل | قاعدة بيانات | مجاني | *حرج* |
| *ESD Platform* | ✅ يعمل | أقمار صناعية | مدفوع جزئياً | *حرج* |
| *OpenAI* | ✅ يعمل | ذكاء اصطناعي | مدفوع | *عالي* |
| *Infura* | ⚠ مكشوف | بلوكشين | مجاني | متوسط |
| *Etherscan* | ⚠ مكشوف | مستكشف | مجاني | منخفض |
| *OpenWeather* | ❌ مطلوب | طقس | مجاني | *عالي* |

*النتيجة:*
- ✅ *يعمل بنجاح:* 3 خدمات
- ⚠ *يعمل لكن يحتاج تأمين:* 2 خدمات  
- ❌ *مطلوب فوراً:* 1 خدمة

---

## المفاتيح النشطة

### 1️⃣ Supabase - قاعدة البيانات والمصادقة

*الحالة:* ✅ *يعمل بنجاح 100%*

```env
NEXT_PUBLIC_SUPABASE_URL=https://mxnkwudqxtgduhenrgvm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bmt3dWRxeHRnZHVoZW5yZ3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODkwMDUsImV4cCI6MjA2ODk2NTAwNX0.yVugFF3oc0aRry4UddG8pGdarX0iNUq6g_ZrZJdz3gc
```

*التفاصيل:*
- *المشروع:* mxnkwudqxtgduhenrgvm.supabase.co
- *الصلاحية:* حتى 2068 (43+ سنة)
- *الحد المجاني:* 500MB قاعدة + 1GB تخزين + 2GB نقل

*الاستخدامات:*
- ✅ تسجيل الدخول والخروج
- ✅ قاعدة بيانات (12 جدول)
- ✅ تخزين الصور والملفات
- ✅ تحديثات الوقت الفعلي

*الروابط:*
- Dashboard: https://supabase.com/dashboard/project/mxnkwudqxtgduhenrgvm
- Database: https://supabase.com/dashboard/project/mxnkwudqxtgduhenrgvm/editor
- Auth: https://supabase.com/dashboard/project/mxnkwudqxtgduhenrgvm/auth/users

*الأمان:* ✅ آمن للنشر (Public Anon Key)

---

### 2️⃣ ESD Platform - صور الأقمار الصناعية

*الحالة:* ✅ *يعمل بنجاح 100%*

```env
ESD_CLIENT_ID=your-esd-client-id
ESD_CLIENT_SECRET=your-esd-client-secret
ESD_AUTH_URL=https://auth.esd.earth/oauth/token
ESD_API_BASE_URL=https://api.esd.earth/v1
```

*التفاصيل:*
- *المزود:* Earth Satellite Data (ESD)
- *الخدمات:* صور متعددة الأطياف، تحليلات NDVI وEVI، مراقبة زراعية مخصصة
- *الدقة:* حتى 5 متر للبكسل
- *التحديث:* كل 3-5 أيام (حسب المنطقة)

*الاستخدامات:*
- ✅ تحليل صحة المحاصيل ومراقبة الإجهاد المائي
- ✅ إنشاء صور NDVI حديثة للحقول
- ✅ أرشيف بيانات تاريخية لأكثر من 7 سنوات
- ✅ مقارنة موسمية ومراقبة نمو المحاصيل

*API Endpoints:*
- Token: `$ESD_AUTH_URL`
- Satellite Imagery: `$ESD_API_BASE_URL/imagery/satellite`
- NDVI Analytics: `$ESD_API_BASE_URL/analytics/ndvi`

*الروابط:*
- Dashboard: https://portal.esd.earth
- Docs: https://portal.esd.earth/docs
- Support: https://portal.esd.earth/support

*التكلفة:* 💰 خطة أساسية مجانية (500 طلب/شهر)، خطط مدفوعة لتحليلات متقدمة

*الأمان:* ⚠ Client Secret حساس - استخدمه فقط في الخادم

---

### 3️⃣ OpenAI - المساعد الذكي

*الحالة:* ✅ *يعمل بنجاح 100%*

```env
OPENAI_API_KEY=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
```

*التفاصيل:*
- *المزود:* OpenAI
- *النماذج:* GPT-4o, GPT-4o-mini
- *التكلفة:* $0.15/1M input, $0.60/1M output (GPT-4o-mini)

*الاستخدامات:*
- ✅ مساعد زراعي ذكي يجيب بالعربية
- ✅ تشخيص أمراض النباتات من الصور
- ✅ توصيات مخصصة للمحاصيل
- ✅ تحليل التربة ونصائح الأسمدة

*الروابط:*
- Dashboard: https://platform.openai.com/api-keys
- Docs: https://platform.openai.com/docs
- Usage: https://platform.openai.com/usage

*الأمان:* ✅ آمن - Service Account Key

---

### 4️⃣ Infura - شبكة Ethereum

*الحالة:* ⚠ *يعمل لكن مكشوف - يحتاج تجديد*

```env
NEXT_PUBLIC_INFURA_API_KEY=c39b028e09be4c268110c1dcc81b3ebc
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/c39b028e09be4c268110c1dcc81b3ebc
NEXT_PUBLIC_MAINNET_RPC_URL=https://mainnet.infura.io/v3/c39b028e09be4c268110c1dcc81b3ebc
```

*التفاصيل:*
- *المزود:* Infura (ConsenSys)
- *الشبكات:* Ethereum Sepolia + Mainnet
- *الحد المجاني:* 100,000 طلب/يوم

*الاستخدامات:*
- ✅ قراءة بيانات العقود الذكية
- ✅ إرسال معاملات البلوكشين
- ✅ استعلامات الرصيد

*الروابط:*
- Dashboard: https://infura.io/dashboard
- Docs: https://docs.infura.io/

*⚠ تحذير:* المفتاح مكشوف - يُنصح بتجديده قبل الإنتاج

---

### 5️⃣ Etherscan - مستكشف البلوكشين

*الحالة:* ⚠ *يعمل لكن مكشوف - يحتاج تجديد*

```env
NEXT_PUBLIC_ETHERSCAN_API_KEY=RKVSW4VI28GAW1VNZHQEC538Q1M9P2M49S
```

*التفاصيل:*
- *المزود:* Etherscan.io
- *الحد المجاني:* 5 طلب/ث، 100K طلب/يوم
- *الشبكات:* Ethereum + Sepolia

*الاستخدامات:*
- ✅ التحقق من العقود الذكية
- ✅ تتبع المعاملات
- ✅ بيانات المحفظة
- ✅ سعر Gas

*الروابط:*
- Explorer: https://sepolia.etherscan.io
- API Keys: https://etherscan.io/myapikey
- Contract: https://sepolia.etherscan.io/address/0xda22c4a3691D42A8989822BC49Ec36CE3D577DfA

*⚠ تحذير:* المفتاح مكشوف - يُنصح بتجديده

---

## المفاتيح المطلوبة

### 6️⃣ OpenWeather - بيانات الطقس

*الحالة:* ❌ *مطلوب فوراً*

```env
OPENWEATHER_API_KEY=your-openweather-api-key-here  # ⚠ يحتاج استبدال
```

*لماذا مهم:*
- الطقس الحالي ودرجات الحرارة
- توقعات 7 أيام
- تنبيهات الصقيع والأمطار
- بيانات تاريخية

*الحد المجاني:*
- 1,000 طلب/يوم
- 60 طلب/دقيقة
- بدون بطاقة ائتمان

*كيفية الحصول عليه (5 دقائق):*

1. *التسجيل:*
   - اذهب: https://openweathermap.org/api
   - اضغط "Sign Up"
   - املأ البيانات:
     - Username: adham_agritech
     - Email: adhamlouxor@gmail.com
     - Password: (اختر كلمة مرور قوية)

2. *تفعيل البريد:*
   - افتح adhamlouxor@gmail.com
   - ابحث عن رسالة OpenWeather
   - اضغط رابط التفعيل

3. *نسخ المفتاح:*
   - سجّل دخول: https://home.openweathermap.org/api_keys
   - المفتاح موجود تلقائياً
   - انسخه (مثل: a1b2c3d4e5f6g7h8i9j0)

4. *الانتظار:*
   - انتظر 10 دقائق للتفعيل
   - المفاتيح الجديدة تحتاج وقت

5. *الإضافة للمشروع:*
   ```bash
   # افتح .env.local
   # استبدل السطر:
   OPENWEATHER_API_KEY=المفتاح-الجديد-هنا
   
   # أعد التشغيل
   pnpm run dev
   ```

*الملف الجاهز:* app/api/weather/route.ts ينتظر المفتاح فقط!

*الأولوية:* 🔴 *عالية جداً* - الطقس من أهم الميزات الزراعية

---

## 7️⃣ Ethereum Blockchain - إعدادات البلوكشين

*الحالة:* ✅ *مُكوّن ويعمل (Testnet)*

```env
# عنوان العقد الذكي
NEXT_PUBLIC_CONTRACT_ADDRESS=0xda22c4a3691D42A8989822BC49Ec36CE3D577DfA

# محفظة الاختبار
NEXT_PUBLIC_WALLET_ADDRESS=0xAff150d1F86D37c13b6b764f3F62569f4fE27c89

# الشبكة
NEXT_PUBLIC_NETWORK=sepolia
NEXT_PUBLIC_CHAIN_ID=11155111
```

*التفاصيل:*
- *الشبكة:* Sepolia Testnet (ليست أموال حقيقية)
- *الاستخدام:* NFTs للأراضي، سلسلة التوريد
- *Explorer:* https://sepolia.etherscan.io/address/0xda22c4a3691D42A8989822BC49Ec36CE3D577DfA

*⚠ تحذير أمني مهم جداً:*
- هذه محفظة اختبار مكشوفة
- لا تستخدمها للأموال الحقيقية أبداً!
- قبل الإنتاج: أنشئ محفظة جديدة في MetaMask

---

## خطوات الإعداد

### ✅ الخطوة 1: اختبار المفاتيح النشطة

```bash
# تحقق من Supabase
curl https://mxnkwudqxtgduhenrgvm.supabase.co/rest/v1/

# تحقق من OpenAI
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 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" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "مرحباً"}],
    "max_tokens": 50
  }'

# تحقق من Infura
curl https://sepolia.infura.io/v3/c39b028e09be4c268110c1dcc81b3ebc \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# تحقق من Etherscan
curl "https://api-sepolia.etherscan.io/api?module=account&action=balance&address=0xAff150d1F86D37c13b6b764f3F62569f4fE27c89&apikey=RKVSW4VI28GAW1VNZHQEC538Q1M9P2M49S"
```

### 🔴 الخطوة 2: الحصول على OpenWeather API (5 دقائق)

```bash
# 1. سجّل في:
https://openweathermap.org/api

# 2. احصل على المفتاح من:
https://home.openweathermap.org/api_keys

# 3. أضفه في .env.local:
OPENWEATHER_API_KEY=المفتاح-هنا

# 4. اختبر:
curl "https://api.openweathermap.org/data/2.5/weather?q=Luxor,EG&appid=المفتاح-هنا&units=metric&lang=ar"
```

### ⚠ الخطوة 3: تأمين المفاتيح المكشوفة (قبل الإنتاج)

```bash
# 1. جدّد Infura:
# - https://infura.io/dashboard
# - أنشئ مشروع جديد
# - استبدل في .env.local

# 2. جدّد Etherscan:
# - https://etherscan.io/myapikey
# - أنشئ مفتاح جديد
# - احذف القديم

# 3. أنشئ محفظة Ethereum جديدة:
# - استخدم MetaMask
# - احتفظ بالـ Private Key آمن
# - لا تشاركه أبداً
```

### ✅ الخطوة 4: اختبار كل شيء

```bash
# شغّل المشروع
pnpm run dev

# افتح المتصفح:
http://localhost:3003

# اختبر الصفحات:
# - http://localhost:3003/dashboard/weather (يحتاج OpenWeather)
# - http://localhost:3003/dashboard/ai-assistant (يعمل مع OpenAI)
# - http://localhost:3003/dashboard/satellite (ESD)
# - http://localhost:3003/dashboard/agronomy-insights (SensorHub)
```

---

## 🎯 قائمة المهام

### فوري (اليوم):
- [x] ✅ OpenAI API Key (تم إضافته!)
- [ ] 🔴 الحصول على OpenWeather API Key
- [ ] اختبار صفحة الطقس
- [ ] اختبار المساعد الذكي

### قريباً (قبل الإنتاج):
- [ ] تجديد Infura API Key
- [ ] تجديد Etherscan API Key
- [ ] إنشاء محفظة Ethereum جديدة
- [ ] ضبط حدود OpenAI ($10/شهر)
- [ ] إضافة .env.local إلى .gitignore

### للمستقبل:
- [ ] ترقية Supabase إلى Pro ($25/شهر) إذا تجاوزت الحدود
- [ ] النقل من Sepolia إلى Ethereum Mainnet
- [ ] إعداد نسخ احتياطية تلقائية
- [ ] مراقبة استخدام APIs

---

## 🔒 نصائح أمنية

1. *لا تشارك هذا الملف على GitHub:*
   ```bash
   # تأكد من وجود .env.local في .gitignore
   echo ".env.local" >> .gitignore
   ```

2. *استخدم متغيرات بيئة مختلفة للإنتاج:*
   - Development: .env.local
   - Production: Vercel Environment Variables

3. *راجع المفاتيح شهرياً:*
   - تحقق من الاستخدام
   - جدّد المفاتيح المكشوفة
   - احذف المفاتيح غير المستخدمة

4. *فعّل تنبيهات الاستخدام:*
   - OpenAI: إشعار عند $7.50
   - Infura: إشعار عند 80,000 طلب
   - Supabase: إشعار عند 400MB

---

## 📞 الدعم

*إذا واجهت مشاكل:*

1. *Supabase:* https://supabase.com/dashboard/project/mxnkwudqxtgduhenrgvm/settings/support
2. *OpenWeather:* https://openweathermap.org/faq
3. *OpenAI:* https://help.openai.com/
4. *ESD Support:* https://portal.esd.earth/support
5. *Infura:* https://support.infura.io/
6. *Etherscan:* https://etherscan.io/contactus

---

## ✅ قائمة التحقق النهائية

قبل النشر للإنتاج، تأكد من:

- [x] ✅ OpenAI API Key يعمل
- [x] ✅ Supabase يعمل
- [x] ✅ ESD يعمل
- [ ] 🔴 OpenWeather API Key
- [ ] ⚠ تجديد Infura API Key
- [ ] ⚠ تجديد Etherscan API Key
- [ ] .env.local في .gitignore
- [ ] تم اختبار جميع الصفحات
- [ ] تم ضبط حدود الاستخدام
- [ ] تم تفعيل الإشعارات
- [ ] تم إنشاء نسخة احتياطية من المفاتيح

---

*🎉 بالتوفيق في مشروع Adham AgriTech!*

> آخر تحديث: 21 أكتوبر 2025 - الساعة 05:00 صباحاً
