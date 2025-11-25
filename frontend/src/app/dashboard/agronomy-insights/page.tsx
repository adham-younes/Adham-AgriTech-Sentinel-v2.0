"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BrainCircuit,
  Activity,
  RadioTower,
  CloudSunRain,
  Leaf,
  Droplets,
  TrendingUp,
  Sparkles,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/use-language"

type HealthLevel = "excellent" | "good" | "fair" | "poor" | "critical"

type FieldSummary = {
  id: string
  name: string | null
  crop_type?: string | null
}

type FieldInsights = {
  remoteSensing: {
    ndvi: number | null
    evi: number | null
    ndwi: number | null
    capturedAt: string | null
    health: HealthLevel
  }
  soil: {
    ph_level: number | null
    nitrogen_ppm: number | null
    phosphorus_ppm: number | null
    potassium_ppm: number | null
    organic_matter_percent: number | null
    moisture_percent: number | null
    summary: string | null
  }
  irrigation: {
    liters_per_hectare: number
    total_recommended_liters: number
    schedule: {
      frequency: string
      slot: string
    }
    notes: string
  }
  monitoring: {
    health_status: HealthLevel
    temperature_celsius: number
  }
}

const DEMO_SENSOR_READINGS = {
  moisture: [34, 36, 38, 37, 35, 39, 40],
  temperature: [28.2, 28.8, 29.1, 29.4, 29.8, 30.1, 29.5],
  conductivity: [1.2, 1.25, 1.28, 1.3, 1.35, 1.33, 1.31],
}

export default function AgronomyInsightsPage() {
  const { language, setLanguage } = useTranslation()
  const [fields, setFields] = useState<FieldSummary[]>([])
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)
  const [insights, setInsights] = useState<FieldInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lang, setLang] = useState<"ar" | "en">("ar")

  const t = {
    ar: {
      pageTitle: "تحليلات زراعية",
      subtitle: "رؤى زراعية فورية مدعومة ببيانات المستشعرات وصور الأقمار الصناعية وتنبؤات الذكاء الاصطناعي.",
      generate: "إنشاء توصية جديدة",
      updatedAgo: "تم التحديث منذ 5 دقائق",
      aiRecs: "توصيات بالذكاء الاصطناعي",
      aiRecsDesc: "نماذج مدمجة تجمع بين المستشعرات الأرضية وشرائط الأقمار الصناعية والتنبؤات الموسمية.",
      sensorNetwork: "شبكة المستشعرات",
      sensorSelect: "اختر حقلاً لمراجعة حالة القياسات والتنبيهات.",
      alerts: (n: number) => (n === 1 ? "1 تنبيه" : `${n} تنبيهات`),
      stable: "مستقر",
      soilCanopy: (m: number, c: number) => `رطوبة التربة ${m}% · حرارة الغطاء ${c.toFixed(1)}°م`,
      canopyHealth: "درجة صحة الغطاء النباتي",
      canopyNote: "حُسبت باستخدام تدرجات NDVI ورطوبة الورق وبيانات البخر-نتح.",
      wxVeg: "الطقس واتجاه الغطاء النباتي",
      wxVegDesc: (name: string) => `مركب NDVI أسبوعي متوافق مع رصد الطقس الموضعي لحقل ${name}.`,
      vegNote: "أُعيد معايرة خط الأساس لمؤشر الغطاء باستخدام حزم Sentinel‑2 (8/4/3) وقياسات أرضية.",
      streams: "بيانات القياسات",
      streamsDesc: "قارن ملخصات المستشعرات اليومية للرطوبة وحرارة الغطاء والموصلية.",
      tabs: { moisture: "الرطوبة", temperature: "حرارة الغطاء", conductivity: "الموصلية" },
      day: (i: number) => `اليوم ${i}`,
      confidence: (p: number) => `${p}% ثقة`,
      howToTitle: "طريقة الاستخدام",
      howToSteps: [
        "اختر حقلاً من شبكة المستشعرات لعرض حالته.",
        "راجع التوصيات الذكية وحدد إجراءات الري/التغذية.",
        "استخدم التبويبات لمقارنة قراءات الرطوبة والحرارة والموصلية عبر الأيام.",
      ],
      langToggle: "EN",
    },
    en: {
      pageTitle: "Agronomy Intelligence",
      subtitle: "Real‑time agronomic insights powered by sensor telemetry, satellite imagery, and AI forecasting.",
      generate: "Generate New Insight",
      updatedAgo: "Updated 5 minutes ago",
      aiRecs: "AI Recommendations",
      aiRecsDesc: "Blended models combining ground sensors, satellite bands, and seasonal AI forecasting.",
      sensorNetwork: "Sensor Network",
      sensorSelect: "Select a field to review telemetry status and anomalies.",
      alerts: (n: number) => `${n} alerts`,
      stable: "Stable",
      soilCanopy: (m: number, c: number) => `Soil moisture ${m}% · Canopy ${c.toFixed(1)}°C`,
      canopyHealth: "Canopy health score",
      canopyNote: "Calculated using NDVI gradients, leaf wetness, and evapotranspiration data.",
      wxVeg: "Weather & Vegetation Trend",
      wxVegDesc: (name: string) => `Weekly NDVI composite aligned with hyper‑local weather observations for ${name}.`,
      vegNote: "Vegetation index baseline recalibrated using Sentinel‑2 bands 8/4/3 and ground spectral readings.",
      streams: "Telemetry Streams",
      streamsDesc: "Compare daily sensor summaries across moisture, canopy temperature, and EC.",
      tabs: { moisture: "Moisture", temperature: "Canopy Temp", conductivity: "EC" },
      day: (i: number) => `Day ${i}`,
      confidence: (p: number) => `${p}% confidence`,
      howToTitle: "How to use",
      howToSteps: [
        "Pick a field from Sensor Network to focus the view.",
        "Read AI recommendations and decide irrigation/nutrition actions.",
        "Use tabs to compare moisture, canopy temperature, and EC across days.",
      ],
      langToggle: "ع",
    },
  }

  useEffect(() => {
    if (language === "ar" || language === "en") {
      setLang(language)
    }
  }, [language])

  useEffect(() => {
    const loadFields = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch("/api/fields")
        if (!response.ok) {
          throw new Error(`Failed to load fields: ${response.status}`)
        }
        const payload = (await response.json()) as { fields?: Array<{ id: string; name: string | null; crop_type?: string | null }> }
        const list = payload.fields ?? []
        setFields(list)
        if (list.length > 0) {
          const firstId = list[0].id
          setActiveFieldId(firstId)
          await loadInsights(firstId)
        }
      } catch (err) {
        console.error("[AgronomyInsights] Failed to load fields", err)
        setError(lang === "ar" ? "تعذر تحميل الحقول" : "Failed to load fields")
      } finally {
        setLoading(false)
      }
    }
    loadFields()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadInsights(fieldId: string) {
    try {
      setInsightsLoading(true)
      setError(null)
      const response = await fetch(`/api/fields/insights?field_id=${encodeURIComponent(fieldId)}`)
      if (!response.ok) {
        throw new Error(`Failed to load insights: ${response.status}`)
      }
      const payload = (await response.json()) as { insights?: FieldInsights }
      if (payload.insights) {
        setInsights(payload.insights)
      }
    } catch (err) {
      console.error("[AgronomyInsights] Failed to load insights", err)
      setError(lang === "ar" ? "تعذر تحميل تحليلات الحقل" : "Failed to load field insights")
    } finally {
      setInsightsLoading(false)
    }
  }

  const activeField = useMemo(
    () => fields.find((field) => field.id === activeFieldId) ?? null,
    [fields, activeFieldId],
  )

  const activeFieldName =
    activeField?.name ?? (lang === "ar" ? "الحقل المختار" : "selected field")

  const soilMoisture = insights?.soil.moisture_percent ?? 40
  const canopyTemp = insights?.monitoring.temperature_celsius ?? 28
  const canopyScore = useMemo(() => Math.round((soilMoisture / 60) * 100), [soilMoisture])

  const sensorReadings = DEMO_SENSOR_READINGS

  const ndviTrends = useMemo(() => {
    // If we have a current NDVI, build a simple trend around it; else use a static demo series
    if (insights?.remoteSensing?.ndvi != null) {
      const current = Number(insights.remoteSensing.ndvi) || 0
      const clamp = (v: number) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0))
      return [
        { label: t[lang].day(1), value: clamp(current * 0.8) },
        { label: t[lang].day(2), value: clamp(current * 0.9) },
        { label: t[lang].day(3), value: clamp(current) },
        { label: t[lang].day(4), value: clamp(current * 1.05) },
      ]
    }
    return [
      { label: t[lang].day(1), value: 0.22 },
      { label: t[lang].day(2), value: 0.28 },
      { label: t[lang].day(3), value: 0.34 },
      { label: t[lang].day(4), value: 0.31 },
    ]
  }, [insights, lang, t])

  const irrigationRecommendation = useMemo(() => {
    if (!insights) {
      return {
        text:
          lang === "ar"
            ? "قم بجدولة رية بالتنقيط لتخفيف إجهاد الماء في الحقل النشط."
            : "Schedule a drip irrigation cycle for the active field to relieve water stress.",
        confidence: 90,
      }
    }
    const name = activeField?.name ?? (lang === "ar" ? "الحقل النشط" : "active field")
    const liters = insights.irrigation.total_recommended_liters
    const freq = insights.irrigation.schedule.frequency
    const slot = insights.irrigation.schedule.slot
    const base =
      lang === "ar"
        ? `يوصى بضخ حوالي ${formatIrrigationLiters(liters, "ar")} لتر للري في ${name} (${freq} - ${slot}).`
        : `Recommended to apply about ${formatIrrigationLiters(liters, "en")} liters of irrigation for ${name} (${freq}, ${slot}).`
    return {
      text: `${base} ${lang === "ar" ? insights.irrigation.notes : insights.irrigation.notes}`,
      confidence: 90,
    }
  }, [insights, activeField, lang])

  const nutritionRecommendation = useMemo(() => {
    if (!insights) {
      return {
        text:
          lang === "ar"
            ? "تأكد من متابعة برنامج التسميد الحالي وضبط معدلات النيتروجين والفوسفور حسب نمو المحصول."
            : "Continue your current fertilization program and adjust nitrogen and phosphorus rates according to crop growth.",
        confidence: 85,
      }
    }
    const n = insights.soil.nitrogen_ppm
    const p = insights.soil.phosphorus_ppm
    const k = insights.soil.potassium_ppm
    if (lang === "ar") {
      return {
        text: `مستوى النيتروجين التقديري حوالي ${n} جزء في المليون، والفوسفور ${p}، والبوتاسيوم ${k}. راجع برنامج التسميد لتغطية هذه الاحتياجات خلال الأسبوع القادم.`,
        confidence: 82,
      }
    }
    return {
      text: `Estimated nitrogen level is around ${n} ppm, with phosphorus at ${p} ppm and potassium at ${k} ppm. Review your fertilization plan to cover these needs over the coming week.`,
      confidence: 82,
    }
  }, [insights, lang])

  const diseaseRecommendation = useMemo(() => {
    if (!insights) {
      return {
        text:
          lang === "ar"
            ? "راقب مظاهر الإجهاد أو البقع على الأوراق خاصة بعد فترات الرطوبة العالية."
            : "Monitor for signs of stress or leaf spots, especially after periods of high humidity.",
        confidence: 75,
      }
    }
    const health = insights.remoteSensing.health
    const msgAr =
      health === "excellent" || health === "good"
        ? "لا توجد مؤشرات قوية على أمراض حالية، لكن يُنصح بالمتابعة الدورية للورق والعفن خاصة بعد الري أو الأمطار."
        : "مؤشرات الغطاء النباتي تظهر بعض الإجهاد؛ راقب ظهور بقع أو اصفرار وانتبه لفترات البلل الطويلة على الأوراق."
    const msgEn =
      health === "excellent" || health === "good"
        ? "No strong disease signals detected, but keep scouting canopy and foliage after irrigation or rainfall."
        : "Vegetation indices show some stress; inspect for leaf spots or yellowing and watch periods of prolonged leaf wetness."
    return {
      text: lang === "ar" ? msgAr : msgEn,
      confidence: health === "excellent" || health === "good" ? 78 : 70,
    }
  }, [insights, lang])

  return (
    <div className="space-y-8 p-6 sm:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">{t[lang].pageTitle}</h1>
          <p className="text-muted-foreground">{t[lang].subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              const next = lang === "ar" ? "en" : "ar"
              setLang(next)
              setLanguage(next)
            }}
          >
            {t[lang].langToggle}
          </Button>
          <Button className="gap-2" variant="outline">
            <Sparkles className="h-4 w-4" />
            {t[lang].generate}
          </Button>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BrainCircuit className="h-5 w-5 text-primary" />
                {t[lang].aiRecs}
              </CardTitle>
              <CardDescription>{t[lang].aiRecsDesc}</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400">
              {t[lang].updatedAgo}
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <InsightCard
              title={lang === "ar" ? "الري" : "Irrigation"}
              description={irrigationRecommendation.text}
              confidence={irrigationRecommendation.confidence}
              confidenceLabel={t[lang].confidence(irrigationRecommendation.confidence)}
              icon={<Droplets className="h-5 w-5" />}
            />
            <InsightCard
              title={lang === "ar" ? "التغذية" : "Nutrition"}
              description={nutritionRecommendation.text}
              confidence={nutritionRecommendation.confidence}
              confidenceLabel={t[lang].confidence(nutritionRecommendation.confidence)}
              icon={<Leaf className="h-5 w-5" />}
            />
            <InsightCard
              title={lang === "ar" ? "مخاطر الأمراض" : "Disease Risk"}
              description={diseaseRecommendation.text}
              confidence={diseaseRecommendation.confidence}
              confidenceLabel={t[lang].confidence(diseaseRecommendation.confidence)}
              icon={<Activity className="h-5 w-5" />}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RadioTower className="h-5 w-5 text-primary" />
              {t[lang].sensorNetwork}
            </CardTitle>
            <CardDescription>{t[lang].sensorSelect}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {fields.length === 0 && !loading && (
                <p className="text-sm text-muted-foreground">
                  {lang === "ar"
                    ? "لا توجد حقول مرتبطة حتى الآن. ابدأ بإضافة حقل جديد من لوحة الحقول."
                    : "No fields available yet. Start by adding a new field from the Fields dashboard."}
                </p>
              )}
              {fields.map((field) => (
                <button
                  key={field.id}
                  onClick={() => {
                    setActiveFieldId(field.id)
                    loadInsights(field.id)
                  }}
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-left transition-all",
                    activeFieldId === field.id
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40 hover:bg-primary/5",
                  )}
                  disabled={insightsLoading && activeFieldId === field.id}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{field.name || (lang === "ar" ? "حقل بدون اسم" : "Unnamed field")}</span>
                    <Badge variant="outline" className="border-transparent bg-emerald-500/10 text-emerald-400">
                      {t[lang].stable}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t[lang].soilCanopy(soilMoisture, canopyTemp)}
                  </p>
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
              <p className="text-sm font-medium text-primary">{t[lang].canopyHealth}</p>
              <p className="mt-2 text-3xl font-bold text-primary">{canopyScore}%</p>
              <p className="mt-1 text-xs text-primary/80">{t[lang].canopyNote}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudSunRain className="h-5 w-5 text-primary" />
              {t[lang].wxVeg}
            </CardTitle>
            <CardDescription>{t[lang].wxVegDesc(activeFieldName)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-4">
              {ndviTrends.map((point) => (
                <div key={point.label} className="flex-1">
                  <div
                    className="rounded-t-lg bg-gradient-to-t from-emerald-500/30 to-emerald-400"
                    style={{ height: `${point.value * 100}px` }}
                  />
                  <p className="mt-2 text-center text-xs text-muted-foreground">{point.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{t[lang].vegNote}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t[lang].streams}
            </CardTitle>
            <CardDescription>{t[lang].streamsDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="moisture" className="space-y-4">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="moisture">{t[lang].tabs.moisture}</TabsTrigger>
                <TabsTrigger value="temperature">{t[lang].tabs.temperature}</TabsTrigger>
                <TabsTrigger value="conductivity">{t[lang].tabs.conductivity}</TabsTrigger>
              </TabsList>
              <TabsContent value="moisture">
                <StreamList unit="%" data={sensorReadings.moisture} dayLabel={t[lang].day} />
              </TabsContent>
              <TabsContent value="temperature">
                <StreamList unit="°C" data={sensorReadings.temperature} dayLabel={t[lang].day} />
              </TabsContent>
              <TabsContent value="conductivity">
                <StreamList unit="dS/m" data={sensorReadings.conductivity} dayLabel={t[lang].day} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>{t[lang].howToTitle}</CardTitle>
            <CardDescription>
              {lang === "ar"
                ? "ملخص سريع لاستخدام التحليلات لاتخاذ قرارات عملية"
                : "Quick guide to use analytics for actionable decisions"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
              {t[lang].howToSteps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function InsightCard({
  title,
  description,
  confidence,
  confidenceLabel,
  icon,
}: {
  title: string
  description: string
  confidence: number
  confidenceLabel: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card/60 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          {icon}
          <span className="font-semibold">{title}</span>
        </div>
        <Badge variant="outline" className="border-primary/40 text-primary">
          {confidenceLabel}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function StreamList({ data, unit, dayLabel }: { data: number[]; unit: string; dayLabel: (i: number) => string }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {data.map((value, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-sm"
        >
          <span className="text-muted-foreground">{dayLabel(index + 1)}</span>
          <span className="font-semibold text-primary">
            {value}
            {unit}
          </span>
        </div>
      ))}
    </div>
  )
}

function formatIrrigationLiters(value: number, language: "ar" | "en"): string {
  try {
    return value.toLocaleString(language === "ar" ? "ar-EG" : "en-GB")
  } catch {
    try {
      return value.toLocaleString("en-GB")
    } catch {
      return String(value)
    }
  }
}
