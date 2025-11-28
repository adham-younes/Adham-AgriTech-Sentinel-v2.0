import { NextResponse } from "next/server"
import { assessDiseaseRisk } from "@/lib/services/predictive-analytics"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { fieldId } = await request.json()

    if (!fieldId) {
      return NextResponse.json({ error: "Field ID is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: field } = await supabase
      .from("fields")
      .select("id, user_id")
      .eq("id", fieldId)
      .single()

    if (!field || field.user_id !== user.id) {
      return NextResponse.json({ error: "Field not found or access denied" }, { status: 403 })
    }

    const assessment = await assessDiseaseRisk(fieldId)

    return NextResponse.json(assessment)
  } catch (error) {
    console.error("[Predictive Analytics API] Error:", error)
    return NextResponse.json(
      { error: "Failed to assess disease risk", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

