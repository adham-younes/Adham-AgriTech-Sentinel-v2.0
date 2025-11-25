import { NextResponse } from "next/server"

import {
  isEOSDAConfigured,
  searchEOSDAScenes,
  renderEOSDAImagery,
  fetchEOSDAStatistics,
} from "@/lib/services/eosda"
import { upsertFieldImagerySnapshot } from "@/lib/maps/field-imagery-cache"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

const FEDDAN_PER_HECTARE = 2.381
const FEDDAN_IN_SQUARE_METERS = 4200
const EARTH_RADIUS_LAT_METERS = 111_320

type FieldGeometryRow = {
  boundary_coordinates?: unknown
  centroid?: unknown
  latitude?: number | string | null
  longitude?: number | string | null
  area?: number | string | null
  // area_hectares may not exist; keep optional to compute when present
  area_hectares?: number | string | null
  farms?: {
    latitude?: number | string | null
    longitude?: number | string | null
  } | null
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

function parseCentroid(row: FieldGeometryRow): [number, number] | null {
  const centroid = row.centroid
  if (centroid) {
    if (Array.isArray(centroid) && centroid.length >= 2) {
      const lng = parseNumber(centroid[0])
      const lat = parseNumber(centroid[1])
      if (lng != null && lat != null) return [lng, lat]
    }

    if (typeof centroid === "object" && centroid !== null) {
      const coordinates = (centroid as any).coordinates
      if (Array.isArray(coordinates) && coordinates.length >= 2) {
        const lng = parseNumber(coordinates[0])
        const lat = parseNumber(coordinates[1])
        if (lng != null && lat != null) return [lng, lat]
      }
      const lng = parseNumber((centroid as any).longitude)
      const lat = parseNumber((centroid as any).latitude)
      if (lng != null && lat != null) return [lng, lat]
    }
  }

  const lat = parseNumber(row.latitude)
  const lng = parseNumber(row.longitude)
  if (lng != null && lat != null) return [lng, lat]

  const farmLat = parseNumber(row.farms?.latitude)
  const farmLng = parseNumber(row.farms?.longitude)
  if (farmLng != null && farmLat != null) return [farmLng, farmLat]

  return null
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

function polygonToGeoJSON(polygon: [number, number][]) {
  return {
    type: "Polygon" as const,
    coordinates: [polygon],
  }
}

function computeBBox(polygon: [number, number][]): [number, number, number, number] {
  let minLng = Number.POSITIVE_INFINITY
  let minLat = Number.POSITIVE_INFINITY
  let maxLng = Number.NEGATIVE_INFINITY
  let maxLat = Number.NEGATIVE_INFINITY

  polygon.forEach(([lng, lat]) => {
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  })

  return [minLng, minLat, maxLng, maxLat]
}

export async function POST(request: Request) {
  if (!isEOSDAConfigured()) {
    return NextResponse.json({ error: "EOSDA integration not configured" }, { status: 503 })
  }

  let payload: { fieldId?: string; polygon?: [number, number][]; index?: string } | null = null

  try {
    payload = await request.json()
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  let polygon = payload?.polygon ?? null
  let center: [number, number] | null = null
  let supabaseClient: Awaited<ReturnType<typeof createSupabaseServerClient>> | null = null

  if (!polygon && payload?.fieldId) {
    try {
      supabaseClient = await createSupabaseServerClient()
      const { data, error } = await supabaseClient
        .from("fields")
        .select(
          "boundary_coordinates, centroid, latitude, longitude, area, farms(latitude, longitude)",
        )
        .eq("id", payload.fieldId)
        .maybeSingle()

      if (error) {
        console.error("[EOSDA] Unable to load field geometry:", error)
      } else if (data) {
        center = parseCentroid(data as FieldGeometryRow)
        const areaHectares =
          // if area_hectares field exists use it; otherwise treat 'area' as feddans and convert
          ("area_hectares" in (data as any) && parseNumber((data as any).area_hectares)) ||
          (parseNumber((data as FieldGeometryRow).area) != null
            ? (parseNumber((data as FieldGeometryRow).area) as number) / 2.381
            : null)
        const areaFeddan = hectaresToFeddan(areaHectares)
        polygon =
          parsePolygonCoordinates((data as FieldGeometryRow).boundary_coordinates) ??
          (center ? generateFallbackPolygon(center, areaFeddan) : null)
      }
    } catch (error) {
      console.error("[EOSDA] Supabase geometry lookup failed:", error)
    }
  }

  if (!polygon || polygon.length < 4) {
    return NextResponse.json({ error: "Polygon coordinates required" }, { status: 400 })
  }

  if (!center) {
    const lngAverage = polygon.reduce((sum, point) => sum + point[0], 0) / polygon.length
    const latAverage = polygon.reduce((sum, point) => sum + point[1], 0) / polygon.length
    center = [lngAverage, latAverage]
  }

  const geometry = polygonToGeoJSON(polygon)
  const bbox = computeBBox(polygon)

  try {
    const scenes = await searchEOSDAScenes({
      geometry,
      limit: 3,
      cloudCoverMax: 25,
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      endDate: new Date().toISOString(),
    })

    if (!scenes.length) {
      return NextResponse.json({ error: "No satellite scenes available" }, { status: 404 })
    }

    const scene = scenes[0]
    const render = await renderEOSDAImagery({
      sceneId: scene.id,
      bbox: scene.bounds ?? bbox,
      width: 1024,
      height: 1024,
      index: payload?.index ?? "ndvi",
      colormap: "rdylgn",
    })

    const statistics = await fetchEOSDAStatistics({
      geometry,
      startDate: scene.datetime,
      endDate: scene.datetime,
      index: payload?.index ?? "ndvi",
    })

    let snapshot = null

    if (payload?.fieldId) {
      try {
        if (!supabaseClient) {
          supabaseClient = await createSupabaseServerClient()
        }
        snapshot = await upsertFieldImagerySnapshot(
          {
            fieldId: payload.fieldId,
            sceneId: scene.id,
            imageUrl: render.imageUrl,
            bounds: render.bounds,
            index: payload?.index ?? "ndvi",
            capturedAt: scene.datetime,
            provider: scene.platform,
            cloudCover: scene.cloudCover,
            statistics: {
              index: payload?.index ?? "ndvi",
              mean: statistics.mean,
              min: statistics.min,
              max: statistics.max,
              stdDev: statistics.stdDev,
            },
          },
          { supabase: supabaseClient },
        )
      } catch (error) {
        console.error("[EOSDA] Failed to persist imagery snapshot", error)
      }
    }

    return NextResponse.json(
      {
        fieldId: payload?.fieldId ?? null,
        sceneId: scene.id,
        platform: scene.platform,
        cloudCover: scene.cloudCover,
        capturedAt: scene.datetime,
        imagery: render,
        statistics,
        snapshot,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[EOSDA] imagery route error", error)
    return NextResponse.json({ error: "Failed to fetch imagery" }, { status: 500 })
  }
}
