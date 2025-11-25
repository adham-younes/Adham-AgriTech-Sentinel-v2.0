"use client"

import { useEffect, useMemo, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Activity, Droplets, Leaf, LineChart, Download, Eye, Loader2 } from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FarmAnalyticsMap, type FarmAnalyticsFeature } from "@/components/maps/farm-analytics-map"
import { AdvancedSatelliteMap } from "@/components/satellite/advanced-satellite-map"
import { DynamicSoilAnalysis } from "@/components/soil/dynamic-soil-analysis"
import { AdvancedVRAMaps } from "@/components/precision/advanced-vra-maps-fixed"
import { useTranslation } from "@/lib/i18n/use-language"
import { eosdaPublicConfig } from "@/lib/config/eosda"
import { trackUsageEvent } from "@/lib/analytics"
import { DEFAULT_PLAN_ID } from "@/lib/domain/types/billing"
import { formatDateLocale, formatDateTimeLocale } from "@/lib/utils/date"
import { isFeatureEnabled } from "@/lib/config/feature-flags"
import { fetchSatelliteInsights } from "@/lib/client/satellite-insights"
import type { SatelliteAnalysisResponse } from "@/lib/types/satellite"

const FEDDAN_PER_HECTARE = 2.381
const FEDDAN_IN_SQUARE_METERS = 4200
const EARTH_RADIUS_LAT_METERS = 111_320
const DEFAULT_CENTER: [number, number] = [eosdaPublicConfig.center.lng, eosdaPublicConfig.center.lat]

type SupabaseFieldRow = {
  id: string
  name: string | null
  crop_type: string | null
  area: number | string | null
  // area_hectares not present in current schema; keep optional for forward compatibility
  area_hectares?: number | string | null
  ndvi_score?: number | string | null
  last_ndvi?: number | string | null
  last_moisture?: number | string | null
  last_temperature?: number | string | null
  last_reading_at?: string | null
  moisture_index?: number | string | null
  yield_potential?: number | string | null
  updated_at?: string | null
  boundary_coordinates?: unknown
  latitude?: number | string | null
  longitude?: number | string | null
  farms?: {
    latitude?: number | string | null
    longitude?: number | string | null
  } | null
}

type FieldMonitoringSnapshot = {
  ndvi?: number | null
  lastUpdated?: string | null
}

type NdviHistoryPoint = {
  date: string
  value: number
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function hectaresToFeddan(hectares: number | null): number | null {
  if (hectares == null) return null
  return hectares * FEDDAN_PER_HECTARE
}

function parseNdvi(value: unknown): number | null {
  const numeric = parseNumber(value)
  if (numeric == null) return null
  if (numeric > 1.2) {
    return Math.min(1, Math.max(0, numeric / 100))
  }
  if (numeric < -1) return null
  return Math.min(1, Math.max(0, numeric))
}

function parsePercentage(value: unknown): number | null {
  const numeric = parseNumber(value)
  if (numeric == null) return null
  if (numeric <= 1) {
    return Math.round(numeric * 100)
  }
  return Math.round(numeric)
}

function computePolygonCenter(polygon: [number, number][]): [number, number] | null {
  if (!polygon || polygon.length === 0) return null
  const { lng, lat } = polygon.reduce(
    (acc, [lon, la]) => ({ lng: acc.lng + lon, lat: acc.lat + la }),
    { lng: 0, lat: 0 },
  )
  return [lng / polygon.length, lat / polygon.length]
}

function deriveCenter(row: SupabaseFieldRow, polygon: [number, number][] | null): [number, number] {
  const polygonCenter = polygon ? computePolygonCenter(polygon) : null
  if (polygonCenter) return polygonCenter

  const lat = parseNumber(row.latitude)
  const lng = parseNumber(row.longitude)
  if (lng != null && lat != null) return [lng, lat]

  const farmLat = parseNumber(row.farms?.latitude)
  const farmLng = parseNumber(row.farms?.longitude)
  if (farmLng != null && farmLat != null) return [farmLng, farmLat]

  return DEFAULT_CENTER
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

function generateFallbackPolygon(center: [number, number], areaFeddan: number | null): [number, number][] {
  const assumedFeddan = areaFeddan != null && areaFeddan > 0 ? areaFeddan : 1.5
  const areaSquareMeters = assumedFeddan * FEDDAN_IN_SQUARE_METERS
  const halfSideMeters = Math.sqrt(areaSquareMeters) / 2
  const latOffset = halfSideMeters / EARTH_RADIUS_LAT_METERS
  const lngMetersPerDegree =
    Math.cos((center[1] * Math.PI) / 180) * EARTH_RADIUS_LAT_METERS || EARTH_RADIUS_LAT_METERS
  const lngOffset = halfSideMeters / lngMetersPerDegree

  return [
    [center[0] - lngOffset, center[1] - latOffset],
    [center[0] + lngOffset, center[1] - latOffset],
    [center[0] + lngOffset, center[1] + latOffset],
    [center[0] - lngOffset, center[1] + latOffset],
  ]
}

function clampNdvi(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null
  if (value > 1.2) return Math.min(1, Math.max(0, value / 100))
  if (value < -1) return null
  return Math.min(1, Math.max(0, value))
}

function normaliseField(row: SupabaseFieldRow, snapshot?: FieldMonitoringSnapshot | null): FarmAnalyticsFeature | null {
  if (!row.id) return null

  const areaHectares = parseNumber(row.area_hectares) ?? parseNumber(row.area) ?? null
  const areaFeddan = hectaresToFeddan(areaHectares)

  const parsedPolygon = parsePolygonCoordinates(row.boundary_coordinates)
  const center = deriveCenter(row, parsedPolygon)
  const polygon = parsedPolygon ?? generateFallbackPolygon(center, areaFeddan)

  const ndvi = snapshot?.ndvi != null ? clampNdvi(snapshot.ndvi) : parseNdvi(row.last_ndvi ?? row.ndvi_score)
  const moisture = parsePercentage(row.last_moisture ?? row.moisture_index)
  const yieldPotential = parsePercentage(row.yield_potential)
  const health =
    ndvi ??
    (yieldPotential != null ? Math.min(1, Math.max(0, yieldPotential / 100)) : null)

  const lastUpdated = snapshot?.lastUpdated ?? row.last_reading_at ?? row.updated_at ?? null

  return {
    id: row.id,
    name: row.name ?? "حقل غير مسمى",
    crop: row.crop_type,
    areaFeddan,
    ndvi,
    moisture,
    yieldPotential,
    health,
    lastUpdated,
    center,
    polygon,
  }
}

function Sparkline({ points, language }: { points: NdviHistoryPoint[]; language: string }) {
  if (!points.length) {
    return (
      <p className="text-xs text-gray-500">
        {language === "ar" ? "لا توجد قراءات تاريخية حتى الآن" : "No historical readings yet"}
      </p>
    )
  }
  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1

  return (
    <div className="space-y-1">
      <div className="flex items-end gap-[3px] h-16">
        {points.map((point, index) => {
          const norm = (point.value - min) / span
          const height = Math.max(0.15, norm) * 100
          return (
            <div key={`${point.date}-${index}`} className="flex-1 rounded-full bg-emerald-900/30">
              <div
                className="w-full rounded-full bg-gradient-to-t from-emerald-500 via-lime-400 to-emerald-300"
                style={{ height: `${height}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{new Date(points[0].date).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric" })}</span>
        <span>{new Date(points[points.length - 1].date).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric" })}</span>
      </div>
    </div>
  )
}

function formatCaptureDate(value: string, languageCode: string): string {
  const locale = languageCode === "ar" ? "ar-EG" : "en-US"
  return formatDateTimeLocale(value, locale, { dateStyle: "medium", timeStyle: "short" }, "")
}

export default function SatellitePage() {
  const { t, language } = useTranslation()
  const [fields, setFields] = useState<FarmAnalyticsFeature[]>([])
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [requiresLogin, setRequiresLogin] = useState(false)
  // Default to ESRI first to avoid CORS issues, then auto fallback to other providers
  const [provider, setProvider] = useState<"auto" | "esri" | "mapbox" | "eosda" | "sentinel">("auto")
  const [ndviHistory, setNdviHistory] = useState<NdviHistoryPoint[]>([])
  const [moistureHistory, setMoistureHistory] = useState<NdviHistoryPoint[]>([])
  const [diseaseRisk, setDiseaseRisk] = useState<{ level: "low" | "medium" | "high"; score: number } | null>(null)
  const satelliteAutomationEnabled = isFeatureEnabled("soilAnalysisAutomation")
  const [satelliteInsight, setSatelliteInsight] = useState<SatelliteAnalysisResponse | null>(null)
  const [satelliteInsightLoading, setSatelliteInsightLoading] = useState(false)
  const [satelliteInsightError, setSatelliteInsightError] = useState<string | null>(null)
  const [snapshotRefreshToken, setSnapshotRefreshToken] = useState(0)

  const supabase = useMemo(() => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!url || !anonKey) return null
      return createBrowserClient(url, anonKey)
    } catch (error) {
      console.error("[Satellite] Failed to create Supabase client:", error)
      return null
    }
  }, [])

  useEffect(() => {
    if (!supabase) return
    let cancelled = false

    async function trackView() {
      if (!supabase) return
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user || cancelled) return

        await trackUsageEvent({
          userId: user.id,
          featureId: "satellite.map",
          action: "view",
          planId: DEFAULT_PLAN_ID,
        })
      } catch {
        // Analytics must be non-blocking.
      }
    }

    void trackView()

    return () => {
      cancelled = true
    }
  }, [supabase])

  useEffect(() => {
    if (!supabase) {
      setErrorMessage("Supabase configuration is missing.")
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function loadFields() {
      if (!supabase) return
      setIsLoading(true)
      setErrorMessage(null)
      try {
        // Require user session for RLS-protected resources.
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          setRequiresLogin(true)
          setFields([])
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

        // First try: query with extended columns (if schema supports them)
        let data: any[] | null = null
        const monitoringSnapshots = new Map<string, FieldMonitoringSnapshot>()
        try {
          const res = await supabase
            .from("fields")
            .select(
              "id, name, crop_type, area, ndvi_score, last_ndvi, last_moisture, last_temperature, last_reading_at, moisture_index, yield_potential, updated_at, boundary_coordinates, latitude, longitude, farms(latitude, longitude)",
            )
            .in("farm_id", farmIds)
            .limit(200)
          if (res.error) throw res.error
          data = res.data
        } catch (colError: any) {
          // Fallback if some columns (e.g., ndvi_score) do not exist in current DB schema
          const looksLikeMissingColumn = /column|does not exist|unknown column/i.test(
            String(colError?.message ?? ""),
          )
          if (!looksLikeMissingColumn) throw colError
          console.warn("[Satellite] Falling back to minimal fields selection due to schema mismatch:", colError?.message)
          const res2 = await supabase
            .from("fields")
            .select(
              "id, name, crop_type, area, updated_at, boundary_coordinates, latitude, longitude, farms(latitude, longitude)",
            )
            .in("farm_id", farmIds)
            .limit(200)
          if (res2.error) throw res2.error
          data = res2.data
        }

        const fieldIds = (data ?? []).map((row) => row?.id).filter((id): id is string => Boolean(id))
        if (fieldIds.length > 0 && supabase) {
          const { data: monitoringRows, error: monitoringError } = await supabase
            .from("crop_monitoring")
            .select("field_id, monitoring_date, ndvi_value")
            .in("field_id", fieldIds)
            .order("monitoring_date", { ascending: false })
          if (monitoringError) {
            console.warn("[Satellite] Unable to load NDVI snapshots:", monitoringError.message)
          } else {
            monitoringRows?.forEach((row) => {
              if (!row.field_id || monitoringSnapshots.has(row.field_id)) return
              const ndviValue =
                typeof row.ndvi_value === "number" ? row.ndvi_value : parseNumber(row.ndvi_value)
              monitoringSnapshots.set(row.field_id, {
                ndvi: ndviValue ?? null,
                lastUpdated: row.monitoring_date ?? null,
              })
            })
          }
        }

        if (cancelled) return

        const normalised =
          data
            ?.map((row) => {
              const fieldId = (row as SupabaseFieldRow)?.id
              if (!fieldId) return null
              const snapshot = monitoringSnapshots.get(fieldId)
              return normaliseField(row as SupabaseFieldRow, snapshot)
            })
            .filter((field): field is FarmAnalyticsFeature => Boolean(field)) ?? []

        setFields(normalised)

        if (normalised.length > 0) {
          setSelectedFieldId((current) =>
            current && normalised.some((field) => field.id === current)
              ? current
              : normalised[0].id,
          )
        } else {
          setSelectedFieldId(null)
        }
      } catch (fetchError: any) {
        console.error("[Satellite] Failed to load field analytics:", fetchError)
        if (!cancelled) {
          const message =
            typeof fetchError?.message === "string" ? fetchError.message : "Unable to load fields data."
          // If it looks like an auth/RLS error, ask the user to sign in but don't block the map.
          if (/jwt|auth|permission|rls/i.test(message)) {
            setRequiresLogin(true)
            setErrorMessage(null)
          } else {
            setErrorMessage(message)
          }
          setFields([])
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadFields()

    return () => {
      cancelled = true
    }
  }, [supabase])

  useEffect(() => {
    if (fields.length === 0) return
    setSelectedFieldId((current) =>
      current && fields.some((field) => field.id === current) ? current : fields[0].id,
    )
  }, [fields])

  useEffect(() => {
    if (!satelliteAutomationEnabled || !selectedFieldId) {
      setSatelliteInsight(null)
      setSatelliteInsightError(null)
      setSatelliteInsightLoading(false)
      return
    }

    let cancelled = false
    async function loadSatelliteSnapshot() {
      setSatelliteInsightLoading(true)
      setSatelliteInsightError(null)
      try {
        const payload = await fetchSatelliteInsights(selectedFieldId || "", language === "en" ? "en" : "ar")
        if (!cancelled) {
          if (!payload) throw new Error("Satellite snapshot unavailable")
          setSatelliteInsight(payload)
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error && error.message
              ? error.message
              : language === "ar"
                ? "تعذر تحميل قراءة القمر الصناعي"
                : "Unable to load satellite snapshot"
          setSatelliteInsightError(message)
          setSatelliteInsight(null)
        }
      } finally {
        if (!cancelled) {
          setSatelliteInsightLoading(false)
        }
      }
    }

    void loadSatelliteSnapshot()
    return () => {
      cancelled = true
    }
  }, [selectedFieldId, language, satelliteAutomationEnabled, snapshotRefreshToken])

  useEffect(() => {
    if (!supabase || !selectedFieldId) {
      setNdviHistory([])
      setMoistureHistory([])
      setDiseaseRisk(null)
      return
    }

    let cancelled = false

    async function loadHistory() {
      if (!supabase) return
      try {
        const { data, error } = await supabase
          .from("crop_monitoring")
          .select("monitoring_date, ndvi_value, ndwi_value")
          .eq("field_id", selectedFieldId)
          .order("monitoring_date", { ascending: true })
          .limit(30)

        if (error || !data || cancelled) {
          if (error) {
            console.warn("[Satellite] Failed to load NDVI history:", error.message)
          }
          if (!cancelled) setNdviHistory([])
          return
        }

        const ndviPoints: NdviHistoryPoint[] = []
        const moisturePoints: NdviHistoryPoint[] = []
        for (const row of data as any[]) {
          const date = row?.monitoring_date ?? row?.created_at ?? null
          if (!date) continue
          const rawNdvi = row?.ndvi_value
          const ndviNumeric = typeof rawNdvi === "number" ? rawNdvi : parseNumber(rawNdvi)
          const ndviClamped =
            ndviNumeric == null || Number.isNaN(ndviNumeric) ? null : clampNdvi(ndviNumeric)
          if (ndviClamped != null) {
            ndviPoints.push({ date: String(date), value: ndviClamped })
          }

          const rawNdwi = row?.ndwi_value
          const ndwiNumeric = typeof rawNdwi === "number" ? rawNdwi : parseNumber(rawNdwi)
          if (ndwiNumeric != null && !Number.isNaN(ndwiNumeric)) {
            const normalized = Math.max(0, Math.min(1, (ndwiNumeric + 1) / 2))
            moisturePoints.push({ date: String(date), value: normalized })
          }
        }

        let riskLevel: "low" | "medium" | "high" = "low"
        let riskScore = 0
        if (ndviPoints.length > 0) {
          const latest = ndviPoints[ndviPoints.length - 1]?.value ?? null
          const moist = moisturePoints[moisturePoints.length - 1]?.value ?? null
          const ndviRisk = latest != null && latest > 0.5 ? (latest - 0.5) * 2 : 0
          const moistureRisk = moist != null && moist > 0.6 ? (moist - 0.6) / 0.4 : 0
          const combined = Math.min(1, Math.max(0, 0.6 * ndviRisk + 0.4 * moistureRisk))
          riskScore = combined
          if (combined >= 0.7) riskLevel = "high"
          else if (combined >= 0.4) riskLevel = "medium"
        }

        if (!cancelled) {
          setNdviHistory(ndviPoints)
          setMoistureHistory(moisturePoints)
          setDiseaseRisk({ level: riskLevel, score: Number((riskScore * 100).toFixed(0)) })
        }
      } catch (error: any) {
        console.warn("[Satellite] Unexpected NDVI history error:", error?.message ?? error)
        if (!cancelled) {
          setNdviHistory([])
          setMoistureHistory([])
          setDiseaseRisk(null)
        }
      }
    }

    void loadHistory()

    return () => {
      cancelled = true
    }
  }, [supabase, selectedFieldId])

  const selectedField = useMemo(() => {
    if (fields.length === 0) return null
    return fields.find((field) => field.id === selectedFieldId) ?? fields[0]
  }, [fields, selectedFieldId])

  const summary = useMemo(() => {
    if (fields.length === 0) {
      return { totalFields: 0, averageHealth: 0, totalArea: "0" }
    }
    const totalFields = fields.length
    const averageHealth = Math.round(
      (fields.reduce((acc, field) => acc + (field.health ?? 0.55), 0) / totalFields) * 100,
    )
    const totalAreaValue = fields.reduce((acc, field) => acc + (field.areaFeddan ?? 0), 0)
    let totalArea: string
    try {
      totalArea = totalAreaValue.toLocaleString(language === "ar" ? "ar-EG" : "en-US", {
        maximumFractionDigits: 1,
      })
    } catch {
      totalArea = totalAreaValue.toLocaleString("en-US", {
        maximumFractionDigits: 1,
      })
    }
    return { totalFields, averageHealth, totalArea }
  }, [fields, language])

  const moistureLabel = selectedField?.moisture != null ? `${selectedField.moisture}%` : "—"
  const yieldLabel =
    selectedField?.yieldPotential != null ? `${selectedField.yieldPotential}%` : "—"
  const ndviLabel = selectedField?.ndvi != null ? selectedField.ndvi.toFixed(2) : "—"

  const formattedCaptureDate =
    selectedField?.lastUpdated != null
      ? formatCaptureDate(selectedField.lastUpdated, language)
      : null

  const chlorophyllHistory = useMemo(
    () =>
      ndviHistory.map((point) => ({
        date: point.date,
        value: Math.max(0, Math.min(1, point.value * 1.05 + 0.02)),
      })),
    [ndviHistory],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
            {t("satellite3d.title")}
          </h1>
          <p className="text-gray-400 mt-2 max-w-2xl">{t("satellite3d.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <span>{language === "ar" ? "المزوّد:" : "Provider:"}</span>
            <select
              className="rounded-md border bg-background px-2 py-1 text-foreground/80"
              value={provider}
              onChange={(e) => setProvider(e.target.value as any)}
            >
              <option value="sentinel">{language === "ar" ? "سنتينل هب" : "Sentinel Hub"}</option>
              <option value="eosda">EOSDA</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <Button
            variant="outline"
            className="glass-card border-white/10 flex items-center gap-2"
            disabled={isLoading}
          >
            <Download className="h-4 w-4" />
            <span>{t("satellite3d.actions.export")}</span>
          </Button>
        </div>
      </div>

      {requiresLogin && (
        <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
          يجب تسجيل الدخول لعرض الحقول الخاصة بك. <a href="/auth/login" className="underline">تسجيل الدخول</a>
        </div>
      )}
      {errorMessage && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {errorMessage}
        </div>
      )}

      {/* Empty state for new users */}
      {!isLoading && !errorMessage && !requiresLogin && fields.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-background/40 p-6">
          <p className="text-sm text-muted-foreground mb-3">
            {language === "ar"
              ? "لا توجد حقول بعد. أضف مزرعة وحقلاً لعرض التحليلات، أو زر ثورة الزراعة الرقمية لتعلّم كيفية رسم الحدود."
              : "No fields yet. Add a farm and field to view the analytics, or visit the Digital Agriculture Revolution to learn how to map boundaries."}
          </p>
          <div className="flex gap-2">
            <Link href="/dashboard/farms" className="underline text-primary">
              {language === "ar" ? "إدارة المزارع" : "Manage Farms"}
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/dashboard/fields/new" className="underline text-primary">
              {language === "ar" ? "إضافة حقل" : "Add Field"}
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/knowledge-hub" className="underline text-primary">
              {language === "ar" ? "ثورة الزراعة الرقمية" : "Digital Agriculture Revolution"}
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card className="glass-card">
          <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t("satellite3d.live_view")}</CardTitle>
              <CardDescription>{t("satellite3d.analysis_panel")}</CardDescription>
            </div>
            {selectedField && (
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                {selectedField.name}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <FarmAnalyticsMap
              fields={fields}
              selectedFieldId={selectedFieldId}
              onFieldSelect={setSelectedFieldId}
              isLoading={isLoading}
              error={null}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle>{selectedField?.name ?? t("satellite3d.select_prompt")}</CardTitle>
                  <CardDescription>
                    {selectedField?.crop ?? t("satellite3d.select_prompt")}
                  </CardDescription>
                </div>
                {diseaseRisk && (
                  <Badge
                    className={
                      diseaseRisk.level === "high"
                        ? "bg-red-500/20 text-red-100 border-red-500/50"
                        : diseaseRisk.level === "medium"
                          ? "bg-amber-500/20 text-amber-100 border-amber-500/50"
                          : "bg-emerald-500/20 text-emerald-100 border-emerald-500/40"
                    }
                  >
                    {language === "ar"
                      ? `مؤشر إنذار مبكر: ${diseaseRisk.level === "high" ? "مرتفع" : diseaseRisk.level === "medium" ? "متوسط" : "منخفض"
                      } (${diseaseRisk.score}٪)`
                      : `Early‑warning index: ${diseaseRisk.level === "high" ? "High" : diseaseRisk.level === "medium" ? "Medium" : "Low"
                      } (${diseaseRisk.score}%)`}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedField ? (
                <>
                  <div className="grid gap-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">NDVI</span>
                      <span className="font-semibold text-emerald-300">{ndviLabel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">{t("satellite3d.moisture")}</span>
                      <span className="font-semibold text-sky-300">{moistureLabel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">{t("satellite3d.yield")}</span>
                      <span className="font-semibold text-yellow-300">{yieldLabel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">{t("satellite3d.last_updated")}</span>
                      <span className="font-medium text-gray-200">
                        {formattedCaptureDate ?? "—"}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400">{t("satellite3d.select_prompt")}</p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="glass-card">
              <CardHeader className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle>{selectedField?.name ?? t("satellite3d.select_prompt")}</CardTitle>
                    <CardDescription>
                      {selectedField?.crop ?? t("satellite3d.select_prompt")}
                    </CardDescription>
                  </div>
                  {diseaseRisk && (
                    <Badge
                      className={
                        diseaseRisk.level === "high"
                          ? "bg-red-500/20 text-red-100 border-red-500/50"
                          : diseaseRisk.level === "medium"
                            ? "bg-amber-500/20 text-amber-100 border-amber-500/50"
                            : "bg-emerald-500/20 text-emerald-100 border-emerald-500/40"
                      }
                    >
                      {language === "ar"
                        ? `مؤشر إنذار مبكر: ${diseaseRisk.level === "high" ? "مرتفع" : diseaseRisk.level === "medium" ? "متوسط" : "منخفض"
                        } (${diseaseRisk.score}٪)`
                        : `Early‑warning index: ${diseaseRisk.level === "high" ? "High" : diseaseRisk.level === "medium" ? "Medium" : "Low"
                        } (${diseaseRisk.score}%)`}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedField ? (
                  <>
                    <div className="grid gap-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">NDVI</span>
                        <span className="font-semibold text-emerald-300">{ndviLabel}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">{t("satellite3d.moisture")}</span>
                        <span className="font-semibold text-sky-300">{moistureLabel}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">{t("satellite3d.yield")}</span>
                        <span className="font-semibold text-yellow-300">{yieldLabel}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">{t("satellite3d.last_updated")}</span>
                        <span className="font-medium text-gray-200">
                          {formattedCaptureDate ?? "—"}
                        </span>
                      </div>
                    </div>
                    {satelliteAutomationEnabled && (
                      <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-emerald-100">
                            {language === "ar" ? "قراءة EOSDA المباشرة" : "EOSDA satellite snapshot"}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 border-emerald-500/40 bg-transparent text-xs text-emerald-100"
                            disabled={satelliteInsightLoading || !selectedFieldId}
                            onClick={() => selectedFieldId && setSnapshotRefreshToken((token) => token + 1)}
                          >
                            {satelliteInsightLoading ? (
                              <span className="flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                {language === "ar" ? "تحميل..." : "Loading..."}
                              </span>
                            ) : (
                              language === "ar" ? "تحديث" : "Refresh"
                            )}
                          </Button>
                        </div>
                        {satelliteInsightError && (
                          <p className="text-xs text-amber-200">{satelliteInsightError}</p>
                        )}
                        {!satelliteInsightError && !satelliteInsight && (
                          <p className="text-xs text-emerald-100/80">
                            {satelliteInsightLoading
                              ? language === "ar"
                                ? "جاري تحميل قراءة القمر الصناعي..."
                                : "Fetching satellite snapshot..."
                              : language === "ar"
                                ? "لم يتم استلام القراءة بعد"
                                : "No satellite reading yet."}
                          </p>
                        )}
                        {satelliteInsight && (
                          <div className="space-y-3">
                            <div className="grid gap-3 text-sm sm:grid-cols-3">
                              <div>
                                <p className="text-emerald-200/80 text-xs">NDVI</p>
                                <p className="text-lg font-semibold text-white">
                                  {typeof satelliteInsight.satellite?.ndviValue === "number"
                                    ? satelliteInsight.satellite.ndviValue.toFixed(2)
                                    : typeof satelliteInsight.satellite?.ndviMean === "number"
                                      ? satelliteInsight.satellite.ndviMean.toFixed(2)
                                      : "—"}
                                </p>
                              </div>
                              <div>
                                <p className="text-emerald-200/80 text-xs">
                                  {language === "ar" ? "رطوبة" : "Moisture"}
                                </p>
                                <p className="text-lg font-semibold text-white">
                                  {typeof satelliteInsight.satellite?.soilMoisture?.value === "number"
                                    ? `${Math.round(satelliteInsight.satellite.soilMoisture.value)}%`
                                    : "—"}
                                </p>
                              </div>
                              <div>
                                <p className="text-emerald-200/80 text-xs">
                                  {language === "ar" ? "كلوروفيل" : "Chlorophyll"}
                                </p>
                                <p className="text-lg font-semibold text-white">
                                  {typeof satelliteInsight.satellite?.chlorophyll?.value === "number"
                                    ? satelliteInsight.satellite.chlorophyll.value.toFixed(2)
                                    : "—"}
                                </p>
                              </div>
                            </div>
                            {typeof satelliteInsight.analysis?.confidence === "number" && (
                              <p className="text-xs text-emerald-100">
                                {language === "ar" ? "الثقة" : "Confidence"}: {Math.round(satelliteInsight.analysis.confidence * 100)}%
                              </p>
                            )}
                            {satelliteInsight.analysis?.summary && (
                              <p className="text-xs text-emerald-100/80">
                                {satelliteInsight.analysis.summary}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="text-xs text-emerald-200">
                          {language === "ar"
                            ? "منحنى NDVI لآخر القراءات"
                            : "Recent NDVI trend"}
                        </p>
                        <Sparkline points={ndviHistory} language={language} />
                      </div>
                      <div>
                        <p className="text-xs text-emerald-200">
                          {language === "ar"
                            ? "منحنى مؤشر الكلوروفيل (مشتق من NDVI)"
                            : "Chlorophyll index trend (derived from NDVI)"}
                        </p>
                        <Sparkline points={chlorophyllHistory} language={language} />
                      </div>
                      <div>
                        <p className="text-xs text-emerald-200">
                          {language === "ar"
                            ? "منحنى رطوبة التربة (من NDWI)"
                            : "Soil moisture trend (from NDWI)"}
                        </p>
                        <Sparkline points={moistureHistory} language={language} />
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">{t("satellite3d.select_prompt")}</p>
                )}
                {selectedField && selectedField.ndvi == null && (
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    {t("satellite3d.ndvi_missing")}
                  </div>
                )}
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/ai-assistant?field=${encodeURIComponent(selectedField?.id ?? "")}`}
                    className="flex-1"
                  >
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span>{t("satellite3d.actions.ndvi")}</span>
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="flex-1 glass-card border-white/10 flex items-center justify-center gap-2"
                    disabled={!selectedField}
                  >
                    <Activity className="h-4 w-4" />
                    <span>{t("satellite3d.actions.issues")}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-3">
              <Card className="glass-card">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <Leaf className="h-6 w-6 text-emerald-300" />
                    <span className="text-sm text-gray-300">{t("satellite3d.summary.fields")}</span>
                  </div>
                  <span className="text-lg font-semibold text-white">{summary.totalFields}</span>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <LineChart className="h-6 w-6 text-emerald-300" />
                    <span className="text-sm text-gray-300">{t("satellite3d.summary.health")}</span>
                  </div>
                  <span className="text-lg font-semibold text-white">{summary.averageHealth}%</span>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <Droplets className="h-6 w-6 text-emerald-300" />
                    <span className="text-sm text-gray-300">{t("satellite3d.summary.area")}</span>
                  </div>
                  <span className="text-lg font-semibold text-white">
                    {summary.totalArea} {language === "ar" ? "فدان" : "feddans"}
                  </span>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>{t("satellite3d.quick_actions")}</CardTitle>
            <CardDescription>{t("satellite.crop_monitoring")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button
                variant="outline"
                className="h-24 glass-card border-white/10 flex flex-col items-center justify-center gap-2"
                disabled={!selectedField}
              >
                <Activity className="h-5 w-5" />
                <span className="text-sm text-gray-200">{t("satellite3d.actions.ndvi")}</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 glass-card border-white/10 flex flex-col items-center justify-center gap-2"
                disabled={!selectedField}
              >
                <LineChart className="h-5 w-5" />
                <span className="text-sm text-gray-200">{t("satellite3d.actions.growth")}</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 glass-card border-white/10 flex flex-col items-center justify-center gap-2"
                disabled={!selectedField}
              >
                <Droplets className="h-5 w-5" />
                <span className="text-sm text-gray-200">{t("satellite3d.actions.issues")}</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 glass-card border-white/10 flex flex-col items-center justify-center gap-2"
                disabled={isLoading}
              >
                <Download className="h-5 w-5" />
                <span className="text-sm text-gray-200">{t("satellite3d.actions.export")}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Satellite Map */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-emerald-300">
              {language === "ar" ? "خرائط الأقمار الصناعية المتقدمة" : "Advanced Satellite Maps"}
            </CardTitle>
            <CardDescription>
              {language === "ar" ? "بيانات الأقمار الصناعية المباشرة مع مؤشرات متعددة" : "Live satellite data with multiple indices"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdvancedSatelliteMap
              latitude={selectedField?.center[0] || null}
              longitude={selectedField?.center[1] || null}
              lang={language}
              allowProviderSwitch={true}
              allowLayerSwitch={true}
              fieldName={selectedField?.name || undefined}
              height="500px"
            />
          </CardContent>
        </Card>

        {/* Dynamic Soil Analysis */}
        {selectedField && (
          <DynamicSoilAnalysis
            fieldId={selectedField.id}
            latitude={selectedField.center[0] || undefined}
            longitude={selectedField.center[1] || undefined}
            fieldName={selectedField.name || undefined}
          />
        )}

        {/* Advanced VRA Maps */}
        {selectedField && (
          <AdvancedVRAMaps
            fieldId={selectedField.id}
            latitude={selectedField.center[0] || undefined}
            longitude={selectedField.center[1] || undefined}
            fieldName={selectedField.name || undefined}
          />
        )}
      </div>
    </div>
  )
}
