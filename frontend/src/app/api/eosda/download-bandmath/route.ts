import { NextRequest, NextResponse } from 'next/server'

const EOSDA_API_KEY = process.env.EOSDA_API_KEY || process.env.NEXT_PUBLIC_EOSDA_API_KEY
const EOSDA_BASE_URL = process.env.EOSDA_API_BASE_URL || 'https://api-connect.eos.com'

/**
 * POST /api/eosda/download-bandmath
 * Step 1: Create bandmath download task (returns GeoTIFF)
 */
export async function POST(request: NextRequest) {
    try {
        if (!EOSDA_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'EOSDA API key not configured' },
                { status: 500 }
            )
        }

        const body = await request.json()
        const {
            viewId,
            bmType,
            geometry,
            nameAlias,
            reference
        } = body

        if (!viewId || !bmType || !geometry || !reference) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required parameters: viewId, bmType, geometry, reference'
                },
                { status: 400 }
            )
        }

        const payload = {
            type: 'bandmath',
            params: {
                view_id: viewId,
                bm_type: bmType,
                geometry,
                name_alias: nameAlias,
                reference
            }
        }

        console.log('[EOSDA Bandmath] Creating task:', JSON.stringify(payload, null, 2))

        const createTaskUrl = `${EOSDA_BASE_URL}/api/gdw/api?api_key=${EOSDA_API_KEY}`
        const createResponse = await fetch(createTaskUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        if (!createResponse.ok) {
            const errorText = await createResponse.text()
            console.error('[EOSDA Bandmath] Task creation failed:', errorText)
            return NextResponse.json(
                {
                    success: false,
                    error: `Failed to create bandmath task: ${createResponse.status}`,
                    details: errorText
                },
                { status: createResponse.status }
            )
        }

        const taskData = await createResponse.json()
        console.log('[EOSDA Bandmath] Task created:', taskData)

        return NextResponse.json({
            success: true,
            taskId: taskData.task_id,
            status: taskData.status,
            timeout: taskData.task_timeout
        })

    } catch (error) {
        console.error('[EOSDA Bandmath] Error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            },
            { status: 500 }
        )
    }
}

/**
 * GET /api/eosda/download-bandmath?taskId=xxx
 * Step 2: Check task status and download GeoTIFF
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
        const taskId = searchParams.get('taskId')

        if (!taskId) {
            return NextResponse.json(
                { success: false, error: 'Missing taskId parameter' },
                { status: 400 }
            )
        }

        console.log('[EOSDA Bandmath] Checking task status:', taskId)

        const checkUrl = `${EOSDA_BASE_URL}/api/gdw/api/${taskId}`
        const checkResponse = await fetch(checkUrl, {
            method: 'GET',
            headers: {
                'x-api-key': EOSDA_API_KEY,
            },
        })

        if (!checkResponse.ok) {
            const errorText = await checkResponse.text()
            console.error('[EOSDA Bandmath] Status check failed:', errorText)
            return NextResponse.json(
                {
                    success: false,
                    error: `Failed to check task status: ${checkResponse.status}`,
                    details: errorText
                },
                { status: checkResponse.status }
            )
        }

        const statusData = await checkResponse.json()
        console.log('[EOSDA Bandmath] Task status:', statusData)

        // If task is completed and has a download URL, return the file
        if (statusData.status === 'completed' && statusData.result_url) {
            const fileResponse = await fetch(statusData.result_url)

            if (!fileResponse.ok) {
                return NextResponse.json({
                    success: false,
                    error: 'Failed to download file from result URL'
                }, { status: 500 })
            }

            const fileBuffer = await fileResponse.arrayBuffer()
            const contentType = fileResponse.headers.get('content-type') || 'image/tiff'

            return new NextResponse(fileBuffer, {
                headers: {
                    'Content-Type': contentType,
                    'Content-Disposition': `attachment; filename="bandmath-${taskId}.tif"`,
                    'Cache-Control': 'public, max-age=31536000, immutable',
                },
            })
        }

        // Return task status for pending/processing/failed
        return NextResponse.json({
            success: true,
            status: statusData.status,
            taskId: taskId,
            ...(statusData.error && { error: statusData.error }),
            ...(statusData.result_url && { resultUrl: statusData.result_url })
        })

    } catch (error) {
        console.error('[EOSDA Bandmath] Error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            },
            { status: 500 }
        )
    }
}
