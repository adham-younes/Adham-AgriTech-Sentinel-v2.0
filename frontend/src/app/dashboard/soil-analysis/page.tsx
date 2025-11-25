"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/use-language"
import { formatDateSafe } from "@/lib/utils/date-safe"

export default function SoilAnalysisPage() {
  const { language, setLanguage } = useTranslation()
  const [analyses, setAnalyses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<"ar" | "en">(language === "en" ? "en" : "ar")

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
        .select("*, fields(name, farms!fields_farm_id_fkey(name))")
        .order("analysis_date", { ascending: false })

      if (error) throw error
      setAnalyses(data || [])
    } catch (error) {
      console.error("[v0] Error fetching soil analyses:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (value: number, optimal: { min: number; max: number }) => {
    if (value < optimal.min) return <TrendingDown className="h-4 w-4 text-orange-500" />
    if (value > optimal.max) return <TrendingUp className="h-4 w-4 text-orange-500" />
    return <Minus className="h-4 w-4 text-green-500" />
  }

  const t = {
    ar: {
      title: "تحليل التربة",
      helper: "التحاليل تأتي تلقائياً من EOSDA (رطوبة التربة + الغطاء النباتي). افتح أي حقل لعرض الخريطة الحرارية والقيم الزمنية.",
      ctaFields: "الذهاب إلى الحقول",
      ctaSatellite: "فتح لوحة الأقمار",
      noAnalyses: "لا توجد تحليلات محفوظة هنا",
      noAnalysesDesc: "سيظهر التحليل تلقائياً لكل حقل عند وصول آخر مشهد قمر صناعي.",
      field: "الحقل",
      farm: "المزرعة",
      date: "التاريخ",
      ph: "الحموضة (pH)",
      nitrogen: "النيتروجين",
      phosphorus: "الفوسفور",
      potassium: "البوتاسيوم",
      viewDetails: "عرض التفاصيل",
    },
    en: {
      title: "Soil Analysis",
      helper: "Insights are auto-fed from EOSDA (soil moisture + canopy signals). Open any field to view the heatmap and timeline.",
      ctaFields: "Go to Fields",
      ctaSatellite: "Open Satellite Console",
      noAnalyses: "No saved analyses here",
      noAnalysesDesc: "Analyses will auto-populate for each field when the latest satellite pass arrives.",
      field: "Field",
      farm: "Farm",
      date: "Date",
      ph: "pH Level",
      nitrogen: "Nitrogen",
      phosphorus: "Phosphorus",
      potassium: "Potassium",
      viewDetails: "View Details",
    },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
          {t[lang].title}
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const next = lang === "ar" ? "en" : "ar"
              setLang(next)
              setLanguage(next)
            }}
            className="border-slate-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-600"
          >
            {lang === "ar" ? "EN" : "ع"}
          </Button>
          <Link href="/dashboard/fields">
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500">
              {t[lang].ctaFields}
            </Button>
          </Link>
          <Link href="/dashboard/satellite">
            <Button variant="outline" className="gap-2 border-amber-300 text-amber-700 hover:border-amber-400 hover:text-amber-800 bg-amber-50">
              {t[lang].ctaSatellite}
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border border-emerald-700/40 bg-gradient-to-r from-emerald-900/80 via-emerald-900/60 to-amber-900/50 px-4 py-4 text-sm text-emerald-100 max-w-4xl">
        <p>{t[lang].helper}</p>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        </div>
      ) : analyses.length === 0 ? (
        <Card className="p-12 text-center border border-emerald-700/50 bg-gradient-to-br from-emerald-900/80 via-emerald-900/60 to-amber-900/50 shadow-lg">
          <div className="mx-auto max-w-md space-y-4">
            <h3 className="text-2xl font-bold text-emerald-50">{t[lang].noAnalyses}</h3>
            <p className="text-emerald-100/80">
              {t[lang].noAnalysesDesc}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/dashboard/fields">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500">
                  {t[lang].ctaFields}
                </Button>
              </Link>
              <Link href="/dashboard/satellite">
                <Button variant="outline" className="border-amber-300 text-amber-200 hover:border-amber-400 hover:text-amber-100">
                  {t[lang].ctaSatellite}
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {analyses.map((analysis) => (
            <Card
              key={analysis.id}
              className="glass-card p-6 border-white/10 hover:border-green-500/50 hover:shadow-glow transition-all"
            >
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-green-400">
                    {analysis.fields?.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {t[lang].farm}: {analysis.fields?.farms?.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t[lang].date}:{" "}
                    {formatAnalysisDate(analysis.analysis_date, lang)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">{t[lang].ph}</span>
                      {getStatusIcon(analysis.ph_level, { min: 6.0, max: 7.5 })}
                    </div>
                    <p className="text-lg font-bold text-green-400">{analysis.ph_level}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">{t[lang].nitrogen}</span>
                      {getStatusIcon(analysis.nitrogen_ppm, { min: 20, max: 50 })}
                    </div>
                    <p className="text-lg font-bold text-green-400">{analysis.nitrogen_ppm} ppm</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">{t[lang].phosphorus}</span>
                      {getStatusIcon(analysis.phosphorus_ppm, { min: 15, max: 40 })}
                    </div>
                    <p className="text-lg font-bold text-green-400">{analysis.phosphorus_ppm} ppm</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">{t[lang].potassium}</span>
                      {getStatusIcon(analysis.potassium_ppm, { min: 100, max: 200 })}
                    </div>
                    <p className="text-lg font-bold text-green-400">{analysis.potassium_ppm} ppm</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <h4 className="text-sm font-semibold text-green-300 mb-2">
                    {lang === 'ar' ? "توصيات عملية" : "Actionable Recommendations"}
                  </h4>
                  <ul className="space-y-1">
                    {(() => {
                      const recs = []
                      if (analysis.ph_level < 6.0) recs.push(lang === 'ar' ? "أضف الجير لرفع درجة الحموضة" : "Add lime to increase pH")
                      if (analysis.ph_level > 7.5) recs.push(lang === 'ar' ? "أضف الكبريت لخفض درجة الحموضة" : "Add sulfur to decrease pH")
                      if (analysis.nitrogen_ppm < 20) recs.push(lang === 'ar' ? "استخدم سماد غني بالنيتروجين" : "Apply nitrogen-rich fertilizer")
                      if (analysis.phosphorus_ppm < 15) recs.push(lang === 'ar' ? "استخدم سماد الفوسفات" : "Apply phosphate fertilizer")
                      if (analysis.potassium_ppm < 100) recs.push(lang === 'ar' ? "أضف سماد البوتاس" : "Add potash fertilizer")

                      if (recs.length === 0) recs.push(lang === 'ar' ? "التربة في حالة مثالية" : "Soil conditions are optimal")

                      return recs.map((rec, i) => (
                        <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">•</span>
                          {rec}
                        </li>
                      ))
                    })()}
                  </ul>
                </div>

                <div className="mt-4 flex justify-end">
                  <Link href={`/dashboard/soil-analysis/${analysis.id}`}>
                    <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300 hover:bg-green-400/10">
                      {t[lang].viewDetails}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function formatAnalysisDate(dateString: string, lang: "ar" | "en") {
  if (!dateString) return ""
  const locale = lang === "ar" ? "ar-EG" : "en-US"
  return formatDateSafe(dateString, locale, { dateStyle: "medium" }, dateString)
}
