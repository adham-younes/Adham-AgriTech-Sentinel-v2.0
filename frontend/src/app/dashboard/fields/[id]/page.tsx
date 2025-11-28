"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Leaf, Waves, ThermometerSun, Map } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useTranslation } from "@/lib/i18n/use-language"
import { AdvancedIndexMap } from "@/components/ui/advanced-index-map"
import { FieldAnalyticsDashboard } from "@/components/ui/field-analytics-dashboard"
import { ComparativeAnalytics } from "@/components/ui/comparative-analytics"
import { formatDateTimeLocale } from "@/lib/utils/date"
import { getCropByNameOrId, getSoilTypeByNameOrId } from "@/lib/domain/crops"

const translations = {
  ar: {
    fieldDetails: "تفاصيل الحقل",
    backToFields: "العودة للحقول",
    loading: "جاري التحميل...",
    error: "حدث خطأ",
    noData: "لا توجد بيانات",
    health: "صحة الحقل",
    ndvi: "NDVI",
    chlorophyll: "الكلوروفيل",
    moisture: "الرطوبة",
    temperature: "درجة الحرارة",
    area: "المساحة",
    cropType: "نوع المحصول",
    soilType: "نوع التربة",
    lastUpdate: "آخر تحديث",
    analytics: "التحليلات",
    comparativeAnalytics: "التحليلات المقارنة",
    recommendations: "التوصيات",
    irrigation: "الري",
    fertilization: "التسميد",
    diseaseRisk: "مخاطر الأمراض",
    yieldPotential: "إمكانية المحصول",
    soilAnalysis: "تحليل التربة",
    cropMonitoring: "مراقبة المحاصيل",
    weatherImpact: "تأثير الطقس"
  },
  en: {
    fieldDetails: "Field Details",
    backToFields: "Back to Fields",
    loading: "Loading...",
    error: "Error occurred",
    noData: "No data available",
    health: "Field Health",
    ndvi: "NDVI",
    chlorophyll: "Chlorophyll",
    moisture: "Moisture",
    temperature: "Temperature",
    area: "Area",
    cropType: "Crop Type",
    soilType: "Soil Type",
    lastUpdate: "Last Update",
    analytics: "Analytics",
    comparativeAnalytics: "Comparative Analytics",
    recommendations: "Recommendations",
    irrigation: "Irrigation",
    fertilization: "Fertilization",
    diseaseRisk: "Disease Risk",
    yieldPotential: "Yield Potential",
    soilAnalysis: "Soil Analysis",
    cropMonitoring: "Crop Monitoring",
    weatherImpact: "Weather Impact"
  }
}

const SatelliteMap = dynamic(
  () => import("@/components/maps/farm-analytics-map").then((mod) => mod.FarmAnalyticsMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] w-full rounded-2xl border border-emerald-900/50 bg-emerald-950/30 flex items-center justify-center text-sm text-emerald-100/70">
        Loading map…
      </div>
    ),
  },
)

type Lang = "ar" | "en"

type MetricTimelineEntry = {
  date: string
  ndvi?: number | null
  chlorophyll?: number | null
  soilMoisture?: number | null
  mapUrl?: string | null
  type?: "ndvi" | "chlorophyll"
}

export default function FieldDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { language } = useTranslation()
  const [lang, setLang] = useState<Lang>(language)
  const [fieldId, setFieldId] = useState<string>("")
  const [field, setField] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [cropLabel, setCropLabel] = useState<{ ar?: string | null; en?: string | null } | null>(null)
  const [soilLabel, setSoilLabel] = useState<{ ar?: string | null; en?: string | null } | null>(null)
  const [metrics, setMetrics] = useState<{
    ndvi?: { latest: number | null; history: number[]; mapUrl?: string | null; date?: string | null }
    moisture?: { latest: number | null }
    temperature?: { latest: number | null }
    chlorophyll?: { latest: number | null; date: string | null; mapUrl?: string | null; history: number[] }
    soilMoisture?: { latest: number | null; date: string | null; mapUrl?: string | null; history: number[] }
    evi?: { latest: number | null; date: string | null; mapUrl?: string | null; history: number[] }
    nri?: { latest: number | null; date: string | null; mapUrl?: string | null; history: number[] }
    dswi?: { latest: number | null; date: string | null; mapUrl?: string | null; history: number[] }
    ndwi?: { latest: number | null; date: string | null; mapUrl?: string | null; history: number[] }
    weather?: { latest: { temperature?: number | null; humidity?: number | null; precipitation?: number | null; wind_speed?: number | null; condition?: string | null }; history: any[] }
    timeline?: MetricTimelineEntry[]
    field?: any
  } | null>(null)
  const [activeRaster, setActiveRaster] = useState<"ndvi" | "chlorophyll">("ndvi")
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const supabase = createClient()

  const parseMaybeNumber = (value: unknown) =>
    typeof value === "string"
      ? Number.parseFloat(value)
      : typeof value === "number"
        ? value
        : null

  const FALLBACK_RASTER_TILE =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='512' height='512'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23d1fae5' stop-opacity='0.6'/%3E%3Cstop offset='50%25' stop-color='%23a7f3d0' stop-opacity='0.55'/%3E%3Cstop offset='100%25' stop-color='%23fbbf24' stop-opacity='0.6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='0' y='0' width='512' height='512' fill='url(%23g)'/%3E%3C/svg%3E"

  function sparklinePath(data: number[]) {
    if (data.length === 0) return ""
    const width = 120
    const height = 40
    const padding = 4
    const step = (width - 2 * padding) / Math.max(data.length - 1, 1)
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    return data.map((value, index) => {
      const x = padding + index * step
      const y = padding + (1 - (value - min) / range) * (height - 2 * padding)
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    }).join(' ')
  }

  async function resolveDomainLabels(fieldData: any) {
    try {
      const cropName = typeof fieldData.crop_type === "string" ? fieldData.crop_type.trim() : ""
      const soilName = typeof fieldData.soil_type === "string" ? fieldData.soil_type.trim() : ""

      if (!cropName && !soilName) {
        setCropLabel(null)
        setSoilLabel(null)
        return
      }

      const [crop, soil] = await Promise.all([
        cropName ? getCropByNameOrId(supabase, { name: cropName }) : Promise.resolve(null),
        soilName ? getSoilTypeByNameOrId(supabase, { name: soilName }) : Promise.resolve(null),
      ])

      setCropLabel(crop ? { ar: crop.name_ar, en: crop.name_en } : null)
      setSoilLabel(soil ? { ar: soil.name_ar, en: soil.name_en } : null)
    } catch (error) {
      console.warn("[FieldDetails] Failed to resolve crop/soil labels:", error)
      setCropLabel(null)
      setSoilLabel(null)
    }
  }

  useEffect(() => {
    async function resolveParams() {
      try {
        const resolvedParams = await params
        const id = resolvedParams.id
        if (id && id !== fieldId) {
          setFieldId(id)
          setLoading(true) // Reset loading when field ID changes
        }
      } catch (error) {
        console.error("[FieldDetails] Failed to resolve params:", error)
        setLoading(false)
      }
    }
    resolveParams()
  }, [params, fieldId])

  useEffect(() => {
    if (fieldId) {
      setLoading(true)
      fetchField()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldId])

  useEffect(() => {
    if (language === "ar" || language === "en") {
      setLang(language)
    }
  }, [language])

  useEffect(() => {
    if (fieldId) {
      loadMetrics()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldId])

  async function loadMetrics() {
    try {
      if (!fieldId) return
      const res = await fetch(`/api/fields/${fieldId}/metrics`)
      if (!res.ok) return
      const payload = await res.json()
      setMetrics(payload)
      if (payload?.timeline?.length) {
        setSelectedDate(payload.timeline[0].date ?? null)
        if (payload.timeline[0]?.type === "chlorophyll") {
          setActiveRaster("chlorophyll")
        }
      }
    } catch (error) {
      console.warn("[FieldMetrics] Failed to load metrics", error)
    }
  }

  async function fetchField() {
    try {
      if (!fieldId) return
      const { data, error } = await supabase
        .from("fields")
        .select("*, farms(name, location, latitude, longitude)")
        .eq("id", fieldId)
        .maybeSingle()

      if (error) throw error
      setField(data ?? null)
      if (data) {
        resolveDomainLabels(data)
      } else {
        setCropLabel(null)
        setSoilLabel(null)
      }
    } catch (error) {
      console.error("[v0] Error fetching field details:", error)
      setField(null)
    } finally {
      setLoading(false)
    }
  }

  const translations = {
    ar: {
      back: "رجوع",
      title: "تفاصيل الحقل",
      farm: "المزرعة",
      location: "الموقع",
      area: "المساحة",
      cropType: "نوع المحصول",
      soilType: "نوع التربة",
      coordinates: "الإحداثيات",
      ndvi: "مؤشر NDVI",
      moisture: "رطوبة المحصول",
      lastReading: "آخر قراءة",
      notFound: "لم يتم العثور على هذا الحقل",
      chlorophyll: "الكلوروفيل",
      temperature: "حرارة الغطاء",
      moistureSoil: "رطوبة التربة",
      action: "إجراء مقترح",
      rasterHeader: "خريطة الحقل حرارياً",
      timeline: "المشاهد السابقة",
      noTimeline: "لا توجد قراءات تاريخية بعد.",
      legendLow: "منخفض",
      legendHigh: "مرتفع",
    },
    en: {
      back: "Back",
      title: "Field Details",
      farm: "Farm",
      location: "Location",
      area: "Area",
      cropType: "Crop Type",
      soilType: "Soil Type",
      coordinates: "Coordinates",
      ndvi: "NDVI",
      moisture: "Crop moisture",
      lastReading: "Last reading",
      notFound: "Field not found",
      chlorophyll: "Chlorophyll",
      temperature: "Canopy temp",
      moistureSoil: "Soil moisture",
      action: "Suggested action",
      rasterHeader: "Live thermal/spectral map",
      timeline: "Previous passes",
      noTimeline: "No historical readings yet.",
      legendLow: "Low",
      legendHigh: "High",
    },
  } as const

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-emerald-200">...</div>
  }

  if (!field) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/fields">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <p className="text-muted-foreground">{translations[lang].notFound}</p>
      </div>
    )
  }

  const areaFeddan = (() => {
    const feddan = parseMaybeNumber(field.area)
    return feddan != null ? feddan.toFixed(2) : "--"
  })()

  const ndviDisplay = (() => {
    const ndvi =
      metrics?.ndvi?.latest ??
      parseMaybeNumber(field.last_ndvi ?? field.ndvi_score ?? field.last_ndvi_score)
    return ndvi != null ? ndvi.toFixed(2) : "--"
  })()

  const moistureDisplay = (() => {
    const moisture =
      metrics?.moisture?.latest ??
      parseMaybeNumber(field.last_moisture ?? field.moisture_index ?? field.last_moisture_index)
    return moisture != null ? `${moisture.toFixed(1)}%` : "--"
  })()

  const temperatureDisplay = (() => {
    const temp =
      metrics?.temperature?.latest ??
      parseMaybeNumber(field.last_temperature ?? field.temperature_c ?? field.last_temperature_c)
    return temp != null ? `${temp.toFixed(1)}°C` : "--"
  })()

  const chlorophyllDisplay = (() => {
    const chl = metrics?.chlorophyll?.latest
    return chl != null ? chl.toFixed(2) : "--"
  })()

  const farm = field.farm ?? field.farms ?? null

  const ndviTrend = (() => {
    if (metrics?.ndvi?.history?.length) return metrics.ndvi.history
    const base = parseMaybeNumber(field.last_ndvi ?? field.ndvi_score) ?? 0.45
    const clamp = (v: number) => Math.max(0, Math.min(1, v))
    return [base - 0.05, base - 0.02, base, base + 0.02, base + 0.01].map((v) =>
      clamp(Number.isFinite(v) ? Number(v.toFixed(2)) : base),
    )
  })()

  const moistureTrend = (() => {
    const base = parseMaybeNumber(field.last_moisture ?? field.moisture_index) ?? 40
    return [base - 3, base - 1, base, base + 2, base - 2].map((v) =>
      Math.max(0, Number.isFinite(v) ? Number(v.toFixed(1)) : base),
    )
  })()

  const chlorophyllTrend = (() => {
    const base = parseMaybeNumber(metrics?.chlorophyll?.latest) ?? 0.5
    return [base - 0.04, base - 0.02, base, base + 0.02, base + 0.01].map((v) =>
      Math.max(0, Number.isFinite(v) ? Number(v.toFixed(2)) : base),
    )
  })()

  const timelineEntries: MetricTimelineEntry[] = metrics?.timeline ?? []
  const selectedEntry =
    selectedDate && timelineEntries.length
      ? timelineEntries.find((item) => item.date === selectedDate) ?? null
      : null
  const timelineLabels = timelineEntries.map((entry) =>
    formatDateTimeLocale(entry.date, lang === "ar" ? "ar-EG" : "en-US", { dateStyle: "medium" }, "") || entry.date,
  )

  const latNum = parseMaybeNumber(field.latitude)
  const lngNum = parseMaybeNumber(field.longitude)
  const farmLat = parseMaybeNumber((farm as any)?.latitude)
  const farmLng = parseMaybeNumber((farm as any)?.longitude)
  const fieldCenter =
    latNum != null && lngNum != null
      ? ([latNum, lngNum] as [number, number])
      : farmLat != null && farmLng != null
        ? ([farmLat, farmLng] as [number, number])
        : null

  const ndviSeries = ndviTrend.length ? ndviTrend : [0.4, 0.42, 0.41]
  const chlorophyllSeries = chlorophyllTrend.length ? chlorophyllTrend : [0.52, 0.5, 0.48]

  const legendGradientClass =
    activeRaster === "chlorophyll"
      ? "from-amber-200 via-emerald-300 to-emerald-700"
      : "from-emerald-200 via-emerald-400 to-amber-500"

  const selectedRasterUrl =
    selectedEntry?.mapUrl ??
    (activeRaster === "chlorophyll" ? metrics?.chlorophyll?.mapUrl : metrics?.ndvi?.mapUrl) ??
    null
  const rasterForView = selectedRasterUrl ?? FALLBACK_RASTER_TILE

  const recommendedAction = (() => {
    const ndvi = metrics?.ndvi?.latest ?? parseMaybeNumber(field.last_ndvi ?? field.ndvi_score)
    const moisture = metrics?.moisture?.latest ?? parseMaybeNumber(field.last_moisture ?? field.moisture_index)
    const temp = metrics?.temperature?.latest ?? parseMaybeNumber(field.last_temperature ?? field.temperature_c)
    const rainComing =
      metrics?.weather?.history?.some((wx) => {
        const p = parseMaybeNumber(wx.precipitation)
        return p != null && p >= 3
      }) ?? false

    if (moisture != null && moisture < 25 && !rainComing) {
      return lang === "ar"
        ? "ري خلال 24 ساعة بجرعة خفيفة لأن الرطوبة منخفضة ولا توجد أمطار متوقعة."
        : "Irrigate within 24h (light dose). Moisture is low and no rain is expected."
    }
    if (ndvi != null && ndvi < 0.3) {
      return lang === "ar"
        ? "مؤشر NDVI منخفض: راجع صورة القمر الصناعي وحدد بقع الإجهاد، ثم نفّذ ري تصحيحي."
        : "NDVI is low: inspect latest imagery for stressed zones and run a corrective irrigation."
    }
    if (temp != null && temp > 36) {
      return lang === "ar"
        ? "درجات حرارة مرتفعة: جدولة ري مبكر صباحاً أو مساءً لتقليل الإجهاد الحراري."
        : "High canopy temp: schedule irrigation early morning/evening to reduce heat stress."
    }
    if (rainComing) {
      return lang === "ar"
        ? "أمطار متوقعة: أَجّل الري 12–24 ساعة وراقب الرطوبة بعد الهطول."
        : "Rain expected: delay irrigation 12–24h and re-check soil moisture after rainfall."
    }
    return lang === "ar"
      ? "لا تنبيهات حرجة حالياً. تابع المراقبة وحدّث الحدود إذا تغيرت مساحة الحقل."
      : "No critical actions now. Keep monitoring; update the boundary if the field shape changes."
  })()

  const lastReadingDisplay = (() => {
    const ts = field.last_reading_at ?? metrics?.ndvi?.date ?? metrics?.chlorophyll?.date
    if (!ts) return "--"
    return (
      formatDateTimeLocale(ts, lang === "ar" ? "ar-EG" : "en-US", { dateStyle: "short", timeStyle: "short" }, "--") ||
      "--"
    )
  })()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/fields">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-emerald-950">{field.name}</h1>
            <p className="text-emerald-700">{translations[lang].title}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const next = lang === "ar" ? "en" : "ar"
            setLang(next)
          }}
        >
          {lang === "ar" ? "EN" : "ع"}
        </Button>
      </div>

      {/* معلومات أساسية */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 bg-gradient-to-br from-emerald-900/80 via-emerald-900/70 to-amber-900/60 border border-emerald-800/60 shadow-sm">
          <p className="text-xs text-emerald-100/80">{lang === "ar" ? "الحقل" : "Field"}</p>
          <p className="text-xl font-semibold text-emerald-50">{field.name}</p>
          <p className="text-xs text-emerald-100/80">{translations[lang].farm}: {farm?.name ?? "--"}</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-900/80 via-emerald-900/70 to-amber-900/60 border border-emerald-800/60 shadow-sm">
          <p className="text-xs text-emerald-100/80">{translations[lang].area}</p>
          <p className="text-xl font-semibold text-emerald-50">
            {areaFeddan} {lang === "ar" ? "فدان" : "feddans"}
          </p>
          <p className="text-xs text-emerald-100/70 mt-1">{cropLabel ? cropLabel[lang] : field.crop_type || "--"}</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-900/80 via-emerald-900/70 to-amber-900/60 border border-emerald-800/60 shadow-sm">
          <p className="text-xs text-emerald-100/80">{lang === "ar" ? "الموقع" : "Location"}</p>
          <p className="text-sm font-mono text-emerald-50">
            {field.latitude != null && field.longitude != null
              ? `${Number(field.latitude).toFixed(5)}, ${Number(field.longitude).toFixed(5)}`
              : "--"}
          </p>
          {farm?.location && <p className="text-xs text-emerald-100/70 mt-1">{farm.location}</p>}
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-900/80 via-emerald-900/70 to-amber-900/60 border border-emerald-800/60 shadow-sm">
          <p className="text-xs text-emerald-100/80">{translations[lang].soilType}</p>
          <p className="text-lg font-semibold text-emerald-50">{soilLabel ? soilLabel[lang] : field.soil_type || "--"}</p>
          <p className="text-xs text-emerald-100/70 mt-1">
            {translations[lang].lastReading}: {lastReadingDisplay}
          </p>
        </Card>
      </div>

      {/* مؤشرات رئيسية */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 bg-gradient-to-br from-emerald-900/90 via-emerald-900/70 to-amber-900/60 border border-emerald-800/70 shadow-sm">
          <div className="flex items-center justify-between text-sm text-emerald-100/80">
            <span className="flex items-center gap-2 text-emerald-100 font-medium">
              <Leaf className="h-4 w-4" />
              {translations[lang].ndvi}
            </span>
            <span className="text-xs text-emerald-200/70">{translations[lang].lastReading}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-50">{ndviDisplay}</span>
            <span className="text-xs text-emerald-100/80">{lang === "ar" ? "وضع حالي" : "current"}</span>
          </div>
          <div className="mt-3 h-16 rounded-lg bg-emerald-900/60 flex items-center justify-center">
            <svg viewBox="0 0 220 70" className="w-full h-full overflow-visible">
              <path d={sparklinePath(ndviSeries)} fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
              {ndviSeries.map((v, idx) => {
                const width = 180
                const height = 60
                const min = Math.min(...ndviSeries)
                const max = Math.max(...ndviSeries)
                const range = max - min || 1
                const x = 20 + (idx / Math.max(ndviSeries.length - 1, 1)) * width
                const y = 70 - ((v - min) / range) * height
                return <circle key={idx} cx={x} cy={y} r={3} fill="#bbf7d0" />
              })}
            </svg>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-900/90 via-emerald-900/70 to-amber-900/60 border border-emerald-800/70 shadow-sm">
          <div className="flex items-center justify-between text-sm text-emerald-100/80">
            <span className="flex items-center gap-2 text-emerald-100 font-medium">
              <Leaf className="h-4 w-4" />
              {translations[lang].chlorophyll}
            </span>
            <span className="text-xs text-emerald-200/70">{translations[lang].lastReading}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-50">{chlorophyllDisplay}</span>
            <span className="text-xs text-emerald-100/80">{lang === "ar" ? "الكثافة الخضرية" : "canopy density"}</span>
          </div>
          <div className="mt-3 h-16 rounded-lg bg-emerald-900/60 flex items-center justify-center">
            <svg viewBox="0 0 220 70" className="w-full h-full overflow-visible">
              <path
                d={sparklinePath(chlorophyllSeries)}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {chlorophyllSeries.map((v, idx) => {
                const width = 180
                const height = 60
                const min = Math.min(...chlorophyllSeries)
                const max = Math.max(...chlorophyllSeries)
                const range = max - min || 1
                const x = 20 + (idx / Math.max(chlorophyllSeries.length - 1, 1)) * width
                const y = 70 - ((v - min) / range) * height
                return <circle key={idx} cx={x} cy={y} r={3} fill="#fcd34d" />
              })}
            </svg>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-900/90 via-emerald-900/70 to-amber-900/60 border border-emerald-800/70 shadow-sm">
          <div className="flex items-center justify-between text-sm text-emerald-100/80">
            <span className="flex items-center gap-2 text-emerald-100 font-medium">
              <Waves className="h-4 w-4" />
              {translations[lang].moistureSoil}
            </span>
            <span className="text-xs text-emerald-200/70">{translations[lang].lastReading}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-50">{moistureDisplay}</span>
            <span className="text-xs text-emerald-100/80">{lang === "ar" ? "اعتماداً على الأقمار الصناعية" : "satellite inferred"}</span>
          </div>
          <div className="mt-3 h-16 rounded-lg bg-emerald-900/60 flex items-center justify-center">
            <div className="flex items-end gap-1 w-full px-2">
              {moistureTrend.map((v, idx) => (
                <div
                  key={idx}
                  className="flex-1 rounded-full bg-emerald-300/80"
                  style={{ height: `${12 + v * 0.6}px` }}
                />
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-900/90 via-emerald-900/70 to-amber-900/60 border border-emerald-800/70 shadow-sm">
          <div className="flex items-center justify-between text-sm text-emerald-100/80">
            <span className="flex items-center gap-2 text-amber-100 font-medium">
              <ThermometerSun className="h-4 w-4" />
              {translations[lang].temperature}
            </span>
            <span className="text-xs text-emerald-200/70">{translations[lang].lastReading}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-50">{temperatureDisplay}</span>
            {metrics?.weather?.latest?.condition && (
              <span className="text-xs text-emerald-100/80">{metrics.weather.latest.condition}</span>
            )}
          </div>
          <div className="mt-3 h-16 rounded-lg bg-emerald-900/60 flex items-center justify-center">
            <div className="flex items-end gap-1 w-full px-2">
              {[14, 18, 22, 21, 19].map((v, idx) => (
                <div
                  key={idx}
                  className="flex-1 rounded-full bg-amber-300/80"
                  style={{ height: `${v + 20}px` }}
                />
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 bg-gradient-to-br from-emerald-900/90 via-emerald-900/70 to-amber-900/60 border border-emerald-800/70 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-100/90">{lang === "ar" ? "اتجاه NDVI" : "NDVI trend"}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-emerald-50">{ndviDisplay}</span>
                <span className="text-xs text-emerald-200/80">{lang === "ar" ? "آخر قراءة" : "latest"}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-200/80">{translations[lang].lastReading}</p>
              <p className="text-sm font-medium text-emerald-50">{lastReadingDisplay}</p>
            </div>
          </div>
          <div className="mt-4 h-40 rounded-xl bg-gradient-to-b from-emerald-800/60 via-emerald-900/70 to-amber-900/60 border border-emerald-700/60 flex items-center justify-center px-2">
            <svg viewBox="0 0 240 110" className="w-full h-full overflow-visible">
              <path d={sparklinePath(ndviSeries)} fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" />
              {ndviSeries.map((v, idx) => {
                const width = 200
                const height = 80
                const min = Math.min(...ndviSeries)
                const max = Math.max(...ndviSeries)
                const range = max - min || 1
                const x = 20 + (idx / Math.max(ndviSeries.length - 1, 1)) * width
                const y = 100 - ((v - min) / range) * height
                return <circle key={idx} cx={x} cy={y} r={4} fill="#bbf7d0" />
              })}
            </svg>
          </div>
          {timelineEntries.length > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-emerald-100/80">
              {timelineEntries.slice(0, 6).map((entry, idx) => (
                <div key={entry.date} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-300" />
                  <div className="flex-1">
                    <p className="font-medium text-emerald-50">
                      {timelineLabels[idx] ?? entry.date} · {entry.ndvi ?? entry.chlorophyll ?? "--"}
                    </p>
                    {entry.type === "chlorophyll" && (
                      <p className="text-[11px] text-amber-300">
                        {lang === "ar" ? "لقطة كلوروفيل" : "Chlorophyll pass"}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-amber-300">{translations[lang].noTimeline}</p>
          )}
        </Card>

        <Card className="p-5 bg-gradient-to-br from-emerald-900/90 via-emerald-900/70 to-amber-900/60 border border-emerald-800/70 shadow-sm">
          <p className="text-sm text-emerald-100/90">{translations[lang].action}</p>
          <p className="mt-3 text-base text-emerald-50 leading-relaxed">{recommendedAction}</p>
          {metrics?.weather?.latest?.condition && (
            <p className="mt-4 text-[12px] text-amber-200/90">
              {lang === "ar" ? "حالة الطقس الأخيرة: " : "Last weather: "}
              {metrics.weather.latest.condition} · {(metrics.weather.latest.temperature ?? "--") as any}°C ·{" "}
              {metrics.weather.latest.humidity ?? "--"}%
            </p>
          )}
        </Card>
      </div>

      <FieldAnalyticsDashboard
        fieldData={{
          ndvi: metrics?.ndvi?.latest ?? parseMaybeNumber(field.last_ndvi ?? field.ndvi_score),
          chlorophyll: metrics?.chlorophyll?.latest,
          moisture: metrics?.moisture?.latest ?? parseMaybeNumber(field.last_moisture ?? field.moisture_index),
          evi: metrics?.evi?.latest,
          nri: metrics?.nri?.latest,
          dswi: metrics?.dswi?.latest,
          ndwi: metrics?.ndwi?.latest,
        }}
        mapUrls={{
          ndvi: metrics?.ndvi?.mapUrl,
          chlorophyll: metrics?.chlorophyll?.mapUrl,
          moisture: metrics?.soilMoisture?.mapUrl,
          evi: metrics?.evi?.mapUrl,
          nri: metrics?.nri?.mapUrl,
          dswi: metrics?.dswi?.mapUrl,
          ndwi: metrics?.ndwi?.mapUrl,
        }}
        timestamp={metrics?.ndvi?.date || metrics?.chlorophyll?.date || field.last_reading_at}
        lang={lang}
      />

      {/* Map Section */}
      {fieldCenter && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5 text-emerald-600" />
            <span className="text-lg font-semibold text-emerald-950">{lang === "ar" ? "خريطة الحقل" : "Field Map"}</span>
          </div>
          <div className="rounded-xl overflow-hidden border border-emerald-200">
            <SatelliteMap
              fields={[{
                id: field.id,
                name: field.name,
                areaFeddan: parseMaybeNumber(field.area) || 1,
                center: fieldCenter,
                polygon: (field.boundary_coordinates?.type === 'Polygon'
                  ? field.boundary_coordinates.coordinates[0]
                  : [
                    [fieldCenter[1], fieldCenter[0]],
                    [fieldCenter[1] + 0.001, fieldCenter[0]],
                    [fieldCenter[1] + 0.001, fieldCenter[0] + 0.001],
                    [fieldCenter[1], fieldCenter[0] + 0.001]
                  ]) as [number, number][],
                crop: field.crop_type || null,
                health: parseMaybeNumber(field.last_ndvi ?? field.ndvi_score) ?
                  (parseMaybeNumber(field.last_ndvi ?? field.ndvi_score)! * 100) : 50
              }]}
              height={400}
            />
          </div>
        </div>
      )}

      {/* Comparative Analytics */}
      <ComparativeAnalytics
        fieldData={{
          current: {
            ndvi: metrics?.ndvi?.latest ?? parseMaybeNumber(field.last_ndvi ?? field.ndvi_score),
            chlorophyll: metrics?.chlorophyll?.latest,
            moisture: metrics?.moisture?.latest ?? parseMaybeNumber(field.last_moisture ?? field.moisture_index),
            evi: metrics?.evi?.latest,
            nri: metrics?.nri?.latest,
            dswi: metrics?.dswi?.latest,
            ndwi: metrics?.ndwi?.latest,
          },
          historical: metrics?.timeline || [],
          comparison: {
            region_avg: {
              ndvi: 0.6, // Will be calculated from region data
              chlorophyll: 45,
              moisture: 55,
            },
            previous_year: {
              ndvi: 0.55, // Will be fetched from historical data
              chlorophyll: 42,
              moisture: 52,
            },
          },
        }}
        weatherData={{
          current: {
            temperature: metrics?.weather?.latest?.temperature,
            humidity: metrics?.weather?.latest?.humidity,
            precipitation: metrics?.weather?.latest?.precipitation,
            wind_speed: metrics?.weather?.latest?.wind_speed,
          },
          forecast: [], // Will be populated from weather API
        }}
        lang={lang}
      />
    </div>
  )
}
