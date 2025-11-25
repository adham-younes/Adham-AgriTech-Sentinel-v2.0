"use client"

import type { GeoJSON } from "geojson"
import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Plus, 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle,
  AlertTriangle,
  Info,
  Leaf,
  Sprout,
  Bug,
  Eye,
  Calendar,
  MapPin,
  Activity,
  Droplets,
  Sun,
  Wind,
  Thermometer,
  Target,
  BarChart3,
  Satellite,
  TreePine,
  Beaker
} from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/use-language"

const SatelliteMap = dynamic(
  () => import("@/components/maps/farm-analytics-map").then((mod) => mod.FarmAnalyticsMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] w-full items-center justify-center rounded-xl border border-primary/20 bg-muted/40 text-sm text-muted-foreground">
        تحميل خريطة القمر الصناعي / Loading satellite map…
      </div>
    ),
  },
)

interface CropMonitoringData {
  id: string
  field_id: string
  monitoring_date: string
  ndvi_value: number
  chlorophyll_content: number
  leaf_area_index: number
  biomass_estimate: number
  growth_stage: string
  stress_indicators: string
  disease_risk: string
  pest_pressure: string
  yield_prediction: number
  water_stress: number
  temperature_stress: number
  crop_type?: string
  health_score?: number
  fields?: {
    id: string
    name: string
    area?: number
    boundary_coordinates?: GeoJSON
    farms?: {
      name: string
      latitude?: number
      longitude?: number
    }
  }
}

const professionalTranslations = {
  ar: {
    cropMonitoring: "مراقبة المحاصيل",
    lastMonitoring: "آخر مراقبة",
    ndviValue: "قيمة NDVI",
    chlorophyllContent: "محتوى الكلوروفيل",
    leafAreaIndex: "مؤشر مساحة الورقة",
    biomassEstimate: "تقدير الكتلة الحيوية",
    growthStage: "مرحلة النمو",
    stressIndicators: "مؤشرات الإجهاد",
    diseaseRisk: "مخاطر الأمراض",
    pestPressure: "ضغط الآفات",
    yieldPrediction: "توقعات المحصول",
    waterStress: "إجهاد المياه",
    temperatureStress: "إجهاد الحرارة",
    excellent: "ممتاز",
    good: "جيد",
    fair: "متوسط",
    poor: "ضعيف",
    optimal: "مثالي",
    high: "مرتفع",
    low: "منخفض",
    moderate: "متوسط",
    recommendations: "التوصيات",
    viewDetails: "عرض التفاصيل",
    addMonitoring: "إضافة مراقبة",
    noMonitoring: "لا توجد بيانات مراقبة",
    loading: "جاري التحميل...",
    field: "الحقل",
    farm: "المزرعة",
    date: "التاريخ",
    status: "الحالة",
    healthScore: "نقطة الصحة",
    vegetationHealth: "صحة الغطاء النباتي",
    growthAnalysis: "تحليل النمو",
    riskAssessment: "تقييم المخاطر",
    overallHealth: "الصحة العامة",
    needsAttention: "يحتاج انتباه",
    wellBalanced: "متوازن جيداً",
    excellentCondition: "حالة ممتازة",
    criticalIssues: "مشاكل حرجة",
    activeMonitoring: "مراقبة نشطة",
    satelliteData: "بيانات الأقمار الصناعية",
    growthTracking: "تتبع النمو",
    diseaseDetection: "كشف الأمراض",
    pestMonitoring: "مراقبة الآفات",
    yieldOptimization: "تحسين المحصول"
  },
  en: {
    cropMonitoring: "Crop Monitoring",
    lastMonitoring: "Last Monitoring",
    ndviValue: "NDVI Value",
    chlorophyllContent: "Chlorophyll Content",
    leafAreaIndex: "Leaf Area Index",
    biomassEstimate: "Biomass Estimate",
    growthStage: "Growth Stage",
    stressIndicators: "Stress Indicators",
    diseaseRisk: "Disease Risk",
    pestPressure: "Pest Pressure",
    yieldPrediction: "Yield Prediction",
    waterStress: "Water Stress",
    temperatureStress: "Temperature Stress",
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
    poor: "Poor",
    optimal: "Optimal",
    high: "High",
    low: "Low",
    moderate: "Moderate",
    recommendations: "Recommendations",
    viewDetails: "View Details",
    addMonitoring: "Add Monitoring",
    noMonitoring: "No monitoring data found",
    loading: "Loading...",
    field: "Field",
    farm: "Farm",
    date: "Date",
    status: "Status",
    healthScore: "Health Score",
    vegetationHealth: "Vegetation Health",
    growthAnalysis: "Growth Analysis",
    riskAssessment: "Risk Assessment",
    overallHealth: "Overall Health",
    needsAttention: "Needs Attention",
    wellBalanced: "Well Balanced",
    excellentCondition: "Excellent Condition",
    criticalIssues: "Critical Issues",
    activeMonitoring: "Active Monitoring",
    satelliteData: "Satellite Data",
    growthTracking: "Growth Tracking",
    diseaseDetection: "Disease Detection",
    pestMonitoring: "Pest Monitoring",
    yieldOptimization: "Yield Optimization"
  }
}

export default function ProfessionalCropMonitoringPage() {
  const { language, setLanguage } = useTranslation()
  const [monitoring, setMonitoring] = useState<CropMonitoringData[]>([])
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<"ar" | "en">(language === "en" ? "en" : "ar")
  const [activeMonitoring, setActiveMonitoring] = useState<CropMonitoringData | null>(null)

  const t = professionalTranslations[lang]

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    if (language === "ar" || language === "en") {
      setLang(language)
    }
  }, [language])

  useEffect(() => {
    fetchMonitoring()
  }, [])

  async function fetchMonitoring() {
    try {
      const { data, error } = await supabase
        .from("crop_monitoring")
        .select("*, fields(id, name, boundary_coordinates, farms(name, latitude, longitude))")
        .order("monitoring_date", { ascending: false })

      if (error) throw error
      setMonitoring(data || [])
      if (data && data.length > 0) {
        setActiveMonitoring(data[0])
      }
    } catch (error) {
      console.error("[Professional] Error fetching crop monitoring:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (value: number, optimal: { min: number; max: number }) => {
    if (value < optimal.min) return <TrendingDown className="h-4 w-4 text-orange-500" />
    if (value > optimal.max) return <TrendingUp className="h-4 w-4 text-red-500" />
    return <CheckCircle className="h-4 w-4 text-green-500" />
  }

  const getStatusColor = (value: number, optimal: { min: number; max: number }) => {
    if (value < optimal.min) return "text-orange-600 bg-orange-50 border-orange-200"
    if (value > optimal.max) return "text-red-600 bg-red-50 border-red-200"
    return "text-green-600 bg-green-50 border-green-200"
  }

  const getStatusText = (value: number, optimal: { min: number; max: number }) => {
    if (value < optimal.min) return t.low
    if (value > optimal.max) return t.high
    return t.optimal
  }

  const calculateHealthScore = (monitoring: CropMonitoringData) => {
    let score = 0

    // NDVI scoring (most important)
    const ndviScore = monitoring.ndvi_value >= 0.6 && monitoring.ndvi_value <= 0.8 ? 30 : 
                     monitoring.ndvi_value >= 0.4 && monitoring.ndvi_value <= 0.9 ? 20 : 10
    score += ndviScore

    // Chlorophyll scoring
    const chlorophyllScore = monitoring.chlorophyll_content >= 30 && monitoring.chlorophyll_content <= 50 ? 25 : 
                           monitoring.chlorophyll_content >= 20 && monitoring.chlorophyll_content <= 60 ? 15 : 5
    score += chlorophyllScore

    // Leaf Area Index scoring
    const laiScore = monitoring.leaf_area_index >= 2.0 && monitoring.leaf_area_index <= 4.0 ? 20 : 
                   monitoring.leaf_area_index >= 1.5 && monitoring.leaf_area_index <= 5.0 ? 15 : 5
    score += laiScore

    // Biomass scoring
    const biomassScore = monitoring.biomass_estimate >= 50 && monitoring.biomass_estimate <= 80 ? 15 : 
                       monitoring.biomass_estimate >= 30 && monitoring.biomass_estimate <= 100 ? 10 : 5
    score += biomassScore

    // Stress penalties
    if (monitoring.water_stress > 0.3) score -= 10
    if (monitoring.temperature_stress > 0.3) score -= 10
    if (monitoring.disease_risk === "high" || monitoring.pest_pressure === "high") score -= 15

    return Math.max(0, Math.min(100, score))
  }

  const getHealthStatus = (score: number) => {
    if (score >= 85) return { status: t.excellentCondition, color: "bg-emerald-500", textColor: "text-emerald-700", borderColor: "border-emerald-200" }
    if (score >= 70) return { status: t.wellBalanced, color: "bg-green-500", textColor: "text-green-700", borderColor: "border-green-200" }
    if (score >= 50) return { status: t.needsAttention, color: "bg-yellow-500", textColor: "text-yellow-700", borderColor: "border-yellow-200" }
    return { status: t.criticalIssues, color: "bg-red-500", textColor: "text-red-700", borderColor: "border-red-200" }
  }

  const getRecommendations = (monitoring: CropMonitoringData) => {
    const recommendations = []
    
    if (monitoring.ndvi_value < 0.4) {
      recommendations.push(lang === "ar" ? "تحسين صحة المحصول من خلال التسميد المتوازن" : "Improve crop health through balanced fertilization")
    }
    if (monitoring.chlorophyll_content < 25) {
      recommendations.push(lang === "ar" ? "إضافة أسمدة تحتوي على النيتروجين والحديد" : "Add nitrogen and iron-containing fertilizers")
    }
    if (monitoring.water_stress > 0.4) {
      recommendations.push(lang === "ar" ? "زيادة الري أو تحسين كفاءة استخدام المياه" : "Increase irrigation or improve water use efficiency")
    }
    if (monitoring.temperature_stress > 0.4) {
      recommendations.push(lang === "ar" ? "تطبيق تقنيات تبريد أو تظليل" : "Apply cooling or shading techniques")
    }
    if (monitoring.disease_risk === "high") {
      recommendations.push(lang === "ar" ? "فحص الأمراض وتطبيق مبيدات الفطريات الوقائية" : "Conduct disease inspection and apply preventive fungicides")
    }
    if (monitoring.pest_pressure === "high") {
      recommendations.push(lang === "ar" ? "مراقبة الآفات وتطبيق إدارة الآفات المتكاملة" : "Monitor pests and implement integrated pest management")
    }

    return recommendations
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-emerald-200">{t.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">
            {t.cropMonitoring}
          </h1>
          <p className="text-gray-400 mt-2">
            {lang === "ar" 
              ? "مراقبة شاملة لصحة المحاصيل ونموها باستخدام بيانات الأقمار الصناعية والذكاء الاصطناعي"
              : "Comprehensive crop health and growth monitoring using satellite data and AI"
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/crop-monitoring/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Leaf className="h-4 w-4 mr-2" />
              {t.addMonitoring}
            </Button>
          </Link>
        </div>
      </div>

      {monitoring.length === 0 ? (
        <Card className="p-12 text-center">
          <Leaf className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">{t.noMonitoring}</h3>
          <p className="text-gray-400 mb-6">
            {lang === "ar" 
              ? "ابدأ بإضافة بيانات مراقبة المحاصيل لتتبع صحة ونمو محاصيلك"
              : "Start by adding crop monitoring data to track your crop health and growth"
            }
          </p>
          <Link href="/dashboard/crop-monitoring/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Leaf className="h-4 w-4 mr-2" />
              {t.addMonitoring}
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Monitoring with Map */}
          {activeMonitoring && (
            <Card className="overflow-hidden border-2 border-emerald-200 bg-white/95 backdrop-blur-sm">
              <div className="h-3 bg-gradient-to-r from-emerald-500 to-green-500" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {activeMonitoring.fields?.name || "Unknown Field"}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                        {activeMonitoring.fields?.farms?.name || "Unknown Farm"}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(activeMonitoring.monitoring_date).toLocaleDateString(
                          lang === "ar" ? "ar-EG" : "en-US"
                        )}
                      </span>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        {t.activeMonitoring}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Satellite Map */}
                {activeMonitoring && activeMonitoring.fields?.boundary_coordinates && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Satellite className="h-5 w-5 text-emerald-600" />
                      <span className="text-lg font-semibold text-gray-800">{t.satelliteData}</span>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-emerald-200">
                      <SatelliteMap
                        fields={[{
                          id: activeMonitoring.field_id,
                          name: activeMonitoring.fields?.name || "Unknown Field",
                          areaFeddan: activeMonitoring.fields?.area || 1,
                          center: [
                            activeMonitoring.fields?.farms?.longitude || 31.2,
                            activeMonitoring.fields?.farms?.latitude || 30.0
                          ],
                          polygon: (activeMonitoring.fields?.boundary_coordinates?.type === 'Polygon' 
                            ? activeMonitoring.fields.boundary_coordinates.coordinates[0] 
                            : [
                                [31.2, 30.0],
                                [31.21, 30.0],
                                [31.21, 30.01],
                                [31.2, 30.01]
                              ]) as [number, number][],
                          crop: activeMonitoring.crop_type || null,
                          health: activeMonitoring.health_score || 50
                        }]}
                        height={400}
                      />
                    </div>
                  </div>
                )}

                {/* Professional Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {/* NDVI Value */}
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium text-gray-700">{t.ndviValue}</span>
                      </div>
                      {activeMonitoring && getStatusIcon(activeMonitoring.ndvi_value, { min: 0.6, max: 0.8 })}
                    </div>
                    <div className="text-2xl font-bold text-emerald-700 mb-1">
                      {activeMonitoring ? activeMonitoring.ndvi_value.toFixed(2) : '--'}
                    </div>
                    <div className="text-xs text-emerald-600">
                      {activeMonitoring ? getStatusText(activeMonitoring.ndvi_value, { min: 0.6, max: 0.8 }) : '--'}
                    </div>
                  </div>

                  {/* Chlorophyll Content */}
                  <div className="p-4 bg-gradient-to-br from-lime-50 to-green-50 rounded-lg border border-lime-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Leaf className="h-4 w-4 text-lime-600" />
                        <span className="text-sm font-medium text-gray-700">{t.chlorophyllContent}</span>
                      </div>
                      {activeMonitoring && getStatusIcon(activeMonitoring.chlorophyll_content, { min: 30, max: 50 })}
                    </div>
                    <div className="text-2xl font-bold text-lime-700 mb-1">
                      {activeMonitoring ? activeMonitoring.chlorophyll_content.toFixed(0) : '--'}
                    </div>
                    <div className="text-xs text-lime-600">
                      {activeMonitoring ? getStatusText(activeMonitoring.chlorophyll_content, { min: 30, max: 50 }) : '--'} μg/cm²
                    </div>
                  </div>

                  {/* Leaf Area Index */}
                  <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Sprout className="h-4 w-4 text-teal-600" />
                        <span className="text-sm font-medium text-gray-700">{t.leafAreaIndex}</span>
                      </div>
                      {activeMonitoring && getStatusIcon(activeMonitoring.leaf_area_index, { min: 2.0, max: 4.0 })}
                    </div>
                    <div className="text-2xl font-bold text-teal-700 mb-1">
                      {activeMonitoring ? activeMonitoring.leaf_area_index.toFixed(1) : '--'}
                    </div>
                    <div className="text-xs text-teal-600">
                      {activeMonitoring ? getStatusText(activeMonitoring.leaf_area_index, { min: 2.0, max: 4.0 }) : '--'} m²/m²
                    </div>
                  </div>

                  {/* Biomass Estimate */}
                  <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TreePine className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-gray-700">{t.biomassEstimate}</span>
                      </div>
                      {activeMonitoring && getStatusIcon(activeMonitoring.biomass_estimate, { min: 50, max: 80 })}
                    </div>
                    <div className="text-2xl font-bold text-amber-700 mb-1">
                      {activeMonitoring ? activeMonitoring.biomass_estimate.toFixed(0) : '--'}
                    </div>
                    <div className="text-xs text-amber-600">
                      {activeMonitoring ? getStatusText(activeMonitoring.biomass_estimate, { min: 50, max: 80 }) : '--'} t/ha
                    </div>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Water Stress */}
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{t.waterStress}</span>
                      {activeMonitoring && getStatusIcon(activeMonitoring.water_stress * 100, { min: 0, max: 30 })}
                    </div>
                    <div className="text-lg font-bold text-blue-700">
                      {activeMonitoring ? (activeMonitoring.water_stress * 100).toFixed(0) : '--'}%
                    </div>
                  </div>

                  {/* Temperature Stress */}
                  <div className="p-3 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{t.temperatureStress}</span>
                      {activeMonitoring && getStatusIcon(activeMonitoring.temperature_stress * 100, { min: 0, max: 30 })}
                    </div>
                    <div className="text-lg font-bold text-red-700">
                      {activeMonitoring ? (activeMonitoring.temperature_stress * 100).toFixed(0) : '--'}%
                    </div>
                  </div>

                  {/* Yield Prediction */}
                  <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{t.yieldPrediction}</span>
                      <Target className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="text-lg font-bold text-purple-700">
                      {activeMonitoring ? activeMonitoring.yield_prediction.toFixed(1) : '--'} t/ha
                    </div>
                  </div>
                </div>

                {/* Health Score */}
                {activeMonitoring && (() => {
                  const healthScore = calculateHealthScore(activeMonitoring)
                  const healthStatus = getHealthStatus(healthScore)
                  const recommendations = getRecommendations(activeMonitoring)

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                        <div className="flex items-center gap-3">
                          <div className={`relative w-16 h-16 rounded-full ${healthStatus.color} flex items-center justify-center`}>
                            <span className="text-xl font-bold text-white">{healthScore}</span>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center">
                              {healthScore >= 70 ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : healthScore >= 50 ? (
                                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                              ) : (
                                <AlertTriangle className="h-3 w-3 text-red-500" />
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-gray-800">{t.overallHealth}</div>
                            <div className="text-sm text-gray-600">{healthStatus.status}</div>
                          </div>
                        </div>
                        <div className="flex-1 max-w-xs">
                          <Progress value={healthScore} className="h-3" />
                        </div>
                      </div>

                      {/* Recommendations */}
                      {recommendations.length > 0 && (
                        <Alert className="border-blue-200 bg-blue-50">
                          <Info className="h-4 w-4 text-blue-600" />
                          <AlertDescription>
                            <div className="font-medium text-blue-900 mb-2">{t.recommendations}:</div>
                            <ul className="text-sm text-blue-800 space-y-1">
                              {recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-blue-600 mt-0.5">•</span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )
                })()}
              </div>
            </Card>
          )}

          {/* Historical Monitoring List */}
          {monitoring.length > 1 && (
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {lang === "ar" ? "سجل المراقبة السابق" : "Previous Monitoring Records"}
              </h3>
              <div className="space-y-3">
                {monitoring.slice(1).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-800">
                          {calculateHealthScore(record)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t.healthScore}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">
                          {record.fields?.name || "Unknown Field"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(record.monitoring_date).toLocaleDateString(
                            lang === "ar" ? "ar-EG" : "en-US"
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm">
                        <div className="text-gray-600">NDVI: {record.ndvi_value.toFixed(2)}</div>
                        <div className="text-gray-600">{t.yieldPrediction}: {record.yield_prediction.toFixed(1)} t/ha</div>
                      </div>
                      <Link href={`/dashboard/crop-monitoring/${record.id}`}>
                        <Button variant="outline" size="sm">
                          {t.viewDetails}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
