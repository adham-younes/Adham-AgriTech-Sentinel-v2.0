export const runtime = "nodejs"
import { NextResponse } from "next/server"
import {
  fetchEOSDASatelliteImage,
  fetchEOSDANDVI,
  fetchEOSDAWeather,
  fetchEOSDAWeatherSnapshots,
  fetchEOSDAStatistics,
  isEOSDAConfigured,
} from "@/lib/services/eosda"
import { eosdaPublicConfig } from "@/lib/config/eosda"

function withCache<T>(data: T, ttlSeconds: number) {
  const response = NextResponse.json(data)
  response.headers.set("Cache-Control", `public, s-maxage=${ttlSeconds}, stale-while-revalidate=60`)
  return response
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "satellite"
    const lat = Number.parseFloat(searchParams.get("lat") ?? eosdaPublicConfig.center.lat.toString())
    const lng = Number.parseFloat(searchParams.get("lng") ?? eosdaPublicConfig.center.lng.toString())
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const cloud = Number.parseInt(
      searchParams.get("cloud") ?? eosdaPublicConfig.defaultCloudCoverage.toString(),
      10,
    )
    const width = Number.parseInt(searchParams.get("width") || "1024", 10)
    const height = Number.parseInt(searchParams.get("height") || "1024", 10)
    const index = (searchParams.get("index") || "ndvi").toLowerCase()
    const hours = Number.parseInt(searchParams.get("hours") || "24", 10)

    // Provide a sensible default window (last 14 days) if no dates supplied
    const now = new Date()
    const defaultStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const rangeStartISO = startDate || defaultStart.toISOString()
    const rangeEndISO = endDate || now.toISOString()

    if (!isEOSDAConfigured()) {
      return NextResponse.json({ error: "EOS Data Analytics API is not configured" }, { status: 503 })
    }

    const center = {
      latitude: Number.isFinite(lat) ? lat : eosdaPublicConfig.center.lat,
      longitude: Number.isFinite(lng) ? lng : eosdaPublicConfig.center.lng,
    }

    switch (type) {
      case "satellite": {
        const data = await fetchEOSDASatelliteImage({
          center,
          zoom: 15,
          size: { width: Number.isFinite(width) ? width : 1024, height: Number.isFinite(height) ? height : 1024 },
          startDate: rangeStartISO,
          endDate: rangeEndISO,
          cloudCoverage: Number.isFinite(cloud) ? cloud : eosdaPublicConfig.defaultCloudCoverage,
        })
        return withCache(data, 60 * 60)
      }

      case "ndvi": {
        const data = await fetchEOSDANDVI({
          center,
          startDate: new Date(rangeStartISO),
          endDate: new Date(rangeEndISO)
        })
        return withCache(data, 60 * 60)
      }

      case "weather": {
        const data = await fetchEOSDAWeather({
          center,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        })
        return withCache(data, 10 * 60)
      }

      case "snapshots": {
        const safeHours = Number.isFinite(hours) && hours > 0 ? hours : 24
        const data = await fetchEOSDAWeatherSnapshots({
          latitude: center.latitude,
          longitude: center.longitude,
          hours: safeHours,
        })
        return withCache(data, 10 * 60)
      }

      case "statistics":
      case "stats": {
        const delta = 0.01
        const ring = [
          [center.longitude - delta, center.latitude - delta],
          [center.longitude + delta, center.latitude - delta],
          [center.longitude + delta, center.latitude + delta],
          [center.longitude - delta, center.latitude + delta],
          [center.longitude - delta, center.latitude - delta],
        ]
        const geometry = {
          type: "Polygon" as const,
          coordinates: [ring],
        }
        const stats = await fetchEOSDAStatistics({
          geometry,
          startDate: rangeStartISO,
          endDate: rangeEndISO,
          index,
        })
        return withCache(stats, 60 * 60 * 6)
      }

      default:
        return NextResponse.json(
          { error: "Invalid type parameter. Use: satellite, ndvi, weather, snapshots, or statistics" },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error("EOSDA API error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch data from EOS Data Analytics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, center, startDate, endDate, options } = body

    if (!isEOSDAConfigured()) {
      return NextResponse.json({ error: "EOS Data Analytics API is not configured" }, { status: 503 })
    }

    if (!center || !center.latitude || !center.longitude) {
      return NextResponse.json(
        { error: "Center coordinates (latitude, longitude) are required" },
        { status: 400 },
      )
    }

    switch (type) {
      case "satellite": {
        const data = await fetchEOSDASatelliteImage({
          center,
          zoom: options?.zoom || 15,
          size: options?.size || { width: 1024, height: 1024 },
          startDate,
          endDate,
          cloudCoverage: options?.cloudCoverage ?? eosdaPublicConfig.defaultCloudCoverage,
        })
        return NextResponse.json(data)
      }

      case "ndvi": {
        const data = await fetchEOSDANDVI({
          center,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        })
        return NextResponse.json(data)
      }

      case "weather": {
        const data = await fetchEOSDAWeather({
          center,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        })
        return NextResponse.json(data)
      }

      default:
        return NextResponse.json(
          { error: "Invalid type. Use: satellite, ndvi, or weather" },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error("EOSDA API error:", error)
    return NextResponse.json(
      {
        error: "Failed to process EOS Data Analytics request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
