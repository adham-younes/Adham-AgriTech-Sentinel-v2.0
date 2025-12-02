import { NextRequest, NextResponse } from 'next/server'
import { eosdaServerConfig } from '@/lib/config/eosda'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        if (!eosdaServerConfig.apiKey) {
            return NextResponse.json({ error: 'EOSDA API key not configured' }, { status: 500 })
        }

        const body = await req.json()
        const { view_id, geometry, params } = body

        if (!view_id || !geometry || !params) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
        }

        const apiUrl = `${eosdaServerConfig.apiUrl}/api/render/clustering_options?api_key=${eosdaServerConfig.apiKey}`

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                view_id,
                geometry,
                params
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('EOSDA Clustering Error:', errorText)
            return NextResponse.json({ error: `EOSDA API Error: ${response.statusText}`, details: errorText }, { status: response.status })
        }

        const data = await response.json()
        return NextResponse.json(data)

    } catch (error: any) {
        console.error('Clustering API Error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
