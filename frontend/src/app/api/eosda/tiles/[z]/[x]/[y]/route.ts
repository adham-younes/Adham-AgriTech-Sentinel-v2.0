/**
 * EOSDA Tiles Proxy with Render API
 * 
 * Proxies EOSDA Render API requests for colormappe d NDVI/NDMI tiles.
 * MapLibre GL doesn't support custom headers, so we use this proxy.
 * 
 * Documentation: https://doc.eos.com/docs/render/
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

// EOSDA Predefined Colormap IDs
const COLORMAP_IDS: Record<string, string> = {
  'ndvi': 'a9bc6eceeef2a13bb88a7f641dca3aa0', // Red-Yellow-Green for NDVI
  'ndmi': 'default_blues', // Blues for moisture
  'evi': 'default_greens', // Greens for EVI
}

export async function GET(
  request: Request,
  context: { params: Params }
) {
  try {
    const { z, x, y } = context.params
    const url = new URL(request.url)
    const sceneID = url.searchParams.get('sceneID') // Required: specific scene to render
    const layer = url.searchParams.get('layer') || 'ndvi' // ndvi, ndmi, evi, sentinel2l2a
    const viewId = url.searchParams.get('viewId') // Alternative to sceneID (from search API)

    const base = (process.env.EOSDA_API_BASE_URL || process.env.NEXT_PUBLIC_EOSDA_API_URL || 'https://api-connect.eos.com').replace(/\/+$/, '')

    // If no sceneID/viewId provided, return transparent tile (map will handle this gracefully)
    if (!sceneID && !viewId) {
      const transparentPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
      return new NextResponse(transparentPng, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache',
          'X-EOSDA-Note': 'No sceneID or viewId provided',
        },
      })
    }

    const identifier = sceneID || viewId

    // Build EOSDA Render API URL
    // Format: /api/render/{viewId}/{bands}/{z}/{x}/{y}?COLORMAP={id}&MIN_MAX={min},{max}
    let bands = 'B04,B03,B02' // True color (default)
    let tilePath = ''

    if (layer === 'ndvi' || layer === 'ndmi' || layer === 'evi') {
      // For vegetation indices, use single-band rendering with colormap
      bands = layer.toUpperCase()
      tilePath = `/api/render/${identifier}/${bands}/${z}/${x}/${y}`

      // Add colormap parameters
      const colormapId = COLORMAP_IDS[layer]
      const params = new URLSearchParams()
      if (colormapId) {
        params.append('COLORMAP', colormapId)
      }
      // NDVI/NDMI/EVI range is typically -1 to 1
      params.append('MIN_MAX', '-1,1')

      if (params.toString()) {
        tilePath += `?${params.toString()}`
      }
    } else {
      // True color or other RGB composite
      tilePath = `/api/render/${identifier}/${bands}/${z}/${x}/${y}`
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
          'X-Api-Key': apiKey,
          'Accept': 'image/*,application/octet-stream',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(15000), // 15 second timeout (render can be slow)
      })

      if (!upstream.ok) {
        const text = await upstream.text().catch(() => 'Unable to read error response')

        // Handle different error types
        if (upstream.status === 429) {
          logger.warn(`[EOSDA Tiles] Rate limited (429)`, {
            z, x, y, layer, sceneID, endpoint: 'GET /api/eosda/tiles',
            retryAfter: upstream.headers.get('Retry-After') || 'unknown'
          })
        } else if (upstream.status === 404) {
          logger.debug(`[EOSDA Tiles] Scene/tile not found (404)`, {
            z, x, y, layer, sceneID, endpoint: 'GET /api/eosda/tiles',
            note: 'Scene may not have this index or tile coordinates invalid'
          })
        } else {
          logger.error(`[EOSDA Tiles] Upstream failed: ${upstream.status}`, new Error(text.substring(0, 200)), {
            z, x, y, layer, sceneID, status: upstream.status, endpoint: 'GET /api/eosda/tiles'
          })
        }

        // Return a transparent 1x1 PNG as fallback
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

      // Log successful tile fetch
      console.log(`✅ EOSDA Tile: ${layer} at ${z}/${x}/${y} (${buf.byteLength} bytes)`)

      return new NextResponse(buf, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600', // Cache tiles for 1 hour
          'X-EOSDA-Layer': layer,
          'X-EOSDA-SceneID': sceneID || viewId || '',
        },
      })
    } catch (fetchError: any) {
      logger.error('[EOSDA Tiles] Fetch error', fetchError, {
        z, x, y, layer, sceneID, endpoint: 'GET /api/eosda/tiles'
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

