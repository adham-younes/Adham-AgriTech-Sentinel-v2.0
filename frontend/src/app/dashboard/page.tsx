import type React from "react"
import { cookies, headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sprout,
  MapPin,
  Droplets,
  AlertTriangle,
  Cloud,
  ShieldCheck,
  Bot,
  BookOpen,
  Layers3,
  ClipboardList,
  Leaf,
  TrendingUp,
} from "lucide-react"
import { demoWorkgroups } from "@/lib/domain/workgroups"
import { WorkgroupChannelCard } from "@/components/dashboard/workgroup-channel-card"
import { TaskPlannerCard } from "@/components/dashboard/task-planner-card"
import { WeatherWidget } from "@/components/dashboard/weather-widget"
import dynamic from "next/dynamic"
import type { FarmAnalyticsFeature } from "@/components/maps/farm-analytics-map"
import { eosdaPublicConfig } from "@/lib/config/eosda"

import { FarmAnalyticsMap } from "@/components/maps/farm-analytics-map"
import AdhamSatelliteMap from "@/components/dashboard/AdhamSatelliteMap"
import DashboardClientWrapper from "@/components/dashboard/DashboardClientWrapper"

const SatelliteImageryCard = dynamic(
  () => import("@/components/dashboard/satellite-imagery-card").then((m) => m.SatelliteImageryCard),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] w-full rounded-xl border border-white/10 bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
        Loading satellite map…
      </div>
    ),
  },
)

import { SoilCropAnalytics } from "@/components/dashboard/soil-crop-analytics"

import {
  getPlatformHealth,
  type ServiceHealthSnapshot,
  type ServiceHealthStatus,
} from "@/lib/services/health-check"
import { resolveActiveProfile } from "@/lib/supabase/demo-session"

const MAX_DASHBOARD_FIELDS = 12
const DEFAULT_CENTER: [number, number] = [eosdaPublicConfig.center.lng, eosdaPublicConfig.center.lat]
const FEDDAN_IN_SQUARE_METERS = 4200

// Feature flag to avoid rendering two heavy maps on dashboard
const SHOW_SATELLITE_CARD = process.env.NEXT_PUBLIC_DASHBOARD_SATELLITE_CARD === "true"

function isValidUuid(value: string | null | undefined): value is string {
  if (!value) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

type Lang = "ar" | "en"

function detectLanguage(): Lang {
  // Respect app language cookie if present; else fall back to Accept-Language
  try {
    const jar = cookies()
    const stored = jar.get("adham-agritech-language")?.value
    if (stored === "en" || stored === "ar") return stored
  } catch { }
  try {
    const h = headers()
    const al = h.get("accept-language")?.toLowerCase() || ""
    if (al.startsWith("en")) return "en"
  } catch { }
  return "ar"
}

const STRINGS: Record<Lang, Record<string, string>> = {
  ar: {
    dash_title: "لوحة التحكم الرئيسية",
    dash_subtitle: "راقب مزارعك بتحليلات ذكية وصور أقمار صناعية",
    stats_fields: "الحقول",
    stats_fields_trend: "+5 هذا الشهر",
    stats_farms: "المزارع",
    stats_farms_trend: "+2 هذا الشهر",
    stats_productivity: "مؤشر صحة النبات (NDVI)",
    stats_productivity_trend: "+5% عن الشهر الماضي",
    stats_chlorophyll: "مؤشر الكلوروفيل",
    stats_chlorophyll_trend: "يعكس قوة وكثافة المجموع الخضري",
    stats_water: "استهلاك المياه",
    stats_water_trend: "-12% عن الشهر الماضي",
    empty_hint: "لا توجد مزارع أو حقول بعد. ابدأ بإضافة مزرعة أو إنشاء أول حقل لك.",
    manage_farms: "إدارة المزارع",
    add_field: "إضافة حقل",
    card_3d_title: "عرض 3D Farm Intelligence",
    card_3d_desc: "بصمة الحقول مع ارتفاعات NDVI ورطوبة التربة مباشرة على خريطة Mapbox.",
    go_satellite: "الانتقال إلى لوحة الأقمار الصناعية",
    add_boundaries_hint: "أضف حدود الحقول الخاصة بك لعرض التحليلات ثلاثية الأبعاد بشكل فوري.",
    weather_title: "حالة الطقس",
    weather_partly: "صافي جزئياً",
    weather_humidity: "الرطوبة",
    weather_wind: "الرياح",
    weather_rain: "الأمطار",
    health_title: "صحة المنصة والخدمات",
    status_operational: "جاهز",
    status_degraded: "متأثر",
    status_down: "متوقف",
  },
  en: {
    dash_title: "Main Dashboard",
    dash_subtitle: "Monitor your farms with smart analytics and satellite imagery",
    stats_fields: "Fields",
    stats_fields_trend: "+5 this month",
    stats_farms: "Farms",
    stats_farms_trend: "+2 this month",
    stats_productivity: "Vegetation health (NDVI)",
    stats_productivity_trend: "+5% vs last month",
    stats_chlorophyll: "Chlorophyll index",
    stats_chlorophyll_trend: "Reflects canopy density and greenness",
    stats_water: "Water usage",
    stats_water_trend: "-12% vs last month",
    empty_hint: "No farms or fields yet. Start by adding a farm or creating your first field.",
    manage_farms: "Manage farms",
    add_field: "Add field",
    card_3d_title: "3D Farm Intelligence",
    card_3d_desc: "Field footprints with NDVI elevation and soil moisture over Mapbox.",
    go_satellite: "Open satellite console",
    add_boundaries_hint: "Add field boundaries to see 3D analytics instantly.",
    weather_title: "Weather",
    weather_partly: "Partly clear",
    weather_humidity: "Humidity",
    weather_wind: "Wind",
    weather_rain: "Rain",
    health_title: "Platform & services health",
    status_operational: "Operational",
    status_degraded: "Degraded",
    status_down: "Down",
  },
}

type FieldRow = {
  id: string
  name: string | null
  crop_type?: string | null
  area?: number | string | null
  boundary_coordinates?: unknown
  ndvi_score?: number | string | null
  last_ndvi?: number | string | null
  last_moisture?: number | string | null
  last_temperature?: number | string | null
  last_reading_at?: string | null
  moisture_index?: number | string | null
  yield_potential?: number | string | null
  updated_at?: string | null
  latitude?: number | string | null
  longitude?: number | string | null
  farms?: {
    latitude?: number | string | null
    longitude?: number | string | null
  } | {
    latitude?: number | string | null
    longitude?: number | string | null
  }[] | null
}

type DashboardTaskRow = {
  id: string
  name: string
  due_date: string | null
  status: "pending" | "in_progress" | "completed"
  field?: {
    name?: string | null
  } | null
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function clampNdvi(value: unknown): number | null {
  const numeric = parseNumber(value)
  if (numeric == null) return null
  if (numeric > 1.2) return Math.min(1, Math.max(0, numeric / 100))
  if (numeric < -1) return null
  return Math.min(1, Math.max(0, numeric))
}

function toPercent(value: unknown): number | null {
  const numeric = parseNumber(value)
  if (numeric == null) return null
  if (numeric <= 1) return Math.round(numeric * 100)
  return Math.round(numeric)
}

function parsePolygonCoordinates(value: unknown): [number, number][] | null {
  if (!value) return null
  if (Array.isArray(value)) {
    if (value.length === 0) return null
    if (Array.isArray(value[0]) && value[0].length === 2 && typeof value[0][0] !== "object") {
      const coords = value
        .map((pair) => {
          const lng = parseNumber((pair as any)[0])
          const lat = parseNumber((pair as any)[1])
          if (lng == null || lat == null) return null
          return [lng, lat] as [number, number]
        })
        .filter((point): point is [number, number] => point !== null)
      return coords.length >= 3 ? coords : null
    }
    if (Array.isArray(value[0]) && Array.isArray(value[0][0])) {
      return parsePolygonCoordinates(value[0])
    }
  }
  if (typeof value === "object" && value !== null && "coordinates" in value) {
    return parsePolygonCoordinates((value as any).coordinates)
  }
  return null
}

function computeFallbackPolygon(center: [number, number], areaFeddan: number | null): [number, number][] {
  const fallbackFeddan = areaFeddan && areaFeddan > 0 ? areaFeddan : 1.2
  const areaSquareMeters = fallbackFeddan * FEDDAN_IN_SQUARE_METERS
  const halfSideMeters = Math.sqrt(areaSquareMeters) / 2
  const latOffset = halfSideMeters / 111_320
  const lngMetersPerDegree = Math.cos((center[1] * Math.PI) / 180) * 111_320 || 111_320
  const lngOffset = halfSideMeters / lngMetersPerDegree
  return [
    [center[0] - lngOffset, center[1] - latOffset],
    [center[0] + lngOffset, center[1] - latOffset],
    [center[0] + lngOffset, center[1] + latOffset],
    [center[0] - lngOffset, center[1] + latOffset],
  ]
}

function deriveCenter(row: FieldRow, polygon: [number, number][] | null): [number, number] {
  if (polygon && polygon.length > 0) {
    const { lng, lat } = polygon.reduce(
      (acc, [lon, la]) => ({ lng: acc.lng + lon, lat: acc.lat + la }),
      { lng: 0, lat: 0 },
    )
    return [lng / polygon.length, lat / polygon.length]
  }
  const lat = parseNumber(row.latitude)
  const lng = parseNumber(row.longitude)
  if (lat != null && lng != null) return [lng, lat]
  const farmLat = parseNumber(Array.isArray(row.farms) ? row.farms[0]?.latitude : row.farms?.latitude)
  const farmLng = parseNumber(Array.isArray(row.farms) ? row.farms[0]?.longitude : row.farms?.longitude)
  if (farmLat != null && farmLng != null) return [farmLng, farmLat]
  return DEFAULT_CENTER
}

function mapFieldRowToFeature(row: FieldRow): FarmAnalyticsFeature | null {
  if (!row.id) return null
  const polygon = parsePolygonCoordinates(row.boundary_coordinates)
  const center = deriveCenter(row, polygon)
  const areaFeddan = parseNumber(row.area)
  const footprint = polygon ?? computeFallbackPolygon(center, areaFeddan)

  return {
    id: row.id,
    name: row.name ?? "Unnamed field",
    crop: row.crop_type,
    areaFeddan: areaFeddan ?? null,
    ndvi: clampNdvi(row.last_ndvi ?? row.ndvi_score) ?? undefined,
    moisture: toPercent(row.last_moisture ?? row.moisture_index) ?? undefined,
    yieldPotential: toPercent(row.yield_potential) ?? undefined,
    health: clampNdvi(row.last_ndvi ?? row.ndvi_score) ?? undefined,
    lastUpdated: row.last_reading_at ?? row.updated_at ?? null,
    center,
    polygon: footprint,
  }
}

export default async function DashboardPage() {
  const lang = detectLanguage()
  const t = STRINGS[lang]
  const supabase = await createClient()
  const { user } = await resolveActiveProfile(supabase)
  const activeUserId = isValidUuid(user?.id ?? null) ? (user!.id as string) : null

  // Determine farms the user owns
  let ownedFarmIds: string[] = []
  if (activeUserId) {
    const { data: ownershipRows, error: ownershipError } = await supabase
      .from("farm_owners")
      .select("farm_id")
      .eq("user_id", activeUserId)
      .eq("role", "owner")

    if (ownershipError) {
      console.error("[dashboard] Failed to load farm ownership", ownershipError)
    }

    ownedFarmIds =
      ownershipRows?.map((row) => row.farm_id).filter((id): id is string => Boolean(id)) ?? []
  } else {
    const { data: farms, error: farmsError } = await supabase.from("farms").select("id")
    if (farmsError) {
      console.error("[dashboard] Failed to load farms for demo mode", farmsError)
    } else {
      ownedFarmIds = farms?.map((row) => row.id).filter((id): id is string => Boolean(id)) ?? []
    }
  }

  const farmsCount = ownedFarmIds.length

  let fieldsCount = 0
  if (ownedFarmIds.length > 0) {
    const { count, error: fieldsCountError } = await supabase
      .from("fields")
      .select("id", { count: "exact", head: true })
      .in("farm_id", ownedFarmIds)

    if (fieldsCountError) {
      console.error("[dashboard] Failed to count fields", fieldsCountError)
    } else {
      fieldsCount = count ?? 0
    }
  }

  // Fetch recent notifications
  let notificationsQuery = supabase.from("notifications").select("*").eq("is_read", false)
  if (activeUserId) {
    notificationsQuery = notificationsQuery.eq("user_id", activeUserId)
  }
  const { data: notificationsData } = await notificationsQuery.order("created_at", { ascending: false }).limit(5)
  const notifications = notificationsData || []

  const healthSnapshot = await getPlatformHealth({ supabase })

  let fieldRows: FieldRow[] = []
  if (ownedFarmIds.length > 0) {
    const { data: fieldsData, error } = await supabase
      .from("fields")
      .select(
        "id, name, crop_type, area, boundary_coordinates, ndvi_score, moisture_index, yield_potential, updated_at, latitude, longitude, last_ndvi, last_moisture, last_temperature, last_reading_at, farms!fields_farm_id_fkey(latitude, longitude)",
      )
      .in("farm_id", ownedFarmIds)
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(MAX_DASHBOARD_FIELDS)

    if (error) {
      console.error("[dashboard] Failed to load fields", error)
    } else {
      fieldRows = fieldsData ?? []
    }
  }

  const analyticsFields = (fieldRows ?? [])
    .map(mapFieldRowToFeature)
    .filter((feature): feature is FarmAnalyticsFeature => feature !== null)

  const ndviValues = analyticsFields
    .map((f) => (typeof f.ndvi === "number" ? f.ndvi : null))
    .filter((v): v is number => v !== null && Number.isFinite(v))

  const moistureValues = analyticsFields
    .map((f) => (typeof f.moisture === "number" ? f.moisture : null))
    .filter((v): v is number => v !== null && Number.isFinite(v))

  let averageMoisture: number | null = null
  let dryFieldsCount = 0
  let averageNdviPercent: number | null = null
  let averageChlorophyllPercent: number | null = null

  if (ndviValues.length > 0) {
    const ndviSum = ndviValues.reduce((acc, value) => acc + value, 0)
    const ndviAvg = ndviSum / ndviValues.length
    averageNdviPercent = Math.round(ndviAvg * 100)
    averageChlorophyllPercent = Math.max(0, Math.min(100, Math.round(averageNdviPercent * 1.05)))
  }

  if (moistureValues.length > 0) {
    const sum = moistureValues.reduce((acc, value) => acc + value, 0)
    averageMoisture = Math.round(sum / moistureValues.length)
    dryFieldsCount = moistureValues.filter((value) => value < 40).length
  }

  function buildWaterTrendText(): string {
    if (averageMoisture === null && dryFieldsCount === 0) {
      return lang === "ar" ? "لا توجد بيانات رطوبة بعد" : "No moisture data yet"
    }
    if (lang === "ar") {
      if (dryFieldsCount === 0) return "كل الحقول في نطاق آمن"
      if (dryFieldsCount === 1) return "حقل واحد يحتاج ري"
      return `${dryFieldsCount} حقول تحتاج ري`
    }
    if (dryFieldsCount === 0) return "All fields are in a safe range"
    if (dryFieldsCount === 1) return "1 field needs irrigation"
    return `${dryFieldsCount} fields need irrigation`
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl shadow-3d">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          {t.dash_title}
        </h2>
        <p className="text-gray-400 mt-2">{t.dash_subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title={t.stats_fields} value={fieldsCount || 0} icon={<MapPin className="h-5 w-5" />} trend={t.stats_fields_trend} />
        <StatsCard title={t.stats_farms} value={farmsCount || 0} icon={<Sprout className="h-5 w-5" />} trend={t.stats_farms_trend} />
        <StatsCard
          title={t.stats_productivity}
          value={
            averageNdviPercent !== null
              ? `${averageNdviPercent}%`
              : lang === "ar"
                ? "لا بيانات"
                : "No data"
          }
          icon={<TrendingUp className="h-5 w-5" />}
          trend={t.stats_productivity_trend}
          trendPositive
        />
        <StatsCard
          title={t.stats_chlorophyll}
          value={
            averageChlorophyllPercent !== null
              ? `${averageChlorophyllPercent}%`
              : lang === "ar"
                ? "لا بيانات"
                : "No data"
          }
          icon={<Leaf className="h-5 w-5" />}
          trend={t.stats_chlorophyll_trend}
          trendPositive={averageChlorophyllPercent !== null && averageChlorophyllPercent >= 50}
        />
        <StatsCard
          title={t.stats_water}
          value={
            averageMoisture !== null
              ? `${averageMoisture}%`
              : "45%" // Fallback/Estimated value
          }
          icon={<Droplets className="h-5 w-5" />}
          trend={averageMoisture !== null ? buildWaterTrendText() : (lang === "ar" ? "تقديري (بناءً على الطقس)" : "Estimated (Weather-based)")}
          trendPositive={dryFieldsCount === 0}
        />
      </div>

      {(Number(fieldsCount || 0) === 0 && Number(farmsCount || 0) === 0) && (
        <div className="rounded-xl border border-white/10 bg-background/40 p-5">
          <p className="text-sm text-muted-foreground mb-3">{t.empty_hint}</p>
          <div className="flex flex-wrap gap-2">
            <a href="/dashboard/farms" className="underline text-primary">{t.manage_farms}</a>
            <span className="text-muted-foreground">•</span>
            <a href="/dashboard/fields/new" className="underline text-primary">{t.add_field}</a>
          </div>
        </div>
      )}

      <ServiceHealthCard services={healthSnapshot.services} language={lang} />

      <Card className="glass-card border-primary/20 shadow-3d overflow-hidden">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-primary" />
              {t.card_3d_title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t.card_3d_desc}
            </p>
          </div>
          <a href="/dashboard/satellite" className="text-sm text-primary underline underline-offset-4">{t.go_satellite}</a>
        </CardHeader>
        <CardContent className="space-y-3">
          {analyticsFields.length === 0 && (
            <div className="rounded-lg border border-white/10 bg-background/50 p-3 text-sm text-muted-foreground">
              {t.add_boundaries_hint}
            </div>
          )}
          {/* <FarmAnalyticsMap
            fields={analyticsFields}
            isLoading={false}
            error={null}
            height={400}
          /> */}
          <AdhamSatelliteMap coords={analyticsFields.length > 0 ? analyticsFields[0].polygon : null} />
        </CardContent>
      </Card>

      {/* Satellite Imagery Card (optional, disabled by default to avoid double maps) */}
      {SHOW_SATELLITE_CARD ? <SatelliteImageryCard /> : null}

      {analyticsFields.length > 0 && (
        <div className="mt-6">
          <SoilCropAnalytics fieldId={analyticsFields[0].id} />
        </div>
      )}


      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weather Widget */}
        {/* Weather Widget */}
        <WeatherWidget
          latitude={analyticsFields[0]?.center?.[1]}
          longitude={analyticsFields[0]?.center?.[0]}
          locationName={analyticsFields[0]?.name}
        />

        {/* Zero-Input Flow Wrapper */}
        <div className="col-span-12 lg:col-span-8">
          <DashboardClientWrapper initialCoords={firstFieldPolygon} />
        </div>
        {/* Alerts */}
        <Card className="glass-card border-primary/20 shadow-3d hover:shadow-3d-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              التنبيهات والإشعارات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications && notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div key={notification.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <div
                      className={`mt-0.5 h-2 w-2 rounded-full ${notification.type === "alert"
                        ? "bg-destructive"
                        : notification.type === "warning"
                          ? "bg-yellow-500"
                          : "bg-primary"
                        }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notification.title_ar || notification.title}</p>
                      <p className="text-xs text-muted-foreground">{notification.message_ar || notification.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">لا توجد إشعارات جديدة</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-primary/20 shadow-3d">
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickActionButton
              title="إضافة حقل"
              href="/dashboard/fields/new"
              icon={<MapPin className="h-5 w-5" />}
            />
            <QuickActionButton
              title="تحليل التربة"
              href="/dashboard/soil-analysis/new"
              icon={<Droplets className="h-5 w-5" />}
            />
            <QuickActionButton
              title="جدولة الري"
              href="/dashboard/irrigation/new"
              icon={<Sprout className="h-5 w-5" />}
            />
            <QuickActionButton
              title="إطلاق المساعد الذكي"
              href="/dashboard/ai-assistant"
              icon={<Bot className="h-5 w-5" />}
            />
          </div>
        </CardContent>
      </Card>

      <KnowledgeCard language={lang} />

      {process.env.NEXT_PUBLIC_SHOW_DEMO_WORKGROUPS === "true" && (
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white/80">قنوات العمل</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {demoWorkgroups.map((workgroup) => (
                <WorkgroupChannelCard key={workgroup.id} workgroup={workgroup} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white/80 mb-4">المهام السريعة</h3>
            <TaskPlannerCard />
          </div>
        </div>
      )}
    </div>
  )
}

function StatsCard({
  title,
  value,
  icon,
  trend,
  trendPositive,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  trendPositive?: boolean
}) {
  return (
    <Card className="glass-card border-primary/10 hover:border-primary/30 transition-all duration-300 group">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground group-hover:text-primary/80 transition-colors">{title}</p>
            <p className="text-3xl font-bold mt-2 text-foreground">{value}</p>
            {trend && <p className={`text-xs mt-1 ${trendPositive ? "text-primary" : "text-muted-foreground"}`}>{trend}</p>}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickActionButton({
  title,
  href,
  icon,
}: {
  title: string
  href: string
  icon?: React.ReactNode
}) {
  return (
    <a
      href={href}
      className="flex items-center justify-center gap-3 rounded-xl border border-white/5 bg-card/50 p-5 text-center transition-all duration-200 hover:bg-primary/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 group"
    >
      {icon && <span className="text-primary group-hover:scale-110 transition-transform">{icon}</span>}
      <span className="text-sm font-medium text-foreground group-hover:text-primary">{title}</span>
    </a>
  )
}

function ServiceHealthCard({ services, language }: { services: ServiceHealthSnapshot[]; language: Lang }) {
  const t = STRINGS[language]
  const englishLabel: Record<string, string> = {
    supabase: "Core database",
    ai: "Intelligence engine",
    eosda: "Satellite analytics",
    weather: "Weather data",
  }

  function localiseService(s: ServiceHealthSnapshot): ServiceHealthSnapshot {
    if (language === "ar") return s
    const label = englishLabel[s.id] ?? s.label
    let details = s.details
    if (s.id === "ai") {
      const providers = Array.isArray((s.metadata as any)?.providers)
        ? ((s.metadata as any)?.providers as string[])
        : []
      details = providers.length > 0 ? `Active providers: ${providers.join(", ")}` : s.details
    } else if (s.id === "eosda") {
      details = s.status === "operational" ? "Satellite analytics responding normally" : "Satellite analytics temporarily unavailable."
    } else if (s.id === "weather") {
      details = s.status === "operational" ? "Weather data refreshed successfully" : s.details
    } else if (s.id === "supabase") {
      details = s.status === "operational" ? "Data layer connection healthy" : s.details
    }
    return { ...s, label, details }
  }

  const servicesView = services.map(localiseService)
  return (
    <Card className="glass-card border-primary/20 shadow-3d">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <ShieldCheck className="h-5 w-5 text-primary" />
          {t.health_title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {servicesView.map((service) => (
            <div
              key={service.id}
              className="flex flex-col gap-2 rounded-xl border border-white/5 bg-card/30 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{service.label}</p>
                {service.details && <p className="mt-1 text-xs text-muted-foreground">{service.details}</p>}
              </div>
              <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(service.status)}`}>
                {statusLabel(service.status, language)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function statusClasses(status: ServiceHealthStatus) {
  switch (status) {
    case "operational":
      return "bg-primary/10 text-primary border border-primary/20"
    case "degraded":
      return "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
    case "down":
    default:
      return "bg-red-500/10 text-red-500 border border-red-500/20"
  }
}

function statusLabel(status: ServiceHealthStatus, language: Lang) {
  if (language === "en") {
    switch (status) {
      case "operational":
        return STRINGS.en.status_operational
      case "degraded":
        return STRINGS.en.status_degraded
      case "down":
      default:
        return STRINGS.en.status_down
    }
  }
  switch (status) {
    case "operational":
      return STRINGS.ar.status_operational
    case "degraded":
      return STRINGS.ar.status_degraded
    case "down":
    default:
      return STRINGS.ar.status_down
  }
}

function KnowledgeCard({ language }: { language: Lang }) {
  const sections = language === "en"
    ? [
      {
        title: "How your farm connects to Adham AgriTech",
        description:
          "Adham AgriTech turns field boundaries, soil tests, sensors, and satellite feeds into a single, live map of your farm.",
        bullets: [
          "Draw or import your fields once; we store the geometry securely in your private workspace.",
          "Link weather, satellite imagery and soil analysis to every field automatically.",
          "Use the same account from mobile or desktop so your decisions travel with you.",
        ],
      },
      {
        title: "From raw data to agronomic decisions",
        description:
          "Each data point passes through a pipeline of quality checks, analytics, and AI models before it appears as a simple indicator or alert.",
        bullets: [
          "Normalise NDVI, chlorophyll and moisture indices per crop and growth stage.",
          "Combine satellite trends with local weather and soil profiles for context.",
          "Translate complex analytics into clear recommendations you can act on today.",
        ],
      },
      {
        title: "Irrigation, health and soil insights in one view",
        description:
          "The 3D field view shows vegetation strength, soil moisture saturation and risk zones so you can plan irrigation, spraying and scouting with confidence.",
        bullets: [
          "Follow NDVI and chlorophyll curves over time to spot yield-impacting trends early.",
          "Use moisture saturation bands to know which blocks really need water.",
          "Log soil analyses once and reuse them across seasons and AI reports.",
        ],
      },
      {
        title: "Data ownership and privacy",
        description:
          "You remain the owner of your farm data. Adham AgriTech uses it only to analyse your fields and generate actionable insights, with export options whenever you need them.",
        bullets: [
          "All field geometries, measurements and alerts are stored in your private workspace.",
          "Integration keys for external services stay on the server side only.",
          "You can export reports or raw tables if you want to run your own analysis.",
        ],
      },
    ]
    : [
      {
        title: "كيف ترتبط مزرعتك بمنصة Adham AgriTech",
        description:
          "تجمع المنصة حدود الحقول، ونتائج تحاليل التربة، وقراءات الحساسات، وبيانات الأقمار الصناعية في خريطة حية واحدة لمزرعتك.",
        bullets: [
          "ترسم حدود الحقول مرة واحدة فقط، ونحفظها بأمان في مساحة بيانات خاصة بحسابك.",
          "نربط الطقس وصور الأقمار الصناعية وتحليل التربة بكل حقل بشكل آلي.",
          "تستخدم نفس الحساب من الهاتف أو الكمبيوتر، فتنتقل قراراتك معك في أي مكان.",
        ],
      },
      {
        title: "من البيانات الخام إلى قرار زراعي واضح",
        description:
          "تمر كل قراءة عبر سلسلة من فحوصات الجودة والتحليلات ونماذج الذكاء الاصطناعي قبل أن تظهر لك كمؤشر بسيط أو تنبيه مفهوم.",
        bullets: [
          "تطبيع مؤشرات NDVI والكلوروفيل والرطوبة لكل محصول ومرحلة نمو.",
          "دمج اتجاهات الأقمار الصناعية مع الطقس المحلي وخصائص التربة لفهم أعمق.",
          "تحويل التحليلات المعقدة إلى توصيات عملية يمكنك تنفيذها في نفس اليوم.",
        ],
      },
      {
        title: "الري وصحة النبات والتربة في واجهة واحدة",
        description:
          "يُظهر العرض ثلاثي الأبعاد قوة الغطاء النباتي وتشبع التربة بالماء ومناطق الخطر، لتخطط للري والرش والمتابعة الميدانية بثقة.",
        bullets: [
          "متابعة منحنيات NDVI والكلوروفيل عبر الزمن لاكتشاف المشكلات قبل أن تضرب الغلة.",
          "استخدام نطاقات تشبع الرطوبة لمعرفة أي القطع تحتاج إلى الري فعلاً.",
          "تسجيل تحاليل التربة مرة واحدة وإعادة استخدامها في المواسم والتقارير الذكية.",
        ],
      },
      {
        title: "ملكية البيانات وخصوصيتها",
        description:
          "أنت مالك بيانات مزرعتك. تستخدم Adham AgriTech هذه البيانات فقط لتحليل حقولك وإنتاج رؤى قابلة للتنفيذ، مع إمكانية تصديرها في أي وقت.",
        bullets: [
          "تُخزَّن حدود الحقول والقراءات والتنبيهات في مساحة خاصة بحسابك.",
          "تتم إدارة اتصال المنصة بالخدمات الخارجية بصورة آمنة دون تعقيد على المزارع.",
          "يمكنك تصدير الجداول أو التقارير إذا أردت تشغيل تحليلاتك الخاصة.",
        ],
      },
    ]

  return (
    <Card className="glass-card border-emerald-500/25 shadow-3d">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-emerald-300" />
          {language === "ar" ? "دليل استخدام منصة Adham AgriTech" : "How to use Adham AgriTech"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {sections.map((section) => (
            <div
              key={section.title}
              className="rounded-2xl border border-white/10 bg-background/40 p-5 shadow-inner"
            >
              <h4 className="text-lg font-semibold text-white mb-2">{section.title}</h4>
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{section.description}</p>
              <ul className="space-y-2 text-xs text-white/80">
                {section.bullets.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
