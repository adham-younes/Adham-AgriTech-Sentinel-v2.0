import { NextResponse } from "next/server"
import { ALLOWED_TASK_STATUSES, buildErrorResponse, getUserSupabase, isUuid } from "../utils"

type UpdatePayload = {
  name?: string
  description?: string | null
  due_date?: string | null
  status?: string
  recommendations?: Record<string, unknown> | null
}

async function ensureTaskVisible(supabase: any, taskId: string) {
  const { data, error } = await supabase.from("tasks").select("id, field_id").eq("id", taskId).maybeSingle()
  if (error) {
    console.error("[Tasks API] Failed to verify task ownership", error)
    return { error: "LOOKUP_FAILED" as const }
  }

  if (!data) {
    return { error: "NOT_FOUND" as const }
  }

  return { task: data }
}

export async function PUT(request: Request, { params }: { params: { taskId: string } }) {
  const taskId = params.taskId
  console.info("[Tasks API] Incoming request", { method: "PUT", taskId })

  if (!isUuid(taskId)) {
    return buildErrorResponse(400, "INVALID_TASK_ID", "Task id is not a valid UUID")
  }

  const { supabase, user, error: authError } = await getUserSupabase()
  if (authError || !supabase || !user) {
    return buildErrorResponse(401, "UNAUTHENTICATED", "User session not found")
  }

  const visibility = await ensureTaskVisible(supabase, taskId)
  if (visibility.error === "LOOKUP_FAILED") {
    return buildErrorResponse(500, "TASK_LOOKUP_FAILED", "Unable to verify task access")
  }
  if (visibility.error === "NOT_FOUND") {
    return buildErrorResponse(403, "FORBIDDEN", "Task not found or access denied")
  }

  let body: UpdatePayload
  try {
    body = (await request.json()) as UpdatePayload
  } catch (error) {
    console.warn("[Tasks API] Invalid JSON payload", error)
    return buildErrorResponse(400, "INVALID_JSON", "Unable to parse request body")
  }

  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return buildErrorResponse(422, "VALIDATION_ERROR", "Task name must be a non-empty string")
    }
    updates.name = body.name.trim()
  }
  if (body.description !== undefined) {
    updates.description = body.description ?? null
  }
  if (body.due_date !== undefined) {
    updates.due_date = body.due_date ?? null
  }
  if (body.status !== undefined) {
    if (!ALLOWED_TASK_STATUSES.has(body.status)) {
      return buildErrorResponse(422, "VALIDATION_ERROR", "Status value is invalid")
    }
    updates.status = body.status
  }
  if (body.recommendations !== undefined) {
    updates.recommendations = body.recommendations ?? {}
  }

  if (Object.keys(updates).length === 0) {
    return buildErrorResponse(400, "NO_CHANGES", "No valid fields provided to update")
  }

  const { data: task, error } = await supabase.from("tasks").update({ ...updates }).eq("id", taskId).select("*").single()

  if (error) {
    console.error("[Tasks API] Failed to update task", error)
    return buildErrorResponse(500, "TASK_UPDATE_FAILED", "Unable to update task", error.message)
  }

  console.info("[Tasks API] Task updated", { taskId })

  return NextResponse.json(
    {
      code: "SUCCESS",
      message: "Task updated successfully",
      details: { taskId },
      task,
    },
    { status: 200 },
  )
}

export async function DELETE(request: Request, { params }: { params: { taskId: string } }) {
  const taskId = params.taskId
  console.info("[Tasks API] Incoming request", { method: "DELETE", taskId })

  if (!isUuid(taskId)) {
    return buildErrorResponse(400, "INVALID_TASK_ID", "Task id is not a valid UUID")
  }

  const { supabase, user, error: authError } = await getUserSupabase()
  if (authError || !supabase || !user) {
    return buildErrorResponse(401, "UNAUTHENTICATED", "User session not found")
  }

  const visibility = await ensureTaskVisible(supabase, taskId)
  if (visibility.error === "LOOKUP_FAILED") {
    return buildErrorResponse(500, "TASK_LOOKUP_FAILED", "Unable to verify task access")
  }
  if (visibility.error === "NOT_FOUND") {
    return buildErrorResponse(403, "FORBIDDEN", "Task not found or access denied")
  }

  const { error } = await supabase.from("tasks").delete().eq("id", taskId)
  if (error) {
    console.error("[Tasks API] Failed to delete task", error)
    return buildErrorResponse(500, "TASK_DELETE_FAILED", "Unable to delete task", error.message)
  }

  console.info("[Tasks API] Task deleted", { taskId })

  return NextResponse.json(
    {
      code: "SUCCESS",
      message: "Task deleted successfully",
      details: { taskId },
    },
    { status: 200 },
  )
}
