"use client"

import type { GeoJSON } from "geojson"
import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Loader2, MapPin } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { eosdaPublicConfig } from "@/lib/config/eosda"
import AgricultureSearch from '@/components/AgricultureSearch'
import { useTranslation } from "@/lib/i18n/use-language"
import { formatDateSafe } from "@/lib/utils/date-safe"

const SatelliteMap = dynamic(() => import("@/components/satellite-map").then((mod) => mod.SatelliteMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] w-full items-center justify-center rounded-xl border border-primary/20 bg-muted/40 text-sm text-muted-foreground">
      تحميل خريطة القمر الصناعي / Loading satellite map…
    </div>
  ),
})

export default function CropMonitoringDetailsPage() {
  const params = useParams()
  const { language, setLanguage } = useTranslation()
  const [monitoring, setMonitoring] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<"ar" | "en">(language === "en" ? "en" : "ar")
  const [sentinelImageUrl, setSentinelImageUrl] = useState<string | null>(null)

  const hectaresToFeddan = (hectares?: number | null) =>
    typeof hectares === "number" && Number.isFinite(hectares) ? hectares * 2.381 : null
  const parseMaybeNumber = (value: unknown) =>
    typeof value === "string"
      ? Number.parseFloat(value)
      : typeof value === "number"
        ? value
        : null

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
    if (params?.id) {
      fetchMonitoringDetails()
    }
  }, [params?.id])

  async function fetchMonitoringDetails() {
    try {
      const { data, error } = await supabase
        .from("crop_monitoring")
        .select("*, fields(id, name, area, crop_type, boundary_coordinates, farms(name, location, latitude, longitude))")
        .eq("id", params?.id)
        .single()

      if (error) throw error
      setMonitoring(data)
    } catch (error) {
      console.error("[v0] Error fetching monitoring details:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function fetchSentinelImage() {
      try {
        if (!monitoring || monitoring.satellite_image_url) return
        const lat = monitoring.fields?.latitude ?? monitoring.fields?.farms?.latitude
        const lng = monitoring.fields?.longitude ?? monitoring.fields?.farms?.longitude
        if (typeof lat !== 'number' || typeof lng !== 'number') return

        const delta = 0.015
        const bounds = [
          [lng - delta, lat - delta],
          [lng + delta, lat + delta],
        ]

        const res = await fetch('/api/sentinel/imagery', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ bounds, date: new Date().toISOString().split('T')[0], width: 960, height: 540 }),
        })
        if (!res.ok) return
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        setSentinelImageUrl(objectUrl)
      } catch (err) {
        console.error('[Sentinel] Image fetch failed', err)
      }
    }

    fetchSentinelImage()
  }, [monitoring])

  useEffect(() => {
    return () => {
      if (sentinelImageUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(sentinelImageUrl)
      }
    }
  }, [sentinelImageUrl])

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
      back: "رجوع",
      details: "تفاصيل مراقبة المحاصيل",
      field: "الحقل",
      farm: "المزرعة",
      location: "الموقع",
      area: "المساحة",
      cropType: "نوع المحصول",
      date: "تاريخ المراقبة",
      health: "الحالة الصحية",
      indices: "المؤشرات النباتية",
      ndvi: "مؤشر NDVI",
      ndviDesc: "مؤشر الغطاء النباتي",
      evi: "مؤشر EVI",
      eviDesc: "مؤشر الغطاء النباتي المحسن",
      ndwi: "مؤشر NDWI",
      ndwiDesc: "مؤشر المياه",
      temperature: "درجة الحرارة",
      satelliteImage: "صورة القمر الصناعي",
      notes: "الملاحظات",
      noNotes: "لا توجد ملاحظات",
      excellent: "ممتاز",
      good: "جيد",
      fair: "متوسط",
      poor: "ضعيف",
      critical: "حرج",
    },
    en: {
      back: "Back",
      details: "Crop Monitoring Details",
      field: "Field",
      farm: "Farm",
      location: "Location",
      area: "Area",
      cropType: "Crop Type",
      date: "Monitoring Date",
      health: "Health Status",
      indices: "Vegetation Indices",
      ndvi: "NDVI Index",
      ndviDesc: "Normalized Difference Vegetation Index",
      evi: "EVI Index",
      eviDesc: "Enhanced Vegetation Index",
      ndwi: "NDWI Index",
      ndwiDesc: "Normalized Difference Water Index",
      temperature: "Temperature",
      satelliteImage: "Satellite Image",
      notes: "Notes",
      noNotes: "No notes available",
      excellent: "Excellent",
      good: "Good",
      fair: "Fair",
      poor: "Poor",
      critical: "Critical",
    },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!monitoring) {
    return <div>Monitoring data not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/crop-monitoring">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{monitoring.fields?.name}</h1>
            <p className="text-muted-foreground">{t[lang].details}</p>
            <AgricultureSearch />
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

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t[lang].farm}</p>
            <p className="font-semibold">{monitoring.fields?.farms?.name}</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t[lang].location}</p>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-primary" />
              <p className="font-semibold text-sm">{monitoring.fields?.farms?.location}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t[lang].area}</p>
            <p className="font-semibold">
              {(() => {
                const feddan = parseMaybeNumber(monitoring.fields?.area)
                return feddan != null
                  ? `${feddan.toFixed(2)} ${lang === 'ar' ? 'فدان' : 'feddans'}`
                  : lang === 'ar'
                    ? 'غير متوفر'
                    : 'N/A'
              })()}
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t[lang].date}</p>
            <p className="font-semibold">
              {formatMonitoringDate(monitoring.monitoring_date, lang)}
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{t[lang].health}</h2>
          <Badge className={`${getHealthColor(monitoring.health_status)} text-white`}>
            {t[lang][monitoring.health_status as keyof typeof t.ar] || monitoring.health_status}
          </Badge>
        </div>

        {monitoring.fields?.crop_type && (
          <div className="mb-4 pb-4 border-b">
            <p className="text-sm text-muted-foreground">{t[lang].cropType}</p>
            <p className="font-semibold">{monitoring.fields.crop_type}</p>
          </div>
        )}

        <div className="space-y-6">
          <h3 className="text-lg font-semibold">{t[lang].indices}</h3>

          {monitoring.ndvi_value !== null && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t[lang].ndvi}</p>
                  <p className="text-xs text-muted-foreground">{t[lang].ndviDesc}</p>
                </div>
                <span className="text-2xl font-bold">{monitoring.ndvi_value.toFixed(2)}</span>
              </div>
              <Progress value={monitoring.ndvi_value * 100} className="h-2" />
            </div>
          )}

          {monitoring.evi_value !== null && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t[lang].evi}</p>
                  <p className="text-xs text-muted-foreground">{t[lang].eviDesc}</p>
                </div>
                <span className="text-2xl font-bold">{monitoring.evi_value.toFixed(2)}</span>
              </div>
              <Progress value={monitoring.evi_value * 100} className="h-2" />
            </div>
          )}

          {monitoring.ndwi_value !== null && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t[lang].ndwi}</p>
                  <p className="text-xs text-muted-foreground">{t[lang].ndwiDesc}</p>
                </div>
                <span className="text-2xl font-bold">{monitoring.ndwi_value.toFixed(2)}</span>
              </div>
              <Progress value={monitoring.ndwi_value * 100} className="h-2" />
            </div>
          )}

          {monitoring.temperature_celsius !== null && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="font-medium">{t[lang].temperature}</p>
              <span className="text-2xl font-bold">{monitoring.temperature_celsius}°C</span>
            </div>
          )}
        </div>
      </Card>

      {monitoring.fields?.farms && (
        <SatelliteMap
          fieldId={monitoring.fields.id ?? null}
          latitude={
            monitoring.fields.latitude ??
            monitoring.fields.farms.latitude ??
            eosdaPublicConfig.center.lat
          }
          longitude={
            monitoring.fields.longitude ??
            monitoring.fields.farms.longitude ??
            eosdaPublicConfig.center.lng
          }
          boundary={(monitoring.fields.boundary_coordinates as GeoJSON.Polygon) ?? null}
          fieldName={monitoring.fields.name}
          ndviValue={monitoring.ndvi_value}
          healthStatus={monitoring.health_status}
          lang={lang}
        />
      )}

      {(monitoring.satellite_image_url || sentinelImageUrl) && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">{t[lang].satelliteImage}</h2>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
            <Image
              src={monitoring.satellite_image_url || sentinelImageUrl || "/placeholder.svg"}
              alt={`Satellite imagery for ${monitoring.fields?.name} on ${formatMonitoringDate(monitoring.monitoring_date, lang)}`}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </Card>
      )}

      {monitoring.notes && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">{t[lang].notes}</h2>
          <p className="whitespace-pre-wrap leading-relaxed">{monitoring.notes}</p>
        </Card>
      )}
    </div>
  )
}

function formatMonitoringDate(value: string, language: "ar" | "en") {
  const locale = language === "ar" ? "ar-EG" : "en-US"
  return formatDateSafe(value, locale, { dateStyle: "medium" }, value)
}
