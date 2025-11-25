# خدمات التكامل الخارجية - External Services Integration

## نظرة عامة - Overview

يحتوي مشروع Adham AgriTech على تكاملات شاملة مع عدة خدمات خارجية لتوفير ميزات متقدمة للمزارعين.

## الخدمات المتكاملة - Integrated Services

### 1. Supabase (قاعدة البيانات)
- **الحالة**: ✅ يعمل بنجاح
- **الاستخدام**: قاعدة البيانات والمصادقة والتخزين
- **الملفات**:
  - `lib/supabase/client.ts` - عميل المتصفح
  - `lib/supabase/server.ts` - عميل الخادم
  - `lib/supabase/middleware.ts` - معالج المصادقة

### 2. OpenWeather API (بيانات الطقس)
- **الحالة**: ✅ يعمل (يحتاج مفتاح API)
- **الاستخدام**: الطقس الحالي والتنبؤات
- **الملفات**:
  - `app/api/weather/route.ts` - نقطة نهاية الطقس
  - `app/dashboard/weather/page.tsx` - صفحة الطقس

### 3. ESD Platform (الأقمار الصناعية)
- **الحالة**: ✅ يعمل بنجاح
- **الاستخدام**: صور الأقمار الصناعية وتحليل NDVI
- **الملفات**:
  - `lib/services/esd.ts` - عميل ESD الرسمي
  - `lib/satellite/earth-engine.ts` - معالجة بيانات الأقمار
  - `components/satellite-map.tsx` - خريطة الأقمار الصناعية

### 4. Groq AI (الذكاء الاصطناعي)
- **الحالة**: ✅ يعمل بنجاح
- **الاستخدام**: المساعد الذكي والتوصيات
- **الملفات**:
  - `app/api/ai-assistant/route.ts` - نقطة نهاية المساعد الذكي
  - `app/dashboard/ai-assistant/page.tsx` - صفحة المساعد الذكي

### 5. SensorHub API (شبكة الحساسات)
- **الحالة**: ✅ يعمل (يتطلب نقطة نهاية صحية)
- **الاستخدام**: جمع بيانات الحساسات الأرضية لتغذية التحليلات الذكية
- **الملفات**:
  - `lib/services/sensors.ts` - فحص صحة شبكة الحساسات
  - `app/dashboard/agronomy-insights/page.tsx` - لوحة تحليلات المحاصيل
  - `app/api/services/health/route.ts` - تكامل حالة الخدمات

### 6. Stripe (المدفوعات)
- **الحالة**: ✅ مُكوّن
- **الاستخدام**: معالجة الدفع والاشتراكات
- **الملفات**:
  - `app/api/stripe/route.ts` - نقطة نهاية Stripe

## اختبار الخدمات - Testing Services

### نقطة نهاية فحص الصحة
\`\`\`bash
curl http://localhost:3003/api/services/health
\`\`\`

**الاستجابة**:
\`\`\`json
{
  "status": "healthy",
  "timestamp": "2025-10-21T04:30:00Z",
  "services": {
    "weather": {
      "status": "success",
      "message": "OpenWeather connection successful"
    },
    "sensors": {
      "status": "success",
      "message": "Sensor network reachable"
    },
    "esd": {
      "status": "success",
      "message": "ESD connection successful"
    },
    "supabase": {
      "status": "success",
      "message": "Supabase configured"
    }
  }
}
\`\`\`

## متغيرات البيئة - Environment Variables

### مطلوبة - Required
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://mxnkwudqxtgduhenrgvm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

### اختيارية - Optional
\`\`\`env
OPENWEATHER_API_KEY=your-key-here
OPENAI_API_KEY=your-key-here
ESD_CLIENT_ID=your-id-here
ESD_CLIENT_SECRET=your-secret-here
ESD_AUTH_URL=https://auth.esd.earth/oauth/token
ESD_API_BASE_URL=https://api.esd.earth/v1
NEXT_PUBLIC_SENSORHUB_API_URL=https://sensorhub.example.com
SENSORHUB_API_KEY=optional-key
\`\`\`

### مكشوفة (تحتاج تجديد) - Exposed (Need Renewal)
\`\`\`env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoidGVzdCIsImEiOiJja2YyZ3hqazIwMWpwMnJtMnN5b3B5Z3g0In0.example
\`\`\`

## الصفحات المتاحة - Available Pages

| الصفحة | الرابط | الخدمات المستخدمة |
|--------|--------|------------------|
| لوحة التحكم | `/dashboard` | Supabase |
| الطقس | `/dashboard/weather` | OpenWeather |
| المساعد الذكي | `/dashboard/ai-assistant` | Groq |
| مراقبة المحاصيل | `/dashboard/crop-monitoring` | ESD Platform, Supabase |
| تحليلات المحاصيل | `/dashboard/agronomy-insights` | SensorHub API, ESD Platform |
| حالة الخدمات | `/dashboard/services` | جميع الخدمات |
| الشركاء | `/partners` | - |

## استكشاف الأخطاء - Troubleshooting

### الطقس لا يعمل
\`\`\`bash
# تحقق من المفتاح
echo $OPENWEATHER_API_KEY

# اختبر الاتصال
curl "https://api.openweathermap.org/data/2.5/weather?q=Cairo,EG&appid=YOUR_KEY&units=metric"
\`\`\`

### شبكة الحساسات لا تعمل
\`\`\`bash
# تحقق من نقطة النهاية الصحية
curl "$NEXT_PUBLIC_SENSORHUB_API_URL/health" \\
  -H "X-API-Key: $SENSORHUB_API_KEY"

# استرجع آخر قراءات للتأكد من تدفق البيانات
curl "$NEXT_PUBLIC_SENSORHUB_API_URL/telemetry/latest" \\
  -H "X-API-Key: $SENSORHUB_API_KEY"
\`\`\`

### الأقمار الصناعية لا تعمل
\`\`\`bash
# تحقق من بيانات ESD
# راجع lib/services/copernicus.ts
\`\`\`

## الأمان - Security

### قائمة التحقق - Checklist
- [ ] جميع المفاتيح السرية في `.env.local`
- [ ] `.env.local` في `.gitignore`
- [ ] لا توجد مفاتيح في الكود
- [ ] تم تجديد المفاتيح المكشوفة
- [ ] تم ضبط حدود الاستخدام

### أفضل الممارسات - Best Practices
1. استخدم متغيرات بيئة مختلفة للتطوير والإنتاج
2. جدّد المفاتيح بانتظام
3. راقب استخدام الخدمات
4. فعّل الإشعارات عند تجاوز الحدود

## الدعم - Support

للمزيد من المعلومات، راجع:
- [Supabase Docs](https://supabase.com/docs)
- [OpenWeather API](https://openweathermap.org/api)
- [ESD Portal](https://portal.esd.earth)
- [Groq API](https://console.groq.com)
- [SensorHub API Docs](https://example.com/sensorhub/docs)
