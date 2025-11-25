"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Map, 
  Layers, 
  Droplets, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Activity,
  Leaf,
  MapPin,
  Calendar,
  Download,
  Settings
} from "lucide-react"

interface VRAMapProps {
  fieldId?: string
  fieldName?: string
  lang?: "ar" | "en"
  fieldBoundary?: {
    coordinates: [number, number][]
    area: number
  }
  ndviData?: Array<{
    date: string
    value: number
    zone: string
  }>
}

interface ZoneData {
  id: string
  name: { ar: string; en: string }
  area: number
  ndvi: number
  recommendation: { ar: string; en: string }
  fertilizerRate: {
    nitrogen: number
    phosphorus: number
    potassium: number
  }
  color: string
  status: "optimal" | "low" | "high"
}

const generateZones = (boundary?: { coordinates: [number, number][]; area: number }): ZoneData[] => {
  // Simulate zone generation based on NDVI data
  const zones: ZoneData[] = []
  const zoneNames = [
    { ar: "المنطقة الشمالية", en: "North Zone" },
    { ar: "المنطقة الجنوبية", en: "South Zone" },
    { ar: "المنطقة الشرقية", en: "East Zone" },
    { ar: "المنطقة الغربية", en: "West Zone" },
    { ar: "المنطقة المركزية", en: "Central Zone" }
  ]

  for (let i = 0; i < 5; i++) {
    const ndvi = 0.3 + Math.random() * 0.6
    let status: "optimal" | "low" | "high" = "optimal"
    let color = "#10b981" // Vivid Green
    
    if (ndvi < 0.4) {
      status = "low"
      color = "#ef4444" // Red
    } else if (ndvi > 0.7) {
      status = "high"
      color = "#3b82f6" // Blue
    }

    zones.push({
      id: `zone-${i + 1}`,
      name: zoneNames[i],
      area: boundary ? boundary.area / 5 : 10 + Math.random() * 20,
      ndvi: ndvi,
      recommendation: {
        ar: status === "low" ? "زيادة الأسمدة النيتروجينية" : status === "high" ? "تقليل الأسمدة" : "الحفاظ على المعدل الحالي",
        en: status === "low" ? "Increase nitrogen fertilizer" : status === "high" ? "Reduce fertilizer" : "Maintain current rate"
      },
      fertilizerRate: {
        nitrogen: status === "low" ? 80 : status === "high" ? 20 : 50,
        phosphorus: status === "low" ? 60 : status === "high" ? 30 : 45,
        potassium: status === "low" ? 70 : status === "high" ? 25 : 40
      },
      color,
      status
    })
  }

  return zones
}

const ZoneCard: React.FC<{ zone: ZoneData; lang: "ar" | "en" }> = ({ zone, lang }) => {
  const getStatusIcon = () => {
    switch (zone.status) {
      case "optimal":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />
      case "low":
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      case "high":
        return <Activity className="w-4 h-4 text-blue-400" />
    }
  }

  const getStatusColor = () => {
    switch (zone.status) {
      case "optimal":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      case "low":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "high":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    }
  }

  return (
    <div className={`bg-black/40 border rounded-lg p-4 backdrop-blur-sm ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
          <span className="text-sm font-medium">{zone.name[lang]}</span>
        </div>
        {getStatusIcon()}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/70">{lang === "ar" ? "المساحة:" : "Area:"}</span>
          <span className="text-sm font-medium">{zone.area.toFixed(1)} ha</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-white/70">{lang === "ar" ? "NDVI:" : "NDVI:"}</span>
          <span className="text-sm font-medium">{zone.ndvi.toFixed(3)}</span>
        </div>

        <div className="border-t border-white/10 pt-3">
          <div className="text-xs text-white/70 mb-2">
            {lang === "ar" ? "معدل الأسمدة (كجم/هكتار):" : "Fertilizer Rate (kg/ha):"}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs">N</span>
              <div className="flex items-center gap-2">
                <Progress value={zone.fertilizerRate.nitrogen} className="w-16 h-1" />
                <span className="text-xs font-medium">{zone.fertilizerRate.nitrogen}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs">P</span>
              <div className="flex items-center gap-2">
                <Progress value={zone.fertilizerRate.phosphorus} className="w-16 h-1" />
                <span className="text-xs font-medium">{zone.fertilizerRate.phosphorus}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs">K</span>
              <div className="flex items-center gap-2">
                <Progress value={zone.fertilizerRate.potassium} className="w-16 h-1" />
                <span className="text-xs font-medium">{zone.fertilizerRate.potassium}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-3">
          <div className="text-xs text-white/70 mb-1">
            {lang === "ar" ? "التوصية:" : "Recommendation:"}
          </div>
          <div className="text-xs">{zone.recommendation[lang]}</div>
        </div>
      </div>
    </div>
  )
}

export function VRAMap({ fieldId, fieldName, lang = "ar", fieldBoundary }: VRAMapProps) {
  const [zones, setZones] = useState<ZoneData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedZone, setSelectedZone] = useState<string | null>(null)

  useEffect(() => {
    // Generate zones based on field boundary
    const generatedZones = generateZones(fieldBoundary)
    setZones(generatedZones)
    setIsLoading(false)
  }, [fieldBoundary])

  const overallStats = useMemo(() => {
    if (zones.length === 0) return { avgNDVI: 0, totalArea: 0, optimalZones: 0 }
    
    const avgNDVI = zones.reduce((sum, zone) => sum + zone.ndvi, 0) / zones.length
    const totalArea = zones.reduce((sum, zone) => sum + zone.area, 0)
    const optimalZones = zones.filter(zone => zone.status === "optimal").length
    
    return { avgNDVI, totalArea, optimalZones }
  }, [zones])

  const getHealthStatus = (ndvi: number) => {
    if (ndvi >= 0.6) return { 
      status: lang === "ar" ? "ممتاز" : "Excellent", 
      color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    }
    if (ndvi >= 0.4) return { 
      status: lang === "ar" ? "جيد" : "Good", 
      color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    }
    return { 
      status: lang === "ar" ? "يحتاج عناية" : "Needs Attention", 
      color: "bg-red-500/20 text-red-400 border-red-500/30"
    }
  }

  const healthStatus = getHealthStatus(overallStats.avgNDVI)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-black/40 border border-emerald-400/30 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-emerald-400">
              {lang === "ar" ? "خرائط التطبيق المتغير المعدل" : "Variable Rate Application Maps"}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="w-3 h-3 text-white/70" />
              <span className="text-sm text-white/70">{fieldName || (lang === "ar" ? "الحقل المحدد" : "Selected Field")}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={`text-sm font-medium px-2 py-1 rounded-full border ${healthStatus.color}`}>
                {healthStatus.status}
              </div>
              <div className="text-xs text-white/70 mt-1">
                NDVI: {overallStats.avgNDVI.toFixed(3)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Visualization */}
      <div className="bg-black/40 border border-emerald-400/30 rounded-lg p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-emerald-400">
            {lang === "ar" ? "خريطة المناطق" : "Zone Map"}
          </h4>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <Layers className="w-3 h-3 mr-1" />
              {lang === "ar" ? "طبقات" : "Layers"}
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <Download className="w-3 h-3 mr-1" />
              {lang === "ar" ? "تصدير" : "Export"}
            </Button>
          </div>
        </div>

        {/* Simplified map visualization */}
        <div className="relative bg-black/60 rounded-lg p-8 h-64 flex items-center justify-center border border-emerald-400/20">
          <div className="absolute inset-0 flex items-center justify-center">
            <Map className="w-16 h-16 text-emerald-400/20" />
          </div>
          
          {/* Zone visualization */}
          <div className="relative grid grid-cols-3 gap-2 w-full max-w-md">
            {zones.map((zone, index) => (
              <div
                key={zone.id}
                className={`aspect-square rounded-lg border-2 cursor-pointer transition-all ${
                  selectedZone === zone.id 
                    ? "border-white scale-110 z-10" 
                    : "border-white/30 hover:border-white/60"
                }`}
                style={{ backgroundColor: zone.color + "40" }}
                onClick={() => setSelectedZone(selectedZone === zone.id ? null : zone.id)}
              >
                <div className="flex flex-col items-center justify-center h-full text-xs">
                  <div className="font-medium">{zone.name[lang].split(' ')[0]}</div>
                  <div className="text-white/70">{zone.ndvi.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-white/70">{lang === "ar" ? "منخفض" : "Low"}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-white/70">{lang === "ar" ? "مثالي" : "Optimal"}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-white/70">{lang === "ar" ? "مرتفع" : "High"}</span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-black/40 border border-emerald-400/30 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">
              {lang === "ar" ? "متوسط NDVI" : "Average NDVI"}
            </span>
          </div>
          <div className="text-2xl font-bold">{overallStats.avgNDVI.toFixed(3)}</div>
          <div className="text-xs text-white/70 mt-1">
            {lang === "ar" ? "صحة الغطاء النباتي" : "Vegetation Health"}
          </div>
        </div>

        <div className="bg-black/40 border border-emerald-400/30 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <Map className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">
              {lang === "ar" ? "إجمالي المساحة" : "Total Area"}
            </span>
          </div>
          <div className="text-2xl font-bold">{overallStats.totalArea.toFixed(1)} ha</div>
          <div className="text-xs text-white/70 mt-1">
            {zones.length} {lang === "ar" ? "منطقة" : "zones"}
          </div>
        </div>

        <div className="bg-black/40 border border-emerald-400/30 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">
              {lang === "ar" ? "المناطق المثلى" : "Optimal Zones"}
            </span>
          </div>
          <div className="text-2xl font-bold">{overallStats.optimalZones}/{zones.length}</div>
          <div className="text-xs text-white/70 mt-1">
            {((overallStats.optimalZones / zones.length) * 100).toFixed(0)}% {lang === "ar" ? "مثالي" : "optimal"}
          </div>
        </div>
      </div>

      {/* Zone Details */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-emerald-400">
          {lang === "ar" ? "تفاصيل المناطق والتوصيات" : "Zone Details & Recommendations"}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => (
            <ZoneCard key={zone.id} zone={zone} lang={lang} />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-black/40 border border-emerald-400/30 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 text-white/70" />
            <span className="text-xs text-white/70">
              {lang === "ar" ? "آخر تحليل:" : "Last analysis:"}
            </span>
            <span className="text-xs text-emerald-400">
              {new Date().toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <Settings className="w-3 h-3 mr-1" />
              {lang === "ar" ? "إعدادات" : "Settings"}
            </Button>
            <Button size="sm" className="text-xs bg-emerald-500 hover:bg-emerald-600">
              <Download className="w-3 h-3 mr-1" />
              {lang === "ar" ? "تصدير خطة VRA" : "Export VRA Plan"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
