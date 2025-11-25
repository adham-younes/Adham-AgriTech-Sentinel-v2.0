"use client"

import { useState, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"

import { Loader2, MapPin, Droplets, Calculator, Download, Layers } from "lucide-react"
import { useTranslation } from "@/lib/i18n/use-language"

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false })
const GeoJSON = dynamic(() => import("react-leaflet").then(mod => mod.GeoJSON), { ssr: false })
const useMap = dynamic(() => import("react-leaflet").then(mod => mod.useMap), { ssr: false })
const L = dynamic(() => import("leaflet"), { ssr: false })
const leafletCss = dynamic(() => import("leaflet/dist/leaflet.css"), { ssr: false })

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ManagementZone {
  id: string
  name: string
  area: number // hectares
  boundaries: L.Polygon
  soilData: {
    ph: number
    nitrogen: number // kg/ha
    phosphorus: number // kg/ha
    potassium: number // kg/ha
    organic_matter: number // %
    moisture: number // %
  }
  recommendations: {
    nitrogen_rate: number // kg/ha
    phosphorus_rate: number // kg/ha
    potassium_rate: number // kg/ha
    irrigation_rate: number // mm/week
    priority: "high" | "medium" | "low"
  }
  color: string
}

interface VRAMapData {
  fieldId: string
  fieldName: string
  totalArea: number
  zones: ManagementZone[]
  satelliteData: {
    ndvi: number
    ndmi: number
    evi: number
  }
  generatedAt: string
}

interface AdvancedVRAMapsProps {
  fieldId?: string
  latitude?: number
  longitude?: number
  fieldName?: string
}

const ZONE_COLORS = {
  high: "#10b981", // Vivid Green
  medium: "#f59e0b", // Amber
  low: "#ef4444", // Red
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return ZONE_COLORS.high
    case "medium":
      return ZONE_COLORS.medium
    case "low":
      return ZONE_COLORS.low
    default:
      return "#6b7280"
  }
}

const getPriorityText = (priority: string, lang: "ar" | "en") => {
  const translations = {
    ar: { high: "عالي", medium: "متوسط", low: "منخفض" },
    en: { high: "High", medium: "Medium", low: "Low" }
  }
  return translations[lang][priority as keyof typeof translations[typeof lang]] || priority
}

function ZoneMap({ zones, center }: { zones: ManagementZone[]; center: [number, number] }) {
  const map = useMap()

  useEffect(() => {
    if (center) {
      map.setView(center, 15)
    }
  }, [map, center])

  return (
    <>
      {zones.map((zone) => (
        <GeoJSON
          key={zone.id}
          data={zone.boundaries.toGeoJSON()}
          style={{
            color: zone.color,
            weight: 2,
            fillColor: zone.color,
            fillOpacity: 0.3,
          }}
          onEachFeature={(feature, layer) => {
            if (feature && layer) {
              layer.bindPopup(`
                <div class="bg-black/90 text-white p-2 rounded">
                  <div class="font-medium text-emerald-300">${zone.name}</div>
                  <div class="text-sm mt-1">
                    <div>المساحة: ${zone.area.toFixed(2)} هكتار</div>
                    <div>الأولوية: ${zone.recommendations.priority}</div>
                    <div>N: ${zone.recommendations.nitrogen_rate} كجم/هكتار</div>
                    <div>P: ${zone.recommendations.phosphorus_rate} كجم/هكتار</div>
                    <div>K: ${zone.recommendations.potassium_rate} كجم/هكتار</div>
                  </div>
                </div>
              `)
            }
          }}
        />
      ))}
    </>
  )
}

export function AdvancedVRAMaps({ fieldId, latitude, longitude, fieldName }: AdvancedVRAMapsProps) {
  const { language } = useTranslation()
  const lang = language === "en" ? "en" : "ar"
  const [vraData, setVraData] = useState<VRAMapData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedZone, setSelectedZone] = useState<ManagementZone | null>(null)

  // Generate mock VRA data based on field location
  const generateVRAMap = async () => {
    if (!latitude || !longitude) {
      setError(lang === "ar" ? "مطلوب إحداثيات الحقل" : "Field coordinates required")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Simulate API call with mock data generation
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Generate 5 management zones based on spatial variation
      const zones: ManagementZone[] = []
      const baseLat = latitude
      const baseLng = longitude
      const zoneSize = 0.001 // approximately 100m

      for (let i = 0; i < 5; i++) {
        const angle = (i * 72) * Math.PI / 180 // 360/5 degrees
        const zoneLat = baseLat + Math.cos(angle) * zoneSize
        const zoneLng = baseLng + Math.sin(angle) * zoneSize

        // Create polygon for zone
        const latlngs: L.LatLngExpression[] = []
        const vertices = 6 // hexagonal zones
        for (let j = 0; j < vertices; j++) {
          const vertexAngle = (j * 60) * Math.PI / 180
          const vertexLat = zoneLat + Math.cos(vertexAngle) * zoneSize * 0.8
          const vertexLng = zoneLng + Math.sin(vertexAngle) * zoneSize * 0.8
          latlngs.push([vertexLat, vertexLng])
        }

        // Simulate soil data variation
        const soilVariation = Math.random() * 0.4 - 0.2 // ±20% variation
        const baseNitrogen = 25
        const basePhosphorus = 15
        const basePotassium = 20
        const basePh = 6.5
        const baseMoisture = 30

        const priority = i < 2 ? "high" : i < 4 ? "medium" : "low"

        zones.push({
          id: `zone-${i + 1}`,
          name: lang === "ar" ? `المنطقة ${i + 1}` : `Zone ${i + 1}`,
          area: 2.5 + Math.random() * 2, // 2.5-4.5 hectares
          boundaries: L.polygon(latlngs),
          soilData: {
            ph: basePh + soilVariation * 1,
            nitrogen: baseNitrogen * (1 + soilVariation),
            phosphorus: basePhosphorus * (1 + soilVariation),
            potassium: basePotassium * (1 + soilVariation),
            organic_matter: 2.5 + soilVariation * 1,
            moisture: baseMoisture * (1 + soilVariation * 0.5)
          },
          recommendations: {
            nitrogen_rate: priority === "high" ? 180 : priority === "medium" ? 120 : 80,
            phosphorus_rate: priority === "high" ? 90 : priority === "medium" ? 60 : 40,
            potassium_rate: priority === "high" ? 120 : priority === "medium" ? 80 : 50,
            irrigation_rate: priority === "high" ? 35 : priority === "medium" ? 25 : 20,
            priority
          },
          color: getPriorityColor(priority)
        })
      }

      const totalArea = zones.reduce((sum, zone) => sum + zone.area, 0)

      const vraData: VRAMapData = {
        fieldId: fieldId || "custom",
        fieldName: fieldName || (lang === "ar" ? "حقل مخصص" : "Custom Field"),
        totalArea,
        zones,
        satelliteData: {
          ndvi: 0.65 + Math.random() * 0.2,
          ndmi: 0.45 + Math.random() * 0.2,
          evi: 0.55 + Math.random() * 0.2
        },
        generatedAt: new Date().toISOString()
      }

      setVraData(vraData)
    } catch (err) {
      setError(err instanceof Error ? err.message : lang === "ar" ? "فشل إنشاء خريطة VRA" : "VRA map generation failed")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    generateVRAMap()
  }, [fieldId, latitude, longitude])

  const exportVRAData = () => {
    if (!vraData) return

    const exportData = {
      field: vraData.fieldName,
      totalArea: vraData.totalArea,
      generatedAt: vraData.generatedAt,
      zones: vraData.zones.map(zone => ({
        name: zone.name,
        area: zone.area,
        priority: zone.recommendations.priority,
        recommendations: zone.recommendations,
        soilData: zone.soilData
      }))
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `vra-map-${vraData.fieldName}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const center = latitude && longitude ? [latitude, longitude] as [number, number] : [30.0444, 31.2357]

  if (loading) {
    return (
      <Card className="bg-black border-emerald-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            <span className="mr-2 text-emerald-300">
              {lang === "ar" ? "جاري إنشاء خريطة VRA..." : "Generating VRA map..."}
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
          <Button onClick={generateVRAMap} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
            <Layers className="h-4 w-4 mr-2" />
            {lang === "ar" ? "إعادة المحاولة" : "Retry"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!vraData) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-black border-emerald-500/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-emerald-300 flex items-center gap-2">
            <Layers className="h-5 w-5" />
            {lang === "ar" ? "خرائط التطبيق المتغير المعدل (VRA)" : "Variable Rate Application (VRA) Maps"}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/50">
              {vraData.fieldName}
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">
              {vraData.totalArea.toFixed(1)} {lang === "ar" ? "هكتار" : "ha"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">
                {lang === "ar" ? "عدد المناطق" : "Management zones"}: {vraData.zones.length}
              </p>
              <p className="text-white/70 text-sm">
                NDVI: {vraData.satelliteData.ndvi.toFixed(3)} | 
                NDMI: {vraData.satelliteData.ndmi.toFixed(3)} | 
                EVI: {vraData.satelliteData.evi.toFixed(3)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={generateVRAMap} size="sm" variant="outline" className="border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10">
                <Layers className="h-4 w-4 mr-2" />
                {lang === "ar" ? "تحديث" : "Refresh"}
              </Button>
              <Button onClick={exportVRAData} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Download className="h-4 w-4 mr-2" />
                {lang === "ar" ? "تصدير" : "Export"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card className="bg-black border-emerald-500/20">
        <CardContent className="p-0">
          <div style={{ height: "400px", width: "100%" }}>
            <MapContainer
              center={center}
              zoom={15}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="&copy; Esri"
              />
              <ZoneMap zones={vraData.zones} center={center} />
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vraData.zones.map((zone) => (
          <Card 
            key={zone.id} 
            className={`bg-black border-2 cursor-pointer transition-all ${
              selectedZone?.id === zone.id 
                ? "border-emerald-500 shadow-lg shadow-emerald-500/20" 
                : "border-emerald-500/20 hover:border-emerald-500/50"
            }`}
            onClick={() => setSelectedZone(zone)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-emerald-300 font-medium">{zone.name}</h3>
                <Badge 
                  className={`${getPriorityColor(zone.recommendations.priority)} text-white border-0`}
                >
                  {getPriorityText(zone.recommendations.priority, lang)}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">{lang === "ar" ? "المساحة" : "Area"}:</span>
                  <span className="text-white">{zone.area.toFixed(2)} ha</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">N:</span>
                    <span className="text-white">{zone.recommendations.nitrogen_rate} kg/ha</span>
                  </div>
                  <Progress value={(zone.recommendations.nitrogen_rate / 200) * 100} className="h-1 bg-gray-800" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">P:</span>
                    <span className="text-white">{zone.recommendations.phosphorus_rate} kg/ha</span>
                  </div>
                  <Progress value={(zone.recommendations.phosphorus_rate / 100) * 100} className="h-1 bg-gray-800" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">K:</span>
                    <span className="text-white">{zone.recommendations.potassium_rate} kg/ha</span>
                  </div>
                  <Progress value={(zone.recommendations.potassium_rate / 150) * 100} className="h-1 bg-gray-800" />
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-white/70 flex items-center">
                    <Droplets className="h-3 w-3 mr-1" />
                    {lang === "ar" ? "ري" : "Irrigation"}:
                  </span>
                  <span className="text-white">{zone.recommendations.irrigation_rate} mm/wk</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Zone Details */}
      {selectedZone && (
        <Card className="bg-black border-emerald-500/20">
          <CardHeader>
            <CardTitle className="text-emerald-300">
              {lang === "ar" ? "تفاصيل المنطقة" : "Zone Details"} - {selectedZone.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-medium mb-3">
                  {lang === "ar" ? "بيانات التربة" : "Soil Data"}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">pH:</span>
                    <span className="text-white">{selectedZone.soilData.ph.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">{lang === "ar" ? "نيتروجين" : "Nitrogen"}:</span>
                    <span className="text-white">{selectedZone.soilData.nitrogen.toFixed(1)} mg/kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">{lang === "ar" ? "فوسفور" : "Phosphorus"}:</span>
                    <span className="text-white">{selectedZone.soilData.phosphorus.toFixed(1)} mg/kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">{lang === "ar" ? "بوتاسيوم" : "Potassium"}:</span>
                    <span className="text-white">{selectedZone.soilData.potassium.toFixed(1)} mg/kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">{lang === "ar" ? "مادة عضوية" : "Organic Matter"}:</span>
                    <span className="text-white">{selectedZone.soilData.organic_matter.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">{lang === "ar" ? "رطوبة" : "Moisture"}:</span>
                    <span className="text-white">{selectedZone.soilData.moisture.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-3">
                  {lang === "ar" ? "معدلات التطبيق" : "Application Rates"}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">{lang === "ar" ? "نيتروجين" : "Nitrogen"}:</span>
                    <span className="text-emerald-300 font-medium">{selectedZone.recommendations.nitrogen_rate} kg/ha</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">{lang === "ar" ? "فوسفور" : "Phosphorus"}:</span>
                    <span className="text-emerald-300 font-medium">{selectedZone.recommendations.phosphorus_rate} kg/ha</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">{lang === "ar" ? "بوتاسيوم" : "Potassium"}:</span>
                    <span className="text-emerald-300 font-medium">{selectedZone.recommendations.potassium_rate} kg/ha</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70 flex items-center">
                      <Droplets className="h-3 w-3 mr-1" />
                      {lang === "ar" ? "ري" : "Irrigation"}:
                    </span>
                    <span className="text-emerald-300 font-medium">{selectedZone.recommendations.irrigation_rate} mm/wk</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">{lang === "ar" ? "الأولوية" : "Priority"}:</span>
                    <Badge className={`${getPriorityColor(selectedZone.recommendations.priority)} text-white border-0`}>
                      {getPriorityText(selectedZone.recommendations.priority, lang)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
