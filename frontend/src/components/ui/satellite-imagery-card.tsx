"use client"

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
  Info,
  Loader2,
  Eye,
  Download
} from "lucide-react"
import { useTranslation } from "@/lib/i18n/use-language"

interface SatelliteImageryCardProps {
  fieldId?: string
  fieldName?: string
  lastUpdate?: string
  ndvi?: number
  health?: number
  area?: number
  className?: string
}

export function SatelliteImageryCard({
  fieldId,
  fieldName = "Sample Field",
  lastUpdate,
  ndvi = 0.65,
  health = 75,
  area = 10.5,
  className = ""
}: SatelliteImageryCardProps) {
  const { t, language } = useTranslation()

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { status: "excellent", color: "bg-green-500", textColor: "text-green-700" }
    if (score >= 60) return { status: "good", color: "bg-emerald-500", textColor: "text-emerald-700" }
    if (score >= 40) return { status: "fair", color: "bg-yellow-500", textColor: "text-yellow-700" }
    return { status: "poor", color: "bg-red-500", textColor: "text-red-700" }
  }

  const healthStatus = getHealthStatus(health)

  const translations = {
    ar: {
      satelliteImagery: "صور الأقمار الصناعية",
      lastUpdate: "آخر تحديث",
      healthScore: "مؤشر الصحة",
      ndvi: "مؤشر NDVI",
      area: "المساحة",
      feddan: "فدان",
      viewDetails: "عرض التفاصيل",
      downloadImage: "تحميل الصورة",
      excellent: "ممتاز",
      good: "جيد",
      fair: "متوسط",
      poor: "ضعيف",
      processing: "جاري المعالجة...",
      noData: "لا توجد بيانات"
    },
    en: {
      satelliteImagery: "Satellite Imagery",
      lastUpdate: "Last Update",
      healthScore: "Health Score",
      ndvi: "NDVI Index",
      area: "Area",
      feddan: "Feddan",
      viewDetails: "View Details",
      downloadImage: "Download Image",
      excellent: "Excellent",
      good: "Good",
      fair: "Fair",
      poor: "Poor",
      processing: "Processing...",
      noData: "No Data"
    }
  }

  const tr = translations[language === "en" ? "en" : "ar"]

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Satellite className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">{tr.satelliteImagery}</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {tr[healthStatus.status as keyof typeof tr]}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Field Info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{fieldName}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{lastUpdate || tr.noData}</span>
          </div>
        </div>

        {/* Health Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{tr.healthScore}</span>
            <span className="text-sm text-gray-600">{health}%</span>
          </div>
          <Progress value={health} className="h-2" />
        </div>

        {/* NDVI */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-xs text-blue-600 mb-1">{tr.ndvi}</div>
            <div className="text-lg font-bold text-blue-700">{ndvi.toFixed(3)}</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-xs text-green-600 mb-1">{tr.area}</div>
            <div className="text-lg font-bold text-green-700">{area.toFixed(1)} {tr.feddan}</div>
          </div>
        </div>

        {/* Status Alert */}
        <Alert className={health >= 60 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {health >= 60 ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={health >= 60 ? "text-green-800" : "text-red-800"}>
            {health >= 60 
              ? language === "ar" 
                ? `حقل ${fieldName} في حالة جيدة وصحية` 
                : `Field ${fieldName} is in good and healthy condition`
              : language === "ar"
                ? `حقل ${fieldName} يحتاج إلى اهتمام فوري`
                : `Field ${fieldName} needs immediate attention`
            }
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="h-4 w-4 mr-2" />
            {tr.viewDetails}
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            {tr.downloadImage}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
