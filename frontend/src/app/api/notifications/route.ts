import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })
  }

  const searchParams = new URL(request.url).searchParams
  const unreadOnly = searchParams.get("unread") === "true"
  const limit = Number.parseInt(searchParams.get("limit") ?? "50", 10)

  let query = supabase
    .from("notifications")
    .select("id, title, title_ar, message, message_ar, type, category, link, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 50)

  if (unreadOnly) {
    query = query.eq("is_read", false)
  }

  const { data, error } = await query
  if (error) {
    console.error("[Notifications] fetch failed", error)
    return NextResponse.json({ error: "NOTIFICATIONS_FETCH_FAILED", message: error.message }, { status: 500 })
  }

  return NextResponse.json({ notifications: data ?? [] })
}
