"use client"

import { Suspense, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { SoilIntelligenceDashboard } from "@/components/analytics/soil-intelligence-dashboard"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowLeft } from "lucide-react"
import Link from "next/link"

type Lang = "ar" | "en"

const STRINGS: Record<Lang, Record<string, string>> = {
  ar: {
    title: "ذكاء التربة بالأقمار الصناعية",
    subtitle: "تحليلات مدعومة بالذكاء الاصطناعي والاستشعار عن بعد",
    backToFields: "العودة للحقول",
    selectField: "اختر حقلاً",
    selectFieldDesc: "اختر حقلاً من القائمة لعرض تحليلات التربة الذكية",
    noFields: "لا توجد حقول",
    noFieldsDesc: "أضف حقولاً أولاً لعرض تحليلات التربة",
    addField: "إضافة حقل",
    aiPowered: "مدعوم بالذكاء الاصطناعي",
    aiDesc: "هذه التحليلات تعتمد على بيانات الأقمار الصناعية الفعلية، نماذج التعلم الآلي، والتنبؤات العميقة - لا حاجة لإدخال بيانات يدوية.",
  },
  en: {
    title: "Satellite Soil Intelligence",
    subtitle: "AI-powered analytics with remote sensing",
    backToFields: "Back to Fields",
    selectField: "Select a Field",
    selectFieldDesc: "Choose a field from the list to view smart soil analytics",
    noFields: "No Fields",
    noFieldsDesc: "Add fields first to view soil analytics",
    addField: "Add Field",
    aiPowered: "AI-Powered",
    aiDesc: "These analytics are based on real satellite data, machine learning models, and deep predictions - no manual data entry required.",
  },
}

export default function SoilAnalysisPage() {
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
        .select("id, name, boundary_coordinates, farms!fields_farm_id_fkey(name)")
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary" />
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
      <Card className="glass-card border-primary/20 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
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
              <Button className="bg-primary hover:bg-primary/90 text-black">
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
              <Link key={field.id} href={`/dashboard/soil-analysis?field=${field.id}`}>
                <Button
                  variant="outline"
                  className="whitespace-nowrap border-primary/30 hover:bg-primary/10"
                >
                  {field.name}
                </Button>
              </Link>
            ))}
          </div>

          {/* Dashboard for first field */}
          <SoilIntelligenceDashboard
            fieldId={fields[0].id}
            fieldName={fields[0].name}
            polygon={parsePolygon(fields[0].boundary_coordinates)}
            cropType={null}
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
