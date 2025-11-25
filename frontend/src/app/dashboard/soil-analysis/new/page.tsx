"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2, Sparkles } from "lucide-react"
import Link from "next/link"
import { isFeatureEnabled } from "@/lib/config/feature-flags"
import { useTranslation } from "@/lib/i18n/use-language"
import { fetchSatelliteInsights } from "@/lib/client/satellite-insights"
import type { SatelliteAnalysisResponse } from "@/lib/types/satellite"

type Language = "ar" | "en"

export default function NewSoilAnalysisPage() {
  const router = useRouter()
  const { language, setLanguage } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [fields, setFields] = useState<any[]>([])
  const [lang, setLang] = useState<Language>("ar")
  const [formData, setFormData] = useState({
    field_id: "",
    analysis_date: new Date().toISOString().split("T")[0],
    ph_level: "",
    nitrogen_ppm: "",
    phosphorus_ppm: "",
    potassium_ppm: "",
    organic_matter_percent: "",
    moisture_percent: "",
    ec_ds_m: "",
  })
  const [aiRecommendations, setAiRecommendations] = useState("")
  const [satelliteLoading, setSatelliteLoading] = useState(false)
  const [satelliteError, setSatelliteError] = useState<string | null>(null)
  const [satelliteResultInfo, setSatelliteResultInfo] = useState<
    | {
      capturedAt: string | null
      confidence: number | null
      ndvi?: number | null
      soilMoisture?: number | null
      chlorophyll?: number | null
    }
    | null
  >(null)
  const satelliteAutomationEnabled = isFeatureEnabled("soilAnalysisAutomation")

  const supabase = createClient()

  useEffect(() => {
    if (language === "ar" || language === "en") {
      setLang(language)
    }
  }, [language])

  useEffect(() => {
    fetchFields()
  }, [])

  async function fetchFields() {
    try {
      const { data, error } = await supabase.from("fields").select("id, name, farms!fields_farm_id_fkey(name)").order("name")

      if (error) throw error
      setFields(data || [])
    } catch (error) {
      console.error("[v0] Error fetching fields:", error)
    }
  }

  async function generateAIRecommendations() {
    setGeneratingAI(true)
    try {
      const response = await fetch("/api/soil-analysis/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ph_level: Number.parseFloat(formData.ph_level),
          nitrogen_ppm: Number.parseFloat(formData.nitrogen_ppm),
          phosphorus_ppm: Number.parseFloat(formData.phosphorus_ppm),
          potassium_ppm: Number.parseFloat(formData.potassium_ppm),
          organic_matter_percent: Number.parseFloat(formData.organic_matter_percent),
          moisture_percent: Number.parseFloat(formData.moisture_percent),
          language: lang,
        }),
      })

      const data = await response.json()
      setAiRecommendations(data.recommendations)
    } catch (error) {
      console.error("[v0] Error generating AI recommendations:", error)
      alert(lang === "ar" ? "حدث خطأ في توليد التوصيات" : "Error generating recommendations")
    } finally {
      setGeneratingAI(false)
    }
  }

  function toFormValue(value: unknown, fractionDigits = 1): string | null {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return null
    }
    const fixed = value.toFixed(fractionDigits)
    return fixed.replace(/\.?0+$/, "") || fixed
  }

  function formatCapturedDate(value: string | null, language: Language) {
    if (!value) return null
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      return null
    }
    const primaryLocale = language === "ar" ? "ar-EG" : "en-GB"
    try {
      return parsed.toLocaleDateString(primaryLocale, { dateStyle: "medium" })
    } catch {
      try {
        return parsed.toLocaleDateString("en-GB", { dateStyle: "medium" })
      } catch {
        return value
      }
    }
  }

  function formatRecommendations(analysis: SatelliteAnalysisResponse["analysis"]) {
    if (!analysis) return ""
    const sections: string[] = []
    const summaryBlocks = [analysis.summary, analysis.advisory].filter(
      (entry, index, arr) => typeof entry === "string" && entry.trim() && arr.indexOf(entry) === index,
    ) as string[]
    if (summaryBlocks.length) {
      sections.push(summaryBlocks.map((entry) => entry.trim()).join("\n\n"))
    }

    const recommendations = Array.isArray(analysis.recommendations)
      ? analysis.recommendations
      : typeof analysis.recommendations === "string"
        ? [analysis.recommendations]
        : []
    if (recommendations.length) {
      const header = lang === "ar" ? t[lang].satelliteRecommendationsLabel : t[lang].satelliteRecommendationsLabel
      const items = recommendations.map((rec) => `• ${rec}`)
      sections.push([header, ...items].join("\n"))
    }

    const monitoring = Array.isArray(analysis.monitoring)
      ? analysis.monitoring
      : typeof analysis.monitoring === "string"
        ? [analysis.monitoring]
        : []
    if (monitoring.length) {
      const header = lang === "ar" ? t[lang].satelliteMonitoringLabel : t[lang].satelliteMonitoringLabel
      const items = monitoring.map((item) => `• ${item}`)
      sections.push([header, ...items].join("\n"))
    }

    return sections.join("\n\n").trim()
  }

  async function handleSatelliteAnalysis() {
    if (!formData.field_id) {
      setSatelliteError(t[lang].satelliteErrorNoField)
      return
    }
    setSatelliteError(null)
    setSatelliteResultInfo(null)
    setSatelliteLoading(true)
    try {
      const payload = (await fetchSatelliteInsights(formData.field_id, lang)) as SatelliteAnalysisResponse | null
      if (!payload) {
        throw new Error(t[lang].satelliteErrorGeneric)
      }

      if (payload.analysis) {
        const phValue = toFormValue(payload.analysis.ph_level, 2)
        const nitrogenValue = toFormValue(payload.analysis.nitrogen_ppm, 1)
        const phosphorusValue = toFormValue(payload.analysis.phosphorus_ppm, 1)
        const potassiumValue = toFormValue(payload.analysis.potassium_ppm, 1)
        const organicMatterValue = toFormValue(payload.analysis.organic_matter_percent, 1)
        const moistureValue = toFormValue(payload.analysis.moisture_percent, 1)

        setFormData((prev) => ({
          ...prev,
          ph_level: phValue ?? prev.ph_level,
          nitrogen_ppm: nitrogenValue ?? prev.nitrogen_ppm,
          phosphorus_ppm: phosphorusValue ?? prev.phosphorus_ppm,
          potassium_ppm: potassiumValue ?? prev.potassium_ppm,
          organic_matter_percent: organicMatterValue ?? prev.organic_matter_percent,
          moisture_percent: moistureValue ?? prev.moisture_percent,
        }))

        const formattedRecommendations = formatRecommendations(payload.analysis)
        if (formattedRecommendations) {
          setAiRecommendations(formattedRecommendations)
        }
      }

      setSatelliteResultInfo({
        capturedAt: payload.satellite?.capturedAt ?? null,
        confidence: typeof payload.analysis?.confidence === "number" ? payload.analysis.confidence : null,
        ndvi: payload.satellite?.ndviValue ?? payload.satellite?.ndviMean ?? null,
        soilMoisture: payload.satellite?.soilMoisture?.value ?? null,
        chlorophyll: payload.satellite?.chlorophyll?.value ?? null,
      })
    } catch (error) {
      console.error("[v0] Error running satellite automation:", error)
      setSatelliteError(error instanceof Error ? error.message || t[lang].satelliteErrorGeneric : t[lang].satelliteErrorGeneric)
    } finally {
      setSatelliteLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase.from("soil_analysis").insert({
        user_id: user.id,
        field_id: formData.field_id,
        analysis_date: formData.analysis_date,
        ph_level: Number.parseFloat(formData.ph_level),
        nitrogen_ppm: Number.parseFloat(formData.nitrogen_ppm),
        phosphorus_ppm: Number.parseFloat(formData.phosphorus_ppm),
        potassium_ppm: Number.parseFloat(formData.potassium_ppm),
        organic_matter_percent: formData.organic_matter_percent
          ? Number.parseFloat(formData.organic_matter_percent)
          : null,
        moisture_percent: formData.moisture_percent ? Number.parseFloat(formData.moisture_percent) : null,
        ec_ds_m: formData.ec_ds_m ? Number.parseFloat(formData.ec_ds_m) : null,
        ai_recommendations: aiRecommendations || null,
      })

      if (error) throw error

      router.push("/dashboard/soil-analysis")
    } catch (error) {
      console.error("[v0] Error creating soil analysis:", error)
      alert(lang === "ar" ? "حدث خطأ أثناء حفظ التحليل" : "Error saving analysis")
    } finally {
      setLoading(false)
    }
  }

  const t = {
    ar: {
      title: "إضافة تحليل تربة جديد",
      back: "رجوع",
      field: "الحقل",
      selectField: "اختر الحقل",
      date: "تاريخ التحليل",
      ph: "مستوى الحموضة (pH)",
      nitrogen: "النيتروجين (ppm)",
      phosphorus: "الفوسفور (ppm)",
      potassium: "البوتاسيوم (ppm)",
      organicMatter: "المادة العضوية (%)",
      moisture: "الرطوبة (%)",
      ec: "التوصيل الكهربائي (dS/m)",
      generateAI: "توليد توصيات بالذكاء الاصطناعي",
      generating: "جاري التوليد...",
      aiRecommendations: "توصيات الذكاء الاصطناعي",
      cancel: "إلغاء",
      save: "حفظ التحليل",
      saving: "جاري الحفظ...",
      satelliteTitle: "تحليل تلقائي بالاعتماد على الأقمار الصناعية",
      satelliteDescription: "امسح الحقل المختار لاسترجاع مستويات العناصر والرطوبة المقترحة اعتماداً على بيانات NDVI والأرصاد.",
      satelliteButton: "تعبئة تلقائية من القمر الصناعي",
      satelliteLoading: "جاري التحليل...",
      satelliteErrorNoField: "يرجى اختيار الحقل أولاً قبل استخدام التحليل التلقائي.",
      satelliteErrorGeneric: "تعذر تشغيل التحليل عبر الأقمار الصناعية. حاول مجدداً لاحقاً.",
      satelliteApplied: "تمت تعبئة القيم تلقائياً ويمكنك تعديلها قبل الحفظ.",
      satelliteCaptured: "تاريخ الالتقاط",
      satelliteConfidence: "مستوى الثقة",
      satelliteRecommendationsLabel: "التدخلات المقترحة",
      satelliteMonitoringLabel: "المتابعة خلال الأيام القادمة",
      satelliteNdvi: "مؤشر NDVI",
      satelliteMoistureLabel: "رطوبة القمر الصناعي",
      satelliteChlorophyllLabel: "مؤشر الكلوروفيل",
    },
    en: {
      title: "Add New Soil Analysis",
      back: "Back",
      field: "Field",
      selectField: "Select field",
      date: "Analysis Date",
      ph: "pH Level",
      nitrogen: "Nitrogen (ppm)",
      phosphorus: "Phosphorus (ppm)",
      potassium: "Potassium (ppm)",
      organicMatter: "Organic Matter (%)",
      moisture: "Moisture (%)",
      ec: "Electrical Conductivity (dS/m)",
      generateAI: "Generate AI Recommendations",
      generating: "Generating...",
      aiRecommendations: "AI Recommendations",
      cancel: "Cancel",
      save: "Save Analysis",
      saving: "Saving...",
      satelliteTitle: "Auto-fill with satellite intelligence",
      satelliteDescription: "Fetch NDVI, moisture, and nutrient estimates for the selected field to pre-fill the form.",
      satelliteButton: "Auto-fill from satellite",
      satelliteLoading: "Fetching satellite data...",
      satelliteErrorNoField: "Please select a field first.",
      satelliteErrorGeneric: "Unable to run the satellite pipeline. Please try again.",
      satelliteApplied: "Fields updated with the latest satellite snapshot. You can tweak the numbers before saving.",
      satelliteCaptured: "Captured on",
      satelliteConfidence: "Confidence",
      satelliteRecommendationsLabel: "Suggested interventions",
      satelliteMonitoringLabel: "Monitoring checklist",
      satelliteNdvi: "NDVI",
      satelliteMoistureLabel: "Satellite soil moisture",
      satelliteChlorophyllLabel: "Chlorophyll index",
    },
  }

  const canGenerateAI = formData.ph_level && formData.nitrogen_ppm && formData.phosphorus_ppm && formData.potassium_ppm
  const satelliteInfoText =
    satelliteResultInfo && satelliteAutomationEnabled
      ? [
        t[lang].satelliteApplied,
        satelliteResultInfo.capturedAt
          ? `${t[lang].satelliteCaptured}: ${formatCapturedDate(satelliteResultInfo.capturedAt, lang)}`
          : null,
        typeof satelliteResultInfo.confidence === "number"
          ? `${t[lang].satelliteConfidence}: ${Math.round(satelliteResultInfo.confidence * 100)}%`
          : null,
      ]
        .filter(Boolean)
        .join(" • ")
      : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/soil-analysis">
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

      <Card className="mb-2 border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-50">
        <p>
          {lang === "ar"
            ? "تحليل التربة هنا يعتمد أساسًا على قيَم pH وNPK والرطوبة التي تُدخل يدويًا من معمل أو جهاز قياس. بيانات الأقمار الصناعية تُستخدم كعامل مساعد فقط ولا تغني عن التحليل المعملي."
            : "This soil analysis form is driven primarily by lab or in-field measurements (pH, NPK, moisture) that you enter manually. Satellite data is only used as an optional helper and does not replace proper lab analysis."}
        </p>
      </Card>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="field">{t[lang].field}</Label>
              <Select
                value={formData.field_id}
                onValueChange={(value) => setFormData({ ...formData, field_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t[lang].selectField} />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((field) => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.name} - {field.farms?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">{t[lang].date}</Label>
              <Input
                id="date"
                type="date"
                value={formData.analysis_date}
                onChange={(e) => setFormData({ ...formData, analysis_date: e.target.value })}
                required
              />
            </div>
          </div>

          {satelliteAutomationEnabled && (
            <Card className="border-dashed border-primary/40 bg-primary/5 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">{t[lang].satelliteTitle}</p>
                  <p className="text-sm text-muted-foreground">{t[lang].satelliteDescription}</p>
                </div>
                <Button
                  type="button"
                  onClick={handleSatelliteAnalysis}
                  disabled={satelliteLoading}
                  className="gap-2"
                  variant="secondary"
                >
                  {satelliteLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t[lang].satelliteLoading}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {t[lang].satelliteButton}
                    </>
                  )}
                </Button>
              </div>
              {satelliteError && <p className="mt-3 text-sm text-destructive">{satelliteError}</p>}
              {!satelliteError && satelliteInfoText && (
                <p className="mt-3 text-sm text-muted-foreground">{satelliteInfoText}</p>
              )}
              {!satelliteError && satelliteResultInfo && (
                <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
                  <div className="rounded-md bg-background/80 p-3 shadow-sm">
                    <p className="text-muted-foreground">{t[lang].satelliteNdvi}</p>
                    <p className="text-lg font-semibold">
                      {typeof satelliteResultInfo.ndvi === "number" ? satelliteResultInfo.ndvi.toFixed(2) : "—"}
                    </p>
                  </div>
                  <div className="rounded-md bg-background/80 p-3 shadow-sm">
                    <p className="text-muted-foreground">{t[lang].satelliteMoistureLabel}</p>
                    <p className="text-lg font-semibold">
                      {typeof satelliteResultInfo.soilMoisture === "number"
                        ? `${satelliteResultInfo.soilMoisture.toFixed(0)}%`
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-md bg-background/80 p-3 shadow-sm">
                    <p className="text-muted-foreground">{t[lang].satelliteChlorophyllLabel}</p>
                    <p className="text-lg font-semibold">
                      {typeof satelliteResultInfo.chlorophyll === "number"
                        ? satelliteResultInfo.chlorophyll.toFixed(2)
                        : "—"}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ph">{t[lang].ph}</Label>
              <Input
                id="ph"
                type="number"
                step="0.1"
                value={formData.ph_level}
                onChange={(e) => setFormData({ ...formData, ph_level: e.target.value })}
                placeholder="6.5"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nitrogen">{t[lang].nitrogen}</Label>
              <Input
                id="nitrogen"
                type="number"
                step="0.1"
                value={formData.nitrogen_ppm}
                onChange={(e) => setFormData({ ...formData, nitrogen_ppm: e.target.value })}
                placeholder="35"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phosphorus">{t[lang].phosphorus}</Label>
              <Input
                id="phosphorus"
                type="number"
                step="0.1"
                value={formData.phosphorus_ppm}
                onChange={(e) => setFormData({ ...formData, phosphorus_ppm: e.target.value })}
                placeholder="25"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="potassium">{t[lang].potassium}</Label>
              <Input
                id="potassium"
                type="number"
                step="0.1"
                value={formData.potassium_ppm}
                onChange={(e) => setFormData({ ...formData, potassium_ppm: e.target.value })}
                placeholder="150"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organic">{t[lang].organicMatter}</Label>
              <Input
                id="organic"
                type="number"
                step="0.1"
                value={formData.organic_matter_percent}
                onChange={(e) => setFormData({ ...formData, organic_matter_percent: e.target.value })}
                placeholder="3.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="moisture">{t[lang].moisture}</Label>
              <Input
                id="moisture"
                type="number"
                step="0.1"
                value={formData.moisture_percent}
                onChange={(e) => setFormData({ ...formData, moisture_percent: e.target.value })}
                placeholder="25"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ec">{t[lang].ec}</Label>
              <Input
                id="ec"
                type="number"
                step="0.01"
                value={formData.ec_ds_m}
                onChange={(e) => setFormData({ ...formData, ec_ds_m: e.target.value })}
                placeholder="1.5"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 bg-transparent"
              onClick={generateAIRecommendations}
              disabled={!canGenerateAI || generatingAI}
            >
              {generatingAI ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t[lang].generating}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {t[lang].generateAI}
                </>
              )}
            </Button>

            {aiRecommendations && (
              <Card className="p-4 bg-primary/5 border-primary/20">
                <h4 className="font-semibold mb-2">{t[lang].aiRecommendations}</h4>
                <p className="text-sm whitespace-pre-wrap">{aiRecommendations}</p>
              </Card>
            )}
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Link href="/dashboard/soil-analysis" className="flex-1">
              <Button type="button" variant="outline" className="w-full bg-transparent">
                {t[lang].cancel}
              </Button>
            </Link>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t[lang].saving}
                </>
              ) : (
                t[lang].save
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
