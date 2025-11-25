import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { image_url, field_id, notes } = await request.json()

        // 1. Get the active disease detection model
        const { data: model } = await supabase
            .from("ml_models_registry")
            .select("*")
            .eq("model_type", "disease_detection")
            .eq("is_active", true)
            .single()

        if (!model) {
            return NextResponse.json(
                { error: "No active disease detection model found" },
                { status: 503 }
            )
        }

        // 2. SIMULATE AI Inference (In a real app, this would call a Python service)
        // We will pick a random disease to simulate a detection
        const { data: diseases } = await supabase.from("diseases").select("id, name_en, name_ar")

        if (!diseases || diseases.length === 0) {
            return NextResponse.json({ error: "No diseases in database" }, { status: 500 })
        }

        const randomDisease = diseases[Math.floor(Math.random() * diseases.length)]
        const confidence = (Math.random() * (0.99 - 0.85) + 0.85) * 100 // Random confidence between 85-99%

        // 3. Store the prediction
        const { data: prediction, error } = await supabase
            .from("ai_disease_predictions")
            .insert({
                user_id: (await supabase.auth.getUser()).data.user?.id,
                field_id,
                image_url,
                predicted_disease_id: randomDisease.id,
                confidence_score: confidence,
                model_version: model.model_version,
                additional_notes: notes
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({
            success: true,
            data: {
                prediction,
                disease: randomDisease,
                model: {
                    name: model.model_name,
                    version: model.model_version,
                    accuracy: model.accuracy
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
