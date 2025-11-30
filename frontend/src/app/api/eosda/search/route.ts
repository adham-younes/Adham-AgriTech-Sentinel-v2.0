/**
 * EOSDA Scene Search API
 * 
 * Searches for available satellite scenes in a bounding box.
 * This endpoint queries EOSDA's search API to find Sentinel-2 scenes
 * that can be used for rendering tiles.
 * 
 * @module api/eosda/search
 */

export const runtime = "nodejs"
import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'

export async function GET(request: Request) {
    try {
        const url = new URL(request.url)
        const bbox = url.searchParams.get('bbox') // "west,south,east,north"
        const startDate = url.searchParams.get('startDate')
        const endDate = url.searchParams.get('endDate')
        const cloudCoverage = url.searchParams.get('cloudCoverage') || '20'
        const limit = url.searchParams.get('limit') || '10'

        if (!bbox) {
            return NextResponse.json({
                error: 'bbox required',
                message: 'Provide bbox as: west,south,east,north (e.g., 32.5,25.2,32.6,25.3)'
            }, { status: 400 })
        }

        // Validate bbox format
        const bboxParts = bbox.split(',').map(Number)
        if (bboxParts.length !== 4 || bboxParts.some(isNaN)) {
            return NextResponse.json({
                error: 'Invalid bbox format',
                message: 'bbox must be: west,south,east,north (comma-separated numbers)'
            }, { status: 400 })
        }

        const apiKey = (process.env.EOSDA_API_KEY || process.env.NEXT_PUBLIC_EOSDA_API_KEY || '').trim()
        if (!apiKey) {
            logger.warn('[EOSDA Search] API key not configured', { endpoint: 'GET /api/eosda/search' })
            return NextResponse.json({
                error: 'EOSDA API key not configured',
                configured: false
            }, { status: 503 })
        }

        const base = (process.env.EOSDA_API_BASE_URL || process.env.NEXT_PUBLIC_EOSDA_API_URL || 'https://api-connect.eos.com').replace(/\/+$/, '')

        // EOSDA LMS Search V2 endpoint
        const searchUrl = `${base}/api/lms/search/v2/sentinel2`
        const [west, south, east, north] = bboxParts

        // Build search request body for LMS V2
        const body = {
            fields: ["sceneID", "cloudCoverage", "date", "view_id", "dataGeometry", "platform", "thumbnail"],
            limit: Number(limit),
            page: 1,
            search: {
                date: {
                    from: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    to: endDate || new Date().toISOString().split('T')[0]
                },
                cloudCoverage: {
                    from: 0,
                    to: Number(cloudCoverage)
                },
                shapeRelation: "INTERSECTS",
                shape: {
                    type: "Polygon",
                    coordinates: [[
                        [west, north],
                        [east, north],
                        [east, south],
                        [west, south],
                        [west, north],
                    ]]
                }
            },
            sort: { date: "desc" }
        }

        logger.info('[EOSDA Search] Searching scenes (LMS V2)', {
            bbox,
            cloudCoverage,
            endpoint: 'GET /api/eosda/search'
        })

        const response = await fetch(searchUrl, {
            method: 'POST',
            headers: {
                'X-Api-Key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            cache: 'no-store',
            signal: AbortSignal.timeout(15000),
        })

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unable to read error response')
            logger.error('[EOSDA Search] API error', new Error(errorText), {
                status: response.status,
                endpoint: 'GET /api/eosda/search',
                bbox
            })

            return NextResponse.json({
                error: 'Search failed',
                message: `EOSDA API returned ${response.status}`,
                status: response.status,
                details: errorText.substring(0, 200)
            }, { status: response.status })
        }

        const data = await response.json()
        const scenes = data.results || []

        logger.info('[EOSDA Search] Search successful', {
            count: scenes.length,
            endpoint: 'GET /api/eosda/search'
        })

        // Transform scenes to include essential fields
        const transformedScenes = scenes.map((scene: any) => ({
            id: scene.sceneID,
            sceneID: scene.sceneID,
            viewId: scene.view_id,
            date: scene.date,
            cloudCoverage: scene.cloudCoverage,
            satellite: 'Sentinel-2',
            thumbnail: scene.thumbnail,
            bbox: scene.dataGeometry ? {
                // Approximate bbox from geometry if needed, or just pass null
                // For now we don't strictly need it for the UI list
            } : null,
        }))

        return NextResponse.json({
            success: true,
            scenes: transformedScenes,
            count: transformedScenes.length,
            bbox: { west, south, east, north },
            filters: {
                cloudCoverage: Number(cloudCoverage),
                startDate,
                endDate,
            }
        }, {
            headers: {
                'Cache-Control': 'public, max-age=300',
            }
        })

    } catch (error: any) {
        logger.error('[EOSDA Search] Error', error, {
            endpoint: 'GET /api/eosda/search',
            message: error?.message
        })

        return NextResponse.json({
            error: 'Internal server error',
            message: error?.message || 'Unknown error occurred',
            success: false
        }, { status: 500 })
    }
}
