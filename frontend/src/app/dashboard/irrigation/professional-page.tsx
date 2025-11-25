"use client"

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
  Droplets,
  Calendar,
  MapPin,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Info,
  Activity,
  Thermometer,
  Sun,
  Wind,
  Beaker,
  Target,
  BarChart3,
  Settings,
  Zap,
  CloudRain,
  Gauge,
  Timer,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/use-language"
import { isFeatureEnabled } from "@/lib/config/feature-flags"
import { fetchSatelliteInsights } from "@/lib/client/satellite-insights"
import type { SatelliteInsightsMap } from "@/lib/types/satellite"

interface IrrigationSystemData {
  id: string
  field_id: string
  system_type: string
  flow_rate: number
  pressure: number
  efficiency: number
  last_maintenance: string
  next_maintenance: string
  water_source: string
  energy_consumption: number
  coverage_area: number
  automation_level: string
  sensor_integration: boolean
  schedule: string
  status: string
  fields?: {
    name: string
    farms?: {
      name: string
    }
  }
}

const professionalTranslations = {
  ar: {
    irrigationManagement: "إدارة الري",
    lastIrrigation: "آخر ري",
    systemType: "نوع النظام",
    flowRate: "معدل التدفق",
    pressure: "الضغط",
    efficiency: "الكفاءة",
    lastMaintenance: "آخر صيانة",
    nextMaintenance: "الصيانة التالية",
    waterSource: "مصدر المياه",
    energyConsumption: "استهلاك الطاقة",
    coverageArea: "منطقة التغطية",
    automationLevel: "مستوى الأتمتة",
    sensorIntegration: "تكامل المستشعرات",
    schedule: "الجدولة",
    status: "الحالة",
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
    addSystem: "إضافة نظام",
    noSystems: "لا توجد أنظمة ري",
    loading: "جاري التحميل...",
    field: "الحقل",
    farm: "المزرعة",
    date: "التاريخ",
    healthScore: "نقطة الصحة",
    waterEfficiency: "كفاءة المياه",
    energyUsage: "استهلاك الطاقة",
    systemPerformance: "أداء النظام",
    overallHealth: "الصحة العامة",
    needsAttention: "يحتاج انتباه",
    wellBalanced: "متوازن جيداً",
    excellentCondition: "حالة ممتازة",
    criticalIssues: "مشاكل حرجة",
    activeSystems: "الأنظمة النشطة",
    waterUsage: "استخدام المياه",
    maintenanceRequired: "صيانة مطلوبة",
    sensorData: "بيانات المستشعرات",
    automatedIrrigation: "ري آلي",
    waterConservation: "حفظ المياه",
    energyOptimization: "تحسين الطاقة",
    predictiveMaintenance: "صيانة تنبؤية"
  },
  en: {
    irrigationManagement: "Irrigation Management",
    lastIrrigation: "Last Irrigation",
    systemType: "System Type",
    flowRate: "Flow Rate",
    pressure: "Pressure",
    efficiency: "Efficiency",
    lastMaintenance: "Last Maintenance",
    nextMaintenance: "Next Maintenance",
    waterSource: "Water Source",
    energyConsumption: "Energy Consumption",
    coverageArea: "Coverage Area",
    automationLevel: "Automation Level",
    sensorIntegration: "Sensor Integration",
    schedule: "Schedule",
    status: "Status",
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
    addSystem: "Add System",
    noSystems: "No irrigation systems found",
    loading: "Loading...",
    field: "Field",
    farm: "Farm",
    date: "Date",
    healthScore: "Health Score",
    waterEfficiency: "Water Efficiency",
    energyUsage: "Energy Usage",
    systemPerformance: "System Performance",
    overallHealth: "Overall Health",
    needsAttention: "Needs Attention",
    wellBalanced: "Well Balanced",
    excellentCondition: "Excellent Condition",
    criticalIssues: "Critical Issues",
    activeSystems: "Active Systems",
    waterUsage: "Water Usage",
    maintenanceRequired: "Maintenance Required",
    sensorData: "Sensor Data",
    automatedIrrigation: "Automated Irrigation",
    waterConservation: "Water Conservation",
    energyOptimization: "Energy Optimization",
    predictiveMaintenance: "Predictive Maintenance"
  }
}

export default function ProfessionalIrrigationPage() {
  const { language, setLanguage } = useTranslation()
  const [systems, setSystems] = useState<IrrigationSystemData[]>([])
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<"ar" | "en">(language === "en" ? "en" : "ar")
  const satelliteEnabled = isFeatureEnabled("soilAnalysisAutomation")
  const [fieldInsights, setFieldInsights] = useState<SatelliteInsightsMap>({})
  const [satelliteSyncing, setSatelliteSyncing] = useState(false)

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
    fetchSystems()
  }, [])

  useEffect(() => {
    if (!satelliteEnabled || systems.length === 0) return

    const uniqueFieldIds = Array.from(
      new Set(
        systems
          .map((system) => system.field_id)
          .filter((value): value is string => typeof value === "string" && value.length > 0),
      ),
    )
    const pending = uniqueFieldIds.filter((fieldId) => !fieldInsights[fieldId])
    if (pending.length === 0) return

    setSatelliteSyncing(true)
    fetchSatelliteInsights(pending)
      .then((insights) => {
        setFieldInsights((prev) => ({ ...prev, ...insights }))
      })
      .catch((error) => {
        console.error("[Irrigation] Failed to sync satellite insights:", error)
      })
      .finally(() => {
        setSatelliteSyncing(false)
      })
  }, [systems, satelliteEnabled, fieldInsights])

  async function fetchSystems() {
    try {
      const { data, error } = await supabase
        .from("irrigation_systems")
        .select("*, fields(name, farms(name))")
        .order("created_at", { ascending: false })

      if (error) throw error
      setSystems(data || [])
    } catch (error) {
      console.error("[Professional] Error fetching irrigation systems:", error)
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

  const calculateHealthScore = (system: IrrigationSystemData) => {
    let score = 0

    // Efficiency scoring (most important)
    const efficiencyScore = system.efficiency >= 75 && system.efficiency <= 90 ? 30 :
      system.efficiency >= 60 && system.efficiency <= 95 ? 20 : 10
    score += efficiencyScore

    // Flow rate scoring
    const flowScore = system.flow_rate >= 10 && system.flow_rate <= 50 ? 20 :
      system.flow_rate >= 5 && system.flow_rate <= 100 ? 15 : 5
    score += flowScore

    // Pressure scoring
    const pressureScore = system.pressure >= 20 && system.pressure <= 60 ? 20 :
      system.pressure >= 15 && system.pressure <= 80 ? 15 : 5
    score += pressureScore

    // Energy consumption scoring (lower is better)
    const energyScore = system.energy_consumption <= 5 ? 15 :
      system.energy_consumption <= 10 ? 10 : 5
    score += energyScore

    // Coverage area scoring
    const coverageScore = system.coverage_area >= 50 && system.coverage_area <= 200 ? 15 :
      system.coverage_area >= 20 && system.coverage_area <= 300 ? 10 : 5
    score += coverageScore

    // Automation and sensor integration bonuses
    if (system.automation_level === "full") score += 10
    else if (system.automation_level === "semi") score += 5
    if (system.sensor_integration) score += 10

    return Math.max(0, Math.min(100, score))
  }

  const getHealthStatus = (score: number) => {
    if (score >= 85) return { status: t.excellentCondition, color: "bg-emerald-500", textColor: "text-emerald-700", borderColor: "border-emerald-200" }
    if (score >= 70) return { status: t.wellBalanced, color: "bg-green-500", textColor: "text-green-700", borderColor: "border-green-200" }
    if (score >= 50) return { status: t.needsAttention, color: "bg-yellow-500", textColor: "text-yellow-700", borderColor: "border-yellow-200" }
    return { status: t.criticalIssues, color: "bg-red-500", textColor: "text-red-700", borderColor: "border-red-200" }
  }

  const getRecommendations = (system: IrrigationSystemData) => {
    const recommendations = []

    if (system.efficiency < 60) {
      recommendations.push(lang === "ar" ? "تحسين كفاءة النظام من خلال الصيانة الدورية" : "Improve system efficiency through regular maintenance")
    }
    if (system.pressure < 20 || system.pressure > 60) {
      recommendations.push(lang === "ar" ? "ضبط الضغط إلى المستوى المثالي (20-60 PSI)" : "Adjust pressure to optimal level (20-60 PSI)")
    }
    if (system.energy_consumption > 10) {
      recommendations.push(lang === "ar" ? "تقليل استهلاك الطاقة باستخدام مضخات كفاءة" : "Reduce energy consumption using efficient pumps")
    }
    if (!system.sensor_integration) {
      recommendations.push(lang === "ar" ? "دمج مستشعرات التربة والطقس للري الذكي" : "Integrate soil and weather sensors for smart irrigation")
    }
    if (system.automation_level === "manual") {
      recommendations.push(lang === "ar" ? "ترقية إلى نظام شبه آلي أو آلي بالكامل" : "Upgrade to semi-automated or fully automated system")
    }

    // Check maintenance requirements
    const daysSinceMaintenance = system.last_maintenance ?
      Math.floor((Date.now() - new Date(system.last_maintenance).getTime()) / (1000 * 60 * 60 * 24)) : 365
    if (daysSinceMaintenance > 90) {
      recommendations.push(lang === "ar" ? "إجراء صيانة دورية للنظام" : "Perform regular system maintenance")
    }

    return recommendations
  }

  const getSystemTypeIcon = (type: string) => {
    const icons = {
      drip: <Droplets className="h-5 w-5 text-blue-600" />,
      sprinkler: <CloudRain className="h-5 w-5 text-cyan-600" />,
      flood: <Activity className="h-5 w-5 text-emerald-600" />,
      pivot: <Settings className="h-5 w-5 text-purple-600" />,
      micro: <Zap className="h-5 w-5 text-amber-600" />
    }
    return icons[type as keyof typeof icons] || <Droplets className="h-5 w-5 text-blue-600" />
  }

  const getSystemTypeLabel = (type: string) => {
    const labels = {
      drip: lang === "ar" ? "ري بالتنقيط" : "Drip Irrigation",
      sprinkler: lang === "ar" ? "ري بالرش" : "Sprinkler Irrigation",
      flood: lang === "ar" ? "ري بالغمر" : "Flood Irrigation",
      pivot: lang === "ar" ? "ري المحوري" : "Pivot Irrigation",
      micro: lang === "ar" ? "ري بالتنقيط الدقيق" : "Micro Irrigation"
    }
    return labels[type as keyof typeof labels] || type
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
            {t.irrigationManagement}
          </h1>
          <p className="text-gray-400 mt-2">
            {lang === "ar"
              ? "إدارة أنظمة الري بكفاءة عالية باستخدام تقنيات متقدمة وبيانات الأقمار الصناعية"
              : "High-efficiency irrigation management using advanced technologies and satellite data"
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/irrigation/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Droplets className="h-4 w-4 mr-2" />
              {t.addSystem}
            </Button>
          </Link>
        </div>
      </div>

      {/* Satellite Sync Status */}
      {satelliteEnabled && (
        <Alert className="border-blue-200 bg-blue-50">
          <Activity className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            {satelliteSyncing ? (
              <span className="text-blue-800">
                {lang === "ar" ? "جاري مزامنة بيانات الأقمار الصناعية..." : "Syncing satellite data..."}
              </span>
            ) : (
              <span className="text-blue-800">
                {lang === "ar"
                  ? `تمت مزامنة بيانات الأقمار الصناعية لـ ${Object.keys(fieldInsights).length} حقل`
                  : `Satellite data synced for ${Object.keys(fieldInsights).length} fields`
                }
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {systems.length === 0 ? (
        <Card className="p-12 text-center">
          <Droplets className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">{t.noSystems}</h3>
          <p className="text-gray-400 mb-6">
            {lang === "ar"
              ? "ابدأ بإضافة أنظمة الري لإدارة استهلاك المياه بكفاءة"
              : "Start by adding irrigation systems to manage water consumption efficiently"
            }
          </p>
          <Link href="/dashboard/irrigation/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Droplets className="h-4 w-4 mr-2" />
              {t.addSystem}
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Systems Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-700">{systems.length}</div>
                  <div className="text-sm text-blue-600">{t.activeSystems}</div>
                </div>
                <Droplets className="h-8 w-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-emerald-700">
                    {systems.filter(s => s.efficiency >= 70).length}
                  </div>
                  <div className="text-sm text-emerald-600">{t.waterEfficiency}</div>
                </div>
                <Gauge className="h-8 w-8 text-emerald-500" />
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-amber-700">
                    {systems.filter(s => s.sensor_integration).length}
                  </div>
                  <div className="text-sm text-amber-600">{t.sensorData}</div>
                </div>
                <Activity className="h-8 w-8 text-amber-500" />
              </div>
            </Card>
          </div>

          {/* Systems List */}
          <div className="space-y-4">
            {systems.map((system) => {
              const healthScore = calculateHealthScore(system)
              const healthStatus = getHealthStatus(healthScore)
              const recommendations = getRecommendations(system)
              const fieldInsight = fieldInsights[system.field_id]

              return (
                <Card key={system.id} className={`overflow-hidden border-2 ${healthStatus.borderColor} bg-white/95 backdrop-blur-sm`}>
                  {/* Health Status Header */}
                  <div className={`h-3 ${healthStatus.color}`} />

                  <div className="p-6">
                    {/* System Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          {getSystemTypeIcon(system.system_type)}
                          <h3 className="text-xl font-bold text-gray-900">
                            {system.fields?.name || "Unknown Field"}
                          </h3>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            {getSystemTypeLabel(system.system_type)}
                          </Badge>
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                            {system.fields?.farms?.name || "Unknown Farm"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {system.last_maintenance ?
                              new Date(system.last_maintenance).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") :
                              lang === "ar" ? "غير محدد" : "Not specified"
                            }
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {system.coverage_area.toFixed(1)} {lang === "ar" ? "فدان" : "feddan"}
                          </span>
                        </div>
                      </div>

                      {/* Health Score */}
                      <div className="text-center">
                        <div className={`relative w-20 h-20 rounded-full ${healthStatus.color} flex items-center justify-center`}>
                          <span className="text-2xl font-bold text-white">{healthScore}</span>
                          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center">
                            {healthScore >= 70 ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : healthScore >= 50 ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{healthStatus.status}</div>
                      </div>
                    </div>

                    {/* Professional Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {/* Flow Rate */}
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Droplets className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">{t.flowRate}</span>
                          </div>
                          {getStatusIcon(system.flow_rate, { min: 10, max: 50 })}
                        </div>
                        <div className="text-2xl font-bold text-blue-700 mb-1">{system.flow_rate.toFixed(1)}</div>
                        <div className="text-xs text-blue-600">{getStatusText(system.flow_rate, { min: 10, max: 50 })} L/s</div>
                      </div>

                      {/* Pressure */}
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Gauge className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium text-gray-700">{t.pressure}</span>
                          </div>
                          {getStatusIcon(system.pressure, { min: 20, max: 60 })}
                        </div>
                        <div className="text-2xl font-bold text-purple-700 mb-1">{system.pressure.toFixed(0)}</div>
                        <div className="text-xs text-purple-600">{getStatusText(system.pressure, { min: 20, max: 60 })} PSI</div>
                      </div>

                      {/* Efficiency */}
                      <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm font-medium text-gray-700">{t.efficiency}</span>
                          </div>
                          {getStatusIcon(system.efficiency, { min: 75, max: 90 })}
                        </div>
                        <div className="text-2xl font-bold text-emerald-700 mb-1">{system.efficiency.toFixed(0)}</div>
                        <div className="text-xs text-emerald-600">{getStatusText(system.efficiency, { min: 75, max: 90 })}%</div>
                      </div>

                      {/* Energy Consumption */}
                      <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-medium text-gray-700">{t.energyConsumption}</span>
                          </div>
                          {getStatusIcon(10 - system.energy_consumption, { min: 5, max: 10 })}
                        </div>
                        <div className="text-2xl font-bold text-amber-700 mb-1">{system.energy_consumption.toFixed(1)}</div>
                        <div className="text-xs text-amber-600">kWh/day</div>
                      </div>
                    </div>

                    {/* Advanced Properties */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {/* Automation Level */}
                      <div className="p-3 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">{t.automationLevel}</span>
                          <Settings className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="text-lg font-bold text-indigo-700">
                          {system.automation_level === "full" ? (lang === "ar" ? "كامل" : "Full") :
                            system.automation_level === "semi" ? (lang === "ar" ? "نصف آلي" : "Semi") :
                              (lang === "ar" ? "يدوي" : "Manual")}
                        </div>
                      </div>

                      {/* Sensor Integration */}
                      <div className="p-3 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">{t.sensorIntegration}</span>
                          <Activity className="h-4 w-4 text-teal-600" />
                        </div>
                        <div className="text-lg font-bold text-teal-700">
                          {system.sensor_integration ?
                            (lang === "ar" ? "مدمج" : "Integrated") :
                            (lang === "ar" ? "غير مدمج" : "Not Integrated")}
                        </div>
                      </div>

                      {/* Water Source */}
                      <div className="p-3 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">{t.waterSource}</span>
                          <Droplets className="h-4 w-4 text-cyan-600" />
                        </div>
                        <div className="text-lg font-bold text-cyan-700">{system.water_source}</div>
                      </div>
                    </div>

                    {/* Satellite Insights */}
                    {fieldInsight && (
                      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Activity className="h-5 w-5 text-blue-600" />
                          <span className="text-lg font-semibold text-gray-800">
                            {lang === "ar" ? "رؤى الأقمار الصناعية" : "Satellite Insights"}
                          </span>
                          {/* Health Progress Bar */}
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">{t.overallHealth}</span>
                              <span className="text-sm text-gray-500">{healthScore}%</span>
                            </div>
                            <Progress value={healthScore} className="h-3" />
                          </div>

                          {/* Recommendations */}
                          {recommendations.length > 0 && (
                            <Alert className="mb-6 border-blue-200 bg-blue-50">
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

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Link href={`/dashboard/irrigation/${system.id}`}>
                              <Button variant="outline" className="flex-1 border-blue-200 hover:bg-blue-50">
                                {t.viewDetails}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

