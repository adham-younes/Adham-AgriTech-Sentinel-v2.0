export const runtime = "nodejs"
import { NextResponse } from 'next/server'
import { fetchEOSDASatelliteImage } from '@/lib/services/eosda'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { latitude, longitude, width = 640, height = 480, startDate, endDate, cloudCoverage } = body || {}

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json({ error: 'latitude and longitude are required' }, { status: 400 })
    }

    const data = await fetchEOSDASatelliteImage({
      center: { latitude, longitude },
      size: { width, height },
      startDate,
      endDate,
      cloudCoverage,
    })

    return NextResponse.json({
      url: data.url,
      bounds: data.bounds,
      capturedAt: data.capturedAt,
      cloudCoverage: data.cloudCoverage,
      resolution: data.resolution,
      source: data.source,
    })
  } catch (error: any) {
    console.error('[EOSDA] Image endpoint error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to fetch image' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lat = Number(searchParams.get('lat'))
  const lng = Number(searchParams.get('lng'))
  const width = Number(searchParams.get('width') || '640')
  const height = Number(searchParams.get('height') || '480')

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: 'lat and lng query params are required' }, { status: 400 })
  }

  return POST(new Request(req.url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ latitude: lat, longitude: lng, width, height }),
  }))
}

