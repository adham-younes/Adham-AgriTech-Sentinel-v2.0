"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, Loader2, MapPin, Leaf, Sparkles } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/use-language"
import { ProfessionalFieldCard } from "@/components/ui/professional-field-card"
import { EarlyWarningBanner } from "@/components/dashboard/early-warning-banner"
import { useSearchParams } from "next/navigation"

export default function FieldsPage() {
  const searchParams = useSearchParams()
  const farmId = searchParams?.get('farm_id')
  const { language, setLanguage } = useTranslation()
  const [fields, setFields] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<"ar" | "en">(language === "en" ? "en" : "ar")
  const [filterCritical, setFilterCritical] = useState(false)
  const [fieldMetrics, setFieldMetrics] = useState<Record<string, any>>({})

  const supabase = createClient()

  const fetchFieldMetrics = async (fieldId: string) => {
    try {
      const response = await fetch(`/api/fields/${fieldId}/metrics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })
      if (response.ok) {
        const data = await response.json()
        return data
      }
    } catch (error) {
      console.error(`[Fields] Error fetching metrics for field ${fieldId}:`, error)
    }
    return null
  }

  useEffect(() => {
    if (language === "ar" || language === "en") {
      setLang(language)
    }
  }, [language])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/fields', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        })

        if (!response.ok) {
          if (response.status === 401) {
            console.warn('[Fields] Not authenticated')
            setFields([])
            return
          }
          throw new Error(`Failed to fetch fields: ${response.status}`)
        }

        const data = await response.json()
        let fieldsData = data.fields || []

        if (farmId) {
          fieldsData = fieldsData.filter((f: any) => f.farm_id === farmId)
        }

        setFields(fieldsData)

        // Fetch metrics for each field with proper error handling
        const metricsPromises = fieldsData.map(async (field: any) => {
          try {
            const metrics = await fetchFieldMetrics(field.id)
            return { fieldId: field.id, metrics }
          } catch (error) {
            console.error(`[Fields] Error fetching metrics for field ${field.id}:`, error)
            return { fieldId: field.id, metrics: null }
          }
        })

        const metricsResults = await Promise.allSettled(metricsPromises)
        const metricsMap = metricsResults.reduce((acc, result) => {
          if (result.status === 'fulfilled' && result.value.metrics) {
            acc[result.value.fieldId] = result.value.metrics
          }
          return acc
        }, {} as Record<string, any>)

        setFieldMetrics(metricsMap)
      } catch (error) {
        console.error("[Fields] Error fetching fields:", error)
        setFields([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [farmId])

  const t = {
    ar: {
      title: "الحقول",
      subtitle: "إدارة ومراقبة جميع حقولك مع بيانات الأقمار الصناعية والمؤشرات الصحية.",
      addField: "إضافة حقل جديد",
      noFields: "لا توجد حقول",
      noFieldsDesc: "ابدأ بإضافة حقل جديد لبدء المراقبة الزراعية",
      area: "المساحة",
      farm: "المزرعة",
      cropType: "نوع المحصول",
      ndvi: "مؤشر NDVI",
      moisture: "رطوبة المحصول",
      lastReading: "آخر قراءة",
      criticalOnly: "الحقول الحرجة فقط",
      aiPowered: "مراقبة ذكية",
      aiDesc: "نظام مراقبة متكامل يستخدم صور الأقمار الصناعية والذكاء الاصطناعي لتحليل صحة المحاصيل وتوفير توصيات ري دقيقة.",
    },
    en: {
      title: "Fields",
      subtitle: "Manage and monitor all your fields with satellite data and health indicators.",
      addField: "Add New Field",
      noFields: "No Fields",
      noFieldsDesc: "Start by adding a new field to begin agricultural monitoring",
      area: "Area",
      farm: "Farm",
      cropType: "Crop Type",
      ndvi: "NDVI",
      moisture: "Crop moisture",
      lastReading: "Last reading",
      criticalOnly: "Critical Fields Only",
      aiPowered: "Smart Monitoring",
      aiDesc: "Integrated monitoring system using satellite imagery and AI to analyze crop health and provide precise irrigation recommendations.",
    },
  } as const

  const parseMaybeNumber = (value: unknown) =>
    typeof value === "string"
      ? Number.parseFloat(value)
      : typeof value === "number"
        ? value
        : null

  const decoratedFields = fields.map((field) => {
    const ndvi = parseMaybeNumber((field as any).last_ndvi ?? (field as any).ndvi_score)
    const moisture = parseMaybeNumber((field as any).last_moisture ?? (field as any).moisture_index)
    const heat = parseMaybeNumber((field as any).last_temperature ?? (field as any).temperature_c)
    const critical =
      (ndvi != null && ndvi < 0.3) || (moisture != null && moisture < 25) || (heat != null && heat > 36)
    const badgeColor = (() => {
      if (critical) return "bg-amber-600/80"
      if (ndvi != null && ndvi < 0.4) return "bg-emerald-600/60"
      if (ndvi != null && ndvi < 0.6) return "bg-emerald-600/80"
      return "bg-emerald-600"
    })()
    return { ...field, ndvi, moisture, heat, critical, badgeColor }
  })

  const visibleFields = filterCritical ? decoratedFields.filter((f) => f.critical) : decoratedFields

  // Calculate summary statistics
  const totalFields = fields.length
  const healthyFields = decoratedFields.filter(f => f.ndvi != null && f.ndvi >= 0.6).length
  const criticalFields = decoratedFields.filter(f => f.critical).length
  const ndviValues = decoratedFields
    .map(f => f.ndvi)
    .filter((v): v is number => v != null && !isNaN(v) && v >= -1 && v <= 1)
  const avgNDVI = ndviValues.length > 0
    ? ndviValues.reduce((sum, v) => sum + v, 0) / ndviValues.length
    : 0

  return (
    <div className="space-y-6 min-h-screen">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-primary bg-clip-text text-transparent flex items-center gap-3">
              <Leaf className="h-8 w-8 text-emerald-400" />
              {t[lang].title}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t[lang].subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50"
              onClick={() => {
                const next = lang === "ar" ? "en" : "ar"
                setLang(next)
                setLanguage(next)
              }}
            >
              {lang === "ar" ? "EN" : "ع"}
            </Button>
            <Link href="/dashboard/fields/new">
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                {t[lang].addField}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Professional Smart Monitoring Card */}
      <Card className="glass-card border-emerald-400/30 bg-gradient-to-br from-emerald-950/40 via-black/60 to-cyan-950/40 backdrop-blur-xl p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/20 blur-xl rounded-full"></div>
            <div className="relative bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 p-3 rounded-xl border border-emerald-400/30">
              <Sparkles className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-emerald-400">{t[lang].aiPowered}</h3>
              <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-400/30">
                {lang === "ar" ? "مباشر" : "LIVE"}
              </span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed mb-4">{t[lang].aiDesc}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="bg-black/40 rounded-lg p-3 border border-emerald-500/20">
                <div className="text-xs text-emerald-400/70 mb-1">{lang === "ar" ? "الأقمار الصناعية" : "Satellite"}</div>
                <div className="text-sm font-semibold text-white">EOSDA</div>
              </div>
              <div className="bg-black/40 rounded-lg p-3 border border-emerald-500/20">
                <div className="text-xs text-emerald-400/70 mb-1">{lang === "ar" ? "الذكاء الاصطناعي" : "AI Engine"}</div>
                <div className="text-sm font-semibold text-white">Gemini</div>
              </div>
              <div className="bg-black/40 rounded-lg p-3 border border-emerald-500/20">
                <div className="text-xs text-emerald-400/70 mb-1">{lang === "ar" ? "تحليل التربة" : "Soil Analysis"}</div>
                <div className="text-sm font-semibold text-white">NPK+</div>
              </div>
              <div className="bg-black/40 rounded-lg p-3 border border-emerald-500/20">
                <div className="text-xs text-emerald-400/70 mb-1">{lang === "ar" ? "توقعات الإنتاجية" : "Yield Forecast"}</div>
                <div className="text-sm font-semibold text-white">AI</div>
              </div>
            </div>
            {/* Summary Stats */}
            {totalFields > 0 && (
              <div className="mt-4 pt-4 border-t border-emerald-500/20 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400">{totalFields}</div>
                  <div className="text-xs text-gray-400">{lang === "ar" ? "إجمالي الحقول" : "Total Fields"}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{healthyFields}</div>
                  <div className="text-xs text-gray-400">{lang === "ar" ? "حقول صحية" : "Healthy"}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">{criticalFields}</div>
                  <div className="text-xs text-gray-400">{lang === "ar" ? "حقول حرجة" : "Critical"}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400">{avgNDVI.toFixed(2)}</div>
                  <div className="text-xs text-gray-400">{lang === "ar" ? "متوسط NDVI" : "Avg NDVI"}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : visibleFields.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <div className="mx-auto max-w-md space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
              <MapPin className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-300">{t[lang].noFields}</h3>
            <p className="text-gray-400">{t[lang].noFieldsDesc}</p>
            <Link href="/dashboard/fields/new">
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                {t[lang].addField}
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Early Warning Banner for first critical field */}
          {visibleFields.find((f) => f.critical) && (
            <EarlyWarningBanner fieldId={visibleFields.find((f) => f.critical)!.id} />
          )}
          
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleFields.map((field) => (
              <div key={field.id || `field-${Math.random()}`} className="space-y-3">
                {field.critical && (
                  <EarlyWarningBanner fieldId={field.id} />
                )}
                <ProfessionalFieldCard
                  field={field}
                  metrics={fieldMetrics[field.id] || null}
                  onClick={() => {
                    window.location.href = `/dashboard/fields/${field.id}`
                  }}
                  lang={lang}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
