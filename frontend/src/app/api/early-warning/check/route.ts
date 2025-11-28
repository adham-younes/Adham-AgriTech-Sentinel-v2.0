import { NextResponse } from "next/server"
import { checkFieldHealth } from "@/lib/services/early-warning"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { fieldId } = await request.json()

    if (!fieldId) {
      return NextResponse.json({ error: "Field ID is required" }, { status: 400 })
    }

    // Verify user has access to this field
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

    const result = await checkFieldHealth(fieldId)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[Early Warning API] Error:", error)
    return NextResponse.json(
      { error: "Failed to check field health", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fieldId = searchParams.get("fieldId")

    if (!fieldId) {
      return NextResponse.json({ error: "Field ID is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: warnings, error } = await supabase
      .from("early_warnings")
      .select("*")
      .eq("field_id", fieldId)
      .eq("status", "active")
      .order("detected_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ warnings: warnings || [] })
  } catch (error) {
    console.error("[Early Warning API] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch warnings", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

