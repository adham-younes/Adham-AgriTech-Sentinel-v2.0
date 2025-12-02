import { NextRequest, NextResponse } from "next/server"
import { getVegetationMapStatus } from "@/lib/services/zoning"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/utils/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/eosda/zoning/status/[mapId]
 * Get the status and results of a productivity map
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { mapId: string } }
) {
    try {
        const { mapId } = params

        if (!mapId) {
            return NextResponse.json(
                { success: false, error: "Map ID is required" },
                { status: 400 }
            )
        }

        // Get from database
        const supabase = createClient()
        const { data: productivityMap, error: dbError } = await supabase
            .from("productivity_maps")
            .select(`
        *,
        fields!inner (
          id,
          name,
          farms!inner (
            id,
            user_id
          )
        )
      `)
            .eq("id", mapId)
            .single()

        if (dbError || !productivityMap) {
            return NextResponse.json(
                { success: false, error: "Productivity map not found" },
                { status: 404 }
            )
        }

        // If already completed, return cached data
        if (productivityMap.status === "completed" && productivityMap.zones) {
            return NextResponse.json({
                success: true,
                status: "completed",
                zones: productivityMap.zones,
                shapefileUrl: productivityMap.shapefile_url,
                createdAt: productivityMap.created_at
            })
        }

        // If failed, return error
        if (productivityMap.status === "failed") {
            return NextResponse.json({
                success: false,
                status: "failed",
                error: productivityMap.error_message || "Map generation failed"
            })
        }

        // Still processing - fetch latest from EOSDA
        const result = await getVegetationMapStatus(
            productivityMap.field_id,
            productivityMap.zmap_id
        )

        // Update database with latest status
        if (result.status === "completed") {
            await supabase
                .from("productivity_maps")
                .update({
                    status: "completed",
                    zones: result.zones,
                    shapefile_url: result.shapefile_download_url
                })
                .eq("id", mapId)
        } else if (result.status === "failed") {
            await supabase
                .from("productivity_maps")
                .update({
                    status: "failed",
                    error_message: result.error
                })
                .eq("id", mapId)
        }

        return NextResponse.json({
            success: true,
            status: result.status,
            zones: result.zones,
            shapefileUrl: result.shapefile_download_url,
            createdAt: result.created_at,
            error: result.error
        })

    } catch (error) {
        logger.error("Zoning API status error", { error, mapId: params.mapId })

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to get map status"
            },
            { status: 500 }
        )
    }
}
