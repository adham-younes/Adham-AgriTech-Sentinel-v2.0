export const runtime = "nodejs"
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const sp = url.searchParams

    const viewId = sp.get('viewId')
    const bands = sp.get('bands') || 'B04,B03,B02'
    const z = sp.get('z') || '10'
    const x = sp.get('x')
    const y = sp.get('y')
    const width = sp.get('width') || '1024'
    const height = sp.get('height') || '1024'
    const calibrate = sp.get('calibrate') || undefined
    const colormap = sp.get('colormap') || undefined
    const minmax = sp.get('minmax') || undefined

    if (!viewId || !x || !y) {
      return NextResponse.json({ error: 'Missing required params: viewId, x, y' }, { status: 400 })
    }

    // Build EOSDA Connect render URL
    const mode = (process.env.EOSDA_API_MODE || '').trim().toLowerCase()
    const defaultBase = mode === 'connect' ? 'https://api.eosda.com' : (process.env.EOSDA_API_BASE_URL || 'https://api-connect.eos.com')
    const base = (process.env.EOSDA_API_BASE_URL || defaultBase).replace(/\/+$/, '')

    const qs: string[] = []
    // TILE_SIZE might not be supported in Render API Z/X/Y requests, usually it's 256x256 or 512x512 standard
    // But we can pass other params
    if (calibrate) qs.push(`CALIBRATE=${encodeURIComponent(calibrate)}`)
    if (colormap) qs.push(`COLORMAP=${encodeURIComponent(colormap)}`)
    if (minmax) qs.push(`MIN_MAX=${encodeURIComponent(minmax)}`)

    const target = `${base}/api/render/${encodeURIComponent(viewId)}/${encodeURIComponent(bands)}/${encodeURIComponent(z)}/${encodeURIComponent(x)}/${encodeURIComponent(y)}?${qs.join('&')}`

    const apiKey = (process.env.EOSDA_API_KEY || '').trim()
    if (!apiKey) {
      return NextResponse.json({ error: 'EOSDA API key not configured' }, { status: 503 })
    }

    const upstream = await fetch(target, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'X-Api-Key': apiKey,
        'Accept': 'image/*,application/octet-stream',
      },
      cache: 'no-store',
    })

    if (!upstream.ok) {
      const text = await upstream.text()
      return NextResponse.json({ error: 'Upstream render failed', status: upstream.status, details: text }, { status: 502 })
    }

    const contentType = upstream.headers.get('content-type') || 'image/png'
    const buf = await upstream.arrayBuffer()
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Proxy failed' }, { status: 500 })
  }
}

