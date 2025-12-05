import { NextRequest, NextResponse } from "next/server"
import { createVegetationMap } from "@/lib/services/zoning"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/utils/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/eosda/zoning/create
 * Create a vegetation-based productivity map
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { fieldId, vegetationIndex = "NDVI", zoneQuantity = 5, minZoneArea } = body

        if (!fieldId) {
            return NextResponse.json(
                { success: false, error: "Field ID is required" },
                { status: 400 }
            )
        }

        // Verify user has access to this field
        const supabase = await createClient()
        const { data: field, error: fieldError } = await supabase
            .from("fields")
            .select(`
        id,
        name,
        farms!inner (
          id,
          user_id
        )
      `)
            .eq("id", fieldId)
            .single()

        if (fieldError || !field) {
            return NextResponse.json(
                { success: false, error: "Field not found or access denied" },
                { status: 404 }
            )
        }

        // Create vegetation map via EOSDA
        const { zmapId, taskId } = await createVegetationMap({
            fieldId,
            vegetationIndex,
            zoneQuantity,
            minZoneArea
        })

        // Store in database
        const { data: productivityMap, error: dbError } = await supabase
            .from("productivity_maps")
            .insert({
                field_id: fieldId,
                zmap_id: zmapId,
                vegetation_index: vegetationIndex,
                zone_quantity: zoneQuantity,
                status: "processing"
            })
            .select()
            .single()

        if (dbError) {
            logger.error("Failed to store productivity map", { error: dbError })
            // Continue anyway - we have the zmap_id
        }

        return NextResponse.json({
            success: true,
            zmapId,
            taskId,
            productivityMapId: productivityMap?.id
        })

    } catch (error) {
        logger.error("Zoning API create error", { error })

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to create productivity map"
            },
            { status: 500 }
        )
    }
}
