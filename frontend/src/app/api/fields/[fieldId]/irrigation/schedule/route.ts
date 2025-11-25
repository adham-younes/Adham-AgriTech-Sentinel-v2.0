import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export async function POST(request: Request, { params }: { params: { fieldId: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })
    }

    const payload = await request.json().catch(() => ({}))
    const scheduledDate = payload?.scheduledAt ? new Date(payload.scheduledAt) : new Date(Date.now() + 60 * 60 * 1000)
    if (Number.isNaN(scheduledDate.getTime())) {
      return NextResponse.json({ error: "INVALID_SCHEDULE_DATE" }, { status: 400 })
    }

    const duration = parseNumber(payload?.durationMinutes) ?? 45
    const waterAmount = parseNumber(payload?.waterAmount)
    const notes = typeof payload?.notes === "string" ? payload.notes.trim() : null

    const { data, error } = await supabase
      .from("irrigation_events")
      .insert({
        field_id: params.fieldId,
        scheduled_date: scheduledDate.toISOString(),
        duration_minutes: Math.round(duration),
        water_amount: waterAmount,
        status: "scheduled",
        notes,
      })
      .select("id")
      .single()

    if (error) {
      console.error("[Irrigation] schedule creation failed", error)
      return NextResponse.json({ error: "IRRIGATION_SCHEDULE_FAILED", message: error.message }, { status: 500 })
    }

    return NextResponse.json({ status: "scheduled", eventId: data.id, scheduledAt: scheduledDate.toISOString() })
  } catch (error) {
    console.error("[Irrigation] schedule endpoint error", error)
    return NextResponse.json({ error: "IRRIGATION_SCHEDULE_FAILED", message: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
