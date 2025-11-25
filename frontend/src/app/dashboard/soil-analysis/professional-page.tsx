"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Beaker,
  Droplets,
  Thermometer,
  Leaf,
  Bug,
  Sun,
  Wind,
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar,
  MapPin,
  Sprout,
  TreePine,
  FlaskConical
} from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/use-language"
import { formatDateSafe } from "@/lib/utils/date-safe"

interface SoilAnalysisData {
  id: string
  field_id: string
  analysis_date: string
  ph_level: number
  nitrogen: number
  phosphorus: number
  potassium: number
  organic_matter: number
  electrical_conductivity: number
  moisture_content: number
  texture_type: string
  color: string
  structure: string
  temperature: number
  salinity: number
  fields?: {
    name: string
    farms?: {
      name: string
    }
  }
}

const professionalTranslations = {
  ar: {
    soilAnalysis: "تحليل التربة",
    lastAnalysis: "آخر تحليل",
    phLevel: "مستوى pH",
    nitrogen: "النيتروجين",
    phosphorus: "الفوسفور",
    potassium: "البوتاسيوم",
    organicMatter: "المادة العضوية",
    electricalConductivity: "التوصيل الكهربائي",
    moistureContent: "محتوى الرطوبة",
    textureType: "نسيج التربة",
    structure: "بنية التربة",
    temperature: "درجة الحرارة",
    salinity: "الملوحة",
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
    addAnalysis: "إضافة تحليل",
    noAnalyses: "لا توجد تحليلات",
    loading: "جاري التحميل...",
    field: "الحقل",
    farm: "المزرعة",
    date: "التاريخ",
    status: "الحالة",
    healthScore: "نقطة الصحة",
    nutrients: "العناصر الغذائية",
    physicalProperties: "الخصائص الفيزيائية",
    chemicalProperties: "الخصائص الكيميائية",
    overallHealth: "الصحة العامة",
    needsAttention: "يحتاج انتباه",
    wellBalanced: "متوازن جيداً",
    excellentCondition: "حالة ممتازة",
    criticalIssues: "مشاكل حرجة"
  },
  en: {
    soilAnalysis: "Soil Analysis",
    lastAnalysis: "Last Analysis",
    phLevel: "pH Level",
    nitrogen: "Nitrogen",
    phosphorus: "Phosphorus",
    potassium: "Potassium",
    organicMatter: "Organic Matter",
    electricalConductivity: "Electrical Conductivity",
    moistureContent: "Moisture Content",
    textureType: "Soil Texture",
    structure: "Soil Structure",
    temperature: "Temperature",
    salinity: "Salinity",
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
    addAnalysis: "Add Analysis",
    noAnalyses: "No analyses found",
    loading: "Loading...",
    field: "Field",
    farm: "Farm",
    date: "Date",
    status: "Status",
    healthScore: "Health Score",
    nutrients: "Nutrients",
    physicalProperties: "Physical Properties",
    chemicalProperties: "Chemical Properties",
    overallHealth: "Overall Health",
    needsAttention: "Needs Attention",
    wellBalanced: "Well Balanced",
    excellentCondition: "Excellent Condition",
    criticalIssues: "Critical Issues"
  }
}

export default function ProfessionalSoilAnalysisPage() {
  const { language, setLanguage } = useTranslation()
  const [analyses, setAnalyses] = useState<SoilAnalysisData[]>([])
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<"ar" | "en">(language === "en" ? "en" : "ar")

  const t = professionalTranslations[lang]

  const supabase = createClient()

  useEffect(() => {
    if (language === "ar" || language === "en") {
      setLang(language)
    }
  }, [language])

  useEffect(() => {
    fetchAnalyses()
  }, [])

  async function fetchAnalyses() {
    try {
      const { data, error } = await supabase
        .from("soil_analysis")
        .select("*, fields(name, farms(name))")
        .order("analysis_date", { ascending: false })

      if (error) throw error
      setAnalyses(data || [])
    } catch (error) {
      console.error("[Professional] Error fetching soil analyses:", error)
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

  const calculateHealthScore = (analysis: SoilAnalysisData) => {
    let score = 0
    let factors = 0

    // pH scoring (most important)
    const phScore = analysis.ph_level >= 6.0 && analysis.ph_level <= 7.5 ? 25 :
      analysis.ph_level >= 5.5 && analysis.ph_level <= 8.0 ? 15 : 0
    score += phScore
    factors++

    // NPK scoring
    const npkScore = (analysis.nitrogen >= 20 && analysis.nitrogen <= 40 ? 20 : 0) +
      (analysis.phosphorus >= 15 && analysis.phosphorus <= 30 ? 20 : 0) +
      (analysis.potassium >= 150 && analysis.potassium <= 300 ? 20 : 0)
    score += npkScore / 3
    factors++

    // Organic matter
    const omScore = analysis.organic_matter >= 2.0 && analysis.organic_matter <= 5.0 ? 20 : 0
    score += omScore
    factors++

    // Electrical conductivity (salinity indicator)
    const ecScore = analysis.electrical_conductivity <= 2.0 ? 15 :
      analysis.electrical_conductivity <= 4.0 ? 10 : 0
    score += ecScore
    factors++

    // Moisture content
    const moistureScore = analysis.moisture_content >= 15 && analysis.moisture_content <= 35 ? 20 : 10
    score += moistureScore
    factors++

    return Math.round(score)
  }

  const getHealthStatus = (score: number) => {
    if (score >= 85) return { status: t.excellentCondition, color: "bg-emerald-500", textColor: "text-emerald-700", borderColor: "border-emerald-200" }
    if (score >= 70) return { status: t.wellBalanced, color: "bg-green-500", textColor: "text-green-700", borderColor: "border-green-200" }
    if (score >= 50) return { status: t.needsAttention, color: "bg-yellow-500", textColor: "text-yellow-700", borderColor: "border-yellow-200" }
    return { status: t.criticalIssues, color: "bg-red-500", textColor: "text-red-700", borderColor: "border-red-200" }
  }

  const getRecommendations = (analysis: SoilAnalysisData) => {
    const recommendations = []

    if (analysis.ph_level < 6.0) {
      recommendations.push(lang === "ar" ? "إضافة ليمون أو كالسيوم لرفع مستوى pH" : "Add lime or calcium to raise pH level")
    } else if (analysis.ph_level > 7.5) {
      recommendations.push(lang === "ar" ? "إضافة كبريتات أو مواد عضوية لخفض مستوى pH" : "Add sulfur or organic matter to lower pH level")
    }

    if (analysis.nitrogen < 20) {
      recommendations.push(lang === "ar" ? "إضافة أسمدة نيتروجينية" : "Add nitrogen fertilizers")
    }
    if (analysis.phosphorus < 15) {
      recommendations.push(lang === "ar" ? "إضافة أسمدة فوسفورية" : "Add phosphorus fertilizers")
    }
    if (analysis.potassium < 150) {
      recommendations.push(lang === "ar" ? "إضافة أسمدة بوتاسية" : "Add potassium fertilizers")
    }

    if (analysis.organic_matter < 2.0) {
      recommendations.push(lang === "ar" ? "إضافة مادة عضوية (كمبوست أو سماد عضوي)" : "Add organic matter (compost or organic fertilizer)")
    }

    if (analysis.electrical_conductivity > 4.0) {
      recommendations.push(lang === "ar" ? "تحسين الصرف وتقليل الملوحة" : "Improve drainage and reduce salinity")
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
            {t.soilAnalysis}
          </h1>
          <p className="text-gray-400 mt-2">
            {lang === "ar"
              ? "تحليل شامل لخصائص التربة وصحتها باستخدام تقنيات متقدمة"
              : "Comprehensive soil properties and health analysis using advanced techniques"
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/soil-analysis/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <FlaskConical className="h-4 w-4 mr-2" />
              {t.addAnalysis}
            </Button>
          </Link>
        </div>
      </div>

      {analyses.length === 0 ? (
        <Card className="p-12 text-center">
          <Beaker className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">{t.noAnalyses}</h3>
          <p className="text-gray-400 mb-6">
            {lang === "ar"
              ? "ابدأ بإضافة تحليلات التربة لتتبع صحة أراضيك"
              : "Start by adding soil analyses to track your land health"
            }
          </p>
          <Link href="/dashboard/soil-analysis/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <FlaskConical className="h-4 w-4 mr-2" />
              {t.addAnalysis}
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {analyses.map((analysis) => {
            const healthScore = calculateHealthScore(analysis)
            const healthStatus = getHealthStatus(healthScore)
            const recommendations = getRecommendations(analysis)

            return (
              <Card key={analysis.id} className={`overflow-hidden border-2 ${healthStatus.borderColor} bg-gray-900/95 backdrop-blur-sm`}>
                {/* Health Status Header */}
                <div className={`h-3 ${healthStatus.color}`} />

                <div className="p-6">
                  {/* Analysis Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {analysis.fields?.name || "Unknown Field"}
                        </h3>
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                          {analysis.fields?.farms?.name || "Unknown Farm"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDateSafe(analysis.analysis_date, lang === "ar" ? "ar-EG" : "en-US", {
                            dateStyle: "medium",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {analysis.texture_type}
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
                    {/* pH Level */}
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Beaker className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">{t.phLevel}</span>
                        </div>
                        {getStatusIcon(analysis.ph_level, { min: 6.0, max: 7.5 })}
                      </div>
                      <div className="text-2xl font-bold text-blue-700 mb-1">{analysis.ph_level.toFixed(1)}</div>
                      <div className="text-xs text-blue-600">{getStatusText(analysis.ph_level, { min: 6.0, max: 7.5 })}</div>
                    </div>

                    {/* Nitrogen */}
                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Leaf className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-700">{t.nitrogen}</span>
                        </div>
                        {getStatusIcon(analysis.nitrogen, { min: 20, max: 40 })}
                      </div>
                      <div className="text-2xl font-bold text-green-700 mb-1">{analysis.nitrogen.toFixed(0)}</div>
                      <div className="text-xs text-green-600">{getStatusText(analysis.nitrogen, { min: 20, max: 40 })} mg/kg</div>
                    </div>

                    {/* Phosphorus */}
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Sprout className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-gray-700">{t.phosphorus}</span>
                        </div>
                        {getStatusIcon(analysis.phosphorus, { min: 15, max: 30 })}
                      </div>
                      <div className="text-2xl font-bold text-purple-700 mb-1">{analysis.phosphorus.toFixed(0)}</div>
                      <div className="text-xs text-purple-600">{getStatusText(analysis.phosphorus, { min: 15, max: 30 })} mg/kg</div>
                    </div>

                    {/* Potassium */}
                    <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TreePine className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-gray-700">{t.potassium}</span>
                        </div>
                        {getStatusIcon(analysis.potassium, { min: 150, max: 300 })}
                      </div>
                      <div className="text-2xl font-bold text-orange-700 mb-1">{analysis.potassium.toFixed(0)}</div>
                      <div className="text-xs text-orange-600">{getStatusText(analysis.potassium, { min: 150, max: 300 })} mg/kg</div>
                    </div>
                  </div>

                  {/* Advanced Properties */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Organic Matter */}
                    <div className="p-3 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{t.organicMatter}</span>
                        {getStatusIcon(analysis.organic_matter, { min: 2.0, max: 5.0 })}
                      </div>
                      <div className="text-lg font-bold text-emerald-700">{analysis.organic_matter.toFixed(1)}%</div>
                    </div>

                    {/* Electrical Conductivity */}
                    <div className="p-3 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{t.electricalConductivity}</span>
                        {getStatusIcon(analysis.electrical_conductivity, { min: 0, max: 2.0 })}
                      </div>
                      <div className="text-lg font-bold text-yellow-700">{analysis.electrical_conductivity.toFixed(1)} dS/m</div>
                    </div>

                    {/* Moisture Content */}
                    <div className="p-3 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{t.moistureContent}</span>
                        {getStatusIcon(analysis.moisture_content, { min: 15, max: 35 })}
                      </div>
                      <div className="text-lg font-bold text-cyan-700">{analysis.moisture_content.toFixed(1)}%</div>
                    </div>
                  </div>

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
                    <Link href={`/dashboard/soil-analysis/${analysis.id}`}>
                      <Button variant="outline" className="flex-1 border-emerald-200 hover:bg-emerald-50">
                        {t.viewDetails}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
