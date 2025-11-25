"use client"

import type { GeoJSON } from "geojson"
import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Loader2, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/use-language"

const SatelliteMap = dynamic(() => import("@/components/satellite-map").then((mod) => mod.SatelliteMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] w-full items-center justify-center rounded-xl border border-primary/20 bg-muted/40 text-sm text-muted-foreground">
      تحميل خريطة القمر الصناعي / Loading satellite map…
    </div>
  ),
})

export default function CropMonitoringPage() {
  const { language, setLanguage } = useTranslation()
  const [monitoring, setMonitoring] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<"ar" | "en">(language === "en" ? "en" : "ar")
  const [activeMonitoring, setActiveMonitoring] = useState<any | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (language === "ar" || language === "en") {
      setLang(language)
    }
  }, [language])

  useEffect(() => {
    fetchMonitoring()
  }, [])

  async function fetchMonitoring() {
    try {
      const { data, error } = await supabase
        .from("crop_monitoring")
        .select("*, fields(id, name, boundary_coordinates, farms(name, latitude, longitude))")
        .order("monitoring_date", { ascending: false })

      if (error) throw error
      setMonitoring(data || [])
      setActiveMonitoring(data && data.length > 0 ? data[0] : null)
    } catch (error) {
      console.error("[v0] Error fetching crop monitoring:", error)
    } finally {
      setLoading(false)
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case "excellent":
        return "bg-green-500"
      case "good":
        return "bg-green-400"
      case "fair":
        return "bg-yellow-500"
      case "poor":
        return "bg-orange-500"
      case "critical":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const t = {
    ar: {
      title: "مراقبة المحاصيل",
      addMonitoring: "إضافة مراقبة جديدة",
      noMonitoring: "لا توجد بيانات مراقبة",
      noMonitoringDesc: "ابدأ بإضافة بيانات مراقبة المحاصيل",
      field: "الحقل",
      farm: "المزرعة",
      date: "التاريخ",
      health: "الحالة الصحية",
      ndvi: "مؤشر NDVI",
      evi: "مؤشر EVI",
      viewDetails: "عرض التفاصيل",
      excellent: "ممتاز",
      good: "جيد",
      fair: "متوسط",
      poor: "ضعيف",
      critical: "حرج",
    },
    en: {
      title: "Crop Monitoring",
      addMonitoring: "Add New Monitoring",
      noMonitoring: "No Monitoring Data",
      noMonitoringDesc: "Start by adding crop monitoring data",
      field: "Field",
      farm: "Farm",
      date: "Date",
      health: "Health Status",
      ndvi: "NDVI Index",
      evi: "EVI Index",
      viewDetails: "View Details",
      excellent: "Excellent",
      good: "Good",
      fair: "Fair",
      poor: "Poor",
      critical: "Critical",
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
            className="glass-card border-white/10 hover:border-green-500/50 hover:shadow-glow transition-all"
          >
            {lang === "ar" ? "EN" : "ع"}
          </Button>
          <Link href="/dashboard/crop-monitoring/new">
            <Button className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-glow hover:shadow-glow-lg transition-all">
              <Plus className="h-4 w-4" />
              {t[lang].addMonitoring}
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        </div>
      ) : monitoring.length === 0 ? (
        <Card className="glass-card p-12 text-center border-white/10 shadow-depth">
          <div className="mx-auto max-w-md space-y-4">
            <h3 className="text-2xl font-bold text-white">{t[lang].noMonitoring}</h3>
            <p className="text-gray-400">{t[lang].noMonitoringDesc}</p>
            <Link href="/dashboard/crop-monitoring/new">
              <Button className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-glow hover:shadow-glow-lg transition-all">
                <Plus className="h-4 w-4" />
                {t[lang].addMonitoring}
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeMonitoring && (
            <SatelliteMap
              fieldId={activeMonitoring.fields?.id ?? null}
              latitude={
                activeMonitoring.fields?.latitude ??
                activeMonitoring.fields?.farms?.latitude ??
                25.2854
              }
              longitude={
                activeMonitoring.fields?.longitude ??
                activeMonitoring.fields?.farms?.longitude ??
                32.6421
              }
              boundary={(activeMonitoring.fields?.boundary_coordinates as GeoJSON.Polygon) ?? null}
              fieldName={activeMonitoring.fields?.name || "Field"}
              ndviValue={activeMonitoring.ndvi_value ?? null}
              healthStatus={activeMonitoring.health_status || null}
              lang={lang}
            />
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {monitoring.map((item) => (
              <Card
                key={item.id}
                className={`glass-card p-6 border transition-all group cursor-pointer ${
                  activeMonitoring?.id === item.id
                    ? "border-green-500/70 shadow-glow"
                    : "border-white/10 hover:border-green-500/50 hover:shadow-glow"
                }`}
                onMouseEnter={() => setActiveMonitoring(item)}
                onFocus={() => setActiveMonitoring(item)}
                onClick={() => setActiveMonitoring(item)}
                tabIndex={0}
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-green-400 transition-colors">
                      {item.fields?.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {t[lang].farm}: {item.fields?.farms?.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t[lang].date}:{" "}
                      {formatMonitoringDate(item.monitoring_date, lang)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">{t[lang].health}:</span>
                    <Badge className={`${getHealthColor(item.health_status)} border-0 shadow-glow`}>
                      {t[lang][item.health_status as keyof typeof t.ar] || item.health_status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400">{t[lang].ndvi}</p>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-400" />
                        <p className="text-lg font-bold text-green-400">{item.ndvi_value?.toFixed(2) || "N/A"}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-gray-400">{t[lang].evi}</p>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-400" />
                        <p className="text-lg font-bold text-green-400">{item.evi_value?.toFixed(2) || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  <Link href={`/dashboard/crop-monitoring/${item.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full glass-card border-white/10 hover:border-green-500/50 hover:shadow-glow transition-all bg-transparent"
                    >
                      {t[lang].viewDetails}
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function formatMonitoringDate(value: string, language: "ar" | "en") {
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
