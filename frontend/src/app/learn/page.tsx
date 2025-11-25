"use client"

import { useTranslation } from "@/lib/i18n/use-language"

type Lang = "ar" | "en"

const CONTENT: Record<
  Lang,
  {
    title: string
    subtitle: string
    sections: {
      title: string
      body: string
      bullets: string[]
    }[]
  }
> = {
  ar: {
    title: "المركز التعليمي",
    subtitle:
      "محتوى مبسّط وعملي حول الزراعة الذكية، الدفيئات، إضاءة النمو، وكيف تساعد صور الأقمار الصناعية في متابعة الحقول ورفع الإنتاجية.",
    sections: [
      {
        title: "ما هي الزراعة الدقيقة؟",
        body:
          "الزراعة الدقيقة هي استخدام البيانات (صور أقمار صناعية، مجسات، طقس) لاتخاذ قرارات دقيقة على مستوى الحقل أو حتى القطاع داخل الحقل. الفائدة: تقليل الهدر في المياه والأسمدة، وتحسين الإنتاجية وجودة المحصول.",
        bullets: [
          "خرائط مؤشرات نباتية (NDVI/EVI) لتحديد مناطق الإجهاد النباتي.",
          "جدولة الري بناءً على رطوبة التربة والتبخر والنتح.",
          "تسميد متغير الجرعة حسب الحاجة الفعلية لكل قطاع.",
        ],
      },
      {
        title: "الدفيئة (البيوت المحمية) وإضاءة النمو",
        body:
          "تُستخدم البيوت المحمية للتحكم الدقيق في الحرارة والرطوبة والضوء. تساعد مصابيح Grow Light على إطالة فترة الإضاءة وتحسين التمثيل الضوئي، خصوصاً في الشتاء أو البيئات منخفضة الإشعاع الشمسي.",
        bullets: [
          "اختيار طيف ضوئي مناسب (أحمر/أزرق) حسب مرحلة النمو.",
          "استخدام حساسات لتتبع شدة الإضاءة وفترات التشغيل المثلى.",
          "تحسين استهلاك الطاقة بمؤقتات ذكية وخوارزميات تحكم.",
        ],
      },
      {
        title: "كيف تعمل صور الأقمار الصناعية لخدمة المزارع؟",
        body:
          "تعتمد المؤشرات النباتية مثل NDVI على انعكاس الضوء المرئي وتحت الأحمر القريب من الغطاء النباتي. ارتفاع NDVI يشير عادةً لصحة نباتية أفضل. تُمكّن صور Sentinel‑2 وLandsat من متابعة الغطاء النباتي كل عدة أيام.",
        bullets: [
          "NDVI = (NIR - Red) / (NIR + Red).",
          "تكامل المنصة مع خدمة صور الأقمار الصناعية يوفر خرائط حديثة للحقل.",
          "دمج القراءات مع بيانات الطقس يرفع دقة التنبؤ بالمشكلات.",
        ],
      },
      {
        title: "نصائح سريعة لزيادة الإنتاجية",
        body: "",
        bullets: [
          "ابدأ بتقسيم الحقل لمناطق إدارة فرعية (Zones) وفق خرائط NDVI.",
          "طبق جدولة ري ذكية تربط التربة بالطقس لتقليل الفاقد.",
          "نفّذ تحليل دوري للتربة مع توصيات تسميد متغيرة الجرعة.",
          "تابع الآفات والأمراض بصور الهاتف لاقتراحات علاجية مبكرة.",
        ],
      },
    ],
  },
  en: {
    title: "Learning Center",
    subtitle:
      "Practical, down‑to‑earth content on smart farming, greenhouses, grow‑lights, and how satellite imagery turns into decisions on the field.",
    sections: [
      {
        title: "What is Precision Agriculture?",
        body:
          "Precision agriculture means using data—satellite imagery, sensors, and weather—to make decisions at the level of the field or even the management zone. The result is less waste in water and fertilizer and more yield with better crop quality.",
        bullets: [
          "Use vegetation indices (NDVI/EVI) maps to highlight zones under crop stress.",
          "Schedule irrigation based on soil moisture, evaporation, and transpiration rather than fixed calendars.",
          "Apply variable‑rate fertilization so each zone receives exactly what it needs.",
        ],
      },
      {
        title: "Greenhouses and Grow Lights",
        body:
          "Greenhouses are used to control temperature, humidity, and light with high precision. Grow‑lights extend day length and improve photosynthesis, especially in winter or low‑radiation environments.",
        bullets: [
          "Select the right light spectrum (red/blue balance) for each growth stage.",
          "Use sensors to track light intensity and optimize on/off periods.",
          "Reduce energy costs with timers and control algorithms instead of manual switching.",
        ],
      },
      {
        title: "How Satellite Imagery Helps Farmers",
        body:
          "Vegetation indices such as NDVI rely on the difference between reflected visible and near‑infrared light from the canopy. Higher NDVI usually indicates healthier vegetation. Sentinel‑2 and Landsat imagery allow you to monitor fields every few days.",
        bullets: [
          "NDVI = (NIR − Red) / (NIR + Red).",
          "Connecting your fields to a satellite service provides fresh maps after each pass.",
          "Combining imagery with weather and soil data makes problem detection more reliable.",
        ],
      },
      {
        title: "Quick Tips to Boost Productivity",
        body: "",
        bullets: [
          "Divide each field into management zones based on NDVI history and soil differences.",
          "Link irrigation schedules to both soil readings and short‑term weather forecasts.",
          "Run seasonal soil tests and align fertilizer plans with measured gaps, not guesses.",
          "Capture smartphone photos of pests and diseases and log them alongside satellite data.",
        ],
      },
    ],
  },
}

export default function LearnPage() {
  const { language } = useTranslation()
  const lang: Lang = language === "en" ? "en" : "ar"
  const content = CONTENT[lang]

  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-2 text-3xl font-bold sm:text-4xl">{content.title}</h1>
          <p className="mb-8 text-muted-foreground">{content.subtitle}</p>

          <div className="space-y-10">
            {content.sections.map((section, index) => (
              <article key={index} className="glass-card rounded-2xl p-6">
                <h2 className="mb-2 text-2xl font-semibold">{section.title}</h2>
                {section.body && (
                  <p className="text-sm leading-relaxed text-muted-foreground">{section.body}</p>
                )}
                {section.bullets.length > 0 && (
                  <ul className="mt-3 list-disc pr-5 text-sm leading-relaxed text-muted-foreground">
                    {section.bullets.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
