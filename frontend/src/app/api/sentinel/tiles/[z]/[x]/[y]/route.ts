export const runtime = "nodejs"

import { NextResponse } from "next/server"

import { fetchSentinelTile, isSentinelConfigured } from "@/lib/services/sentinel-hub"

type Params = {
  z: string
  x: string
  y: string
}

export async function GET(request: Request, context: { params: Params }) {
  if (process.env.DISABLE_SENTINEL === "1" || !isSentinelConfigured()) {
    return NextResponse.json(
      { error: "SENTINEL_NOT_CONFIGURED" },
      { status: 503, headers: { "X-Feature-Disabled": "sentinel" } },
    )
  }
  const { z, x, y } = context.params
  const url = new URL(request.url)
  const tileMatrixSet = url.searchParams.get("tileMatrixSet") ?? "PopularWebMercator512"
  const layer = url.searchParams.get("layer") ?? "SENTINEL-2-L2A"
  const format = url.searchParams.get("format") ?? "image/png"
  const style = url.searchParams.get("style") ?? "default"
  const timeRange = url.searchParams.get("time") ?? undefined

  try {
    const buffer = await fetchSentinelTile({
      tileMatrixSet,
      tileMatrix: z,
      tileCol: x,
      tileRow: y,
      layer,
      format,
      style,
      timeRange,
    })

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": format,
        "Cache-Control": "public, max-age=60",
      },
    })
  } catch (error: any) {
    console.error("[Sentinel] Tile endpoint failed", error)
    return NextResponse.json(
      { error: error?.message ?? "Failed to fetch Sentinel tile" },
      { status: 502 },
    )
  }
}
