import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const ALLOWED_TASK_STATUSES = new Set(["pending", "in_progress", "completed"])

export async function getUserSupabase() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    console.warn("[Tasks API] Missing or invalid auth context", { error })
    return { error: "UNAUTHENTICATED" as const }
  }

  return { supabase, user }
}

export function isUuid(value: unknown) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function buildErrorResponse(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ code, message, details }, { status })
}
