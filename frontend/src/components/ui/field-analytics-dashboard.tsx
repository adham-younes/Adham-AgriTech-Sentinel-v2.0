"use client"

import { Card } from "@/components/ui/card"
import { AdvancedIndexMap } from "@/components/ui/advanced-index-map"

interface FieldAnalyticsDashboardProps {
  fieldData: {
    ndvi?: number | null
    chlorophyll?: number | null
    moisture?: number | null
    evi?: number | null
    nri?: number | null
    dswi?: number | null
    ndwi?: number | null
  }
  mapUrls?: {
    ndvi?: string | null
    chlorophyll?: string | null
    moisture?: string | null
    evi?: string | null
    nri?: string | null
    dswi?: string | null
    ndwi?: string | null
  }
  timestamp?: string | null
  lang?: "ar" | "en"
}

export function FieldAnalyticsDashboard({
  fieldData,
  mapUrls,
  timestamp,
  lang = "ar"
}: FieldAnalyticsDashboardProps) {
  const primaryIndices = [
    { key: "ndvi", label: lang === "ar" ? "NDVI" : "NDVI", priority: 1 },
    { key: "chlorophyll", label: lang === "ar" ? "الكلوروفيل" : "Chlorophyll", priority: 2 },
    { key: "moisture", label: lang === "ar" ? "رطوبة التربة" : "Soil Moisture", priority: 3 }
  ]

  const advancedIndices = [
    { key: "evi", label: lang === "ar" ? "EVI" : "EVI", priority: 4 },
    { key: "nri", label: lang === "ar" ? "NRI" : "NRI", priority: 5 },
    { key: "dswi", label: lang === "ar" ? "DSWI" : "DSWI", priority: 6 },
    { key: "ndwi", label: lang === "ar" ? "NDWI" : "NDWI", priority: 7 }
  ]

  const getOverallHealthScore = () => {
    const values = [
      fieldData.ndvi,
      fieldData.chlorophyll,
      fieldData.moisture
    ].filter(v => v !== null && v !== undefined) as number[]

    if (values.length === 0) return null

    // Normalize each value to 0-100 scale
    const normalizedValues = values.map(v => {
      if (fieldData.ndvi === v) return ((v + 1) / 2) * 100 // NDVI: -1 to 1
      if (fieldData.chlorophyll === v) return (v / 100) * 100 // Chlorophyll: 0 to 100
      if (fieldData.moisture === v) return v // Moisture: 0 to 100
      return 50
    })

    return normalizedValues.reduce((sum, v) => sum + v, 0) / normalizedValues.length
  }

  const getHealthStatus = (score: number | null) => {
    if (score === null) return lang === "ar" ? "غير متاح" : "N/A"
    if (score >= 80) return lang === "ar" ? "ممتاز" : "Excellent"
    if (score >= 60) return lang === "ar" ? "جيد" : "Good"
    if (score >= 40) return lang === "ar" ? "متوسط" : "Fair"
    if (score >= 20) return lang === "ar" ? "ضعيف" : "Poor"
    return lang === "ar" ? "سيء جداً" : "Very Poor"
  }

  const getHealthColor = (score: number | null) => {
    if (score === null) return "text-gray-500"
    if (score >= 80) return "text-emerald-600"
    if (score >= 60) return "text-green-600"
    if (score >= 40) return "text-yellow-600"
    if (score >= 20) return "text-orange-600"
    return "text-red-600"
  }

  const healthScore = getOverallHealthScore()

  return (
    <div className="space-y-6">
      {/* Overall Health Score */}
      <Card className="p-6 glass-card border-emerald-500/20 bg-black/40 backdrop-blur-xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            {lang === "ar" ? "نقطة صحة الحقل الإجمالية" : "Overall Field Health Score"}
          </h2>
          <div className={`text-5xl font-bold ${getHealthColor(healthScore)} mb-2 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]`}>
            {healthScore !== null ? `${Math.round(healthScore)}%` : "--"}
          </div>
          <div className={`text-lg font-medium ${getHealthColor(healthScore)}`}>
            {getHealthStatus(healthScore)}
          </div>
          {timestamp && (
            <div className="text-sm text-gray-400 mt-2">
              {lang === "ar" ? "آخر تحديث:" : "Last updated:"}{" "}
              {new Date(timestamp).toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}
            </div>
          )}
        </div>
      </Card>

      {/* Primary Indices */}
      <div>
        <h3 className="text-xl font-semibold text-emerald-50 mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
          {lang === "ar" ? "المؤشرات الأساسية" : "Primary Indices"}
        </h3>
        <div className="grid gap-4 lg:grid-cols-3">
          {primaryIndices.map(({ key, label }) => (
            <div key={key} className="glass-card border-emerald-500/10 bg-black/20 backdrop-blur-md rounded-xl overflow-hidden">
              <AdvancedIndexMap
                index={key as any}
                value={fieldData[key as keyof typeof fieldData]}
                mapUrl={mapUrls?.[key as keyof typeof mapUrls]}
                timestamp={timestamp}
                width={350}
                height={200}
                showLegend={true}
                showStats={true}
                lang={lang}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Indices */}
      <div>
        <h3 className="text-xl font-semibold text-emerald-50 mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"></span>
          {lang === "ar" ? "المؤشرات المتقدمة" : "Advanced Indices"}
        </h3>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {advancedIndices.map(({ key, label }) => (
            <div key={key} className="glass-card border-emerald-500/10 bg-black/20 backdrop-blur-md rounded-xl overflow-hidden">
              <AdvancedIndexMap
                index={key as any}
                value={fieldData[key as keyof typeof fieldData]}
                mapUrl={mapUrls?.[key as keyof typeof mapUrls]}
                timestamp={timestamp}
                width={280}
                height={180}
                showLegend={true}
                showStats={false}
                lang={lang}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Summary */}
      <Card className="p-4 glass-card border-emerald-500/20 bg-black/40 backdrop-blur-xl">
        <h3 className="text-lg font-semibold text-white mb-3">
          {lang === "ar" ? "ملخص سريع" : "Quick Summary"}
        </h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {primaryIndices.map(({ key, label }) => {
            const value = fieldData[key as keyof typeof fieldData]
            const status = key === "ndvi"
              ? (value && value > 0.6 ? lang === "ar" ? "ممتاز" : "Excellent" :
                value && value > 0.4 ? lang === "ar" ? "جيد" : "Good" :
                  value && value > 0.2 ? lang === "ar" ? "متوسط" : "Fair" :
                    lang === "ar" ? "ضعيف" : "Poor")
              : key === "chlorophyll"
                ? (value && value > 60 ? lang === "ar" ? "عالي" : "High" :
                  value && value > 40 ? lang === "ar" ? "متوسط" : "Medium" :
                    lang === "ar" ? "منخفض" : "Low")
                : key === "moisture"
                  ? (value && value > 60 ? lang === "ar" ? "رطبة" : "Moist" :
                    value && value > 30 ? lang === "ar" ? "طبيعية" : "Normal" :
                      lang === "ar" ? "جافة" : "Dry")
                  : lang === "ar" ? "غير متاح" : "N/A"

            return (
              <div key={key} className="bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="text-sm text-gray-400">{label}</div>
                <div className="text-lg font-semibold text-white">
                  {value !== null && value !== undefined ? value.toFixed(2) : "--"}
                </div>
                <div className="text-xs text-emerald-400">{status}</div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
