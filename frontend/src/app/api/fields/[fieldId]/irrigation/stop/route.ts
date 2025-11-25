import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function POST(_request: Request, { params }: { params: { fieldId: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })
    }

    const { data: event, error: lookupError } = await supabase
      .from("irrigation_events")
      .select("id")
      .eq("field_id", params.fieldId)
      .eq("status", "in_progress")
      .order("scheduled_date", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lookupError) {
      console.error("[Irrigation] stop lookup failed", lookupError)
      return NextResponse.json({ error: "IRRIGATION_LOOKUP_FAILED", message: lookupError.message }, { status: 500 })
    }

    if (!event) {
      return NextResponse.json({ error: "NO_ACTIVE_IRRIGATION" }, { status: 404 })
    }

    const endedAt = new Date().toISOString()
    const { error: updateError } = await supabase
      .from("irrigation_events")
      .update({ status: "completed", actual_end_time: endedAt })
      .eq("id", event.id)

    if (updateError) {
      console.error("[Irrigation] stop update failed", updateError)
      return NextResponse.json({ error: "IRRIGATION_STOP_FAILED", message: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ status: "completed", eventId: event.id, endedAt })
  } catch (error) {
    console.error("[Irrigation] stop endpoint error", error)
    return NextResponse.json({ error: "IRRIGATION_STOP_FAILED", message: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
