"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Satellite,
  MapPin,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Eye,
  Zap
} from "lucide-react"
import { useTranslation } from "@/lib/i18n/use-language"
import { satelliteAnalytics } from "@/lib/services/satellite-analytics"
import { createClient } from "@/lib/supabase/client"

interface SatelliteImageryCardProps {
  className?: string
}

export function SatelliteImageryCard({
  className = ""
}: SatelliteImageryCardProps) {
  const { t, language } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<{
    fieldName: string
    ndvi: number
    health: number
    area: number
    lastUpdate: string
    isLive: boolean
  } | null>(null)

  useEffect(() => {
    async function fetchSatelliteData() {
      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setError(language === "ar" ? "يجب تسجيل الدخول" : "Login required")
          setLoading(false)
          return
        }

        // Fetch first field for the user
        const { data: fields, error: fieldsError } = await supabase
          .from("fields")
          .select("id, name, area_feddan, boundary")
          .eq("user_id", user.id)
          .limit(1)
          .single()

        if (fieldsError || !fields) {
          setError(language === "ar" ? "لا توجد حقول" : "No fields found")
          setLoading(false)
          return
        }

        // Get field boundary as polygon
        const polygon = fields.boundary?.coordinates?.[0] || []

        // Fetch EOSDA health metrics
        const metrics = await satelliteAnalytics.getCropHealthMetrics(fields.id, polygon)

        // Calculate health score from NDVI (0.2-0.95 → 0-100%)
        const healthScore = Math.round(((metrics.ndvi.current - 0.2) / 0.75) * 100)

        setData({
          fieldName: fields.name,
          ndvi: metrics.ndvi.current,
          health: Math.max(0, Math.min(100, healthScore)),
          area: fields.area_feddan,
          lastUpdate: new Date().toISOString(),
          isLive: !metrics.isSimulated
        })
      } catch (err) {
        console.error("Error fetching satellite data:", err)
        setError(language === "ar" ? "فشل تحميل البيانات" : "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchSatelliteData()
  }, [language])

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { status: "excellent", color: "bg-emerald-500", textColor: "text-emerald-300", borderColor: "border-emerald-500/30" }
    if (score >= 60) return { status: "good", color: "bg-emerald-500/80", textColor: "text-emerald-400", borderColor: "border-emerald-500/20" }
    if (score >= 40) return { status: "fair", color: "bg-amber-500", textColor: "text-amber-300", borderColor: "border-amber-500/30" }
    return { status: "poor", color: "bg-amber-600", textColor: "text-amber-200", borderColor: "border-amber-600/40" }
  }

  if (loading) {
    return (
      <Card className={`glass-card border-primary/20 shadow-3d ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Satellite className="h-5 w-5 text-primary animate-pulse" />
            <CardTitle className="text-lg text-white/90">
              {language === "ar" ? "صور الأقمار الصناعية" : "Satellite Imagery"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className={`glass-card border-primary/20 shadow-3d ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Satellite className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg text-white/90">
              {language === "ar" ? "صور الأقمار الصناعية" : "Satellite Imagery"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="border-amber-500/40 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-amber-200">
              {error || (language === "ar" ? "لا توجد بيانات" : "No data available")}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const healthStatus = getHealthStatus(data.health)

  const translations = {
    ar: {
      satelliteImagery: "صور الأقمار الصناعية",
      lastUpdate: "آخر تحديث",
      healthScore: "مؤشر الصحة",
      ndvi: "مؤشر NDVI",
      area: "المساحة",
      feddan: "فدان",
      viewDetails: "عرض التفاصيل",
      liveData: "بيانات حية",
      simulation: "محاكاة",
      excellent: "ممتاز",
      good: "جيد",
      fair: "متوسط",
      poor: "ضعيف",
      goodCondition: "في حالة جيدة وصحية",
      needsAttention: "يحتاج إلى اهتمام فوري"
    },
    en: {
      satelliteImagery: "Satellite Imagery",
      lastUpdate: "Last Update",
      healthScore: "Health Score",
      ndvi: "NDVI Index",
      area: "Area",
      feddan: "Feddan",
      viewDetails: "View Details",
      liveData: "Live Data",
      simulation: "Simulation",
      excellent: "Excellent",
      good: "Good",
      fair: "Fair",
      poor: "Poor",
      goodCondition: "is in good and healthy condition",
      needsAttention: "needs immediate attention"
    }
  }

  const tr = translations[language === "en" ? "en" : "ar"]
  const formattedDate = new Date(data.lastUpdate).toLocaleDateString(
    language === "ar" ? "ar-EG" : "en-US",
    { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
  )

  return (
    <Card className={`glass-card border-primary/20 shadow-3d ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Satellite className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg text-white/90">{tr.satelliteImagery}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {data.isLive && (
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                <Zap className="h-3 w-3 mr-1" />
                {tr.liveData}
              </Badge>
            )}
            {!data.isLive && (
              <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                {tr.simulation}
              </Badge>
            )}
            <Badge variant="outline" className={`text-xs ${healthStatus.textColor} ${healthStatus.borderColor}`}>
              {tr[healthStatus.status as keyof typeof tr]}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Field Info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin className="h-4 w-4" />
            <span className="text-white/80">{data.fieldName}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Health Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white/80">{tr.healthScore}</span>
            <span className="text-sm text-gray-400">{data.health}%</span>
          </div>
          <Progress value={data.health} className="h-2 bg-white/10" />
        </div>

        {/* NDVI & Area */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <div className="text-xs text-emerald-400 mb-1">{tr.ndvi}</div>
            <div className="text-lg font-bold text-emerald-300">{data.ndvi.toFixed(3)}</div>
          </div>
          <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="text-xs text-primary mb-1">{tr.area}</div>
            <div className="text-lg font-bold text-primary">{data.area.toFixed(1)} {tr.feddan}</div>
          </div>
        </div>

        {/* Status Alert */}
        <Alert className={data.health >= 60
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-amber-500/40 bg-amber-500/10"
        }>
          {data.health >= 60 ? (
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          )}
          <AlertDescription className={data.health >= 60 ? "text-emerald-200" : "text-amber-200"}>
            {language === "ar"
              ? `حقل ${data.fieldName} ${data.health >= 60 ? tr.goodCondition : tr.needsAttention}`
              : `Field ${data.fieldName} ${data.health >= 60 ? tr.goodCondition : tr.needsAttention}`
            }
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-primary/30 hover:bg-primary/10 text-white/80"
            onClick={() => window.location.href = '/dashboard/satellite'}
          >
            <Eye className="h-4 w-4 mr-2" />
            {tr.viewDetails}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
