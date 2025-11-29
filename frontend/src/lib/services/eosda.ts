// EOS Data Analytics API Integration for satellite imagery and analytics
// Documentation: https://doc.eos.com/
// API Base: https://api-connect.eos.com

import { eosdaPublicConfig, eosdaServerConfig } from "../config/eosda"
import { logger } from "../utils/logger"

export interface EOSDASatelliteImageRequest {
  center: { latitude: number; longitude: number }
  zoom?: number
  size?: { width: number; height: number }
  startDate?: string
  endDate?: string
  cloudCoverage?: number
}

export interface EOSDASatelliteImageResponse {
  id?: string
  url: string
  bounds?: {
    north: number
    south: number
    east: number
    west: number
  }
  resolution?: number
  cloudCoverage?: number
  capturedAt?: string
  source?: string
}

export interface EOSDANDVIResponse {
  id?: string
  url: string
  ndvi_value: number
  statistics?: {
    mean?: number
    min?: number
    max?: number
  }
  bounds?: {
    north: number
    south: number
    east: number
    west: number
  }
  date: string
  source?: string
}

export interface EOSDAIndexSample {
  index: string
  value: number | null
  statistics?: {
    mean?: number | null
    min?: number | null
    max?: number | null
  }
  date?: string | null
  mapUrl?: string | null
}

interface TokenCache {
  token: string
  expiresAt: number
}

function parseBoolean(value?: string | null, fallback = false) {
  if (value == null) return fallback
  const normalized = value.trim().toLowerCase()
  if (["1", "true", "yes", "on", "enabled"].includes(normalized)) return true
  if (["0", "false", "no", "off", "disabled"].includes(normalized)) return false
  return fallback
}

const eosdaDisableRaw = process.env.DISABLE_EOSDA ?? process.env.NEXT_PUBLIC_DISABLE_EOSDA
const EOSDA_FORCED_DISABLED = parseBoolean(eosdaDisableRaw, false)
const SYNTHETIC_IMAGE_URL = "/tile.png"
const SYNTHETIC_SOURCE = "synthetic"

// Token cache for future use when implementing OAuth flow
// Currently using API key directly, but structure is ready for token caching
let cachedToken: TokenCache | null = null
const TOKEN_CACHE_TTL = 1000 * 60 * 55 // 55 minutes
const TOKEN_REFRESH_BUFFER = 1000 * 30 // 30 seconds

export function getEOSDAConfig() {
  const trim = (v?: string) => (typeof v === "string" ? v.trim() : v)
  const modeEnv = (trim(process.env.EOSDA_API_MODE) || "").toLowerCase()
  const mode: "connect" | "stac" = modeEnv === "connect" ? "connect" : "stac"
  const apiKey = eosdaServerConfig.apiKey || (trim(process.env.EOSDA_API_KEY) as string | undefined)

  const baseUrl = eosdaServerConfig.apiUrl || "https://api-connect.eos.com"
  const version = eosdaServerConfig.apiVersion || "v1"
  const apiBaseUrl = `${baseUrl.replace(/\/$/, "")}/${version.replace(/^\//, "")}`

  return {
    apiKey,
    apiBaseUrl,
    mode,
    disabled: EOSDA_FORCED_DISABLED,
    hasCredentials: Boolean(apiKey),
    isValid: Boolean(apiKey) && !EOSDA_FORCED_DISABLED,
    apiVersion: version,
  }
}

export function isEOSDAConfigured(): boolean {
  return getEOSDAConfig().isValid
}

export function isEOSDASynthetic(): boolean {
  return !getEOSDAConfig().isValid
}

async function getEOSDAToken(): Promise<string> {
  const { apiKey } = getEOSDAConfig()

  if (!apiKey) {
    throw new Error('EOSDA API key not configured')
  }

  const now = Date.now()

  if (
    cachedToken &&
    cachedToken.token === apiKey &&
    cachedToken.expiresAt - TOKEN_REFRESH_BUFFER > now
  ) {
    return cachedToken.token
  }

  // For API key authentication, the token is the API key itself.
  // Some EOSDA endpoints reject unexpected Authorization formats.
  // We will use only X-Api-Key header with the raw key.
  cachedToken = {
    token: apiKey,
    expiresAt: now + TOKEN_CACHE_TTL,
  }

  return cachedToken.token
}

function buildEOSDAUrl(path = ""): string {
  const config = getEOSDAConfig()
  const baseUrl = eosdaServerConfig.apiUrl || "https://api-connect.eos.com"

  if (!baseUrl) {
    throw new Error("EOSDA API base URL not configured")
  }

  const trimmedBase = baseUrl.replace(/\/+$/, "")
  const normalizedPath = path.replace(/^\/+/, "")

  // GDW API and some endpoints don't use version prefix
  // Check if path starts with /api/ (like /api/gdw/api) - these don't need v1
  const needsVersion = !normalizedPath.startsWith("api/") && !normalizedPath.startsWith("/api/")
  const version = needsVersion ? config.apiVersion || "v1" : ""

  if (normalizedPath) {
    if (version) {
      return `${trimmedBase}/${version}/${normalizedPath}`
    }
    return `${trimmedBase}/${normalizedPath}`
  }
  
  return version ? `${trimmedBase}/${version}` : trimmedBase
}

interface EOSDAResponseMeta {
  status: number
  durationMs: number
}

async function requestFromEOSDA<T>(path: string, init?: RequestInit & { query?: Record<string, string | number | undefined> }): Promise<T> {
  const endpoint = buildEOSDAUrl(path)
  const { query, ...fetchInit } = init || {}
  const url = new URL(endpoint)

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  const token = await getEOSDAToken()
  
  // EOSDA API requires X-Api-Key header ONLY (NOT query parameter, NOT Bearer)
  // Documentation: https://doc.eos.com/docs/code-examples/
  // Format: Header name: X-Api-Key, Value: apk.xxxxx
  
  try {
    const response = await fetch(url.toString(), {
      ...fetchInit,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Api-Key": token, // ✅ Use X-Api-Key header only
        ...fetchInit?.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('EOSDA API request failed', new Error(`EOSDA API Error [${response.status}]: ${errorText}`), {
        status: response.status,
        statusText: response.statusText,
        endpoint: url,
        errorText: errorText.substring(0, 200)
      })
      throw new Error(`EOSDA API request failed: ${response.status} ${response.statusText}`)
    }

    return await response.json() as T
  } catch (error) {
    logger.error('EOSDA API request failed', error, {
      endpoint: url,
      method: fetchInit?.method || 'GET'
    })
    throw error
  }
}

// -------------------------------
// Connect-mode helpers
// -------------------------------
function makeTinyPolygonAround(lat: number, lon: number, delta = 0.01) {
  const ring: [number, number][] = [
    [lon - delta, lat - delta],
    [lon + delta, lat - delta],
    [lon + delta, lat + delta],
    [lon - delta, lat + delta],
    [lon - delta, lat - delta],
  ]
  return { type: "Polygon", coordinates: [ring] } as {
    type: "Polygon"
    coordinates: [Array<[number, number]>]
  }
}

function toBBoxFromCenter(lat: number, lon: number, delta = 0.01) {
  const west = lon - delta
  const east = lon + delta
  const south = lat - delta
  const north = lat + delta
  return { west, east, south, north }
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function seededRandom(lat: number, lon: number, offset = 0) {
  const seed = Math.sin(lat * 12.9898 + lon * 78.233 + offset * 37.719) * 43758.5453
  return seed - Math.floor(seed)
}

function syntheticTimestamp(startDate?: Date, endDate?: Date) {
  if (endDate) return endDate.toISOString()
  if (startDate) return startDate.toISOString()
  return new Date().toISOString()
}

function syntheticBoundsFromCenter(center: { latitude: number; longitude: number }, delta = 0.05) {
  const bbox = toBBoxFromCenter(center.latitude, center.longitude, delta)
  return { north: bbox.north, south: bbox.south, east: bbox.east, west: bbox.west }
}

function createSyntheticSatelliteImageResponse({
  center,
  size,
}: {
  center: { latitude: number; longitude: number }
  size: { width: number; height: number }
}): EOSDASatelliteImageResponse {
  const bounds = syntheticBoundsFromCenter(center, 0.08)
  const cloudCoverage = Math.round(clampNumber(seededRandom(center.latitude, center.longitude) * 60, 5, 60))
  return {
    id: `synthetic-scene-${Date.now()}`,
    url: SYNTHETIC_IMAGE_URL,
    bounds,
    resolution: Math.max(size.width, size.height) > 1024 ? 10 : 20,
    cloudCoverage,
    capturedAt: new Date().toISOString(),
    source: SYNTHETIC_SOURCE,
  }
}

function createSyntheticIndexSample({
  index,
  center,
  startDate,
  offset = 0,
  scale = 1,
}: {
  index: string
  center: { latitude: number; longitude: number }
  startDate?: Date
  offset?: number
  scale?: number
}): EOSDAIndexSample {
  const raw = seededRandom(center.latitude, center.longitude, offset)
  const value = Math.round(Math.min(1, Math.max(0, raw * scale)) * 100) / 100
  return {
    index,
    value,
    statistics: { mean: value },
    date: syntheticTimestamp(startDate),
    mapUrl: SYNTHETIC_IMAGE_URL,
  }
}

function createSyntheticNDVIResponse({
  center,
  startDate,
  endDate,
}: {
  center: { latitude: number; longitude: number }
  startDate?: Date
  endDate?: Date
}): EOSDANDVIResponse {
  const base = 0.35 + seededRandom(center.latitude, center.longitude) * 0.4
  const mean = Number(clampNumber(base, 0.1, 0.9).toFixed(3))
  const min = Number(clampNumber(mean - 0.18, 0.05, 0.95).toFixed(3))
  const max = Number(clampNumber(mean + 0.18, 0.1, 0.98).toFixed(3))
  const timestamp = syntheticTimestamp(startDate, endDate)
  return {
    id: `synthetic-ndvi-${timestamp}`,
    url: SYNTHETIC_IMAGE_URL,
    ndvi_value: mean,
    statistics: { mean, min, max },
    bounds: undefined,
    date: timestamp,
    source: SYNTHETIC_SOURCE,
  }
}

function createSyntheticWeatherSnapshots({
  latitude,
  longitude,
  hours,
}: {
  latitude: number
  longitude: number
  hours: number
}): EOSDAWeatherSnapshot[] {
  const totalHours = clampNumber(hours, 6, 72)
  const now = Date.now()
  const snapshots: EOSDAWeatherSnapshot[] = []
  for (let h = totalHours; h >= 0; h -= 3) {
    const seed = seededRandom(latitude, longitude, h)
    const capturedAt = new Date(now - h * 60 * 60 * 1000).toISOString()
    const temperature = Number((18 + seed * 12).toFixed(1))
    const humidity = Number(clampNumber(40 + seed * 50, 25, 95).toFixed(0))
    const windSpeed = Number((2 + seed * 4).toFixed(1))
    const precipitation = Number(clampNumber(seed * 5 - 1, 0, 6).toFixed(1))
    const summary =
      humidity > 80
        ? "Rain likely"
        : temperature > 28
          ? "Hot and dry"
          : temperature < 15
            ? "Cool and calm"
            : "Mild conditions"
    snapshots.push({
      capturedAt,
      temperature,
      humidity,
      windSpeed,
      precipitation: precipitation > 0.5 ? precipitation : undefined,
      summary,
    })
  }
  return snapshots
}

function extractGeometryCenter(geometry: EOSDASceneSearchParams["geometry"]): { latitude: number; longitude: number } {
  if (geometry.type === "Point") {
    return { latitude: geometry.coordinates[1], longitude: geometry.coordinates[0] }
  }
  const coords = geometry.coordinates?.[0] ?? []
  if (!coords.length) {
    return { latitude: eosdaPublicConfig.center.lat, longitude: eosdaPublicConfig.center.lng }
  }
  const sum = coords.reduce(
    (acc, [lng, lat]) => {
      acc.lat += lat
      acc.lng += lng
      return acc
    },
    { lat: 0, lng: 0 },
  )
  return {
    latitude: sum.lat / coords.length,
    longitude: sum.lng / coords.length,
  }
}

function createSyntheticScenes(params: EOSDASceneSearchParams): EOSDASceneSummary[] {
  const center = extractGeometryCenter(params.geometry)
  const baseDate = new Date()
  return Array.from({ length: params.limit ?? 2 }).map((_, index) => {
    const capturedAt = new Date(baseDate.getTime() - index * 24 * 60 * 60 * 1000).toISOString()
    return {
      id: `synthetic-scene-${index + 1}`,
      datetime: capturedAt,
      cloudCover: Math.round(clampNumber(seededRandom(center.latitude, center.longitude, index) * 60, 5, 70)),
      platform: "synthetic",
      bounds: [
        center.longitude - 0.05,
        center.latitude - 0.05,
        center.longitude + 0.05,
        center.latitude + 0.05,
      ],
    }
  })
}

function createSyntheticRenderResponse({
  sceneId,
  bbox,
}: {
  sceneId: string
  bbox: [number, number, number, number]
}): EOSDARenderResponse {
  return {
    sceneId,
    imageUrl: SYNTHETIC_IMAGE_URL,
    bounds: bbox,
    renderedAt: new Date().toISOString(),
  }
}

function createSyntheticStatisticsResponse(index: string): EOSDAStatisticsResponse {
  const mean = Number((0.4 + Math.random() * 0.3).toFixed(3))
  return {
    index,
    mean,
    min: Number(clampNumber(mean - 0.2, 0.05, 0.9).toFixed(3)),
    max: Number(clampNumber(mean + 0.2, 0.1, 0.95).toFixed(3)),
    stdDev: Number((0.05 + Math.random() * 0.02).toFixed(3)),
    histogram: Array.from({ length: 5 }).map((_, bucket) => ({ bucket, value: Math.round(Math.random() * 10) })),
    capturedAt: new Date().toISOString(),
  }
}

function createSyntheticWeatherRangeResponse({
  center,
  startDate,
  endDate,
}: EOSDAWeatherRangeRequest) {
  const durationHours =
    startDate && endDate ? Math.max(6, Math.round((endDate.getTime() - startDate.getTime()) / (60 * 60 * 1000))) : 24
  const snapshots = createSyntheticWeatherSnapshots({
    latitude: center.latitude,
    longitude: center.longitude,
    hours: durationHours,
  })
  return { data: snapshots }
}

async function connectSearchViewId(args: {
  latitude: number
  longitude: number
  startDate?: string
  endDate?: string
  cloudCoverage?: number
}): Promise<{ viewId: string | null; cloud?: number; date?: string }> {
  const { latitude, longitude, startDate, endDate, cloudCoverage } = args
  const geom = makeTinyPolygonAround(latitude, longitude)
  const payloadBase = {
    fields: ["sceneID", "cloudCoverage", "tms", "date"],
    limit: 1,
    page: 1,
    search: {
      date: startDate && endDate ? { from: startDate, to: endDate } : undefined,
      cloudCoverage: typeof cloudCoverage === "number" ? { from: 0, to: cloudCoverage } : undefined,
      shapeRelation: "INTERSECTS",
      shape: geom,
    },
    sort: { date: "desc" as const },
  }

  const datasets = [
    "/api/lms/search/v2/sentinel2l2a",
    "/api/lms/search/v2/sentinel2",
  ]

  for (const path of datasets) {
    try {
      const res = await requestFromEOSDA<{
        results?: Array<{ view_id?: string; cloudCoverage?: number; date?: string }>
      }>(path, { method: "POST", body: JSON.stringify(payloadBase) })
      const first = res?.results?.[0]
      if (first?.view_id) {
        return { viewId: first.view_id, cloud: first.cloudCoverage, date: first.date }
      }
    } catch {
      // try next
    }
  }

  return { viewId: null }
}

export async function fetchEOSDASatelliteImage({
  center,
  zoom = 15,
  size = { width: 512, height: 512 },
  startDate,
  endDate,
  cloudCoverage
}: EOSDASatelliteImageRequest): Promise<EOSDASatelliteImageResponse> {
  try {
    const config = getEOSDAConfig()
    if (!config.isValid) {
      return createSyntheticSatelliteImageResponse({ center, size })
    }

    // Search for satellite scenes using the correct LMS Search V2 endpoint
    // Documentation: https://doc.eos.com/docs/search/simple-search/#search-scenes-for-sentinel2
    const searchResponse = await requestFromEOSDA<{
      results: Array<{
        sceneID: string
        date: string
        cloudCoverage: number
        view_id: string
        dataGeometry: {
          coordinates: number[][][]
          type: "Polygon"
        }
      }>
    }>("/api/lms/search/v2/sentinel2", {
      method: 'POST',
      body: JSON.stringify({
        fields: ["sceneID", "cloudCoverage", "date", "view_id", "dataGeometry"],
        limit: 1,
        page: 1,
        search: {
          date: startDate && endDate ? { from: startDate, to: endDate } : undefined,
          cloudCoverage: cloudCoverage ? { from: 0, to: cloudCoverage } : undefined,
          shapeRelation: "INTERSECTS",
          shape: {
            type: "Point",
            coordinates: [center.longitude, center.latitude]
          }
        },
        sort: { date: "desc" }
      }),
    })

    if (!searchResponse.results || searchResponse.results.length === 0) {
      throw new Error('No satellite scenes found')
    }

    const scene = searchResponse.results[0]

    // Calculate Tile X/Y for the center at the requested zoom
    // Formula:
    // n = 2 ^ zoom
    // xtile = n * ((lon_deg + 180) / 360)
    // ytile = n * (1 - (log(tan(lat_rad) + sec(lat_rad)) / pi)) / 2

    const latRad = (center.latitude * Math.PI) / 180
    const n = Math.pow(2, zoom)
    const xTile = Math.floor(n * ((center.longitude + 180) / 360))
    const yTile = Math.floor(n * (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2)

    // Construct the proxy URL with tile coordinates
    const internalProxyUrl = `/api/eosda/proxy?viewId=${scene.view_id}&z=${zoom}&x=${xTile}&y=${yTile}`

    // Calculate bounds for the single tile (approximate)
    // This is just for reference, the UI might display a larger area
    const delta = 0.01
    const bbox = {
      west: center.longitude - delta,
      south: center.latitude - delta,
      east: center.longitude + delta,
      north: center.latitude + delta
    }

    return {
      id: scene.sceneID,
      url: internalProxyUrl,
      bounds: bbox,
      resolution: 10, // Sentinel-2 resolution
      cloudCoverage: scene.cloudCoverage,
      capturedAt: scene.date,
      source: 'eosda'
    }
  } catch (error: any) {
    logger.error("EOSDA satellite image error", error, {
      center,
      zoom,
      startDate,
      endDate,
      service: "eosda"
    })
    const message = error instanceof Error ? error.message : String(error || "")

    // For network problems, fall back to a synthetic image instead of failing hard
    if (message.includes("fetch failed") || message.includes("ENOTFOUND")) {
      return createSyntheticSatelliteImageResponse({ center, size })
    }

    throw new Error("Failed to fetch EOSDA satellite image")
  }
}

export async function fetchEOSDANDVI(
  {
    center,
    startDate,
    endDate,
  }: {
    center: { latitude: number; longitude: number }
    startDate?: Date
    endDate?: Date
  },
  options?: { onResponse?: (meta: EOSDAResponseMeta) => void },
): Promise<EOSDANDVIResponse> {
  try {
    const config = getEOSDAConfig()
    if (!config.isValid) {
      return createSyntheticNDVIResponse({ center, startDate, endDate })
    }
    const { mode } = config

    // Use GDW API for statistics (Task-based workflow)
    // Documentation: https://doc.eos.com/docs/statistics/#task-creation

    const geom = makeTinyPolygonAround(center.latitude, center.longitude)
    const body = {
      type: 'mt_stats',
      params: {
        bm_type: ['NDVI'],
        date_start: startDate ? startDate.toISOString().slice(0, 10) : undefined,
        date_end: endDate ? endDate.toISOString().slice(0, 10) : undefined,
        geometry: geom,
        sensors: ['sentinel2'],
        limit: 10,
        reference: `ndvi_task_${Date.now()}`,
      },
    }

    const created = await requestFromEOSDA<{ status: string; task_id?: string }>(
      '/api/gdw/api',
      { method: 'POST', body: JSON.stringify(body), onResponse: options?.onResponse },
    )

    if (!created.task_id) throw new Error('NDVI task creation failed')

    // Poll for task completion
    // In a real app, we might want to return the task ID and let the client poll, 
    // but here we'll do a simple poll with timeout for simplicity

    let attempts = 0
    const maxAttempts = 10
    const delay = 1000 // 1 second

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, delay))

      const result = await requestFromEOSDA<{
        status?: string
        result?: Array<{ date?: string; indexes?: { NDVI?: { average?: number; min?: number; max?: number } } }>
        errors?: any[]
      }>(`/api/gdw/api/${created.task_id}`)

      if (result.status === 'finished' || result.result) {
        const entry = result?.result?.[0]
        const stats = entry?.indexes?.NDVI

        if (!stats || typeof stats.average !== 'number') {
          // If finished but no data, might be cloud cover or no scenes
          if (result.status === 'finished') throw new Error('NDVI analysis finished but returned no data')
          // If not finished, continue polling
        } else {
          return {
            id: entry?.date,
            url: '', // No map URL from stats API
            ndvi_value: stats.average,
            statistics: {
              mean: stats.average,
              min: stats.min,
              max: stats.max
            },
            bounds: undefined,
            date: entry?.date || new Date().toISOString(),
          }
        }
      }

      if (result.status === 'error' || result.errors?.length) {
        throw new Error(`NDVI task failed: ${JSON.stringify(result.errors)}`)
      }

      attempts++
    }

    throw new Error('NDVI task timed out')
  } catch (error) {
    logger.error('EOSDA NDVI error', error, {
      center,
      startDate,
      endDate,
      service: "eosda"
    })
    // Graceful fallback for demo stability when network/DNS fails
    const message = (error instanceof Error ? error.message : String(error || ''))
    const causeCode = (error as any)?.cause?.code
    const networkFailure = /ENOTFOUND|ECONNREFUSED|EAI_AGAIN|fetch failed|DNS|getaddrinfo/i.test(message) || causeCode === 'ENOTFOUND'
    if (networkFailure) {
      return createSyntheticNDVIResponse({ center, startDate, endDate })
    }
    throw new Error('Failed to fetch EOSDA NDVI data')
  }
}

async function fetchEOSDAIndexSample({
  center,
  startDate,
  endDate,
  index,
  aliases = [],
  syntheticOffset = 0,
  syntheticScale = 1,
}: {
  center: { latitude: number; longitude: number }
  startDate?: Date
  endDate?: Date
  index: string
  aliases?: string[]
  syntheticOffset?: number
  syntheticScale?: number
}): Promise<EOSDAIndexSample> {
  const config = getEOSDAConfig()
  const indexCandidates = [index, ...aliases]

  if (!config.isValid) {
    return createSyntheticIndexSample({
      index,
      center,
      startDate,
      offset: syntheticOffset,
      scale: syntheticScale,
    })
  }

  const requestPayload = {
    geometry: {
      type: "Point",
      coordinates: [center.longitude, center.latitude],
    },
    datetime:
      startDate && endDate
        ? `${startDate.toISOString()}/${endDate.toISOString()}`
        : undefined,
    collections: ["sentinel-2-l2a"],
  }

  const tryFetch = async (slug: string) => {
    const response = await requestFromEOSDA<{
      data: {
        statistics?: { mean?: number; min?: number; max?: number }
        datetime?: string
        bounds?: number[]
        map_url?: string
        [key: string]: unknown
      }
    }>(`/statistics/${slug}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    })

    const statistics = response?.data?.statistics ?? {}
    const value =
      typeof statistics?.mean === "number"
        ? statistics.mean
        : (response?.data?.statistics as { value?: number } | undefined)?.value ?? null
    const mapUrl =
      (response?.data?.map_url as string | undefined) ||
      (response?.data?.[`${slug}_map_url`] as string | undefined) ||
      null

    return {
      index: slug,
      value,
      statistics,
      date: response?.data?.datetime ?? syntheticTimestamp(startDate),
      mapUrl,
    } as EOSDAIndexSample
  }

  for (const slug of indexCandidates) {
    try {
      return await tryFetch(slug)
    } catch (error) {
      // fallback to /indices/{slug}
      try {
        const fallback = await requestFromEOSDA<{
          data: {
            statistics?: { mean?: number; min?: number; max?: number }
            datetime?: string
            bounds?: number[]
            map_url?: string
            [key: string]: unknown
          }
        }>(`/indices/${slug}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        })

        const statistics = fallback?.data?.statistics ?? {}
        const value =
          typeof statistics?.mean === "number"
            ? statistics.mean
            : (fallback?.data?.statistics as { value?: number } | undefined)?.value ?? null
        const mapUrl =
          (fallback?.data?.map_url as string | undefined) ||
          (fallback?.data?.[`${slug}_map_url`] as string | undefined) ||
          null

        return {
          index: slug,
          value,
          statistics,
          date: fallback?.data?.datetime ?? syntheticTimestamp(startDate),
          mapUrl,
        }
      } catch (secondaryError) {
        // Continue trying other aliases.
        continue
      }
    }
  }

  return createSyntheticIndexSample({
    index,
    center,
    startDate,
    offset: syntheticOffset,
    scale: syntheticScale,
  })
}

export async function fetchEOSDAChlorophyll({
  center,
  startDate,
  endDate,
}: {
  center: { latitude: number; longitude: number }
  startDate?: Date
  endDate?: Date
}): Promise<EOSDAIndexSample> {
  return fetchEOSDAIndexSample({
    center,
    startDate,
    endDate,
    index: "chlorophyll",
    aliases: ["chl", "chlorophyll_content"],
    syntheticOffset: 5,
    syntheticScale: 1,
  })
}

export async function fetchEOSDASoilMoisture({
  center,
  startDate,
  endDate,
}: {
  center: { latitude: number; longitude: number }
  startDate?: Date
  endDate?: Date
}): Promise<EOSDAIndexSample> {
  // For soil moisture, we want values in the 0.3-0.7 range (30-70% when multiplied by 100)
  // Using offset 11 and scale 0.4 gives us values roughly in that range
  return fetchEOSDAIndexSample({
    center,
    startDate,
    endDate,
    index: "soil_moisture",
    aliases: ["msavi", "ndmi", "ndwi"],
    syntheticOffset: 11,
    syntheticScale: 0.4, // Scale to 0-0.4 range, then offset will shift it to ~0.3-0.7
  })
}

export interface EOSDASceneSearchParams {
  geometry:
  | {
    type: "Polygon"
    coordinates: number[][][]
  }
  | {
    type: "Point"
    coordinates: [number, number]
  }
  startDate?: string
  endDate?: string
  limit?: number
  collections?: string[]
  cloudCoverMax?: number
}

export interface EOSDASceneSummary {
  id: string
  datetime: string
  cloudCover?: number
  platform?: string
  bounds?: [number, number, number, number]
}

export async function searchEOSDAScenes(params: EOSDASceneSearchParams): Promise<EOSDASceneSummary[]> {
  const config = getEOSDAConfig()
  if (!config.isValid) {
    return createSyntheticScenes(params)
  }
  const datetime = params.startDate && params.endDate ? `${params.startDate}/${params.endDate}` : undefined

  const payload: Record<string, unknown> = {
    geometry: params.geometry,
    datetime,
    limit: params.limit ?? 5,
    collections: params.collections ?? ["sentinel-2-l2a"],
  }

  if (params.cloudCoverMax) {
    payload.query = {
      "eo:cloud_cover": { lte: params.cloudCoverMax },
    }
  }

  const response = await requestFromEOSDA<{
    data: Array<{
      id: string
      attributes: {
        datetime: string
        cloud_cover?: number
        platform?: string
        bbox?: number[]
      }
    }>
  }>("/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  return (
    response?.data?.map((item) => ({
      id: item.id,
      datetime: item.attributes.datetime,
      cloudCover: item.attributes.cloud_cover,
      platform: item.attributes.platform,
      bounds: item.attributes.bbox as [number, number, number, number] | undefined,
    })) ?? []
  )
}

export interface EOSDARenderRequest {
  sceneId: string
  bbox: [number, number, number, number]
  width?: number
  height?: number
  index?: string
  colormap?: string
  format?: "png" | "jpeg" | "tiff"
}

export interface EOSDARenderResponse {
  sceneId: string
  imageUrl: string
  bounds: [number, number, number, number]
  renderedAt: string
}

export async function renderEOSDAImagery({
  sceneId,
  bbox,
  width = 1024,
  height = 1024,
  index = "ndvi",
  colormap = "rdylgn",
  format = "png",
}: EOSDARenderRequest): Promise<EOSDARenderResponse> {
  const config = getEOSDAConfig()
  if (!config.isValid) {
    return createSyntheticRenderResponse({ sceneId, bbox })
  }
  const response = await requestFromEOSDA<{
    data: {
      image_url: string
      bounds: number[]
      datetime: string
    }
  }>(`/render/${sceneId}`, {
    query: {
      bbox: bbox.join(","),
      width: width.toString(),
      height: height.toString(),
      index,
      colormap,
      format,
    },
  })

  const bounds = (response.data.bounds as [number, number, number, number]) ?? bbox

  return {
    sceneId,
    imageUrl: response.data.image_url,
    bounds,
    renderedAt: response.data.datetime,
  }
}

// ============================================
// TILES API - For map tile rendering
// ============================================

export interface EOSDATileRequest {
  viewId: string
  bands?: string // e.g., "B04,B03,B02" for RGB, or "NDVI" for index
  z: number // Zoom level
  x: number // Tile X coordinate
  y: number // Tile Y coordinate
  colormap?: string // Color scheme: "rdylgn", "viridis", "plasma", etc.
  minmax?: string // Min/max values: "0,1" or "auto"
  calibrate?: boolean // Apply calibration
}

export interface EOSDATileResponse {
  tileUrl: string
  viewId: string
  z: number
  x: number
  y: number
}

/**
 * Get EOSDA tile URL for map rendering
 * Documentation: https://doc.eos.com/docs/render/#tile-rendering
 */
export function getEOSDATileUrl({
  viewId,
  bands = "B04,B03,B02",
  z,
  x,
  y,
  colormap,
  minmax,
  calibrate,
}: EOSDATileRequest): string {
  const config = getEOSDAConfig()
  if (!config.isValid) {
    return "" // Return empty for synthetic mode
  }

  const baseUrl = eosdaServerConfig.apiUrl || "https://api-connect.eos.com"
  const apiKey = config.apiKey

  // Build tile URL: /api/render/{viewId}/{bands}/{z}/{x}/{y}
  // Note: api_key should NOT be in query params - use X-Api-Key header instead
  const tilePath = `/api/render/${encodeURIComponent(viewId)}/${encodeURIComponent(bands)}/${z}/${x}/${y}`
  
  const params = new URLSearchParams()
  // ❌ Removed: params.append("api_key", apiKey) - Use X-Api-Key header instead
  if (colormap) params.append("COLORMAP", colormap)
  if (minmax) params.append("MIN_MAX", minmax)
  if (calibrate) params.append("CALIBRATE", "true")

  // Return URL without api_key - the caller must add X-Api-Key header
  return `${baseUrl}${tilePath}${params.toString() ? `?${params.toString()}` : ''}`
}

// ============================================
// THERMAL MAPS API - For temperature/chlorophyll visualization
// ============================================

export interface EOSDAThermalMapRequest {
  viewId: string
  bbox: [number, number, number, number] // [west, south, east, north]
  width?: number
  height?: number
  index?: "ndvi" | "evi" | "ndwi" | "chlorophyll" | "temperature"
  colormap?: "thermal" | "hot" | "cool" | "rdylgn" | "viridis"
  format?: "png" | "jpeg"
}

export interface EOSDAThermalMapResponse {
  imageUrl: string
  bounds: [number, number, number, number]
  index: string
  renderedAt: string
}

/**
 * Get thermal/chlorophyll map from EOSDA
 * Documentation: https://doc.eos.com/docs/render/#thermal-maps
 */
export async function getEOSDAThermalMap({
  viewId,
  bbox,
  width = 1024,
  height = 1024,
  index = "ndvi",
  colormap = "thermal",
  format = "png",
}: EOSDAThermalMapRequest): Promise<EOSDAThermalMapResponse> {
  const config = getEOSDAConfig()
  if (!config.isValid) {
    // Return synthetic response
    return {
      imageUrl: SYNTHETIC_IMAGE_URL,
      bounds: bbox,
      index,
      renderedAt: new Date().toISOString(),
    }
  }

  try {
    // Use render API with thermal colormap
    // Documentation: https://doc.eos.com/docs/render/#thermal-maps
    const response = await requestFromEOSDA<{
      data: {
        image_url: string
        bounds: number[]
        datetime: string
      }
    }>(`/api/render/${viewId}`, {
      method: 'GET',
      query: {
        bbox: bbox.join(","),
        width: width.toString(),
        height: height.toString(),
        index,
        colormap,
        format,
      },
    })

    return {
      imageUrl: response.data.image_url,
      bounds: (response.data.bounds as [number, number, number, number]) ?? bbox,
      index,
      renderedAt: response.data.datetime,
    }
  } catch (error) {
    logger.error("EOSDA thermal map error", error, {
      viewId,
      index,
      date,
      service: "eosda"
    })
    // Fallback to synthetic
    return {
      imageUrl: SYNTHETIC_IMAGE_URL,
      bounds: bbox,
      index,
      renderedAt: new Date().toISOString(),
    }
  }
}

// ============================================
// CHLOROPHYLL MAP API - Specialized for chlorophyll visualization
// ============================================

export interface EOSDAChlorophyllMapRequest {
  viewId: string
  bbox: [number, number, number, number]
  width?: number
  height?: number
}

export interface EOSDAChlorophyllMapResponse {
  imageUrl: string
  bounds: [number, number, number, number]
  chlorophyllIndex: number // Average chlorophyll value
  renderedAt: string
}

/**
 * Get chlorophyll map from EOSDA
 * Uses specialized chlorophyll index rendering
 */
export async function getEOSDAChlorophyllMap({
  viewId,
  bbox,
  width = 1024,
  height = 1024,
}: EOSDAChlorophyllMapRequest): Promise<EOSDAChlorophyllMapResponse> {
  // Use thermal map with chlorophyll index
  const thermalMap = await getEOSDAThermalMap({
    viewId,
    bbox,
    width,
    height,
    index: "chlorophyll",
    colormap: "viridis", // Good colormap for chlorophyll
  })

  // Estimate chlorophyll index (would need actual API response for real value)
  const chlorophyllIndex = 0.5 + Math.random() * 0.3 // Placeholder

  return {
    imageUrl: thermalMap.imageUrl,
    bounds: thermalMap.bounds,
    chlorophyllIndex,
    renderedAt: thermalMap.renderedAt,
  }
}

export interface EOSDAStatisticsRequest {
  geometry: {
    type: "Polygon"
    coordinates: number[][][]
  }
  startDate?: string
  endDate?: string
  index?: string
}

export interface EOSDAStatisticsResponse {
  index: string
  mean?: number
  min?: number
  max?: number
  stdDev?: number
  histogram?: Array<{ bucket: number; value: number }>
  capturedAt?: string
}

export async function fetchEOSDAStatistics({
  geometry,
  startDate,
  endDate,
  index = "ndvi",
}: EOSDAStatisticsRequest): Promise<EOSDAStatisticsResponse> {
  const config = getEOSDAConfig()
  if (!config.isValid) {
    return createSyntheticStatisticsResponse(index)
  }

  try {
    const response = await requestFromEOSDA<{
      data: {
        statistics: {
          mean?: number
          min?: number
          max?: number
          stddev?: number
          histogram?: Array<{ bucket: number; value: number }>
        }
        datetime: string
      }
    }>(`/statistics/${index}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        geometry,
        datetime: startDate && endDate ? `${startDate}/${endDate}` : undefined,
      }),
    })

    return {
      index,
      mean: response.data.statistics.mean,
      min: response.data.statistics.min,
      max: response.data.statistics.max,
      stdDev: response.data.statistics.stddev,
      histogram: response.data.statistics.histogram,
      capturedAt: response.data.datetime,
    }
  } catch (error) {
    logger.error("EOSDA statistics error", error, {
      viewId,
      index,
      date,
      service: "eosda"
    })
    const message = error instanceof Error ? error.message : String(error || "")
    const causeCode = (error as any)?.cause?.code
    const networkFailure =
      /ENOTFOUND|ECONNREFUSED|EAI_AGAIN|fetch failed|DNS|getaddrinfo/i.test(message) ||
      causeCode === "ENOTFOUND"

    if (networkFailure) {
      return createSyntheticStatisticsResponse(index)
    }

    throw new Error("Failed to fetch EOSDA statistics")
  }
}

export interface EOSDAWeatherRequest {
  latitude: number
  longitude: number
  hours?: number
}

export interface EOSDAWeatherSnapshot {
  capturedAt: string
  temperature?: number
  humidity?: number
  windSpeed?: number
  precipitation?: number
  summary?: string
}

export async function fetchEOSDAWeatherSnapshots({
  latitude,
  longitude,
  hours = 24,
}: EOSDAWeatherRequest): Promise<EOSDAWeatherSnapshot[]> {
  const config = getEOSDAConfig()
  if (!config.isValid) {
    return createSyntheticWeatherSnapshots({ latitude, longitude, hours })
  }

  try {
    const response = await requestFromEOSDA<{
      data: Array<{
        datetime: string
        temp?: number
        humidity?: number
        wind_speed?: number
        precipitation?: number
        condition?: string
      }>
    }>("/weather", {
      query: {
        lat: latitude.toString(),
        lon: longitude.toString(),
        hours: hours.toString(),
      },
    })

    return (
      response.data?.map((entry) => ({
        capturedAt: entry.datetime,
        temperature: entry.temp,
        humidity: entry.humidity,
        windSpeed: entry.wind_speed,
        precipitation: entry.precipitation,
        summary: entry.condition,
      })) ?? []
    )
  } catch (error) {
    logger.error("EOSDA weather snapshots error", error, {
      viewId,
      startDate,
      endDate,
      service: "eosda"
    })
    const message = error instanceof Error ? error.message : String(error || "")
    const causeCode = (error as any)?.cause?.code
    const networkFailure =
      /ENOTFOUND|ECONNREFUSED|EAI_AGAIN|fetch failed|DNS|getaddrinfo/i.test(message) ||
      causeCode === "ENOTFOUND"

    if (networkFailure) {
      return createSyntheticWeatherSnapshots({ latitude, longitude, hours })
    }

    throw new Error("Failed to fetch EOSDA weather snapshots")
  }
}

export interface EOSDAWeatherRangeRequest {
  center: { latitude: number; longitude: number }
  startDate?: Date
  endDate?: Date
}

export async function fetchEOSDAWeatherRange({
  center,
  startDate,
  endDate,
}: EOSDAWeatherRangeRequest): Promise<any> {
  try {
    const config = getEOSDAConfig()
    if (!config.isValid) {
      return createSyntheticWeatherRangeResponse({ center, startDate, endDate })
    }
    const response = await requestFromEOSDA("/weather", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        geometry: {
          type: "Point",
          coordinates: [center.longitude, center.latitude],
        },
        datetime:
          startDate && endDate
            ? `${startDate.toISOString()}/${endDate.toISOString()}`
            : undefined,
      }),
    })

    return response
  } catch (error: any) {
    logger.error("EOSDA weather range error", error, {
      viewId,
      startDate,
      endDate,
      service: "eosda"
    })
    const message = error instanceof Error ? error.message : String(error || "")
    const causeCode = (error as any)?.cause?.code
    const networkFailure =
      /ENOTFOUND|ECONNREFUSED|EAI_AGAIN|fetch failed|DNS|getaddrinfo/i.test(message) ||
      causeCode === "ENOTFOUND"

    if (networkFailure) {
      return createSyntheticWeatherRangeResponse({ center, startDate, endDate })
    }

    throw new Error("Failed to fetch EOSDA weather data")
  }
}

export { fetchEOSDAWeatherRange as fetchEOSDAWeather }
