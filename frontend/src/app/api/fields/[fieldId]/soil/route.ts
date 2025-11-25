import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function GET(_request: Request, { params }: { params: { fieldId: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })
    }

    const { data: field, error: fieldError } = await supabase
      .from("fields")
      .select("id, name, crop_type, soil_type, area")
      .eq("id", params.fieldId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (fieldError) {
      console.error("[Soil API] Failed to lookup field", fieldError)
      return NextResponse.json({ error: "FIELD_LOOKUP_FAILED", details: fieldError.message }, { status: 500 })
    }

    if (!field) {
      return NextResponse.json({ error: "FIELD_NOT_FOUND" }, { status: 404 })
    }

    const { data: analysis, error: soilError } = await supabase
      .from("soil_analysis")
      .select(
        "id, analysis_date, ph_level, nitrogen, phosphorus, potassium, organic_matter, moisture, temperature, electrical_conductivity, ai_recommendations, irrigation_recommendations",
      )
      .eq("field_id", params.fieldId)
      .order("analysis_date", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (soilError) {
      console.error("[Soil API] Failed to fetch soil analysis", soilError)
      return NextResponse.json({ error: "SOIL_FETCH_FAILED", details: soilError.message }, { status: 500 })
    }

    if (!analysis) {
      return NextResponse.json({
        field,
        analysis: null,
        message: "No soil samples have been recorded for this field yet.",
      })
    }

    const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 })
    const advisory = [
      analysis.ph_level ? `pH: ${nf.format(analysis.ph_level)}` : null,
      analysis.nitrogen ? `Nitrogen: ${nf.format(analysis.nitrogen)} mg/kg` : null,
      analysis.phosphorus ? `Phosphorus: ${nf.format(analysis.phosphorus)} mg/kg` : null,
      analysis.potassium ? `Potassium: ${nf.format(analysis.potassium)} mg/kg` : null,
      analysis.moisture ? `Moisture: ${nf.format(analysis.moisture)}%` : null,
      analysis.organic_matter ? `Organic matter: ${nf.format(analysis.organic_matter)}%` : null,
      analysis.electrical_conductivity ? `EC: ${nf.format(analysis.electrical_conductivity)} dS/m` : null,
    ]
      .filter(Boolean)
      .join(" · ")

    return NextResponse.json({
      field,
      analysis: {
        ...analysis,
        advisory,
      },
    })
  } catch (error) {
    console.error("[Soil API] Unexpected error", error)
    return NextResponse.json({ error: "SOIL_API_FAILED", message: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
