import type React from "react"
import Link from "next/link"
import { cookies, headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Sprout,
  MapPin,
  Droplets,
  AlertTriangle,
  ShieldCheck,
  Bot,
  Layers3,
  Leaf,
  TrendingUp,
} from "lucide-react"
import { demoWorkgroups } from "@/lib/domain/workgroups"
import { WorkgroupChannelCard } from "@/components/dashboard/workgroup-channel-card"
import { TaskPlannerCard } from "@/components/dashboard/task-planner-card"
import { WeatherWidget } from "@/components/dashboard/weather-widget"
import type { FarmAnalyticsFeature } from "@/components/maps/farm-analytics-map"
import { eosdaPublicConfig } from "@/lib/config/eosda"

import AdhamSatelliteMap from "@/components/dashboard/AdhamSatelliteMap"
import DashboardClientWrapper from "@/components/dashboard/DashboardClientWrapper"

import { SoilCropAnalytics } from "@/components/dashboard/soil-crop-analytics"
import { AiAgronomistWidget } from "@/components/dashboard/ai-agronomist-widget"
import { CropTimeline } from "@/components/dashboard/crop-timeline"
import { DailyBriefing } from "@/components/dashboard/daily-briefing"

import {
  getPlatformHealth,
  type ServiceHealthSnapshot,
  type ServiceHealthStatus,
} from "@/lib/services/health-check"
import { resolveActiveProfile } from "@/lib/supabase/demo-session"

const MAX_DASHBOARD_FIELDS = 12
const DEFAULT_CENTER: [number, number] = [eosdaPublicConfig.center.lng, eosdaPublicConfig.center.lat]
const FEDDAN_IN_SQUARE_METERS = 4200

function isValidUuid(value: string | null | undefined): value is string {
  if (!value) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

type Lang = "ar" | "en"

function detectLanguage(): Lang {
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
    go_satellite: "Open Satellite Console",
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

// Force dynamic rendering to prevent static generation errors
export const dynamic = 'force-dynamic'

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

  const weatherMock = { temp: 28, condition: lang === "ar" ? "مشمس" : "Sunny", humidity: 45 }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl shadow-3d flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
            {t.dash_title}
          </h2>
          <p className="text-gray-400 mt-2">{t.dash_subtitle}</p>
        </div>
        <div className="flex gap-2">
          <QuickActionButton
            title={t.add_field}
            href="/dashboard/fields/new"
            icon={<MapPin className="h-5 w-5" />}
          />
          <QuickActionButton
            title="AI Assistant"
            href="/dashboard/ai-assistant"
            icon={<Bot className="h-5 w-5" />}
          />
        </div>
      </div>

      {/* Daily Briefing Summary */}
      <DailyBriefing
        weather={weatherMock}
        alertCount={notifications.length}
        userName={user?.user_metadata?.full_name?.split(' ')[0]}
      />

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

        {/* Left Column: Stats & Health (1/4) */}
        <div className="space-y-6 xl:col-span-1">
          <ServiceHealthCard services={healthSnapshot.services} language={lang} />

          <div className="grid grid-cols-1 gap-4">
            <StatsCard title={t.stats_fields} value={fieldsCount || 0} icon={<MapPin className="h-5 w-5" />} trend={t.stats_fields_trend} />
            <StatsCard title={t.stats_farms} value={farmsCount || 0} icon={<Sprout className="h-5 w-5" />} trend={t.stats_farms_trend} />
            <StatsCard
              title={t.stats_productivity}
              value={averageNdviPercent !== null ? `${averageNdviPercent}%` : (lang === "ar" ? "لا بيانات" : "No data")}
              icon={<TrendingUp className="h-5 w-5" />}
              trend={t.stats_productivity_trend}
              trendPositive
            />
            <StatsCard
              title={t.stats_water}
              value={averageMoisture !== null ? `${averageMoisture}%` : "45%"}
              icon={<Droplets className="h-5 w-5" />}
              trend={averageMoisture !== null ? buildWaterTrendText() : (lang === "ar" ? "تقديري" : "Estimated")}
              trendPositive={dryFieldsCount === 0}
            />
          </div>
        </div>

        {/* Center Column: Digital Twin Map (2/4) */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="glass-card border-primary/20 shadow-3d overflow-hidden h-full min-h-[600px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Layers3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {t.card_3d_title}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {lang === "ar" 
                      ? "خرائط تفاعلية مع تحليلات NDVI ورطوبة التربة من EOSDA"
                      : "Interactive maps with NDVI and soil moisture analytics from EOSDA"}
                  </p>
                </div>
              </div>
              <Link 
                href="/dashboard/satellite" 
                className="text-sm text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
              >
                {t.go_satellite}
              </Link>
            </CardHeader>
            <CardContent className="flex-1 p-0 relative bg-black/20">
              {analyticsFields.length > 0 ? (
                <AdhamSatelliteMap
                  coords={analyticsFields[0].polygon || []}
                  fieldId={analyticsFields[0].id}
                  esodaKey={process.env.NEXT_PUBLIC_EOSDA_API_KEY || ''}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <Layers3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold text-white/80 mb-2">
                    {lang === "ar" ? "لا توجد حقول لعرضها" : "No fields to display"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-md">
                    {lang === "ar" 
                      ? "أضف حقولاً إلى مزرعتك لعرض الخرائط ثلاثية الأبعاد والتحليلات التفاعلية"
                      : "Add fields to your farm to view 3D maps and interactive analytics"}
                  </p>
                  <Link href="/dashboard/fields/new">
                    <Button variant="default" className="gap-2">
                      <MapPin className="h-4 w-4" />
                      {t.add_field}
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Analytics, Timeline, AI & Weather (1/4) */}
        <div className="space-y-6 xl:col-span-1">
          {/* Timeline & Analytics - moved here for better organization */}
          {analyticsFields.length > 0 && (
            <>
              <CropTimeline
                cropType={analyticsFields[0].crop || 'Wheat'}
                plantingDate={null}
              />
              <SoilCropAnalytics fieldId={analyticsFields[0].id} />
            </>
          )}

          <WeatherWidget
            latitude={analyticsFields[0]?.center?.[1]}
            longitude={analyticsFields[0]?.center?.[0]}
            locationName={analyticsFields[0]?.name}
          />

          <AiAgronomistWidget
            fieldId={analyticsFields.length > 0 ? analyticsFields[0].id : undefined}
            cropType={analyticsFields.length > 0 ? analyticsFields[0].crop : undefined}
            mode="embedded"
          />

          <Card className="glass-card border-primary/20 shadow-3d">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {lang === "ar" ? "التنبيهات" : "Alerts"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications && notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div key={notification.id} className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/5 p-3">
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
                  <p className="text-center text-sm text-muted-foreground py-4">
                    {lang === "ar" ? "لا توجد إشعارات" : "No new alerts"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Demo Workgroups (if enabled) */}
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

      <div className="hidden">
        <DashboardClientWrapper initialCoords={analyticsFields.length > 0 ? analyticsFields[0].polygon : null} />
      </div>
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
            <p className="text-2xl font-bold mt-2 text-foreground">{value}</p>
            {trend && <p className={`text-xs mt-1 ${trendPositive ? "text-primary" : "text-muted-foreground"}`}>{trend}</p>}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-110 transition-transform duration-300">
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
      className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-card/50 px-4 py-2 text-center transition-all duration-200 hover:bg-primary/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 group"
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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground text-lg">
          <ShieldCheck className="h-5 w-5 text-primary" />
          {t.health_title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {servicesView.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-card/30 p-2 hover:bg-white/5 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{service.label}</p>
              </div>
              <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold ml-2 ${statusClasses(service.status)}`}>
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

function statusLabel(status: ServiceHealthStatus, lang: Lang) {
  if (lang === "en") {
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
