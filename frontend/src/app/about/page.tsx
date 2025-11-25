"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/i18n/use-language"

type Status = "live" | "beta" | "planned"

const statusTokens: Record<Status, { en: string; ar: string; className: string }> = {
  live: { en: "Live", ar: "نشط", className: "bg-emerald-600/80" },
  beta: { en: "Beta", ar: "تجريبي", className: "bg-amber-600/80" },
  planned: { en: "Planned", ar: "مخطط", className: "bg-slate-700/80" },
}

const modules = [
  { key: "satellite", en: "Satellite Monitoring (NDVI)", ar: "مراقبة الأقمار الصناعية (NDVI)", status: "live" as Status },
  { key: "soil", en: "Soil & Weather Intelligence", ar: "ذكاء التربة والطقس", status: "beta" as Status },
  { key: "assistant", en: "AI Agronomy Assistant", ar: "المساعد الزراعي الذكي", status: "live" as Status },
  { key: "irrigation", en: "Smart Irrigation Support", ar: "دعم الري الذكي", status: "beta" as Status },
  { key: "notifications", en: "Integrated Alerts Center", ar: "مركز التنبيهات المتكامل", status: "beta" as Status },
  { key: "knowledge", en: "Digital Agriculture Revolution Library", ar: "ثورة الزراعة الرقمية", status: "planned" as Status },
]

const shortRoadmap = [
  {
    id: "near",
    en: "Next Quarter",
    ar: "الربع القادم",
    items: [
      {
        en: "Stabilize farm & field onboarding across web + mobile preview",
        ar: "تثبيت تجربة إنشاء المزارع والحقول على الويب والنسخة المحمولة التجريبية",
      },
      {
        en: "Ship refined satellite overlays with bilingual storytelling",
        ar: "إطلاق تراكبات الأقمار الصناعية المحسّنة مع سرد ثنائي اللغة",
      },
      {
        en: "Launch the Digital Agriculture Revolution library with curated content",
        ar: "إطلاق مكتبة ثورة الزراعة الرقمية بمحتوى منسّق",
      },
    ],
  },
  {
    id: "mid",
    en: "Mid 2025",
    ar: "منتصف 2025",
    items: [
      {
        en: "Phase sensors back in with opt-in automation and clear SLAs",
        ar: "إعادة تفعيل الحساسات تدريجيًا مع أتمتة اختيارية واتفاقيات مستوى خدمة واضحة",
      },
      {
        en: "Predictive AI alerts for pests, heat stress, and irrigation savings",
        ar: "تنبيهات تنبؤية بالذكاء الاصطناعي للآفات والإجهاد الحراري وترشيد الري",
      },
      {
        en: "Release a lightweight field companion app for offline notes",
        ar: "إطلاق تطبيق ميداني خفيف لتسجيل الملاحظات دون اتصال",
      },
    ],
  },
]

const fieldRealities = [
  {
    en: "Water windows disappear; crews hear about dryness only after leaves curl.",
    ar: "نوافذ الري تختفي؛ يسمع الفريق عن الجفاف بعد أن تلتف الأوراق.",
  },
  {
    en: "Heat stress draws silent circles on spectral maps while notes scatter across chats.",
    ar: "الإجهاد الحراري يرسم دوائر صامتة على الخرائط الطيفية بينما تتبعثر الملاحظات في المحادثات.",
  },
  {
    en: "Decisions are retold in voice notes so no one owns a single story for the field.",
    ar: "القرارات تُعاد في رسائل صوتية، فلا أحد يمتلك قصة واحدة للحقل.",
  },
]

const responsePrinciples = [
  {
    en: "Pair every pain point with an immediate bilingual instruction.",
    ar: "وضع كل ألم أمام تعليمات ثنائية اللغة فورية.",
  },
  {
    en: "Give imagery, weather, and soil the same geometry so teams trust what they see.",
    ar: "إعطاء الصور والطقس والتربة نفس الهندسة ليثق الفريق بما يراه.",
  },
  {
    en: "Keep guidance short—one paragraph, one alert, one ritual—so crews respond in minutes.",
    ar: "الحفاظ على الإرشاد قصيرًا: فقرة واحدة، تنبيه واحد، طقس عملي واحد ليستجيب الفريق خلال دقائق.",
  },
]

const rhythmLines = [
  {
    en: "Spectral layers point to the wound while the paired text states why it matters today.",
    ar: "الطبقات الطيفية تشير إلى موضع الخلل، والنص المرافق يوضّح سبب أهميته اليوم.",
  },
  {
    en: "Soil and weather briefings compress into a five-minute ritual before crews move.",
    ar: "موجز التربة والطقس يتكثف في طقس مدته خمس دقائق قبل تحرّك الطواقم.",
  },
  {
    en: "The agronomy assistant writes bilingual steps so supervisors stop rewriting voice notes.",
    ar: "المساعد الزراعي يكتب خطوات ثنائية اللغة كي يتوقف المشرفون عن إعادة صياغة الرسائل الصوتية.",
  },
  {
    en: "The alerts center keeps Live/Beta states transparent so farms know which lane to trust.",
    ar: "مركز التنبيهات يُظهر حالات نشط/تجريبي بوضوح ليعرف المزارع أي مسار يمكن الوثوق به.",
  },
]

const teamFocus = [
  { en: "Temporal satellite analytics", ar: "تحليلات زمنية للأقمار الصناعية" },
  { en: "Bilingual interface systems", ar: "واجهات ثنائية اللغة" },
  { en: "Sensor & IoT orchestration", ar: "تنسيق الحساسات وإنترنت الأشياء" },
]

export default function AboutPage() {
  const { language, toggleLanguage } = useTranslation()
  const isArabic = language === "ar"

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{isArabic ? "رؤية Adham AgriTech" : "Adham AgriTech Vision"}</h1>
        <button
          onClick={toggleLanguage}
          className="text-xs rounded-full border border-white/15 px-3 py-1 opacity-80 hover:opacity-100"
        >
          {isArabic ? "EN" : "ع"}
        </button>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{isArabic ? "رواية الرؤية" : "Vision Narrative"}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-4">
          <p>
            {isArabic
              ? "تعيد Adham AgriTech تصوّر تجربة المزارع بمعالجة ثلاث مشكلات أساسية في الزراعة: غياب الرؤية الشاملة للحقل، والاعتماد على التخمين في قرارات الري والتسميد، وصعوبة تنسيق فرق العمل الميدانيadham-agritech.com. ولحل هذه التحديات، نوفر نظامًا موحّدًا يجمع صور الأقمار الصناعية مع بيانات الطقس والتربة وسجلات الحقول، بالإضافة إلى مساعد زراعي ذكي. هذا التكامل يمنح المزارع صورة واضحة لحالة مزرعته، ويمكنه من اتخاذ قرارات مدروسة مستندة إلى المعلومات بدلًا من الظنون."
              : "Adham AgriTech reimagines the farming experience by addressing three fundamental problems in agriculture: the lack of a unified view of the field, reliance on guesswork for irrigation and fertilization decisions, and the difficulty of coordinating field teamsadham-agritech.com. To overcome these challenges, we provide a unified system that brings together satellite imagery with weather and soil data, field records, and an intelligent farming assistant. This integration gives farmers a clear picture of their farm’s condition and empowers them to make informed decisions based on information instead of guesswork."}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-background/40 p-4 space-y-2">
              <p className="font-medium text-white/90">{isArabic ? "واقع الحقول" : "Field realities"}</p>
              <ul className="list-disc ps-5 space-y-1">
                {fieldRealities.map((item, idx) => (
                  <li key={idx}>{isArabic ? item.ar : item.en}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-background/40 p-4 space-y-2">
              <p className="font-medium text-white/90">{isArabic ? "ردّنا المتناظر" : "Our symmetric response"}</p>
              <ul className="list-disc ps-5 space-y-1">
                {responsePrinciples.map((item, idx) => (
                  <li key={idx}>{isArabic ? item.ar : item.en}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{isArabic ? "أمثلة عملية" : "Practical Examples"}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            {isArabic
              ? "على سبيل المثال، بدلاً من أن يجوب المزارع حقوله معتمدًا على الملاحظة الشخصية، تقدّم المنصة خريطة فضائية ملوّنة تُبرز فورًا البقع التي تعاني من الإجهاد قبل تفاقم المشكلة. وفي حين كانت التقلبات المناخية غير المؤكدة تؤدي إلى تأجيل الري في الماضي، تصبح التوصيات الدقيقة المبنية على بيانات الطقس والتربة متاحة الآن عبر تنبيهات مبكرة تساعد المزارع على الري في الوقت المناسب. كذلك يقوم المساعد الذكي بتحويل أي هدف أو مشكلة يحددها المزارع إلى خطة عمل واضحة من خطوات متعددة، موزعًا المهام على فريق الحقل بشكل فوري لضمان تنسيق سلس دون الاعتماد على التعليمات الشفويةadham-agritech.com."
              : "For example, instead of a farmer walking through fields relying on personal observation, the platform delivers a color-coded satellite map that immediately highlights any areas under stress before problems escalate. And whereas uncertain weather used to cause delays in irrigation, now precise recommendations based on real-time weather and soil data arrive as timely alerts, helping the farmer water at the right time. Likewise, the smart assistant turns any goal or issue the farmer identifies into a clear action plan with multiple steps, assigning tasks to the field team instantly to ensure seamless coordination without relying on spoken instructionsadham-agritech.com."}
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{isArabic ? "رؤيتنا" : "Vision"}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {isArabic
            ? "رؤيتنا طويلة المدى هي تحويل الزراعة إلى عملية فورية تعتمد على البيانات بشكل كامل. نحن نتخيل مستقبلًا يستطيع فيه كل مزارع قراءة أرضه كما يقرأ لوحة معلومات واضحة؛ إذ يرمز كل لون على الخريطة وكل تنبيه من المساعد إلى إجراء ميداني محدّد، دون الحاجة إلى فهم التعقيدات التقنية التي تعمل خلف الكواليسadham-agritech.com. نهدف إلى تمكين المزارعين من اتخاذ قرارات علمية واستباقية ترفع الإنتاجية وتقلل الهدر، وذلك بالتعاون الوثيق مع شركاء المنظومة والمؤسسات الزراعية. ومن خلال بناء الثقة واعتماد الشفافية، نسعى لربط جميع الأطراف – المزارعين والشركاء والمؤسسات – معًا نحو مستقبلٍ زراعيٍ قائمٍ على المعرفة اللحظية والقرارات المدروسة."
            : "Our long-term vision is to turn agriculture into a real-time, data-driven process in every sense. We envision a future where every farmer can read their land like a simple dashboard: each color on the map and each alert from the assistant translates into a specific field action, without the need to grasp the complex technology working behind the scenesadham-agritech.com. We aim to empower farmers to make scientific, proactive decisions that boost productivity and reduce waste, in close collaboration with our ecosystem partners and agricultural institutions. By building trust and embracing transparency, we strive to connect all stakeholders – farmers, partners, and institutions – together toward an agricultural future driven by instantaneous knowledge and well-informed decisions."}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{isArabic ? "رسالتنا" : "Mission"}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc ps-6 text-sm text-muted-foreground space-y-1">
            <li>
              {isArabic
                ? "ترجمة الضوضاء (صور، طقس، سجلات) إلى قصص حقلية مفهومة يمكن للفريق تنفيذها في دقائق."
                : "Translate the noise—imagery, weather, logs—into field stories the crew can act on within minutes."}
            </li>
            <li>
              {isArabic
                ? "جعل كل تنبيه يجيب على سؤالين: ما السبب؟ وما الخطوة التالية؟"
                : "Ensure every alert answers two questions: why it matters, and which next step matters most."}
            </li>
            <li>
              {isArabic
                ? "إعادة تشكيل إدارة الموارد بحيث يكون الماء والسماد يعاملان كوحدات دقيقة، لا تقديرات."
                : "Reshape resource management so water and fertilizer are treated as precise units, not estimates."}
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>{isArabic ? "الوحدات التشغيليّة" : "Operational Modules"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {modules.map((module) => (
              <div key={module.key} className="flex items-center justify-between">
                <span>{isArabic ? module.ar : module.en}</span>
                <Badge className={`${statusTokens[module.status].className} text-white`}>
                  {isArabic ? statusTokens[module.status].ar : statusTokens[module.status].en}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{isArabic ? "إيقاع المنصة" : "Platform Rhythm"}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          {rhythmLines.map((line, idx) => (
            <p key={idx}>• {isArabic ? line.ar : line.en}</p>
          ))}
        </CardContent>
      </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{isArabic ? "خارطة الطريق" : "Roadmap"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
          {shortRoadmap.map((block) => (
            <div key={block.id}>
              <p className="font-medium text-white/90">{isArabic ? block.ar : block.en}</p>
              <ul className="list-disc ps-5 space-y-1 mt-1">
                {block.items.map((item, idx) => (
                  <li key={idx}>{isArabic ? item.ar : item.en}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <section className="rounded-3xl border border-white/10 bg-background/40 p-6 space-y-5" id="vision-team">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">{isArabic ? "من يقف خلف المنصة" : "Who is behind the platform"}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isArabic
              ? "Adham AgriTech مشروع مستقل يمزج بين الهندسة البرمجية والخبرة الحقلية ليقدّم للمزارع أداة عملية يمكن الوثوق بها موسمًا بعد موسم."
              : "Adham AgriTech is an independent effort that blends engineering with field experience to give farmers a practical tool they can trust season after season."}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-background/60 p-5 space-y-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-primary/70">
              {isArabic ? "رؤية المؤسس" : "Founder perspective"}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isArabic
                ? "أدهم يونس محمد أحمد، مهندس من صعيد مصر، صمَّم المنصة لتربط بين حدود الحقل وقراءات التربة وصور الأقمار الصناعية في مسار واحد واضح يساعد فريق العمل على اتخاذ قرار الري والتسميد في دقائق."
                : "Adham Younes Mohamed Ahmed, an engineer from Upper Egypt, designed the platform to connect field boundaries, soil readings and satellite imagery into a single clear workflow that helps crews decide on irrigation and fertilisation within minutes."}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isArabic
                ? "القرارات تُختبر أولاً في الحقول ثم تُترجم إلى مؤشرات ورسوم بيانية بسيطة داخل لوحة التحكم، دون إخفاء من أين جاءت الأرقام أو ما تعنيه للمزارع."
                : "Decisions are tested in real fields first, then translated into simple indicators and charts in the dashboard without hiding where the numbers come from or what they mean for the farmer."}
            </p>
          </div>
          <div className="grid gap-4 text-sm text-primary sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-primary/70">Email</p>
              <a href="mailto:adham@adham-agritech.com" className="font-medium text-white hover:underline">
                adham@adham-agritech.com
              </a>
            </div>
            <div className="rounded-2xl border border-white/10 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-primary/70">
                {isArabic ? "هاتف" : "Phone"}
              </p>
              <a href="tel:+201110093730" className="font-medium text-white hover:underline">
                +20 111 009 3730
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-dashed border-white/20 bg-background/40 p-4 text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-white/90">
              {isArabic ? "التزام بالجودة والخصوصية" : "Commitment to quality and privacy"}
            </p>
            <p>
              {isArabic
                ? "تُبنى الميزات الجديدة تدريجيًا وفق ما يثبته الاستخدام الفعلي في الحقول، مع الحفاظ على استقرار المنصة للمستخدمين الحاليين."
                : "New capabilities are introduced gradually, guided by how they perform in real farms, while keeping the platform stable for existing users."}
            </p>
            <p>
              {isArabic
                ? "جميع الواجهات الأساسية تدعم العربية والإنجليزية، ويمكن توسيع المحتوى والترجمة وفق احتياجات الشركاء والمناطق المختلفة."
                : "All primary surfaces support both Arabic and English, and content can be extended or localised to match partners and regions."}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
