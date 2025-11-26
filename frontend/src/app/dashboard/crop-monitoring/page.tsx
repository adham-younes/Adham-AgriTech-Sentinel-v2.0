"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { CropHealthMonitor } from "@/components/analytics/crop-health-monitor"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Leaf, ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"

type Lang = "ar" | "en"

const STRINGS: Record<Lang, Record<string, string>> = {
  ar: {
    title: "مراقبة صحة المحاصيل",
    subtitle: "تحليل شامل مدعوم بالذكاء الاصطناعي والأقمار الصناعية",
    backToFields: "العودة للحقول",
    selectField: "اختر حقلاً",
    noFields: "لا توجد حقول",
    noFieldsDesc: "أضف حقولاً أولاً لعرض تحليلات صحة المحاصيل",
    addField: "إضافة حقل",
    aiPowered: "مدعوم بالذكاء الاصطناعي",
    aiDesc: "نظام مراقبة متقدم يستخدم NDVI من الأقمار الصناعية، كشف الإجهاد بالتعلم الآلي، وتوقعات الإنتاجية - بدون إدخال يدوي.",
  },
  en: {
    title: "Crop Health Monitoring",
    subtitle: "Comprehensive AI-powered satellite analysis",
    backToFields: "Back to Fields",
    selectField: "Select a Field",
    noFields: "No Fields",
    noFieldsDesc: "Add fields first to view crop health analytics",
    addField: "Add Field",
    aiPowered: "AI-Powered",
    aiDesc: "Advanced monitoring system using satellite NDVI, ML stress detection, and yield predictions - no manual input required.",
  },
}

export default function CropMonitoringPage() {
  const [lang, setLang] = useState<Lang>("ar")
  const [fields, setFields] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchFields()
  }, [])

  async function fetchFields() {
    try {
      const { data, error } = await supabase
        .from("fields")
        .select("id, name, crop_type, area, boundary_coordinates, farms!fields_farm_id_fkey(name)")
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error
      setFields(data || [])
    } catch (error) {
      console.error("Error fetching fields:", error)
    } finally {
      setLoading(false)
    }
  }

  const t = STRINGS[lang]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-primary bg-clip-text text-transparent flex items-center gap-3">
              <Leaf className="h-8 w-8 text-emerald-400" />
              {t.title}
            </h1>
            <p className="text-muted-foreground mt-2">{t.subtitle}</p>
          </div>
          <Link href="/dashboard/fields">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t.backToFields}
            </Button>
          </Link>
        </div>
      </div>

      {/* AI Info Card */}
      <Card className="glass-card border-emerald-400/20 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-white mb-1">{t.aiPowered}</p>
            <p className="text-muted-foreground">{t.aiDesc}</p>
          </div>
        </div>
      </Card>

      {/* Field Selection & Dashboard */}
      {fields.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <h3 className="text-2xl font-bold">{t.noFields}</h3>
            <p className="text-muted-foreground">{t.noFieldsDesc}</p>
            <Link href="/dashboard/fields/new">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                {t.addField}
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Field Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {fields.map((field) => (
              <Link key={field.id} href={`/dashboard/crop-monitoring?field=${field.id}`}>
                <Button
                  variant="outline"
                  className="whitespace-nowrap border-emerald-400/30 hover:bg-emerald-400/10"
                >
                  {field.name}
                  {field.crop_type && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({field.crop_type})
                    </span>
                  )}
                </Button>
              </Link>
            ))}
          </div>

          {/* Dashboard for first field */}
          <CropHealthMonitor
            fieldId={fields[0].id}
            fieldName={fields[0].name}
            polygon={parsePolygon(fields[0].boundary_coordinates)}
            cropType={fields[0].crop_type}
            areaHectares={parseArea(fields[0].area)}
          />
        </div>
      )}
    </div>
  )
}

function parsePolygon(coords: any): [number, number][] {
  if (!coords) return []
  if (Array.isArray(coords) && coords.length > 0) {
    if (Array.isArray(coords[0]) && coords[0].length === 2) {
      return coords as [number, number][]
    }
    if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
      return coords[0] as [number, number][]
    }
  }
  return []
}

function parseArea(area: any): number {
  if (typeof area === 'number') return area / 4200 // Convert from sqm to hectares
  if (typeof area === 'string') {
    const parsed = parseFloat(area)
    return isNaN(parsed) ? 1 : parsed / 4200
  }
  return 1
}
