"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Loader2, FileText, Download, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/use-language"

export default function ReportsPage() {
  const { language, setLanguage } = useTranslation()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<"ar" | "en">(language === "en" ? "en" : "ar")

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
    fetchReports()
  }, [])

  async function fetchReports() {
    try {
      const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setReports(data || [])
    } catch (error) {
      console.error("[v0] Error fetching reports:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "farm_summary":
        return "bg-blue-500"
      case "soil_analysis":
        return "bg-green-500"
      case "crop_monitoring":
        return "bg-yellow-500"
      case "irrigation":
        return "bg-cyan-500"
      case "financial":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const t = {
    ar: {
      title: "التقارير والتحليلات",
      generateReport: "إنشاء تقرير جديد",
      noReports: "لا توجد تقارير",
      noReportsDesc: "ابدأ بإنشاء تقرير جديد",
      type: "النوع",
      period: "الفترة",
      generated: "تم الإنشاء",
      download: "تحميل",
      view: "عرض",
      farm_summary: "ملخص المزرعة",
      soil_analysis: "تحليل التربة",
      crop_monitoring: "مراقبة المحاصيل",
      irrigation: "الري",
      financial: "مالي",
    },
    en: {
      title: "Reports & Analytics",
      generateReport: "Generate New Report",
      noReports: "No Reports",
      noReportsDesc: "Start by generating a new report",
      type: "Type",
      period: "Period",
      generated: "Generated",
      download: "Download",
      view: "View",
      farm_summary: "Farm Summary",
      soil_analysis: "Soil Analysis",
      crop_monitoring: "Crop Monitoring",
      irrigation: "Irrigation",
      financial: "Financial",
    },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t[lang].title}</h1>
        <div className="flex items-center gap-2">
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
          <Link href="/dashboard/reports/revenue">
            <Button variant="outline" size="sm" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Revenue
            </Button>
          </Link>
          <Link href="/dashboard/reports/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t[lang].generateReport}
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : reports.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto max-w-md space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">{t[lang].noReports}</h3>
            <p className="text-muted-foreground">{t[lang].noReportsDesc}</p>
            <Link href="/dashboard/reports/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t[lang].generateReport}
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id} className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{report.title}</h3>
                    <Badge className={`${getTypeColor(report.report_type)} text-white`}>
                      {t[lang][report.report_type as keyof typeof t.ar] || report.report_type}
                    </Badge>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t[lang].period}:</span>
                    <span className="font-medium">
                      {formatReportDate(report.start_date, lang)} - {formatReportDate(report.end_date, lang)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t[lang].generated}:</span>
                    <span className="font-medium">
                      {formatReportDate(report.created_at, lang)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Link href={`/dashboard/reports/${report.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      {t[lang].view}
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function formatReportDate(value: string, language: "ar" | "en") {
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
