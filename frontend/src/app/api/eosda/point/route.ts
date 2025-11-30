import { NextRequest, NextResponse } from 'next/server'

const EOSDA_API_KEY = process.env.EOSDA_API_KEY || process.env.NEXT_PUBLIC_EOSDA_API_KEY
const EOSDA_BASE_URL = process.env.EOSDA_API_BASE_URL || 'https://api-connect.eos.com'

/**
 * GET /api/eosda/point
 * Get value of a spectral index or band at specific coordinates
 */
export async function GET(request: NextRequest) {
    try {
        if (!EOSDA_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'EOSDA API key not configured' },
                { status: 500 }
            )
        }

        const { searchParams } = new URL(request.url)
        const lat = searchParams.get('lat')
        const lon = searchParams.get('lon')
        const viewId = searchParams.get('viewId')
        const band = searchParams.get('band') || 'NDVI'

        if (!lat || !lon || !viewId) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters: lat, lon, viewId' },
                { status: 400 }
            )
        }

        // Parse sensor and scene ID from viewId (e.g., "S2/13/R/EL/2023/7/19/0")
        // API format: /api/render/<sensor>/point/<scene>/<bands>/<lat>/<lon>
        const parts = viewId.split('/')
        const sensor = parts[0]
        // Scene ID is the rest of the path joined, or sometimes specific format depending on sensor
        // For Sentinel-2 (S2), scene_id is often constructed by removing sensor prefix
        // But the docs say: "scene_id is constructed by removing the short-name-of-the-sensor prefix from the view_id"
        // Example: view_id "S2/13/R/EL/2023/7/19/0" -> scene_id "13/R/EL/2023/7/19/0"

        // However, the point API example shows: /api/render/S2/point/55/G/EP/2016/7/19/0/...
        // So we can likely use the viewId parts directly after the sensor.

        const sceneId = parts.slice(1).join('/')

        const url = `${EOSDA_BASE_URL}/api/render/${sensor}/point/${sceneId}/${band}/${lat}/${lon}?CALIBRATE=1&api_key=${EOSDA_API_KEY}`

        console.log('[EOSDA Point] Fetching:', url.replace(EOSDA_API_KEY, '***'))

        const response = await fetch(url)

        if (!response.ok) {
            const errorText = await response.text()
            console.error('[EOSDA Point] Failed:', errorText)
            return NextResponse.json(
                { success: false, error: `EOSDA API Error: ${response.status}`, details: errorText },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json({ success: true, data })

    } catch (error) {
        console.error('[EOSDA Point] Error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            },
            { status: 500 }
        )
    }
}
