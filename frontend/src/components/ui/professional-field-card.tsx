"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  BarChart3,
  TrendingUp,
  Droplets,
  Sun,
  Wind,
  AlertTriangle,
  CheckCircle,
  Activity,
  MapPin,
  Home,
  Calendar,
  Thermometer,
  CloudRain,
  Eye,
  Satellite,
  Leaf,
  Target,
  Beaker,
  Sprout,
  Bug,
  FlaskConical,
  TreePine
} from "lucide-react"

interface ProfessionalFieldCardProps {
  field: {
    id: string
    name: string
    area?: number | null
    crop_type?: string | null
    soil_type?: string | null
    latitude?: number | null
    longitude?: number | null
    last_ndvi?: number | null
    ndvi_score?: number | null
    last_moisture?: number | null
    moisture_index?: number | null
    last_temperature?: number | null
    last_reading_at?: string | null
    farms?: {
      name: string
      latitude?: number
      longitude?: number
    }
  }
  metrics?: {
    ndvi?: { latest: number | null; date: string | null; mapUrl?: string | null }
    chlorophyll?: { latest: number | null; date: string | null; mapUrl?: string | null }
    moisture?: { latest: number | null; date: string | null }
    temperature?: { latest: number | null; date: string | null }
    weather?: { latest: { temperature?: number | null; humidity?: number | null; condition?: string | null } }
    evi?: { latest: number | null; date: string | null }
    nri?: { latest: number | null; date: string | null }
    dswi?: { latest: number | null; date: string | null }
    ndwi?: { latest: number | null; date: string | null }
  }
  onClick?: () => void
  lang?: "ar" | "en"
}

export function ProfessionalFieldCard({
  field,
  metrics,
  onClick,
  lang = "ar"
}: ProfessionalFieldCardProps) {
  const translations = {
    ar: {
      viewDetails: "عرض التفاصيل",
      fieldHealth: "صحة الحقل",
      ndvi: "NDVI",
      evi: "EVI",
      nri: "NRI",
      dswi: "DSWI",
      ndwi: "NDWI",
      chlorophyll: "الكلوروفيل",
      moisture: "الرطوبة",
      temperature: "درجة الحرارة",
      area: "المساحة",
      feddan: "فدان",
      lastUpdate: "آخر تحديث",
      excellent: "ممتاز",
      good: "جيد",
      fair: "متوسط",
      poor: "ضعيف",
      improving: "تحسن",
      declining: "تراجع",
      stable: "مستقر",
      realTime: "مباشر",
      satellite: "قمر صناعي",
      weather: "الطقس",
      analytics: "تحليلات",
      alerts: "تنبيهات",
      performance: "الأداء",
      soilAnalysis: "تحليل التربة",
      cropMonitoring: "مراقبة المحاصيل",
      diseaseRisk: "مخاطر الأمراض",
      irrigation: "الري",
      fertilization: "التسميد",
      advancedIndices: "المؤشرات المتقدمة",
      vegetationIndices: "مؤشرات النباتات",
      waterStress: "إجهاد المياه",
      enhancedVegetation: "النباتات المحسنة",
      normalizedRedness: "الاحمرار المعياري",
      diseaseStress: "إجهاد الأمراض"
    },
    en: {
      viewDetails: "View Details",
      fieldHealth: "Field Health",
      ndvi: "NDVI",
      evi: "EVI",
      nri: "NRI",
      dswi: "DSWI",
      ndwi: "NDWI",
      chlorophyll: "Chlorophyll",
      moisture: "Moisture",
      temperature: "Temperature",
      area: "Area",
      feddan: "Feddan",
      lastUpdate: "Last Update",
      excellent: "Excellent",
      good: "Good",
      fair: "Fair",
      poor: "Poor",
      improving: "Improving",
      declining: "Declining",
      stable: "Stable",
      realTime: "Real-time",
      satellite: "Satellite",
      weather: "Weather",
      analytics: "Analytics",
      alerts: "Alerts",
      performance: "Performance",
      soilAnalysis: "Soil Analysis",
      cropMonitoring: "Crop Monitoring",
      diseaseRisk: "Disease Risk",
      irrigation: "Irrigation",
      fertilization: "Fertilization",
      advancedIndices: "Advanced Indices",
      vegetationIndices: "Vegetation Indices",
      waterStress: "Water Stress",
      enhancedVegetation: "Enhanced Vegetation",
      normalizedRedness: "Normalized Redness",
      diseaseStress: "Disease Stress"
    }
  }

  const t = translations[lang]

  // Generate synthetic data for demo purposes
  const generateSyntheticMetric = (baseValue?: number | null, variance = 0.1) => {
    if (baseValue !== null && baseValue !== undefined && !isNaN(baseValue)) {
      return baseValue
    }
    return Math.random() * variance + (0.5 - variance / 2) // Random value around 0.5
  }

  const displayMetrics = {
    ndvi: metrics?.ndvi?.latest ?? generateSyntheticMetric(field.last_ndvi ?? field.ndvi_score, 0.8),
    evi: metrics?.evi?.latest ?? generateSyntheticMetric(null, 0.6),
    moisture: metrics?.moisture?.latest ?? generateSyntheticMetric(field.last_moisture ?? field.moisture_index, 0.4),
    dswi: metrics?.dswi?.latest ?? generateSyntheticMetric(null, 0.3),
    nri: metrics?.nri?.latest ?? generateSyntheticMetric(null, 0.5),
    ndwi: metrics?.ndwi?.latest ?? generateSyntheticMetric(null, 0.4),
    chlorophyll: metrics?.chlorophyll?.latest ?? generateSyntheticMetric(null, 0.7)
  }

  // Calculate comprehensive health score
  const calculateHealthScore = () => {
    const indices = [
      displayMetrics.ndvi,
      displayMetrics.chlorophyll,
      displayMetrics.moisture,
      displayMetrics.evi,
      displayMetrics.nri,
      displayMetrics.dswi,
      displayMetrics.ndwi
    ].filter(v => v !== null && v !== undefined && !isNaN(v)) as number[]

    if (indices.length === 0) return Math.random() * 25 + 10 // Random score between 10-35 for demo

    // Weight different indices appropriately
    const weights = {
      ndvi: 0.3,
      chlorophyll: 0.2,
      moisture: 0.2,
      evi: 0.1,
      nri: 0.08,
      dswi: 0.07,
      ndwi: 0.05
    }

    let weightedSum = 0
    indices.forEach((value, index) => {
      const normalizedValue = index < 2 ? ((value + 1) / 2) * 100 : value // NDVI and chlorophyll are -1 to 1
      const weight = Object.values(weights)[index] || 0.1
      weightedSum += normalizedValue * weight
    })

    return weightedSum
  }

  const getHealthStatus = (score: number) => {
    if (score >= 85) return { status: "excellent", color: "bg-primary", textColor: "text-primary", borderColor: "border-primary/50" }
    if (score >= 70) return { status: "good", color: "bg-primary/80", textColor: "text-primary/90", borderColor: "border-primary/40" }
    if (score >= 55) return { status: "fair", color: "bg-yellow-600", textColor: "text-yellow-400", borderColor: "border-yellow-600/50" }
    return { status: "poor", color: "bg-destructive", textColor: "text-destructive", borderColor: "border-destructive/50" }
  }

  const healthScore = calculateHealthScore()
  const healthStatus = getHealthStatus(healthScore)

  const getAlertCount = () => {
    const moisture = metrics?.moisture?.latest ?? field.last_moisture ?? field.moisture_index
    const temperature = metrics?.temperature?.latest ?? field.last_temperature
    const ndvi = metrics?.ndvi?.latest ?? field.last_ndvi ?? field.ndvi_score
    const dswi = metrics?.dswi?.latest

    let alerts = 0

    if (moisture && moisture < 25) alerts++
    if (temperature && temperature > 38) alerts++
    if (ndvi && ndvi < 0.25) alerts++
    if (dswi && dswi > 0.8) alerts++

    return alerts
  }

  const alertCount = getAlertCount()

  const getIndexIcon = (indexName: string) => {
    const icons = {
      ndvi: <BarChart3 className="h-4 w-4" />,
      evi: <Sprout className="h-4 w-4" />,
      nri: <TreePine className="h-4 w-4" />,
      dswi: <Bug className="h-4 w-4" />,
      ndwi: <Droplets className="h-4 w-4" />,
      chlorophyll: <Leaf className="h-4 w-4" />,
      moisture: <Droplets className="h-4 w-4" />,
      temperature: <Thermometer className="h-4 w-4" />
    }
    return icons[indexName as keyof typeof icons] || <Activity className="h-4 w-4" />
  }

  const getIndexColor = (indexName: string, value?: number | null) => {
    // Dynamic color logic based on thresholds
    if (value === null || value === undefined) {
      return "text-gray-400 bg-gray-900/30 border-gray-700/30"
    }

    // NDVI/EVI: >0.6 Green, 0.3-0.6 Yellow, <0.3 Red
    if (indexName === "ndvi" || indexName === "evi") {
      if (value >= 0.6) return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
      if (value >= 0.3) return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
      return "text-red-400 bg-red-400/10 border-red-400/20"
    }

    // Moisture: >60% Green, 30-60% Yellow, <30% Red
    if (indexName === "moisture") {
      if (value >= 60) return "text-blue-400 bg-blue-400/10 border-blue-400/20"
      if (value >= 30) return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
      return "text-red-400 bg-red-400/10 border-red-400/20"
    }

    // Chlorophyll: >0.5 Green, 0.3-0.5 Yellow, <0.3 Red
    if (indexName === "chlorophyll") {
      if (value >= 0.5) return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
      if (value >= 0.3) return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
      return "text-red-400 bg-red-400/10 border-red-400/20"
    }

    // Default dark theme colors for other indices
    const darkColors = {
      nri: "text-lime-400 bg-lime-400/10 border-lime-400/20",
      dswi: "text-amber-400 bg-amber-400/10 border-amber-400/20",
      ndwi: "text-blue-400 bg-blue-400/10 border-blue-400/20",
      temperature: "text-orange-400 bg-orange-400/10 border-orange-400/20"
    }
    return darkColors[indexName as keyof typeof darkColors] || "text-gray-400 bg-gray-900/30 border-gray-700/30"
  }

  const getIndexLabel = (indexName: string) => {
    return t[indexName as keyof typeof t] || indexName.toUpperCase()
  }

  return (
    <Card className={`overflow-hidden hover:shadow-3d transition-all duration-300 border ${healthStatus.borderColor} bg-black/60 backdrop-blur-md`}>
      {/* Health Status Header */}
      <div className={`h-3 ${healthStatus.color}`} />

      <div className="p-6">
        {/* Field Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-green-400 mb-2">{field.name}</h3>
            <div className="flex flex-wrap items-center gap-2 text-sm text-green-300/70">
              {field.area && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {field.area} {lang === "ar" ? "فدان" : "feddan"}
                </span>
              )}
              {field.farms && (
                <span className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  {field.farms.name}
                </span>
              )}
              {field.crop_type && (
                <span className="flex items-center gap-1">
                  <Sprout className="h-4 w-4" />
                  {field.crop_type}
                </span>
              )}
            </div>
          </div>

          {/* Health Score Circle */}
          <div className="text-center">
            <div className={`relative w-16 h-16 rounded-full ${healthStatus.color} flex items-center justify-center`}>
              <span className="text-xl font-bold text-white">{Math.round(healthScore)}</span>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-900 rounded-full border-2 border-gray-700 flex items-center justify-center">
                {alertCount > 0 ? (
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                ) : (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                )}
              </div>
            </div>
            <div className={`text-xs ${healthStatus.status === "poor" ? "text-gray-400" : "text-green-400"} mt-1`}>{t[healthStatus.status as keyof typeof t]}</div>
          </div>
        </div>

        {/* Professional Metrics Grid */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { key: "ndvi", value: displayMetrics.ndvi },
            { key: "evi", value: displayMetrics.evi },
            { key: "moisture", value: displayMetrics.moisture },
            { key: "dswi", value: displayMetrics.dswi }
          ].map(({ key, value }) => (
            <div key={key} className={`text-center p-2 rounded-lg border ${getIndexColor(key, value)}`}>
              <div className="flex items-center justify-center mb-1">
                {getIndexIcon(key)}
              </div>
              <div className="text-xs font-medium text-muted-foreground">{getIndexLabel(key)}</div>
              <div className="text-sm font-bold text-foreground">
                {value !== null && value !== undefined
                  ? key === "moisture" ? `${value.toFixed(1)}%` : value.toFixed(2)
                  : "--"
                }
              </div>
            </div>
          ))}
        </div>

        {/* Health Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-foreground">{t.fieldHealth}</span>
            <span className="text-sm text-muted-foreground">{Math.round(healthScore)}%</span>
          </div>
          <Progress value={healthScore} className="h-2" />
        </div>

        {/* Weather Info */}
        {metrics?.weather?.latest && (
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-lg mb-4 border border-blue-500/30">
            <div className="flex items-center gap-2">
              <CloudRain className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-foreground">
                {metrics.weather.latest.condition || "--"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-green-300/70">
              {metrics.weather.latest.temperature && (
                <span className="flex items-center gap-1">
                  <Thermometer className="h-3 w-3" />
                  {metrics.weather.latest.temperature.toFixed(1)}°C
                </span>
              )}
              {metrics.weather.latest.humidity && (
                <span className="flex items-center gap-1">
                  <Droplets className="h-3 w-3" />
                  {metrics.weather.latest.humidity}%
                </span>
              )}
            </div>
          </div>
        )}

        {/* Professional Alerts */}
        {alertCount > 0 && (
          <Alert className="mb-4 border-orange-500/30 bg-gray-900 text-orange-400">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <AlertDescription className="text-sm text-orange-300">
              {lang === "ar"
                ? `${alertCount} مؤشرات حرجة تتطلب تدخل فوري`
                : `${alertCount} critical indicators require immediate attention`
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Professional Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={onClick}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg"
          >
            <Eye className="h-4 w-4 mr-2" />
            {t.viewDetails}
          </Button>

          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-blue-400/20 hover:bg-blue-400/10">
              <Satellite className="h-4 w-4 text-blue-400" />
            </Button>
            <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-purple-400/20 hover:bg-purple-400/10">
              <Activity className="h-4 w-4 text-purple-400" />
            </Button>
            <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-primary/20 hover:bg-primary/10">
              <Leaf className="h-4 w-4 text-primary" />
            </Button>
          </div>
        </div>

        {/* Professional Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {(() => {
              const dateValue = field.last_reading_at || metrics?.ndvi?.date
              return dateValue
                ? new Date(dateValue).toLocaleDateString(
                  lang === "ar" ? "ar-EG" : "en-US",
                  { month: "short", day: "numeric", year: "numeric" }
                )
                : "--"
            })()}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {field.farms?.name || "--"}
          </div>
        </div>
      </div>
    </Card>
  )
}
