import { NextRequest, NextResponse } from 'next/server'

const EOSDA_API_KEY = process.env.EOSDA_API_KEY || process.env.NEXT_PUBLIC_EOSDA_API_KEY
const EOSDA_BASE_URL = process.env.EOSDA_API_BASE_URL || 'https://api-connect.eos.com'

interface DownloadVisualParams {
    viewId: string
    bmType: string
    geometry: {
        type: 'Polygon'
        coordinates: number[][][]
    }
    pxSize: number
    format?: 'jpeg' | 'tiff' | 'png'
    colormap?: string
    levels?: string
    calibrate?: 0 | 1
    reference: string
}

interface TaskStatusResponse {
    status: 'pending' | 'processing' | 'completed' | 'failed'
    task_id: string
    req_id: string
    task_timeout: number
    result_url?: string
    error?: string
}

/**
 * POST /api/eosda/download-visual
 * Step 1: Create a download task
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
            pxSize,
            format = 'png',
            colormap,
            levels,
            calibrate = 1,
            reference
        }: DownloadVisualParams = body

        // Validate required parameters
        if (!viewId || !bmType || !geometry || !pxSize || !reference) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required parameters: viewId, bmType, geometry, pxSize, reference'
                },
                { status: 400 }
            )
        }

        // Create download task
        const downloadPayload = {
            type: format,
            params: {
                view_id: viewId,
                bm_type: bmType,
                geometry,
                px_size: pxSize,
                format,
                reference,
                calibrate,
                ...(colormap && { colormap }),
                ...(levels && { levels })
            }
        }

        console.log('[EOSDA Download Visual] Creating task with payload:', JSON.stringify(downloadPayload, null, 2))

        const createTaskUrl = `${EOSDA_BASE_URL}/api/gdw/api?api_key=${EOSDA_API_KEY}`
        const createResponse = await fetch(createTaskUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(downloadPayload),
        })

        if (!createResponse.ok) {
            const errorText = await createResponse.text()
            console.error('[EOSDA Download Visual] Task creation failed:', errorText)
            return NextResponse.json(
                {
                    success: false,
                    error: `Failed to create download task: ${createResponse.status} ${createResponse.statusText}`,
                    details: errorText
                },
                { status: createResponse.status }
            )
        }

        const taskData: TaskStatusResponse = await createResponse.json()
        console.log('[EOSDA Download Visual] Task created:', taskData)

        return NextResponse.json({
            success: true,
            taskId: taskData.task_id,
            status: taskData.status,
            timeout: taskData.task_timeout
        })

    } catch (error) {
        console.error('[EOSDA Download Visual] Error:', error)
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
 * GET /api/eosda/download-visual?taskId=xxx
 * Step 2: Check task status and get download URL
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

        console.log('[EOSDA Download Visual] Checking task status:', taskId)

        const checkUrl = `${EOSDA_BASE_URL}/api/gdw/api/${taskId}`
        const checkResponse = await fetch(checkUrl, {
            method: 'GET',
            headers: {
                'x-api-key': EOSDA_API_KEY,
            },
        })

        if (!checkResponse.ok) {
            const errorText = await checkResponse.text()
            console.error('[EOSDA Download Visual] Status check failed:', errorText)
            return NextResponse.json(
                {
                    success: false,
                    error: `Failed to check task status: ${checkResponse.status} ${checkResponse.statusText}`,
                    details: errorText
                },
                { status: checkResponse.status }
            )
        }

        const statusData = await checkResponse.json()
        console.log('[EOSDA Download Visual] Task status:', statusData)

        // If task is completed and has a download URL, proxy the image
        if (statusData.status === 'completed' && statusData.result_url) {
            // Fetch the actual image
            const imageResponse = await fetch(statusData.result_url)

            if (!imageResponse.ok) {
                return NextResponse.json({
                    success: false,
                    error: 'Failed to download image from result URL'
                }, { status: 500 })
            }

            const imageBuffer = await imageResponse.arrayBuffer()
            const contentType = imageResponse.headers.get('content-type') || 'image/png'

            // Return the image directly
            return new NextResponse(imageBuffer, {
                headers: {
                    'Content-Type': contentType,
                    'Content-Disposition': `attachment; filename="satellite-image-${taskId}.${contentType.split('/')[1]}"`,
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
        console.error('[EOSDA Download Visual] Error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            },
            { status: 500 }
        )
    }
}
