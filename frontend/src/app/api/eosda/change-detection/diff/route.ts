import { NextRequest, NextResponse } from "next/server"
import { getChangeDetectionTileUrl } from "@/lib/services/change-detection"
import { logger } from "@/lib/utils/logger"

export const runtime = "nodejs"

/**
 * POST /api/eosda/change-detection/diff
 * Get the tile URL template for a difference map
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { viewId1, viewId2, index = "NDVI" } = body

        if (!viewId1 || !viewId2) {
            return NextResponse.json(
                { success: false, error: "Both viewId1 and viewId2 are required" },
                { status: 400 }
            )
        }

        const tileUrl = getChangeDetectionTileUrl(viewId1, viewId2, index)

        return NextResponse.json({
            success: true,
            tileUrl,
            legend: {
                min: -1,
                max: 1,
                colors: [
                    { value: -1, color: "#ef4444", label: "Decline" }, // Red
                    { value: 0, color: "#eab308", label: "No Change" }, // Yellow
                    { value: 1, color: "#22c55e", label: "Growth" }  // Green
                ]
            }
        })

    } catch (error) {
        logger.error("Change detection diff error", { error })

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to generate difference map"
            },
            { status: 500 }
        )
    }
}
