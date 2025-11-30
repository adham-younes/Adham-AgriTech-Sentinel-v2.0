"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Activity, Droplets, Leaf, LineChart, Download, Eye, Loader2, MapPin, Info } from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UnifiedMapWithAnalytics, type FieldFeature } from "@/components/maps/unified-map-with-analytics"
import { SatelliteImageryCard } from "@/components/dashboard/satellite-imagery-card"
import type { FarmAnalyticsFeature } from "@/components/maps/farm-analytics-map"

// Convert FarmAnalyticsFeature to FieldFeature
function convertToFieldFeature(field: FarmAnalyticsFeature): FieldFeature {
  return {
    id: field.id,
    name: field.name,
    crop: field.crop,
    polygon: field.polygon || [],
    center: field.center,
    ndvi: field.ndvi,
    health: field.health,
    moisture: field.moisture,
    areaFeddan: field.areaFeddan,
  }
}
// TEMPORARILY DISABLED - Leaflet initialization issues causing blank page
// import { AdvancedSatelliteMap } from "@/components/satellite/advanced-satellite-map"
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
// Safe access to eosdaPublicConfig with fallback
const DEFAULT_CENTER: [number, number] = (() => {
  try {
    return [eosdaPublicConfig.center.lng, eosdaPublicConfig.center.lat]
  } catch {
    return [30.8025, 26.8206] // Egypt default
  }
})()

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
  planting_date?: string | Date | null
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
    plantingDate: row.planting_date ?? null,
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
  // Check if EOSDA is actually configured and working
  const [eosdaConfigured, setEosdaConfigured] = useState(false)

  useEffect(() => {
    // Check EOSDA configuration - verify API key exists
    const checkEOSDA = async () => {
      try {
        // First check if API key is configured
        const hasApiKey = Boolean(eosdaPublicConfig.apiKey && eosdaPublicConfig.apiKey.trim().length > 0)

        if (!hasApiKey) {
          setEosdaConfigured(false)
          return
        }

        // Then verify it's working by checking health endpoint
        const res = await fetch('/api/system/health')
        const data = await res.json()
        const eosdaStatus = data.services?.find((s: any) => s.name === 'Satellite analytics' || s.id === 'eosda')
        const isOperational = eosdaStatus?.status === 'operational'

        setEosdaConfigured(isOperational && hasApiKey)
      } catch (error) {
        // Use logger if available, otherwise silent in production
        if (process.env.NODE_ENV === 'development') {
          console.error("[Satellite] EOSDA check failed:", error)
        }
        // If API key exists, assume it's configured even if health check fails
        const hasApiKey = Boolean(eosdaPublicConfig.apiKey && eosdaPublicConfig.apiKey.trim().length > 0)
        setEosdaConfigured(hasApiKey)
      }
    }

    checkEOSDA()
  }, [])

  const satelliteAutomationEnabled = Boolean(eosdaPublicConfig.apiKey && eosdaPublicConfig.apiKey.trim().length > 0) && eosdaConfigured
  const [satelliteInsight, setSatelliteInsight] = useState<SatelliteAnalysisResponse | null>(null)
  const [satelliteInsightLoading, setSatelliteInsightLoading] = useState(false)
  const [satelliteInsightError, setSatelliteInsightError] = useState<string | null>(null)
  const [snapshotRefreshToken, setSnapshotRefreshToken] = useState(0)

  const supabase = useMemo(() => {
    try {
      return createClient()
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
              "id, name, crop_type, area, ndvi_score, last_ndvi, last_moisture, last_temperature, last_reading_at, moisture_index, yield_potential, updated_at, boundary_coordinates, latitude, longitude, planting_date, farms(latitude, longitude)",
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
          // Use logger if available
          if (process.env.NODE_ENV === 'development') {
            console.warn("[Satellite] Falling back to minimal fields selection due to schema mismatch:", colError?.message)
          }
          const res2 = await supabase
            .from("fields")
            .select(
              "id, name, crop_type, area, updated_at, boundary_coordinates, latitude, longitude, planting_date, farms(latitude, longitude)",
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
            // Use logger if available
            if (process.env.NODE_ENV === 'development') {
              console.warn("[Satellite] Failed to load NDVI history:", error.message)
            }
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
        // Use logger if available
        if (process.env.NODE_ENV === 'development') {
          console.warn("[Satellite] Unexpected NDVI history error:", error?.message ?? error)
        }
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
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl border border-emerald-500/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="h-8 w-8 text-emerald-400" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-primary bg-clip-text text-transparent">
                {language === "ar" ? "ذكاء المزارع ثلاثي الأبعاد" : "3D Farm Intelligence"}
              </h1>
            </div>
            <p className="text-muted-foreground mb-3 max-w-2xl">
              {language === "ar"
                ? "مراقبة تفاعلية للحقول مع تحليلات NDVI ورطوبة التربة من بيانات الأقمار الصناعية EOSDA"
                : "Interactive field monitoring with NDVI and soil moisture analytics from EOSDA satellite data"}
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge
                variant="outline"
                className={`${satelliteAutomationEnabled
                  ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                  : "border-amber-500/50 text-amber-400 bg-amber-500/10"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${satelliteAutomationEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {satelliteAutomationEnabled
                    ? (language === "ar" ? "بيانات مباشرة من EOSDA" : "Live EOSDA Data")
                    : (language === "ar" ? "بيانات تجريبية" : "Demo Data")
                  }
                </div>
              </Badge>
              {/* Removed Demo Data warning - EOSDA status is shown in badge */}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-black/20 px-3 py-1.5 rounded-full border border-white/5">
              <span>{language === "ar" ? "المزوّد:" : "Provider:"}</span>
              <select
                className="bg-transparent border-none text-emerald-400 font-medium focus:ring-0 cursor-pointer"
                value={provider}
                onChange={(e) => setProvider(e.target.value as any)}
              >
                <option value="sentinel">{language === "ar" ? "سنتينل هب" : "Sentinel Hub"}</option>
                <option value="eosda">EOSDA (Pro)</option>
                <option value="auto">Auto Select</option>
              </select>
            </div>
            <Button
              variant="outline"
              className="glass-card border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 flex items-center gap-2"
              disabled={isLoading}
            >
              <Download className="h-4 w-4" />
              <span>{t("satellite3d.actions.export")}</span>
            </Button>
          </div>
        </div>
      </div>

      {requiresLogin && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          يجب تسجيل الدخول لعرض الحقول الخاصة بك. <a href="/auth/login" className="underline hover:text-amber-300">تسجيل الدخول</a>
        </div>
      )}
      {errorMessage && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          {errorMessage}
        </div>
      )}

      {/* Empty state for new users */}
      {!isLoading && !errorMessage && !requiresLogin && fields.length === 0 && (
        <div className="glass-card p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
            <Leaf className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {language === "ar" ? "ابدأ رحلتك الزراعية" : "Start Your Farming Journey"}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {language === "ar"
              ? "لا توجد حقول بعد. أضف مزرعة وحقلاً لعرض التحليلات، أو زر ثورة الزراعة الرقمية لتعلّم كيفية رسم الحدود."
              : "No fields yet. Add a farm and field to view the analytics, or visit the Digital Agriculture Revolution to learn how to map boundaries."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/dashboard/farms">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {language === "ar" ? "إدارة المزارع" : "Manage Farms"}
              </Button>
            </Link>
            <Link href="/dashboard/fields/new">
              <Button variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                {language === "ar" ? "إضافة حقل" : "Add Field"}
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card className="glass-card border-emerald-500/20">
          <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-5 w-5 text-emerald-400" />
                {language === "ar" ? "خريطة الحقول التفاعلية" : "Interactive Field Map"}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {language === "ar"
                  ? "مراقبة تفاعلية للحقول مع تحليلات NDVI ورطوبة التربة من بيانات EOSDA"
                  : "Interactive field monitoring with NDVI and soil moisture analytics from EOSDA data"}
              </CardDescription>
            </div>
            {selectedField && (
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1">
                {selectedField.name}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="relative min-h-[520px]">
              <SatelliteImageryCard
                initialFieldId={selectedFieldId || undefined}
                initialCoordinates={selectedField?.center || undefined}
                className="h-[600px]"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* التحليلات الآن في Sidebar - تم إزالة الكاردات المكررة */}

          <div className="space-y-4">
            <Card className="glass-card border-emerald-500/20">
              <CardHeader className="flex flex-col gap-2 border-b border-white/5 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Info className="h-4 w-4 text-cyan-400" />
                      {language === "ar" ? "تحليلات الأقمار الصناعية المتقدمة" : "Advanced Satellite Analytics"}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {language === "ar"
                        ? "مدعوم بـ Gemini & EOSDA"
                        : "Powered by Gemini & EOSDA"}
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
                            {language === "ar" ? "قراءة الأقمار الصناعية المباشرة" : "Satellite snapshot"}
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

        {/* Advanced Satellite Map - TEMPORARILY DISABLED */}
        {/* Component has Leaflet initialization issues causing TypeError and blank page */}
        {/* The FarmAnalyticsMap above (line 717) provides the core satellite visualization */}
        {/*
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
        */}

        {/* Advanced Analytics Sections */}
        {selectedField && (
          <div className="space-y-6">
            <Card className="glass-card border-emerald-500/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-sky-400" />
                  {language === "ar" ? "تحليل التربة الديناميكي" : "Dynamic Soil Analysis"}
                </CardTitle>
                <CardDescription>
                  {language === "ar"
                    ? "تحليل متقدم لخصائص التربة بناءً على بيانات الأقمار الصناعية من EOSDA"
                    : "Advanced soil properties analysis based on EOSDA satellite data"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DynamicSoilAnalysis
                  fieldId={selectedField.id}
                  latitude={selectedField.center?.[1] || selectedField.center?.[0] || undefined}
                  longitude={selectedField.center?.[0] || selectedField.center?.[1] || undefined}
                  fieldName={selectedField.name || undefined}
                />
              </CardContent>
            </Card>

            <Card className="glass-card border-emerald-500/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-purple-400" />
                  {language === "ar" ? "خرائط التطبيق المتغير (VRA)" : "Variable Rate Application Maps"}
                </CardTitle>
                <CardDescription>
                  {language === "ar"
                    ? "خرائط دقيقة لتطبيق الأسمدة والمبيدات بناءً على تحليل الحقل من بيانات EOSDA"
                    : "Precision maps for fertilizer and pesticide application based on EOSDA field analysis"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdvancedVRAMaps
                  fieldId={selectedField.id}
                  latitude={selectedField.center[0] || undefined}
                  longitude={selectedField.center[1] || undefined}
                  fieldName={selectedField.name || undefined}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
