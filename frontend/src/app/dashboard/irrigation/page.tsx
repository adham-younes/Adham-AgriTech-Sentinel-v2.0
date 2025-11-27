"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Loader2, Droplets, Calendar } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/use-language"
import { isFeatureEnabled } from "@/lib/config/feature-flags"
import { fetchSatelliteInsights } from "@/lib/client/satellite-insights"
import type { SatelliteInsightsMap } from "@/lib/types/satellite"
import { IrrigationRecommendation } from "@/components/dashboard/irrigation-recommendation"

export default function IrrigationPage() {
  const { language, setLanguage } = useTranslation()
  const [systems, setSystems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<"ar" | "en">(language === "en" ? "en" : "ar")
  const satelliteEnabled = isFeatureEnabled("soilAnalysisAutomation")
  const [fieldInsights, setFieldInsights] = useState<SatelliteInsightsMap>({})
  const [satelliteSyncing, setSatelliteSyncing] = useState(false)

  const supabase = createClient()

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

    let cancelled = false
    async function loadInsights() {
      setSatelliteSyncing(true)
      try {
        for (const fieldId of pending) {
          const payload = await fetchSatelliteInsights(fieldId, lang)
          if (!cancelled && payload) {
            setFieldInsights((prev) => ({ ...prev, [fieldId]: payload }))
          }
        }
      } finally {
        if (!cancelled) {
          setSatelliteSyncing(false)
        }
      }
    }

    void loadInsights()
    return () => {
      cancelled = true
    }
  }, [systems, lang, satelliteEnabled, fieldInsights])

  async function fetchSystems() {
    try {
      const { data, error } = await supabase
        .from("irrigation_systems")
        .select("*, field_id, fields(id, name, farms(name))")
        .order("created_at", { ascending: false })

      if (error) throw error
      setSystems(data || [])
    } catch (error) {
      console.error("[v0] Error fetching irrigation systems:", error)
    } finally {
      setLoading(false)
    }
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

  const t = {
    ar: {
      title: "أنظمة الري",
      addSystem: "إضافة نظام جديد (معطل)",
      noSystems: "لا توجد أنظمة ري",
      noSystemsDesc: "سيتم اقتراح الجداول تلقائياً عند توفر بيانات القمر الصناعي للحقل.",
      field: "الحقل",
      farm: "المزرعة",
      type: "النوع",
      status: "الحالة",
      flowRate: "معدل التدفق",
      schedule: "الجدول",
      active: "نشط",
      scheduled: "مجدول",
      inactive: "غير نشط",
      maintenance: "صيانة",
      drip: "تنقيط",
      sprinkler: "رش",
      surface: "سطحي",
      subsurface: "تحت السطح",
      viewDetails: "عرض التفاصيل",
      satelliteSection: "بيانات القمر الصناعي",
      satelliteNdvi: "NDVI",
      satelliteMoisture: "الرطوبة",
      satelliteChlorophyll: "الكلوروفيل",
      satellitePending: "جاري مزامنة بيانات القمر الصناعي...",
      satelliteUnavailable: "لا توجد قراءات في الوقت الحالي",
    },
    en: {
      title: "Irrigation Systems",
      addSystem: "Add New System (disabled)",
      noSystems: "No Irrigation Systems",
      noSystemsDesc: "Schedules will be suggested automatically when satellite data is available for your field.",
      field: "Field",
      farm: "Farm",
      type: "Type",
      status: "Status",
      flowRate: "Flow Rate",
      schedule: "Schedule",
      active: "Active",
      scheduled: "Scheduled",
      inactive: "Inactive",
      maintenance: "Maintenance",
      drip: "Drip",
      sprinkler: "Sprinkler",
      surface: "Surface",
      subsurface: "Subsurface",
      viewDetails: "View Details",
      satelliteSection: "Satellite signals",
      satelliteNdvi: "NDVI",
      satelliteMoisture: "Soil moisture",
      satelliteChlorophyll: "Chlorophyll",
      satellitePending: "Syncing Satellite data...",
      satelliteUnavailable: "No satellite readings yet",
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
          <Button disabled className="gap-2 bg-slate-200 text-slate-500 border border-slate-300">
            <Plus className="h-4 w-4" />
            {t[lang].addSystem}
          </Button>
        </div>
      </div>

      {/* Global Recommendation based on first system/field if available */}
      {systems.length > 0 && fieldInsights[systems[0].field_id] && (
        <IrrigationRecommendation
          moisture={fieldInsights[systems[0].field_id]?.satellite?.soilMoisture?.value ?? undefined}
          cropType={systems[0].fields?.crop_type}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : systems.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto max-w-md space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Droplets className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">{t[lang].noSystems}</h3>
            <p className="text-muted-foreground">{t[lang].noSystemsDesc}</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {systems.map((system) => {
            const insight = satelliteEnabled && system.field_id ? fieldInsights[system.field_id] : null
            const ndviLabel =
              typeof insight?.satellite?.ndviValue === "number"
                ? insight.satellite.ndviValue.toFixed(2)
                : typeof insight?.satellite?.ndviMean === "number"
                  ? insight.satellite.ndviMean.toFixed(2)
                  : "—"
            const moistureLabel =
              typeof insight?.satellite?.soilMoisture?.value === "number"
                ? `${Math.round(insight.satellite.soilMoisture.value)}%`
                : "—"
            const chlorophyllLabel =
              typeof insight?.satellite?.chlorophyll?.value === "number"
                ? insight.satellite.chlorophyll.value.toFixed(2)
                : "—"

            return (
              <Card key={system.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{system.fields?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t[lang].farm}: {system.fields?.farms?.name}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(system.status)} text-white`}>
                      {t[lang][system.status as keyof typeof t.ar] || system.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t[lang].type}:</span>
                      <span className="font-medium">
                        {t[lang][system.irrigation_type as keyof typeof t.ar] || system.irrigation_type}
                      </span>
                    </div>

                    {system.flow_rate_lpm && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{t[lang].flowRate}:</span>
                        <div className="flex items-center gap-1">
                          <Droplets className="h-3 w-3 text-primary" />
                          <span className="font-medium">{system.flow_rate_lpm} L/min</span>
                        </div>
                      </div>
                    )}

                    {system.schedule && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{t[lang].schedule}:</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-primary" />
                          <span className="font-medium text-xs">{system.schedule}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {satelliteEnabled && system.field_id && (
                    <div className="mt-4 rounded-md bg-primary/5 p-3 text-xs">
                      <p className="font-semibold text-sm">{t[lang].satelliteSection}</p>
                      {insight ? (
                        <div className="mt-2 grid gap-3 sm:grid-cols-3">
                          <div>
                            <p className="text-muted-foreground">{t[lang].satelliteNdvi}</p>
                            <p className="text-base font-semibold">{ndviLabel}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t[lang].satelliteMoisture}</p>
                            <p className="text-base font-semibold">{moistureLabel}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t[lang].satelliteChlorophyll}</p>
                            <p className="text-base font-semibold">{chlorophyllLabel}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 text-muted-foreground">
                          {satelliteSyncing ? t[lang].satellitePending : t[lang].satelliteUnavailable}
                        </p>
                      )}
                    </div>
                  )}

                  <Link href={`/dashboard/irrigation/${system.id}`}>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      {t[lang].viewDetails}
                    </Button>
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
