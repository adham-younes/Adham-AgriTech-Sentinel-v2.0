"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Droplets, Calendar, Loader2 } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/use-language"
import { formatDateTimeLocale } from "@/lib/utils/date"
import { isFeatureEnabled } from "@/lib/config/feature-flags"
import { fetchSatelliteInsights } from "@/lib/client/satellite-insights"
import type { SatelliteAnalysisResponse } from "@/lib/types/satellite"

type Lang = "ar" | "en"

export default function IrrigationDetailsPage() {
  const params = useParams()
  const { language, setLanguage } = useTranslation()
  const [system, setSystem] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<Lang>(language === "en" ? "en" : "ar")
  const satelliteEnabled = isFeatureEnabled("soilAnalysisAutomation")
  const [satelliteInsight, setSatelliteInsight] = useState<SatelliteAnalysisResponse | null>(null)
  const [satelliteLoading, setSatelliteLoading] = useState(false)
  const [satelliteError, setSatelliteError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (language === "ar" || language === "en") {
      setLang(language)
    }
  }, [language])

  useEffect(() => {
    if (params?.id) fetchSystemDetails()
  }, [params?.id])

  useEffect(() => {
    if (!satelliteEnabled || !system?.field_id) return
    void loadSatelliteInsight(system.field_id)
  }, [system?.field_id, lang, satelliteEnabled])

  async function loadSatelliteInsight(fieldId: string) {
    setSatelliteError(null)
    setSatelliteLoading(true)
    try {
      const payload = await fetchSatelliteInsights(fieldId, lang)
      if (!payload) throw new Error(t[lang].satelliteError)
      setSatelliteInsight(payload)
    } catch (error) {
      console.error("[v0] Error loading field satellite insight:", error)
      setSatelliteInsight(null)
      setSatelliteError(error instanceof Error ? error.message || t[lang].satelliteError : t[lang].satelliteError)
    } finally {
      setSatelliteLoading(false)
    }
  }

  async function fetchSystemDetails() {
    try {
      const { data, error } = await supabase
        .from("irrigation_systems")
        .select("*, field_id, fields(id, name, farms(name))")
        .eq("id", params && Array.isArray(params.id) ? params.id[0] : params?.id)
        .single()

      if (error) throw error
      setSystem(data)
    } catch (error) {
      console.error("[v0] Error fetching irrigation system details:", error)
      setSystem(null)
    } finally {
      setLoading(false)
    }
  }

  const t = {
    ar: {
      back: "رجوع",
      details: "تفاصيل نظام الري",
      field: "الحقل",
      farm: "المزرعة",
      type: "نوع الري",
      status: "الحالة",
      flowRate: "معدل التدفق",
      schedule: "الجدول الزمني",
      notes: "ملاحظات",
      drip: "تنقيط",
      sprinkler: "رش",
      surface: "سطحي",
      subsurface: "تحت السطح",
      active: "نشط",
      scheduled: "مجدول",
      inactive: "غير نشط",
      maintenance: "صيانة",
      satelliteHeading: "بيانات القمر الصناعي",
      satelliteRefresh: "تحديث البيانات",
      satelliteSummary: "ملخص الحقل",
      satelliteNdvi: "NDVI",
      satelliteMoisture: "رطوبة",
      satelliteChlorophyll: "كلوروفيل",
      satelliteRecommendations: "التدخلات",
      satelliteConfidence: "الثقة",
      satelliteError: "تعذر تحميل بيانات القمر الصناعي",
      satellitePending: "جاري مزامنة البيانات...",
    },
    en: {
      back: "Back",
      details: "Irrigation System Details",
      field: "Field",
      farm: "Farm",
      type: "Irrigation Type",
      status: "Status",
      flowRate: "Flow Rate",
      schedule: "Schedule",
      notes: "Notes",
      drip: "Drip",
      sprinkler: "Sprinkler",
      surface: "Surface",
      subsurface: "Subsurface",
      active: "Active",
      scheduled: "Scheduled",
      inactive: "Inactive",
      maintenance: "Maintenance",
      satelliteHeading: "Satellite insights",
      satelliteRefresh: "Refresh",
      satelliteSummary: "Field summary",
      satelliteNdvi: "NDVI",
      satelliteMoisture: "Moisture",
      satelliteChlorophyll: "Chlorophyll",
      satelliteRecommendations: "Suggested interventions",
      satelliteConfidence: "Confidence",
      satelliteError: "Unable to load satellite insights",
      satellitePending: "Fetching EOSDA data...",
    },
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "scheduled":
        return "bg-blue-500"
      case "inactive":
        return "bg-gray-500"
      case "maintenance":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!system) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/dashboard/irrigation">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
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
          <p className="text-sm">
            {lang === "ar" ? "لم يتم العثور على نظام الري المطلوب." : "Requested irrigation system was not found."}
          </p>
        </Card>
      </div>
    )
  }

  const localizedType = t[lang][system.irrigation_type as keyof typeof t.ar] || system.irrigation_type
  const localizedStatus = t[lang][system.status as keyof typeof t.ar] || system.status

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/irrigation">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{system.fields?.name}</h1>
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

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {t[lang].farm}: {system.fields?.farms?.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {t[lang].type}: <span className="font-semibold">{localizedType}</span>
            </p>
          </div>
          <Badge className={`${getStatusColor(system.status)} text-white`}>{localizedStatus}</Badge>
        </div>

        {system.flow_rate_lpm && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t[lang].flowRate}:</span>
            <div className="flex items-center gap-1">
              <Droplets className="h-4 w-4 text-primary" />
              <span className="font-medium">{system.flow_rate_lpm} L/min</span>
            </div>
          </div>
        )}

        {system.schedule && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t[lang].schedule}:</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium text-xs">{system.schedule}</span>
            </div>
          </div>
        )}

        {system.notes && (
          <div className="mt-4 border-t pt-4 text-sm">
            <p className="font-semibold mb-1">{t[lang].notes}</p>
            <p className="text-muted-foreground whitespace-pre-wrap">{system.notes}</p>
          </div>
        )}
      </Card>

      {satelliteEnabled && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{t[lang].satelliteHeading}</h2>
              {satelliteInsight?.satellite?.capturedAt && (
                <p className="text-sm text-muted-foreground">
                  {formatDateTimeLocale(
                    satelliteInsight.satellite.capturedAt,
                    lang === "ar" ? "ar-EG" : "en-US",
                    { dateStyle: "medium", timeStyle: "short" },
                    "",
                  )}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent"
              disabled={satelliteLoading || !system?.field_id}
              onClick={() => system?.field_id && loadSatelliteInsight(system.field_id)}
            >
              {satelliteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t[lang].satellitePending}
                </>
              ) : (
                t[lang].satelliteRefresh
              )}
            </Button>
          </div>

          {satelliteError && <p className="text-sm text-destructive">{satelliteError}</p>}

          {!satelliteError && !satelliteInsight && (
            <p className="text-sm text-muted-foreground">{t[lang].satellitePending}</p>
          )}

          {satelliteInsight && (
            <div className="space-y-4">
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-md bg-primary/5 p-3">
                  <p className="text-muted-foreground">{t[lang].satelliteNdvi}</p>
                  <p className="text-lg font-semibold">
                    {typeof satelliteInsight.satellite?.ndviValue === "number"
                      ? satelliteInsight.satellite.ndviValue.toFixed(2)
                      : typeof satelliteInsight.satellite?.ndviMean === "number"
                        ? satelliteInsight.satellite.ndviMean.toFixed(2)
                        : "—"}
                  </p>
                </div>
                <div className="rounded-md bg-primary/5 p-3">
                  <p className="text-muted-foreground">{t[lang].satelliteMoisture}</p>
                  <p className="text-lg font-semibold">
                    {typeof satelliteInsight.satellite?.soilMoisture?.value === "number"
                      ? `${Math.round(satelliteInsight.satellite.soilMoisture.value)}%`
                      : "—"}
                  </p>
                </div>
                <div className="rounded-md bg-primary/5 p-3">
                  <p className="text-muted-foreground">{t[lang].satelliteChlorophyll}</p>
                  <p className="text-lg font-semibold">
                    {typeof satelliteInsight.satellite?.chlorophyll?.value === "number"
                      ? satelliteInsight.satellite.chlorophyll.value.toFixed(2)
                      : "—"}
                  </p>
                </div>
              </div>

              {typeof satelliteInsight.analysis?.confidence === "number" && (
                <p className="text-sm font-medium">
                  {t[lang].satelliteConfidence}: {Math.round(satelliteInsight.analysis.confidence * 100)}%
                </p>
              )}

              {satelliteInsight.analysis?.summary && (
                <p className="text-sm text-muted-foreground">{satelliteInsight.analysis.summary}</p>
              )}

              {Array.isArray(satelliteInsight.analysis?.recommendations) && (
                <div>
                  <p className="font-semibold mb-1">{t[lang].satelliteRecommendations}</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {satelliteInsight.analysis.recommendations.map((rec) => (
                      <li key={rec}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
