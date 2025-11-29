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
import { logger } from '@/lib/utils/logger'

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
    const colormap = url.searchParams.get('colormap') || undefined // For thermal maps: rdylgn, viridis, blues, etc.
    const minmax = url.searchParams.get('minmax') || undefined // Min/max values for colormap
    const base = (process.env.EOSDA_API_BASE_URL || process.env.NEXT_PUBLIC_EOSDA_API_URL || 'https://api-connect.eos.com').replace(/\/+$/, '')
    
    // Build EOSDA LMS tiles URL with colormap support for thermal visualization
    // Format: /api/lms/tiles/v1/{layer}/{z}/{x}/{y}
    // Note: Some layers may not exist for all zoom levels/coordinates - handle 404 gracefully
    let tilePath = `/api/lms/tiles/v1/${layer}/${z}/${x}/${y}`
    
    // Add colormap parameters for thermal maps
    const params = new URLSearchParams()
    if (colormap) params.append('COLORMAP', colormap)
    if (minmax) params.append('MIN_MAX', minmax)
    if (params.toString()) {
      tilePath += `?${params.toString()}`
    }
    
    const target = `${base}${tilePath}`

    const apiKey = (process.env.EOSDA_API_KEY || process.env.NEXT_PUBLIC_EOSDA_API_KEY || '').trim()
    if (!apiKey) {
      logger.warn('[EOSDA Tiles] API key not configured', { z, x, y, layer, endpoint: 'GET /api/eosda/tiles' })
      return NextResponse.json({ error: 'EOSDA API key not configured' }, { status: 503 })
    }

    // ✅ EOSDA API requires X-Api-Key header ONLY
    try {
      const upstream = await fetch(target, {
        method: 'GET',
        headers: {
          'X-Api-Key': apiKey, // ✅ Correct format: X-Api-Key header only
          'Accept': 'image/*,application/octet-stream',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (!upstream.ok) {
        const text = await upstream.text().catch(() => 'Unable to read error response')
        
        // Handle different error types
        if (upstream.status === 429) {
          // Rate limit - log but return transparent tile (client will retry)
          logger.warn(`[EOSDA Tiles] Rate limited (429)`, {
            z, x, y, layer, endpoint: 'GET /api/eosda/tiles',
            retryAfter: upstream.headers.get('Retry-After') || 'unknown'
          })
        } else if (upstream.status === 404) {
          // Endpoint doesn't exist - likely layer/coordinates not available
          logger.debug(`[EOSDA Tiles] Endpoint not found (404)`, {
            z, x, y, layer, endpoint: 'GET /api/eosda/tiles',
            note: 'Layer may not be available for these coordinates/zoom level'
          })
        } else {
          // Other errors
          logger.error(`[EOSDA Tiles] Upstream failed: ${upstream.status}`, new Error(text.substring(0, 200)), {
            z, x, y, layer, status: upstream.status, endpoint: 'GET /api/eosda/tiles'
          })
        }
        
        // Return a transparent 1x1 PNG as fallback instead of error
        const transparentPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
        return new NextResponse(transparentPng, {
          status: 200,
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'no-cache',
            'X-EOSDA-Error': `Upstream failed: ${upstream.status}`,
            'X-EOSDA-Error-Type': upstream.status === 429 ? 'rate_limit' : upstream.status === 404 ? 'not_found' : 'error',
          },
        })
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
    } catch (fetchError: any) {
      logger.error('[EOSDA Tiles] Fetch error', fetchError, {
        z, x, y, layer, endpoint: 'GET /api/eosda/tiles'
      })
      // Return transparent PNG as fallback
      const transparentPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
      return new NextResponse(transparentPng, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache',
          'X-EOSDA-Error': fetchError?.message || 'Network error',
        },
      })
    }
  } catch (error: any) {
    logger.error('[EOSDA Tiles] Error', error, {
      endpoint: 'GET /api/eosda/tiles'
    })
    // Return transparent PNG as fallback
    const transparentPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
    return new NextResponse(transparentPng, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache',
        'X-EOSDA-Error': error?.message || 'Tile proxy failed',
      },
    })
  }
}

