import { NextRequest, NextResponse } from "next/server"
import { analyzeVegetationChange } from "@/lib/services/change-detection"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/utils/logger"

export const runtime = "nodejs"

/**
 * POST /api/eosda/change-detection/analyze
 * Calculate statistical change and optionally create an alert
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { fieldId, date1, date2, index = "NDVI", createAlert = false } = body

        if (!fieldId || !date1 || !date2) {
            return NextResponse.json(
                { success: false, error: "Field ID and both dates are required" },
                { status: 400 }
            )
        }

        // Get field geometry
        const supabase = createClient()
        const { data: field, error: fieldError } = await supabase
            .from("fields")
            .select("geom")
            .eq("id", fieldId)
            .single()

        if (fieldError || !field) {
            return NextResponse.json(
                { success: false, error: "Field not found" },
                { status: 404 }
            )
        }

        // Analyze change
        const result = await analyzeVegetationChange(
            fieldId,
            field.geom,
            date1,
            date2,
            index
        )

        // Create alert if requested and significant
        let alertId = undefined
        if (createAlert && result.isSignificant) {
            const { data: alert, error: alertError } = await supabase
                .from("change_alerts")
                .insert({
                    field_id: fieldId,
                    baseline_date: date1,
                    comparison_date: date2,
                    change_percentage: result.changePercentage,
                    change_type: result.changeType,
                    vegetation_index: index,
                    status: "unread"
                })
                .select()
                .single()

            if (!alertError && alert) {
                alertId = alert.id
            }
        }

        return NextResponse.json({
            success: true,
            ...result,
            alertId
        })

    } catch (error) {
        logger.error("Change detection analysis error", { error })

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to analyze change"
            },
            { status: 500 }
        )
    }
}
