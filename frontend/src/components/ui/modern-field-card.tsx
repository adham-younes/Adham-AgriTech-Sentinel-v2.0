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
  Calendar,
  Thermometer,
  CloudRain,
  Eye,
  Satellite,
  Leaf,
  Target
} from "lucide-react"

interface ModernFieldCardProps {
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
  }
  metrics?: {
    ndvi?: { latest: number | null; date: string | null; mapUrl?: string | null }
    chlorophyll?: { latest: number | null; date: string | null; mapUrl?: string | null }
    moisture?: { latest: number | null; date: string | null }
    temperature?: { latest: number | null; date: string | null }
    weather?: { latest: { temperature?: number | null; humidity?: number | null; condition?: string | null } }
  }
  onClick?: () => void
  lang?: "ar" | "en"
}

export function ModernFieldCard({
  field,
  metrics,
  onClick,
  lang = "ar"
}: ModernFieldCardProps) {
  const t = {
    ar: {
      viewDetails: "عرض التفاصيل",
      health: "صحة الحقل",
      ndvi: "NDVI",
      moisture: "الرطوبة",
      temperature: "درجة الحرارة",
      area: "المساحة",
      feddan: "فدان",
      lastUpdate: "آخر تحديث",
      excellent: "ممتاز",
      good: "جيد",
      fair: "متوسط",
      poor: "ضعيف",
      realTime: "مباشر",
      satellite: "قمر صناعي",
      weather: "الطقس",
      analytics: "تحليلات",
      alerts: "تنبيهات",
      performance: "الأداء"
    },
    en: {
      viewDetails: "View Details",
      health: "Field Health",
      ndvi: "NDVI",
      moisture: "Moisture",
      temperature: "Temperature",
      area: "Area",
      feddan: "Feddan",
      lastUpdate: "Last Update",
      excellent: "Excellent",
      good: "Good",
      fair: "Fair",
      poor: "Poor",
      realTime: "Real-time",
      satellite: "Satellite",
      weather: "Weather",
      analytics: "Analytics",
      alerts: "Alerts",
      performance: "Performance"
    }
  }

  const translations = t[lang]

  // Calculate health score - returns null when no data available
  const calculateHealthScore = (): number | null => {
    const ndvi = metrics?.ndvi?.latest ?? field.last_ndvi ?? field.ndvi_score
    const moisture = metrics?.moisture?.latest ?? field.last_moisture ?? field.moisture_index

    // Return null to indicate "N/A" instead of 0 when data is missing
    const hasNdvi = typeof ndvi === 'number' && !isNaN(ndvi)
    const hasMoisture = typeof moisture === 'number' && !isNaN(moisture)

    if (!hasNdvi && !hasMoisture) return null

    let score = 0
    let count = 0

    if (hasNdvi) {
      // Normalize NDVI from -1,1 to 0-100
      score += ((ndvi! + 1) / 2) * 100
      count++
    }

    if (hasMoisture) {
      // Moisture is already 0-100
      score += moisture!
      count++
    }

    return count > 0 ? Math.round(score / count) : null
  }

  const getHealthStatus = (score: number | null) => {
    if (score === null) return { status: "unknown", color: "bg-gray-400", textColor: "text-gray-500" }
    if (score >= 80) return { status: "excellent", color: "bg-emerald-500", textColor: "text-emerald-700" }
    if (score >= 60) return { status: "good", color: "bg-green-500", textColor: "text-green-700" }
    if (score >= 40) return { status: "fair", color: "bg-yellow-500", textColor: "text-yellow-700" }
    return { status: "poor", color: "bg-red-500", textColor: "text-red-700" }
  }

  const healthScore = calculateHealthScore()
  const healthStatus = getHealthStatus(healthScore)

  const getAlertCount = () => {
    const moisture = metrics?.moisture?.latest ?? field.last_moisture ?? field.moisture_index
    const temperature = metrics?.temperature?.latest ?? field.last_temperature
    const ndvi = metrics?.ndvi?.latest ?? field.last_ndvi ?? field.ndvi_score

    let alerts = 0

    if (moisture && moisture < 30) alerts++
    if (temperature && temperature > 35) alerts++
    if (ndvi && ndvi < 0.3) alerts++

    return alerts
  }

  const alertCount = getAlertCount()

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-gray-900/90 backdrop-blur-sm">
      {/* Header with gradient background */}
      <div className={`h-2 ${healthStatus.color}`} />

      <div className="p-6">
        {/* Field Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{field.name}</h3>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              {field.area && (
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {field.area.toFixed(2)} {translations.feddan}
                </span>
              )}
              {field.crop_type && (
                <Badge variant="outline" className="text-xs">
                  <Leaf className="h-3 w-3 mr-1" />
                  {field.crop_type}
                </Badge>
              )}
            </div>
          </div>

          {/* Health Score Badge */}
          <div className="text-center">
            <div className={`text-2xl font-bold ${healthStatus.textColor}`}>
              {healthScore !== null ? `${healthScore}%` : "--"}
            </div>
            <Badge className={`${healthStatus.color} text-white border-0 text-xs`}>
              {translations[healthStatus.status as keyof typeof translations]}
            </Badge>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-center justify-center gap-1 mb-1">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-gray-600">{translations.ndvi}</span>
            </div>
            <div className="text-lg font-bold text-emerald-700">
              {metrics?.ndvi?.latest ?? field.last_ndvi ?? field.ndvi_score ?? "--"}
            </div>
          </div>

          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Droplets className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-gray-600">{translations.moisture}</span>
            </div>
            <div className="text-lg font-bold text-blue-700">
              {metrics?.moisture?.latest ?? field.last_moisture ?? field.moisture_index
                ? `${(metrics?.moisture?.latest ?? field.last_moisture ?? field.moisture_index)?.toFixed(1)}%`
                : "--"
              }
            </div>
          </div>

          <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Thermometer className="h-4 w-4 text-orange-600" />
              <span className="text-xs text-gray-600">{translations.temperature}</span>
            </div>
            <div className="text-lg font-bold text-orange-700">
              {metrics?.temperature?.latest ?? field.last_temperature
                ? `${(metrics?.temperature?.latest ?? field.last_temperature)?.toFixed(1)}°C`
                : "--"
              }
            </div>
          </div>
        </div>

        {/* Health Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">{translations.health}</span>
            <span className="text-sm text-gray-500">{healthScore !== null ? `${healthScore}%` : "--"}</span>
          </div>
          <Progress value={healthScore ?? 0} className="h-2" />
        </div>

        {/* Weather Info */}
        {metrics?.weather?.latest && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <CloudRain className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700">
                {metrics.weather.latest.condition || "--"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              {metrics.weather.latest.temperature && (
                <span>{metrics.weather.latest.temperature.toFixed(1)}°C</span>
              )}
              {metrics.weather.latest.humidity && (
                <span>{metrics.weather.latest.humidity}%</span>
              )}
            </div>
          </div>
        )}

        {/* Alerts */}
        {alertCount > 0 && (
          <Alert className="mb-4 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm">
              {lang === "ar"
                ? `${alertCount} تنبيهات نشطة تتطلب الانتباه`
                : `${alertCount} active alerts require attention`
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={onClick}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Eye className="h-4 w-4 mr-2" />
            {translations.viewDetails}
          </Button>

          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0">
              <Satellite className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-9 w-9 p-0">
              <Activity className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            {(() => {
              const dateValue = field.last_reading_at || metrics?.ndvi?.date
              return dateValue
                ? new Date(dateValue).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")
                : "--"
            })()}
          </div>

          {field.latitude && field.longitude && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3" />
              {field.latitude.toFixed(4)}, {field.longitude.toFixed(4)}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
