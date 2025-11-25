"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import type { GeoJSON } from "geojson"
import { createBrowserClient } from "@supabase/ssr"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  Map as MapIcon,
  Grid,
  Activity,
  TrendingUp,
  Leaf,
  Droplets,
  AlertTriangle,
  Thermometer,
  Calendar,
} from "lucide-react"

interface MonitoringRecord {
  id: string
  monitoring_date: string
  health_status: string | null
  ndvi_value: number | null
  evi_value: number | null
  temperature_celsius: number | null
}

interface FieldWithMonitoring {
  id: string
  name: string
  cropType: string | null
  area: number | null
  centroid: [number, number] | null
  boundary: GeoJSON.Polygon | null
  latestMonitoring: MonitoringRecord | null
}

const FarmAnalyticsMap = dynamic(
  () => import("@/components/maps/farm-analytics-map").then((mod) => mod.FarmAnalyticsMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center rounded-2xl border border-primary/20 bg-muted/40 text-sm text-muted-foreground">
        تحميل خريطة الحقول...
      </div>
    ),
  },
)

export default function CropMonitoringLivePage() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  )

  const [fields, setFields] = useState<FieldWithMonitoring[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid")
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void loadData()
  }, [supabase])

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!user) {
        setFields([])
        setSelectedFieldId(null)
        return
      }

      const { data: ownershipRows, error: ownershipError } = await supabase
        .from("farm_owners")
        .select("farm_id")
        .eq("user_id", user.id)
        .eq("role", "owner")

      if (ownershipError) throw ownershipError

      const farmIds =
        ownershipRows?.map((row) => row.farm_id).filter((id): id is string => Boolean(id)) ?? []

      if (farmIds.length === 0) {
        setFields([])
        setSelectedFieldId(null)
        return
      }

      const { data: fieldRows, error: fieldError } = await supabase
        .from("fields")
        .select("id, name, crop_type, area, centroid, boundary_coordinates, latitude, longitude")
        .in("farm_id", farmIds)
        .is("is_archived", false)
        .order("updated_at", { ascending: false })

      if (fieldError) throw fieldError

      const fieldIds = fieldRows?.map((row) => row.id) ?? []
      const monitoringMap = new Map<string, MonitoringRecord>()

      if (fieldIds.length > 0) {
        const { data: monitoringRows, error: monitoringError } = await supabase
          .from("crop_monitoring")
          .select("id, field_id, monitoring_date, health_status, ndvi_value, evi_value, temperature_celsius")
          .in("field_id", fieldIds)
          .order("monitoring_date", { ascending: false })

        if (monitoringError) throw monitoringError

        monitoringRows?.forEach((row) => {
          if (!monitoringMap.has(row.field_id)) {
            monitoringMap.set(row.field_id, {
              id: row.id,
              monitoring_date: row.monitoring_date,
              health_status: row.health_status,
              ndvi_value: row.ndvi_value,
              evi_value: row.evi_value,
              temperature_celsius: row.temperature_celsius,
            })
          }
        })
      }

      const parsedFields: FieldWithMonitoring[] = (fieldRows ?? []).map((row) => {
        const boundary = row.boundary_coordinates ? (row.boundary_coordinates as GeoJSON.Polygon) : null
        const centroidValue = parseCentroid(row.centroid, row.latitude, row.longitude, boundary)

        return {
          id: row.id,
          name: row.name,
          cropType: row.crop_type ?? null,
          area: row.area ?? null,
          centroid: centroidValue,
          boundary,
          latestMonitoring: monitoringMap.get(row.id) ?? null,
        }
      })

      setFields(parsedFields)
      setSelectedFieldId((current) => current ?? parsedFields[0]?.id ?? null)
    } catch (err: any) {
      console.error("[CropMonitoringLivePage] loadData", err)
      setError(err?.message ?? "تعذر تحميل البيانات")
    } finally {
      setLoading(false)
    }
  }

  const summary = useMemo(() => {
    if (fields.length === 0) {
      return { total: 0, healthy: 0, critical: 0, averageNdvi: "0.00" }
    }

    const healthyStatuses = new Set(["excellent", "good"]) as Set<string>
    const criticalStatuses = new Set(["poor", "critical"]) as Set<string>

    const healthy = fields.filter((field) =>
      field.latestMonitoring?.health_status
        ? healthyStatuses.has(field.latestMonitoring.health_status)
        : false,
    ).length
    const critical = fields.filter((field) =>
      field.latestMonitoring?.health_status
        ? criticalStatuses.has(field.latestMonitoring.health_status)
        : false,
    ).length

    const ndviValues = fields
      .map((field) => field.latestMonitoring?.ndvi_value)
      .filter((value): value is number => typeof value === "number")

    const averageNdvi = ndviValues.length
      ? (ndviValues.reduce((acc, value) => acc + value, 0) / ndviValues.length).toFixed(2)
      : "0.00"

    return {
      total: fields.length,
      healthy,
      critical,
      averageNdvi,
    }
  }, [fields])

  const selectedField = useMemo(
    () => fields.find((field) => field.id === selectedFieldId) ?? null,
    [fields, selectedFieldId],
  )

  const hasNoData = !loading && fields.length === 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
            المراقبة الحية للمحاصيل
          </h1>
          <p className="text-sm text-muted-foreground">
            يتم تحميل بيانات حقيقية من قاعدة بيانات مزرعتك الآمنة وتتضمن أحدث قراءات NDVI والصحة النباتية.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="gap-2"
          >
            <Grid className="h-4 w-4" /> شبكة البطاقات
          </Button>
          <Button
            variant={viewMode === "map" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("map")}
            className="gap-2"
          >
            <MapIcon className="h-4 w-4" /> عرض الخريطة
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={<Leaf className="h-5 w-5" />} label="إجمالي الحقول" value={summary.total.toString()} />
        <SummaryCard icon={<TrendingUp className="h-5 w-5" />} label="حقول بصحة جيدة" value={summary.healthy.toString()} />
        <SummaryCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="حقول تحتاج تدخل"
          value={summary.critical.toString()}
          tone="warning"
        />
        <SummaryCard icon={<Activity className="h-5 w-5" />} label="متوسط NDVI" value={summary.averageNdvi} tone="success" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card className="glass-card border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> حدث خطأ أثناء تحميل البيانات
            </CardTitle>
            <CardDescription className="text-destructive/80">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => void loadData()} className="mt-2">
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      ) : hasNoData ? (
        <Card className="glass-card border-primary/30 text-center">
          <CardHeader>
            <CardTitle>لا توجد حقول معرفة</CardTitle>
            <CardDescription>
              قم بإضافة حقل من صفحة "الحقول" ثم قم بتسجيل أول قياس مراقبة لتظهر البيانات هنا.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-6">
          {viewMode === "map" && (
            <FarmAnalyticsMap
              fields={fields.map((field) => ({
                id: field.id,
                name: field.name,
                // Extract outer ring from Polygon coordinates, default to empty array if null
                polygon: (field.boundary?.coordinates[0] as [number, number][]) ?? [],
                // Default center to [0,0] if null, though it should ideally be filtered or handled
                center: field.centroid ?? [0, 0],
                ndvi: field.latestMonitoring?.ndvi_value ?? null,
                moisture: null,
                yieldPotential: field.latestMonitoring?.evi_value ?? null,
                lastUpdated: field.latestMonitoring?.monitoring_date ?? null,
              }))}
              selectedFieldId={selectedFieldId}
              onFieldSelect={setSelectedFieldId}
            />
          )}

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="grid gap-4 md:grid-cols-2">
              {fields.map((field) => (
                <Card
                  key={field.id}
                  className={`glass-card border ${field.id === selectedFieldId
                    ? "border-emerald-400/70 shadow-glow"
                    : "border-white/10 hover:border-emerald-400/40"
                    } transition-all`}
                  onMouseEnter={() => setSelectedFieldId(field.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-white">{field.name}</CardTitle>
                        <CardDescription>
                          {field.cropType ? `المحصول: ${field.cropType}` : "لم يتم تحديد المحصول"}
                        </CardDescription>
                      </div>
                      {field.latestMonitoring?.health_status && (
                        <Badge variant="outline" className={healthBadgeTone(field.latestMonitoring.health_status)}>
                          {healthLabel(field.latestMonitoring.health_status)}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between text-white/80">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" /> آخر تحديث
                      </span>
                      <span>
                        {field.latestMonitoring?.monitoring_date
                          ? formatMonitoringDateShort(field.latestMonitoring.monitoring_date)
                          : "لم يتم القياس"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-white/80">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Activity className="h-4 w-4" /> مؤشر NDVI
                      </span>
                      <span>{formatMetric(field.latestMonitoring?.ndvi_value)}</span>
                    </div>
                    <div className="flex items-center justify-between text-white/80">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="h-4 w-4" /> مؤشر EVI
                      </span>
                      <span>{formatMetric(field.latestMonitoring?.evi_value)}</span>
                    </div>
                    <div className="flex items-center justify-between text-white/80">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Thermometer className="h-4 w-4" /> درجة الحرارة
                      </span>
                      <span>
                        {field.latestMonitoring?.temperature_celsius != null
                          ? `${field.latestMonitoring.temperature_celsius.toFixed(1)}°C`
                          : "—"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="h-5 w-5" /> ملخص الحقل المحدد
                </CardTitle>
                <CardDescription>
                  عرض مفصل لأحدث القياسات اعتماداً على الحقل المحدد في القائمة أو الخريطة.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedField ? (
                  <div className="space-y-4 text-sm text-white/80">
                    <div>
                      <p className="text-base font-semibold text-white">{selectedField.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {selectedField.cropType ? `المحصول: ${selectedField.cropType}` : "لم يتم تحديد المحصول"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <MetricRow label="NDVI" value={formatMetric(selectedField.latestMonitoring?.ndvi_value)} />
                      <MetricRow label="EVI" value={formatMetric(selectedField.latestMonitoring?.evi_value)} />
                      <MetricRow
                        label="درجة الحرارة"
                        value={
                          selectedField.latestMonitoring?.temperature_celsius != null
                            ? `${selectedField.latestMonitoring.temperature_celsius.toFixed(1)}°C`
                            : "—"
                        }
                      />
                      <MetricRow
                        label="آخر قياس"
                        value={
                          selectedField.latestMonitoring?.monitoring_date
                            ? formatMonitoringDateShort(selectedField.latestMonitoring.monitoring_date)
                            : "—"
                        }
                      />
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      استعن بالأرقام أعلاه لتخطيط الري والتسميد. في حال انخفاض NDVI عن 0.35 يُنصح بزيادة التسميد الورقي
                      ومراجعة الرطوبة المتاحة للنبات.
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">اختر حقلاً من القائمة لرؤية التفاصيل.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

function parseCentroid(
  centroid: any,
  latitude?: number | null,
  longitude?: number | null,
  boundary?: GeoJSON.Polygon | null,
): [number, number] | null {
  if (Array.isArray(centroid) && centroid.length >= 2) {
    const [lng, lat] = centroid
    if (typeof lat === "number" && typeof lng === "number") {
      return [lat, lng]
    }
  }

  if (centroid && typeof centroid === "object" && "lat" in centroid && "lng" in centroid) {
    const lat = Number((centroid as any).lat)
    const lng = Number((centroid as any).lng)
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return [lat, lng]
    }
  }

  if (typeof latitude === "number" && typeof longitude === "number") {
    return [latitude, longitude]
  }

  if (boundary?.coordinates?.[0]?.length) {
    const coords = boundary.coordinates[0]
    const sum = coords.reduce(
      (acc, [lng, lat]) => {
        return { lat: acc.lat + lat, lng: acc.lng + lng }
      },
      { lat: 0, lng: 0 },
    )
    return [sum.lat / coords.length, sum.lng / coords.length]
  }

  return null
}

function healthLabel(status: string) {
  const dictionary: Record<string, string> = {
    excellent: "ممتاز",
    good: "جيد",
    fair: "متوسط",
    poor: "ضعيف",
    critical: "حرج",
  }

  return dictionary[status] ?? status
}

function healthBadgeTone(status: string) {
  switch (status) {
    case "excellent":
    case "good":
      return "border-emerald-400 text-emerald-200"
    case "fair":
      return "border-amber-400 text-amber-200"
    case "poor":
    case "critical":
      return "border-rose-400 text-rose-200"
    default:
      return "border-white/20 text-white"
  }
}

function formatMetric(value: number | null | undefined) {
  if (typeof value !== "number") return "—"
  return value.toFixed(2)
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone?: "success" | "warning"
}) {
  const toneClasses = {
    success: "border-emerald-400/30 text-emerald-100",
    warning: "border-amber-400/30 text-amber-100",
    default: "border-white/10 text-white",
  }

  return (
    <Card className={`glass-card border ${toneClasses[tone ?? "default"]}`}>
      <CardContent className="flex items-center justify-between gap-3 p-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
        </div>
        <div className="rounded-xl bg-primary/20 p-3 text-primary shadow-inner">{icon}</div>
      </CardContent>
    </Card>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  )
}

function formatMonitoringDateShort(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  try {
    return date.toLocaleDateString("ar-EG")
  } catch {
    try {
      return date.toLocaleDateString("en-US")
    } catch {
      return value
    }
  }
}
