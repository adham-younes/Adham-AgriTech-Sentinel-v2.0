export const runtime = "nodejs"

import { NextResponse } from "next/server"

import {
  fetchSentinelTrueColorImage,
  toBoundsFromCenter,
  toBoundsFromPairs,
  type SentinelBounds,
  isSentinelConfigured,
} from "@/lib/services/sentinel-hub"

type ImageryRequest = {
  bounds?: [number, number][]
  center?: { latitude: number; longitude: number }
  delta?: number
  date?: string
  width?: number
  height?: number
}

function resolveBounds(payload: ImageryRequest): SentinelBounds {
  if (payload.bounds && payload.bounds.length >= 2) {
    return toBoundsFromPairs(payload.bounds as [number, number][])
  }

  if (payload.center) {
    return toBoundsFromCenter(payload.center, payload.delta ?? 0.01)
  }

  throw new Error("bounds or center must be provided")
}

export async function POST(request: Request) {
  try {
    // Fast-fail if Sentinel is intentionally disabled/unconfigured
    if (process.env.DISABLE_SENTINEL === "1" || !isSentinelConfigured()) {
      return NextResponse.json(
        { error: "SENTINEL_NOT_CONFIGURED" },
        { status: 503, headers: { "X-Feature-Disabled": "sentinel" } },
      )
    }

    const payload = (await request.json()) as ImageryRequest
    const bounds = resolveBounds(payload)
    const date = payload.date ?? new Date().toISOString()

    const buffer = await fetchSentinelTrueColorImage({
      bounds,
      date,
      width: payload.width ?? 768,
      height: payload.height ?? 768,
    })

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    })
  } catch (error: any) {
    console.error("[Sentinel] Imagery endpoint failed", error)
    return NextResponse.json(
      { error: error?.message ?? "Failed to fetch Sentinel imagery" },
      { status: 500 },
    )
  }
}
