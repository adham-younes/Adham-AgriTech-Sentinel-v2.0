"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Loader2, Sparkles } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/use-language"

export default function SoilAnalysisDetailsPage() {
  const params = useParams()
  const { language, setLanguage } = useTranslation()
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<"ar" | "en">(language === "en" ? "en" : "ar")

  const supabase = createClient()

  useEffect(() => {
    if (language === "ar" || language === "en") {
      setLang(language)
    }
  }, [language])

  useEffect(() => {
    if (params?.id) fetchAnalysisDetails()
  }, [params.id])

  async function fetchAnalysisDetails() {
    try {
      const { data, error } = await supabase
        .from("soil_analysis")
        .select("*, fields(name, farms(name))")
        .eq("id", params && Array.isArray(params.id) ? params.id[0] : params?.id)
        .single()

      if (error) throw error
      setAnalysis(data)
    } catch (error) {
      console.error("[v0] Error fetching analysis details:", error)
    } finally {
      setLoading(false)
    }
  }

  const getParameterStatus = (value: number, optimal: { min: number; max: number }) => {
    if (value < optimal.min) return { status: "low", color: "text-orange-500", progress: (value / optimal.min) * 50 }
    if (value > optimal.max)
      return { status: "high", color: "text-orange-500", progress: 50 + ((value - optimal.max) / optimal.max) * 50 }
    return {
      status: "optimal",
      color: "text-green-500",
      progress: 50 + ((value - optimal.min) / (optimal.max - optimal.min)) * 50,
    }
  }

  const t = {
    ar: {
      back: "رجوع",
      details: "تفاصيل تحليل التربة",
      field: "الحقل",
      farm: "المزرعة",
      date: "تاريخ التحليل",
      parameters: "معاملات التربة",
      ph: "مستوى الحموضة (pH)",
      nitrogen: "النيتروجين",
      phosphorus: "الفوسفور",
      potassium: "البوتاسيوم",
      organicMatter: "المادة العضوية",
      moisture: "الرطوبة",
      ec: "التوصيل الكهربائي",
      optimal: "مثالي",
      low: "منخفض",
      high: "مرتفع",
      aiRecommendations: "توصيات الذكاء الاصطناعي",
      noRecommendations: "لا توجد توصيات متاحة",
    },
    en: {
      back: "Back",
      details: "Soil Analysis Details",
      field: "Field",
      farm: "Farm",
      date: "Analysis Date",
      parameters: "Soil Parameters",
      ph: "pH Level",
      nitrogen: "Nitrogen",
      phosphorus: "Phosphorus",
      potassium: "Potassium",
      organicMatter: "Organic Matter",
      moisture: "Moisture",
      ec: "Electrical Conductivity",
      optimal: "Optimal",
      low: "Low",
      high: "High",
      aiRecommendations: "AI Recommendations",
      noRecommendations: "No recommendations available",
    },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!analysis) {
    return <div>Analysis not found</div>
  }

  const phStatus = getParameterStatus(analysis.ph_level, { min: 6.0, max: 7.5 })
  const nStatus = getParameterStatus(analysis.nitrogen_ppm, { min: 20, max: 50 })
  const pStatus = getParameterStatus(analysis.phosphorus_ppm, { min: 15, max: 40 })
  const kStatus = getParameterStatus(analysis.potassium_ppm, { min: 100, max: 200 })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/soil-analysis">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{analysis.fields?.name}</h1>
            <p className="text-muted-foreground">{t[lang].details}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const next = lang === "ar" ? "en" : "ar"
            setLang(next)
            setLanguage(next)
          }}
        >
          {lang === "ar" ? "EN" : "ع"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t[lang].field}</p>
            <p className="font-semibold">{analysis.fields?.name}</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t[lang].farm}</p>
            <p className="font-semibold">{analysis.fields?.farms?.name}</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t[lang].date}</p>
            <p className="font-semibold">
              {formatAnalysisDate(analysis.analysis_date, lang)}
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">{t[lang].parameters}</h2>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t[lang].ph}</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{analysis.ph_level}</span>
                <span className={`text-sm ${phStatus.color}`}>
                  {phStatus.status === "optimal"
                    ? t[lang].optimal
                    : phStatus.status === "low"
                      ? t[lang].low
                      : t[lang].high}
                </span>
              </div>
            </div>
            <Progress value={phStatus.progress} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t[lang].nitrogen}</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{analysis.nitrogen_ppm}</span>
                <span className="text-sm text-muted-foreground">ppm</span>
                <span className={`text-sm ${nStatus.color}`}>
                  {nStatus.status === "optimal"
                    ? t[lang].optimal
                    : nStatus.status === "low"
                      ? t[lang].low
                      : t[lang].high}
                </span>
              </div>
            </div>
            <Progress value={nStatus.progress} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t[lang].phosphorus}</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{analysis.phosphorus_ppm}</span>
                <span className="text-sm text-muted-foreground">ppm</span>
                <span className={`text-sm ${pStatus.color}`}>
                  {pStatus.status === "optimal"
                    ? t[lang].optimal
                    : pStatus.status === "low"
                      ? t[lang].low
                      : t[lang].high}
                </span>
              </div>
            </div>
            <Progress value={pStatus.progress} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t[lang].potassium}</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{analysis.potassium_ppm}</span>
                <span className="text-sm text-muted-foreground">ppm</span>
                <span className={`text-sm ${kStatus.color}`}>
                  {kStatus.status === "optimal"
                    ? t[lang].optimal
                    : kStatus.status === "low"
                      ? t[lang].low
                      : t[lang].high}
                </span>
              </div>
            </div>
            <Progress value={kStatus.progress} className="h-2" />
          </div>

          {analysis.organic_matter_percent && (
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="font-medium">{t[lang].organicMatter}</span>
              <span className="text-xl font-bold">{analysis.organic_matter_percent}%</span>
            </div>
          )}

          {analysis.moisture_percent && (
            <div className="flex items-center justify-between">
              <span className="font-medium">{t[lang].moisture}</span>
              <span className="text-xl font-bold">{analysis.moisture_percent}%</span>
            </div>
          )}

          {analysis.ec_ds_m && (
            <div className="flex items-center justify-between">
              <span className="font-medium">{t[lang].ec}</span>
              <span className="text-xl font-bold">{analysis.ec_ds_m} dS/m</span>
            </div>
          )}
        </div>
      </Card>

      {analysis.ai_recommendations && (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">{t[lang].aiRecommendations}</h2>
          </div>
          <p className="whitespace-pre-wrap leading-relaxed">{analysis.ai_recommendations}</p>
        </Card>
      )}
    </div>
  )
}

function formatAnalysisDate(value: string, language: "ar" | "en") {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const primaryLocale = language === "ar" ? "ar-EG" : "en-US"
  try {
    return date.toLocaleDateString(primaryLocale)
  } catch {
    try {
      return date.toLocaleDateString("en-US")
    } catch {
      return value
    }
  }
}
