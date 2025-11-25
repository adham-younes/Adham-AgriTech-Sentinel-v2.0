import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function POST(_request: Request, { params }: { params: { notificationId: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", params.notificationId)
    .eq("user_id", user.id)

  if (error) {
    console.error("[Notifications] mark read failed", error)
    return NextResponse.json({ error: "NOTIFICATION_UPDATE_FAILED", message: error.message }, { status: 500 })
  }

  return NextResponse.json({ status: "ok" })
}
