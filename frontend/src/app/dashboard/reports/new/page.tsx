"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/use-language"

export default function NewReportPage() {
  const router = useRouter()
  const { language, setLanguage } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState<"ar" | "en">(language === "en" ? "en" : "ar")
  const [formData, setFormData] = useState({
    title: "",
    report_type: "",
    start_date: "",
    end_date: "",
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Generate report data based on type
      const reportData = await generateReportData(formData.report_type, formData.start_date, formData.end_date)

      const { error } = await supabase.from("reports").insert({
        user_id: user.id,
        title: formData.title,
        report_type: formData.report_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        data: reportData,
      })

      if (error) throw error

      router.push("/dashboard/reports")
    } catch (error) {
      console.error("[v0] Error creating report:", error)
      alert(lang === "ar" ? "حدث خطأ أثناء إنشاء التقرير" : "Error creating report")
    } finally {
      setLoading(false)
    }
  }

  async function generateReportData(type: string, startDate: string, endDate: string) {
    // Mock report data generation
    return {
      summary: "Report generated successfully",
      metrics: {
        total_farms: 5,
        total_fields: 12,
        total_area: 150,
      },
      charts: [],
    }
  }

  const t = {
    ar: {
      title: "إنشاء تقرير جديد",
      back: "رجوع",
      reportTitle: "عنوان التقرير",
      titlePlaceholder: "أدخل عنوان التقرير",
      type: "نوع التقرير",
      selectType: "اختر النوع",
      farm_summary: "ملخص المزرعة",
      soil_analysis: "تحليل التربة",
      crop_monitoring: "مراقبة المحاصيل",
      irrigation: "الري",
      financial: "مالي",
      startDate: "تاريخ البداية",
      endDate: "تاريخ النهاية",
      cancel: "إلغاء",
      generate: "إنشاء التقرير",
      generating: "جاري الإنشاء...",
    },
    en: {
      title: "Generate New Report",
      back: "Back",
      reportTitle: "Report Title",
      titlePlaceholder: "Enter report title",
      type: "Report Type",
      selectType: "Select type",
      farm_summary: "Farm Summary",
      soil_analysis: "Soil Analysis",
      crop_monitoring: "Crop Monitoring",
      irrigation: "Irrigation",
      financial: "Financial",
      startDate: "Start Date",
      endDate: "End Date",
      cancel: "Cancel",
      generate: "Generate Report",
      generating: "Generating...",
    },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/reports">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{t[lang].title}</h1>
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

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">{t[lang].reportTitle}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t[lang].titlePlaceholder}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">{t[lang].type}</Label>
            <Select
              value={formData.report_type}
              onValueChange={(value) => setFormData({ ...formData, report_type: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={t[lang].selectType} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="farm_summary">{t[lang].farm_summary}</SelectItem>
                <SelectItem value="soil_analysis">{t[lang].soil_analysis}</SelectItem>
                <SelectItem value="crop_monitoring">{t[lang].crop_monitoring}</SelectItem>
                <SelectItem value="irrigation">{t[lang].irrigation}</SelectItem>
                <SelectItem value="financial">{t[lang].financial}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">{t[lang].startDate}</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">{t[lang].endDate}</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Link href="/dashboard/reports" className="flex-1">
              <Button type="button" variant="outline" className="w-full bg-transparent">
                {t[lang].cancel}
              </Button>
            </Link>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t[lang].generating}
                </>
              ) : (
                t[lang].generate
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
