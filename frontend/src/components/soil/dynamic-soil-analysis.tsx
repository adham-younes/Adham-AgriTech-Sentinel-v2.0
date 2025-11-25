"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, RefreshCw, TrendingUp, TrendingDown, Minus, Droplets, Thermometer, Activity } from "lucide-react"
import { useTranslation } from "@/lib/i18n/use-language"

interface SoilMetrics {
  nitrogen: { value: number; status: "low" | "optimal" | "high"; trend: "up" | "down" | "stable" }
  phosphorus: { value: number; status: "low" | "optimal" | "high"; trend: "up" | "down" | "stable" }
  potassium: { value: number; status: "low" | "optimal" | "high"; trend: "up" | "down" | "stable" }
  ph: { value: number; status: "acidic" | "optimal" | "alkaline"; trend: "up" | "down" | "stable" }
  moisture: { value: number; status: "dry" | "optimal" | "wet"; trend: "up" | "down" | "stable" }
  organic_matter: { value: number; status: "low" | "optimal" | "high"; trend: "up" | "down" | "stable" }
  temperature: { value: number; status: "cold" | "optimal" | "hot"; trend: "up" | "down" | "stable" }
  conductivity: { value: number; status: "low" | "optimal" | "high"; trend: "up" | "down" | "stable" }
}

interface Recommendations {
  nitrogen: string[]
  phosphorus: string[]
  potassium: string[]
  ph: string[]
  moisture: string[]
  overall: string[]
}

interface DynamicSoilAnalysis {
  fieldId: string
  fieldName: string
  location: { latitude: number; longitude: number }
  timestamp: string
  metrics: SoilMetrics
  satelliteData: {
    ndvi: number | null
    ndmi: number | null
    evi: number | null
    lastUpdated: string | null
  }
  recommendations: Recommendations
  healthScore: number
  trendAnalysis: {
    improving: string[]
    declining: string[]
    stable: string[]
  }
}

interface DynamicSoilAnalysisProps {
  fieldId?: string
  latitude?: number
  longitude?: number
  fieldName?: string
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "optimal":
    case "good":
      return "bg-emerald-500"
    case "low":
    case "dry":
    case "cold":
    case "acidic":
      return "bg-amber-500"
    case "high":
    case "wet":
    case "hot":
    case "alkaline":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

const getStatusText = (status: string, lang: "ar" | "en") => {
  const translations = {
    ar: {
      low: "منخفض",
      optimal: "مثالي",
      high: "مرتفع",
      dry: "جاف",
      wet: "رطب",
      cold: "بارد",
      hot: "حار",
      acidic: "حمضي",
      alkaline: "قاعدي",
      stable: "مستقر",
      up: "تحسن",
      down: "تراجع"
    },
    en: {
      low: "Low",
      optimal: "Optimal",
      high: "High",
      dry: "Dry",
      wet: "Wet",
      cold: "Cold",
      hot: "Hot",
      acidic: "Acidic",
      alkaline: "Alkaline",
      stable: "Stable",
      up: "Improving",
      down: "Declining"
    }
  }
  return translations[lang][status as keyof typeof translations[typeof lang]] || status
}

const getMetricIcon = (metric: string) => {
  switch (metric) {
    case "moisture":
      return <Droplets className="h-4 w-4" />
    case "temperature":
      return <Thermometer className="h-4 w-4" />
    default:
      return <Activity className="h-4 w-4" />
  }
}

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-3 w-3 text-green-400" />
    case "down":
      return <TrendingDown className="h-3 w-3 text-red-400" />
    default:
      return <Minus className="h-3 w-3 text-gray-400" />
  }
}

export function DynamicSoilAnalysis({ fieldId, latitude, longitude, fieldName }: DynamicSoilAnalysisProps) {
  const { language } = useTranslation()
  const lang = language === "en" ? "en" : "ar"
  const [analysis, setAnalysis] = useState<DynamicSoilAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalysis = async () => {
    if (!fieldId && (!latitude || !longitude)) {
      setError(lang === "ar" ? "مطلوب معرف الحقل أو الإحداثيات" : "Field ID or coordinates required")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/soil-analysis/dynamic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fieldId,
          latitude,
          longitude,
          includeHistorical: true
        }),
      })

      if (!response.ok) {
        throw new Error(lang === "ar" ? "فشل تحليل التربة" : "Soil analysis failed")
      }

      const data = await response.json()
      setAnalysis(data.analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : lang === "ar" ? "خطأ غير معروف" : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalysis()
  }, [fieldId, latitude, longitude])

  if (loading) {
    return (
      <Card className="bg-black border-emerald-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            <span className="mr-2 text-emerald-300">
              {lang === "ar" ? "جاري تحليل التربة..." : "Analyzing soil..."}
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-black border-red-500/20">
        <CardContent className="p-6">
          <Alert className="bg-red-900/20 border-red-500/50">
            <AlertDescription className="text-red-300">
              {error}
            </AlertDescription>
          </Alert>
          <Button onClick={fetchAnalysis} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            {lang === "ar" ? "إعادة المحاولة" : "Retry"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-black border-emerald-500/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-emerald-300">
            {lang === "ar" ? "تحليل التربة الديناميكي" : "Dynamic Soil Analysis"}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/50">
              {analysis.fieldName}
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">
              {lang === "ar" ? "مؤشر الصحة" : "Health Score"}: {analysis.healthScore}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">
                {lang === "ar" ? "آخر تحديث" : "Last updated"}: {new Date(analysis.timestamp).toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}
              </p>
              {analysis.satelliteData.ndvi && (
                <p className="text-white/70 text-sm">
                  NDVI: {analysis.satelliteData.ndvi.toFixed(3)}
                </p>
              )}
            </div>
            <Button onClick={fetchAnalysis} size="sm" variant="outline" className="border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10">
              <RefreshCw className="h-4 w-4 mr-2" />
              {lang === "ar" ? "تحديث" : "Refresh"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Soil Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(analysis.metrics).map(([key, metric]) => (
          <Card key={key} className="bg-black border-emerald-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getMetricIcon(key)}
                  <span className="text-white/70 text-sm capitalize">
                    {key === "soil_ph" ? "pH" : key.replace(/_/g, " ")}
                  </span>
                  {getTrendIcon(metric.trend)}
                </div>
                <Badge className={`${getStatusColor(metric.status)} text-white`}>
                  {getStatusText(metric.status, lang)}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-emerald-300 mb-2">
                {metric.value.toFixed(1)}
                {key === "ph" ? "" : key === "moisture" || key === "organic_matter" ? "%" : " mg/kg"}
              </div>
              <Progress 
                value={metric.status === "optimal" ? 100 : metric.status === "low" ? 30 : 70} 
                className="h-2 bg-gray-800"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recommendations */}
      <Card className="bg-black border-emerald-500/20">
        <CardHeader>
          <CardTitle className="text-emerald-300">
            {lang === "ar" ? "التوصيات" : "Recommendations"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysis.recommendations.overall.length > 0 && (
            <div>
              <h4 className="text-white font-medium mb-2">
                {lang === "ar" ? "التوصيات العامة" : "Overall Recommendations"}
              </h4>
              <ul className="space-y-1">
                {analysis.recommendations.overall.map((rec: string, index: number) => (
                  <li key={index} className="text-white/70 text-sm flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(analysis.recommendations).map(([category, recs]) => (
              category !== "overall" && recs.length > 0 && (
                <div key={category}>
                  <h4 className="text-white font-medium mb-2 capitalize">
                    {category === "ph" ? "pH" : category}
                  </h4>
                  <ul className="space-y-1">
                    {recs.map((rec, index) => (
                      <li key={index} className="text-white/70 text-sm flex items-start">
                        <span className="text-emerald-400 mr-2">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trend Analysis */}
      <Card className="bg-black border-emerald-500/20">
        <CardHeader>
          <CardTitle className="text-emerald-300">
            {lang === "ar" ? "تحليل الاتجاهات" : "Trend Analysis"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-green-400 font-medium mb-2">
                {lang === "ar" ? "متحسن" : "Improving"}
              </h4>
              <div className="space-y-1">
                {analysis.trendAnalysis.improving.map((metric, index) => (
                  <div key={index} className="text-white/70 text-sm capitalize">
                    {metric.replace(/_/g, " ")}
                  </div>
                ))}
                {analysis.trendAnalysis.improving.length === 0 && (
                  <div className="text-white/50 text-sm italic">
                    {lang === "ar" ? "لا يوجد" : "None"}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-red-400 font-medium mb-2">
                {lang === "ar" ? "تراجع" : "Declining"}
              </h4>
              <div className="space-y-1">
                {analysis.trendAnalysis.declining.map((metric, index) => (
                  <div key={index} className="text-white/70 text-sm capitalize">
                    {metric.replace(/_/g, " ")}
                  </div>
                ))}
                {analysis.trendAnalysis.declining.length === 0 && (
                  <div className="text-white/50 text-sm italic">
                    {lang === "ar" ? "لا يوجد" : "None"}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-gray-400 font-medium mb-2">
                {lang === "ar" ? "مستقر" : "Stable"}
              </h4>
              <div className="space-y-1">
                {analysis.trendAnalysis.stable.map((metric, index) => (
                  <div key={index} className="text-white/70 text-sm capitalize">
                    {metric.replace(/_/g, " ")}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
