import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const supabase = await createClient()

        const { data: models, error } = await supabase
            .from("ml_models_registry")
            .select("*")
            .eq("is_active", true)
            .order("accuracy", { ascending: false })

        if (error) throw error

        return NextResponse.json({
            success: true,
            data: models
        })

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}
