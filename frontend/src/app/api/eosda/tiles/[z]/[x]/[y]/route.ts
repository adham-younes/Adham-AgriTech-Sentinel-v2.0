/**
 * EOSDA Tiles Proxy
 * 
 * Proxies EOSDA tile requests with X-Api-Key header.
 * MapLibre GL doesn't support custom headers, so we use this proxy.
 * 
 * @module api/eosda/tiles
 */

export const runtime = "nodejs"
import { NextResponse } from 'next/server'

type Params = {
  z: string
  x: string
  y: string
}

export async function GET(
  request: Request,
  context: { params: Params }
) {
  try {
    const { z, x, y } = context.params
    const url = new URL(request.url)
    const layer = url.searchParams.get('layer') || 'sentinel2l2a' // default to true-color
    const base = (process.env.EOSDA_API_BASE_URL || 'https://api-connect.eos.com').replace(/\/+$/, '')
    
    // Build EOSDA LMS tiles URL
    // Format: /api/lms/tiles/v1/{layer}/{z}/{x}/{y}
    const tilePath = `/api/lms/tiles/v1/${layer}/${z}/${x}/${y}`
    const target = `${base}${tilePath}`

    const apiKey = (process.env.EOSDA_API_KEY || process.env.NEXT_PUBLIC_EOSDA_API_KEY || '').trim()
    if (!apiKey) {
      return NextResponse.json({ error: 'EOSDA API key not configured' }, { status: 503 })
    }

    // ✅ EOSDA API requires X-Api-Key header ONLY
    const upstream = await fetch(target, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey, // ✅ Correct format: X-Api-Key header only
        'Accept': 'image/*,application/octet-stream',
      },
      cache: 'no-store',
    })

    if (!upstream.ok) {
      const text = await upstream.text()
      console.error(`[EOSDA Tiles] Upstream failed: ${upstream.status}`, text.substring(0, 200))
      return NextResponse.json(
        { error: 'Upstream tile request failed', status: upstream.status, details: text.substring(0, 200) },
        { status: 502 }
      )
    }

    const contentType = upstream.headers.get('content-type') || 'image/png'
    const buf = await upstream.arrayBuffer()
    
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache tiles for 1 hour
      },
    })
  } catch (error: any) {
    console.error('[EOSDA Tiles] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Tile proxy failed' },
      { status: 500 }
    )
  }
}

