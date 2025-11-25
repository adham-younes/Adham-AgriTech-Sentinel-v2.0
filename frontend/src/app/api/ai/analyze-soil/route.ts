import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { image_url, field_id } = await request.json()

        // 1. Get the active soil analysis model
        const { data: model } = await supabase
            .from("ml_models_registry")
            .select("*")
            .eq("model_type", "soil_analysis")
            .eq("is_active", true)
            .single()

        if (!model) {
            return NextResponse.json(
                { error: "No active soil analysis model found" },
                { status: 503 }
            )
        }

        // 2. SIMULATE AI Inference
        // Generate plausible soil values
        const predicted_ph = Number((Math.random() * (7.5 - 6.0) + 6.0).toFixed(2))
        const predicted_nitrogen = Number((Math.random() * (60 - 30) + 30).toFixed(2))
        const predicted_phosphorus = Number((Math.random() * (40 - 15) + 15).toFixed(2))
        const predicted_potassium = Number((Math.random() * (250 - 150) + 150).toFixed(2))
        const predicted_moisture = Number((Math.random() * (45 - 20) + 20).toFixed(2))
        const confidence = (Math.random() * (0.98 - 0.90) + 0.90) * 100

        // 3. Store the analysis
        const { data: analysis, error } = await supabase
            .from("ai_soil_analysis")
            .insert({
                user_id: (await supabase.auth.getUser()).data.user?.id,
                field_id,
                image_url,
                predicted_ph,
                predicted_nitrogen,
                predicted_phosphorus,
                predicted_potassium,
                predicted_moisture,
                confidence_score: confidence,
                model_version: model.model_version
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({
            success: true,
            data: {
                analysis,
                model: {
                    name: model.model_name,
                    version: model.model_version
                }
            }
        })

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}
