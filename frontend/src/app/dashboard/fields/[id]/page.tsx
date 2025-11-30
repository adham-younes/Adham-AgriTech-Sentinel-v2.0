"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Droplets, Leaf, Wind, ThermometerSun, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { FieldAnalyticsDashboard } from "@/components/ui/field-analytics-dashboard"
import { ComparativeAnalytics } from "@/components/ui/comparative-analytics"
import { SoilAnalysisCard } from "@/components/ui/soil-analysis-card"
import { IrrigationPlanCard } from "@/components/ui/irrigation-plan-card"
import { UnifiedEOSDAMap } from "@/components/maps/unified-eosda-map"


const translations = {
  ar: {
    title: "تفاصيل الحقل",
    farm: "المزرعة",
    area: "المساحة",
    feddans: "فدان",
    soilType: "نوع التربة",
    lastReading: "آخر قراءة",
    fieldHealth: "صحة الحقل",
    mildConditions: "ظروف معتدلة",
    viewDetails: "عرض التفاصيل",
    irrigationAlert: "تنبيه: الحقل بحاجة تدخل فوري",
    loading: "جاري التحميل...",
  },
  en: {
    title: "Field Details",
    farm: "Farm",
    area: "Area",
    feddans: "feddans",
    soilType: "Soil Type",
    lastReading: "Last Reading",
    fieldHealth: "Field Health",
    mildConditions: "Mild conditions",
    viewDetails: "View Details",
    irrigationAlert: "Alert: Field requires immediate intervention",
    loading: "Loading...",
  }
}

type Lang = "ar" | "en"

function parseMaybeNumber(val: any): number | null {
  if (val == null) return null
  const num = Number(val)
  return Number.isFinite(num) ? num : null
}

export default function FieldDetailsPage() {
  const params = useParams()
  const fieldId = params?.id as string
  const [lang, setLang] = useState<Lang>("ar")
  const [field, setField] = useState<any>(null)
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFieldData = async () => {
      if (!fieldId) return

      const supabase = createClient()

      // Fetch field data
      const { data: fieldData, error: fieldError } = await supabase
        .from("fields")
        .select(`
          *,
          farms (
            id,
            name,
            location
          )
        `)
        .eq("id", fieldId)
        .single()

      if (fieldError) {
        console.error("Error loading field:", fieldError)
        setLoading(false)
        return
      }

      setField(fieldData)

      // Fetch latest analytics
      const { data: analyticsData } = await supabase
        .from("field_analytics")
        .select("*")
        .eq("field_id", fieldId)
        .order("date", { ascending: false })
        .limit(1)
        .single()

      setMetrics(analyticsData)
      setLoading(false)
    }

    loadFieldData()
  }, [fieldId])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-emerald-400 text-lg">{translations[lang].loading}</div>
      </div>
    )
  }

  if (!field) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-400 text-lg">Field not found</div>
      </div>
    )
  }

  // Calculate values
  const ndvi = parseMaybeNumber(metrics?.ndvi ?? field.last_ndvi ?? field.ndvi_score) ?? -0.18
  const dswi = parseMaybeNumber(metrics?.dswi ?? 0.0)
  const moisture = parseMaybeNumber(metrics?.moisture ?? field.last_moisture ?? field.moisture_index)
  const evi = parseMaybeNumber(metrics?.evi ?? 0.0)
  const chlorophyll = parseMaybeNumber(metrics?.chlorophyll ?? 0.01)

  // Calculate health percentage (based on NDVI primarily)
  const healthPercentage = Math.max(0, Math.min(100, Math.round(((ndvi + 1) / 2) * 100)))

  // Weather data
  const temperature = parseMaybeNumber(field.last_temperature ?? 20.6)
  const humidity = parseMaybeNumber(field.last_humidity ?? 51)

  // Farm info
  const farm = field.farms ?? field.farm
  const farmName = farm?.name ?? "adham"

  // Area calculation
  const areaM2 = parseMaybeNumber(field.area_m2)
  const areaFeddan = areaM2 ? (areaM2 / 4200).toFixed(2) : "4.20"

  // Crop and soil
  const cropName = field.crop_type ?? "طماطم"
  const soilType = field.soil_type ?? "طينية"

  // Last reading
  const lastReading = formatDate(metrics?.date ?? field.last_reading_at, lang)

  // Get trend indicator
  const getTrendIcon = (value: number | null, threshold: number) => {
    if (value === null) return <Minus className="h-3 w-3" />
    if (value > threshold) return <TrendingUp className="h-3 w-3 text-emerald-400" />
    if (value < threshold) return <TrendingDown className="h-3 w-3 text-red-400" />
    return <Minus className="h-3 w-3 text-gray-400" />
  }

  // Prepare data for child components
  const fieldAnalyticsData = {
    ndvi: metrics?.ndvi,
    chlorophyll: metrics?.chlorophyll,
    moisture: metrics?.moisture,
    evi: metrics?.evi,
    nri: metrics?.nri,
    dswi: metrics?.dswi,
    ndwi: metrics?.ndwi
  }

  const comparativeData = {
    current: fieldAnalyticsData,
    historical: [], // Placeholder for historical data
    comparison: undefined
  }

  // Calculate field center from boundary if available
  const fieldCenter = field.boundary_coordinates?.coordinates?.[0]?.[0]
    ? ([field.boundary_coordinates.coordinates[0][0][1], field.boundary_coordinates.coordinates[0][0][0]] as [number, number])
    : undefined

  return (
    <div className="min-h-screen bg-black p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/fields">
              <Button
                variant="ghost"
                size="icon"
                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">{translations[lang].title}</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          >
            {lang === "ar" ? "EN" : "ع"}
          </Button>
        </div>
      </div>

      {/* Main Field Card */}
      <div className="max-w-7xl mx-auto">
        <Card className="bg-black/60 border-emerald-400/40 backdrop-blur-xl shadow-[0_0_24px_rgba(16,185,129,0.15)] overflow-hidden">
          <div className="p-8">
            {/* Field Number Circle + Basic Info */}
            <div className="flex items-start gap-6 mb-8">
              {/* Circular Field Number */}
              <div className="flex-shrink-0">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center border-2 border-emerald-400"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 78, 59, 0.2))'
                  }}
                >
                  <div className="text-4xl font-bold text-white">{field.name}</div>
                </div>
              </div>

              {/* Field Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    {cropName}
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">{field.name}</h2>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-emerald-400" />
                    {translations[lang].farm}: <span className="text-white font-medium">{farmName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{translations[lang].area}:</span>
                    <span className="text-white font-medium">{areaFeddan} {translations[lang].feddans}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{translations[lang].soilType}:</span>
                    <span className="text-white font-medium">{soilType}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {translations[lang].lastReading}: {lastReading}
                </div>
              </div>
            </div>

            {/* 4-Column Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* DSWI */}
              <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="text-xs text-gray-400 uppercase mb-1">DSWI</div>
                <div className="text-2xl font-bold text-white mb-1">{dswi?.toFixed(2) ?? "0.00"}</div>
                <div className="flex items-center justify-center">
                  {getTrendIcon(dswi, 0.5)}
                </div>
              </div>

              {/* Moisture */}
              <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="text-xs text-gray-400 uppercase mb-1">{lang === "ar" ? "الرطوبة" : "Moisture"}</div>
                <div className="text-2xl font-bold text-white mb-1">{moisture ? `${moisture.toFixed(1)}%` : "--"}</div>
                <div className="flex items-center justify-center">
                  {getTrendIcon(moisture, 40)}
                </div>
              </div>

              {/* EVI */}
              <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="text-xs text-gray-400 uppercase mb-1">EVI</div>
                <div className="text-2xl font-bold text-white mb-1">{evi?.toFixed(2) ?? "0.00"}</div>
                <div className="flex items-center justify-center">
                  {getTrendIcon(evi, 0.3)}
                </div>
              </div>

              {/* NDVI */}
              <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="text-xs text-gray-400 uppercase mb-1">NDVI</div>
                <div className="text-2xl font-bold text-white mb-1">{ndvi.toFixed(2)}</div>
                <div className="flex items-center justify-center">
                  {getTrendIcon(ndvi, 0.4)}
                </div>
              </div>
            </div>

            {/* Health Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">{translations[lang].fieldHealth}</span>
                <span className="text-lg font-bold text-emerald-400">{healthPercentage}%</span>
              </div>
              <Progress
                value={healthPercentage}
                className="h-2 bg-gray-800"
                style={{
                  ['--progress-background' as any]: 'linear-gradient(90deg, rgb(16 185 129), rgb(52 211 153))'
                }}
              />
            </div>

            {/* Weather Info Row */}
            <div className="flex items-center gap-6 text-sm text-gray-300 mb-6">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-400" />
                <span>{humidity}%</span>
              </div>
              <div className="flex items-center gap-2">
                <ThermometerSun className="h-4 w-4 text-orange-400" />
                <span>{temperature}°C</span>
              </div>
            </div>

            {/* Action Button */}
            <button className="w-full py-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-400 hover:bg-emerald-500/30 transition-colors">
              {translations[lang].viewDetails}
            </button>
          </div>
        </Card>

        {/* Additional Sections */}
        <div className="mt-8 space-y-6 max-w-7xl mx-auto">
          {/* Field Analytics Dashboard */}
          <FieldAnalyticsDashboard
            fieldData={fieldAnalyticsData}
            timestamp={metrics?.date}
            lang={lang}
          />

          {/* Comparative Analytics */}
          <ComparativeAnalytics
            fieldData={comparativeData}
            lang={lang}
          />

          <div className="grid md:grid-cols-2 gap-6">
            {/* Soil Analysis Card */}
            <SoilAnalysisCard
              analysis={metrics?.soil_analysis}
              lang={lang}
            />

            {/* Irrigation Plan Card */}
            <IrrigationPlanCard
              plan={metrics?.irrigation_plan}
              loading={false}
              lang={lang}
            />
          </div>

          {/* Map Section */}
          <div className="rounded-2xl overflow-hidden border border-emerald-500/20 shadow-2xl shadow-emerald-900/20">
            <UnifiedEOSDAMap
              fieldId={fieldId}
              fieldName={field.name}
              coordinates={field.boundary_coordinates?.coordinates?.[0]}
              center={fieldCenter}
              zoom={14}
              height="500px"
              showLayerControls={true}
              lang={lang}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string | null | undefined, lang: "ar" | "en"): string {
  if (!dateStr) return "--"
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  } catch {
    return "--"
  }
}
