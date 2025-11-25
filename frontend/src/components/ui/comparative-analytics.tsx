"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Droplets, 
  Sun, 
  Wind,
  Calendar,
  MapPin,
  Activity
} from "lucide-react"

interface ComparativeAnalyticsProps {
  fieldData: {
    current: {
      ndvi?: number | null
      chlorophyll?: number | null
      moisture?: number | null
      evi?: number | null
      nri?: number | null
      dswi?: number | null
      ndwi?: number | null
    }
    historical: Array<{
      date: string
      ndvi?: number | null
      chlorophyll?: number | null
      moisture?: number | null
      evi?: number | null
      nri?: number | null
      dswi?: number | null
      ndwi?: number | null
    }>
    comparison?: {
      region_avg: {
        ndvi?: number | null
        chlorophyll?: number | null
        moisture?: number | null
      }
      previous_year: {
        ndvi?: number | null
        chlorophyll?: number | null
        moisture?: number | null
      }
    }
  }
  weatherData?: {
    current: {
      temperature?: number | null
      humidity?: number | null
      precipitation?: number | null
      wind_speed?: number | null
    }
    forecast: Array<{
      date: string
      temperature?: number | null
      precipitation?: number | null
      condition?: string
    }>
  }
  lang?: "ar" | "en"
}

export function ComparativeAnalytics({
  fieldData,
  weatherData,
  lang = "ar"
}: ComparativeAnalyticsProps) {
  const t = {
    ar: {
      title: "التحليل المقارن المتقدم",
      overview: "نظرة عامة",
      trends: "الاتجاهات الزمنية",
      comparison: "المقارنات",
      recommendations: "التوصيات",
      healthScore: "نقطة الصحة",
      performance: "الأداء",
      vsRegion: "مقابل المنطقة",
      vsLastYear: "مقابل العام الماضي",
      excellent: "ممتاز",
      good: "جيد",
      fair: "متوسط",
      poor: "ضعيف",
      improving: "تحسن",
      declining: "تراجع",
      stable: "مستقر",
      ndvi: "NDVI",
      chlorophyll: "الكلوروفيل",
      moisture: "الرطوبة",
      temperature: "درجة الحرارة",
      precipitation: "الأمطار",
      insights: "رؤى تحليلية",
      alerts: "التنبيهات",
      weatherImpact: "تأثير الطقس",
      growthPotential: "إمكانية النمو",
      irrigationNeeds: "احتياجات الري",
      diseaseRisk: "مخاطر الأمراض"
    },
    en: {
      title: "Advanced Comparative Analytics",
      overview: "Overview",
      trends: "Temporal Trends",
      comparison: "Comparisons",
      recommendations: "Recommendations",
      healthScore: "Health Score",
      performance: "Performance",
      vsRegion: "vs Region Average",
      vsLastYear: "vs Last Year",
      excellent: "Excellent",
      good: "Good",
      fair: "Fair",
      poor: "Poor",
      improving: "Improving",
      declining: "Declining",
      stable: "Stable",
      ndvi: "NDVI",
      chlorophyll: "Chlorophyll",
      moisture: "Moisture",
      temperature: "Temperature",
      precipitation: "Precipitation",
      insights: "Analytical Insights",
      alerts: "Alerts",
      weatherImpact: "Weather Impact",
      growthPotential: "Growth Potential",
      irrigationNeeds: "Irrigation Needs",
      diseaseRisk: "Disease Risk"
    }
  }

  const translations = t[lang]

  // Calculate health score
  const calculateHealthScore = () => {
    const values = [
      fieldData.current.ndvi,
      fieldData.current.chlorophyll,
      fieldData.current.moisture
    ].filter(v => v !== null && v !== undefined) as number[]

    if (values.length === 0) return 0

    const normalizedValues = values.map(v => {
      if (fieldData.current.ndvi === v) return ((v + 1) / 2) * 100
      if (fieldData.current.chlorophyll === v) return (v / 100) * 100
      return v
    })

    return normalizedValues.reduce((sum, v) => sum + v, 0) / normalizedValues.length
  }

  const getTrendDirection = (current: number | null | undefined, historical: number[]) => {
    if (!current || historical.length < 2) return "stable"
    
    const recent = historical.slice(-3)
    const avg = recent.reduce((sum, v) => sum + v, 0) / recent.length
    const diff = current - avg
    
    if (diff > 0.05) return "improving"
    if (diff < -0.05) return "declining"
    return "stable"
  }

  const getPerformanceLevel = (score: number) => {
    if (score >= 80) return { level: "excellent", color: "text-emerald-600", bg: "bg-emerald-100" }
    if (score >= 60) return { level: "good", color: "text-green-600", bg: "bg-green-100" }
    if (score >= 40) return { level: "fair", color: "text-yellow-600", bg: "bg-yellow-100" }
    return { level: "poor", color: "text-red-600", bg: "bg-red-100" }
  }

  const healthScore = calculateHealthScore()
  const performance = getPerformanceLevel(healthScore)

  // Prepare chart data
  const chartData = fieldData.historical.map((entry, index) => ({
    date: new Date(entry.date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { 
      month: "short", 
      day: "numeric" 
    }),
    ndvi: entry.ndvi,
    chlorophyll: entry.chlorophyll,
    moisture: entry.moisture,
    evi: entry.evi,
    nri: entry.nri,
    dswi: entry.dswi,
    ndwi: entry.ndwi
  }))

  // Generate insights
  const generateInsights = () => {
    const insights = []
    
    if (fieldData.current.ndvi && fieldData.current.ndvi > 0.7) {
      insights.push({
        type: "success",
        icon: CheckCircle,
        message: lang === "ar" 
          ? "NDVI مرتفع يدل على صحة النبات الممتازة" 
          : "High NDVI indicates excellent plant health"
      })
    }

    if (fieldData.current.moisture && fieldData.current.moisture < 30) {
      insights.push({
        type: "warning",
        icon: AlertTriangle,
        message: lang === "ar" 
          ? "رطوبة التربة منخفضة - قد تحتاج إلى ري" 
          : "Low soil moisture - irrigation may be needed"
      })
    }

    if (weatherData?.current.temperature && weatherData.current.temperature > 35) {
      insights.push({
        type: "warning",
        icon: Sun,
        message: lang === "ar" 
          ? "درجات حرارة مرتفعة - راقب الإجهاد الحراري" 
          : "High temperatures - monitor for heat stress"
      })
    }

    return insights
  }

  const insights = generateInsights()

  return (
    <div className="space-y-6">
      {/* Header with Health Score */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-emerald-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {translations.title}
            </h2>
            <p className="text-gray-600">
              {lang === "ar" 
                ? "تحليل شامل لأداء الحقل ومقارناته" 
                : "Comprehensive field performance analysis and comparisons"}
            </p>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold ${performance.color} mb-1`}>
              {Math.round(healthScore)}%
            </div>
            <Badge className={`${performance.bg} ${performance.color} border-0`}>
              {translations[performance.level as keyof typeof translations]}
            </Badge>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{translations.overview}</TabsTrigger>
          <TabsTrigger value="trends">{translations.trends}</TabsTrigger>
          <TabsTrigger value="comparison">{translations.comparison}</TabsTrigger>
          <TabsTrigger value="recommendations">{translations.recommendations}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium text-gray-700">{translations.healthScore}</span>
              </div>
              <div className={`text-2xl font-bold ${performance.color}`}>
                {Math.round(healthScore)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {translations[performance.level as keyof typeof translations]}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">{translations.ndvi}</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {fieldData.current.ndvi?.toFixed(2) ?? "--"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {translations[getTrendDirection(fieldData.current.ndvi, fieldData.historical.map(h => h.ndvi).filter(Boolean) as number[])]}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="h-5 w-5 text-cyan-600" />
                <span className="text-sm font-medium text-gray-700">{translations.moisture}</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {fieldData.current.moisture?.toFixed(1) ?? "--"}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {fieldData.current.moisture && fieldData.current.moisture < 30 
                  ? lang === "ar" ? "منخفضة" : "Low"
                  : lang === "ar" ? "مناسبة" : "Adequate"}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sun className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">{translations.temperature}</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {weatherData?.current.temperature?.toFixed(1) ?? "--"}°C
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {weatherData?.current.humidity ? `${weatherData.current.humidity}% RH` : "--"}
              </div>
            </Card>
          </div>

          {/* Insights */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Info className="h-5 w-5" />
              {translations.insights}
            </h3>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <Alert key={index} className={`border-l-4 ${
                  insight.type === "success" ? "border-l-emerald-500 bg-emerald-50" : "border-l-amber-500 bg-amber-50"
                }`}>
                  <insight.icon className={`h-4 w-4 ${
                    insight.type === "success" ? "text-emerald-600" : "text-amber-600"
                  }`} />
                  <AlertDescription className="text-sm">
                    {insight.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {lang === "ar" ? "اتجاهات المؤشرات الزمنية" : "Index Trends Over Time"}
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="ndvi" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="chlorophyll" stroke="#f59e0b" strokeWidth={2} />
                  <Line type="monotone" dataKey="moisture" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {lang === "ar" ? "المؤشرات المتقدمة" : "Advanced Indices"}
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="evi" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="nri" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="dswi" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="ndwi" stackId="1" stroke="#84cc16" fill="#84cc16" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {translations.vsRegion}
              </h3>
              <div className="space-y-4">
                {[
                  { key: "ndvi", label: translations.ndvi, current: fieldData.current.ndvi, avg: fieldData.comparison?.region_avg.ndvi },
                  { key: "chlorophyll", label: translations.chlorophyll, current: fieldData.current.chlorophyll, avg: fieldData.comparison?.region_avg.chlorophyll },
                  { key: "moisture", label: translations.moisture, current: fieldData.current.moisture, avg: fieldData.comparison?.region_avg.moisture }
                ].map(({ key, label, current, avg }) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{label}</span>
                      <span>
                        {current?.toFixed(2) ?? "--"} vs {avg?.toFixed(2) ?? "--"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full" 
                        style={{ width: `${current && avg ? (current / Math.max(current, avg)) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {translations.vsLastYear}
              </h3>
              <div className="space-y-4">
                {[
                  { key: "ndvi", label: translations.ndvi, current: fieldData.current.ndvi, prev: fieldData.comparison?.previous_year.ndvi },
                  { key: "chlorophyll", label: translations.chlorophyll, current: fieldData.current.chlorophyll, prev: fieldData.comparison?.previous_year.chlorophyll },
                  { key: "moisture", label: translations.moisture, current: fieldData.current.moisture, prev: fieldData.comparison?.previous_year.moisture }
                ].map(({ key, label, current, prev }) => {
                  const change = current && prev ? ((current - prev) / prev) * 100 : 0
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{label}</span>
                        <span className={change >= 0 ? "text-green-600" : "text-red-600"}>
                          {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${change >= 0 ? "bg-green-500" : "bg-red-500"}`}
                          style={{ width: `${Math.min(Math.abs(change), 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-600" />
                {translations.irrigationNeeds}
              </h3>
              <div className="space-y-3">
                <Alert className="border-blue-200 bg-blue-50">
                  <Droplets className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    {fieldData.current.moisture && fieldData.current.moisture < 30
                      ? lang === "ar" 
                        ? "الري الفوري مطلوب. رطوبة التربة منخفضة جداً."
                        : "Immediate irrigation required. Soil moisture is very low."
                      : fieldData.current.moisture && fieldData.current.moisture < 50
                      ? lang === "ar"
                        ? "ري خفيف موصى به خلال 24-48 ساعة."
                        : "Light irrigation recommended within 24-48 hours."
                      : lang === "ar"
                        ? "مستويات الرطوبة كافية. لا حاجة للري حالياً."
                        : "Moisture levels are adequate. No irrigation needed currently."
                    }
                  </AlertDescription>
                </Alert>
                
                {weatherData?.forecast && weatherData.forecast.slice(0, 3).map((day, index) => (
                  <div key={index} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                    <span>{new Date(day.date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { weekday: "short" })}</span>
                    <span>{day.temperature?.toFixed(1)}°C, {day.precipitation?.toFixed(1) || 0}mm</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                {translations.diseaseRisk}
              </h3>
              <div className="space-y-3">
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription>
                    {fieldData.current.ndvi && fieldData.current.ndvi < 0.3
                      ? lang === "ar"
                        ? "مخاطر عالية للأمراض الفطرية بسبب النمو الضعيف."
                        : "High risk of fungal diseases due to poor growth."
                      : fieldData.current.moisture && fieldData.current.moisture > 70
                      ? lang === "ar"
                        ? "الرطوبة العالية تزيد من مخاطر الأمراض."
                        : "High moisture increases disease risk."
                      : lang === "ar"
                        ? "مخاطر الأمراض معتدلة. استمر في المراقبة."
                        : "Moderate disease risk. Continue monitoring."
                    }
                  </AlertDescription>
                </Alert>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{lang === "ar" ? "الرطوبة" : "Humidity"}</span>
                    <span className={weatherData?.current.humidity && weatherData.current.humidity > 70 ? "text-red-600" : "text-green-600"}>
                      {weatherData?.current.humidity ?? "--"}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{lang === "ar" ? "درجة الحرارة" : "Temperature"}</span>
                    <span className={weatherData?.current.temperature && weatherData.current.temperature > 30 ? "text-amber-600" : "text-green-600"}>
                      {weatherData?.current.temperature?.toFixed(1) ?? "--"}°C
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
