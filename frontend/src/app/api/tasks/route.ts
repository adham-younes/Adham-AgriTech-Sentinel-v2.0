import { NextResponse } from "next/server"
import { ALLOWED_TASK_STATUSES, buildErrorResponse, getUserSupabase, isUuid } from "./utils"

type TaskPayload = {
  name?: string
  description?: string | null
  field_id?: string
  due_date?: string | null
  status?: string
  recommendations?: Record<string, unknown> | null
}

export async function GET(request: Request) {
  console.info("[Tasks API] Incoming request", { method: "GET", url: request.url })
  const { supabase, user, error: authError } = await getUserSupabase()
  if (authError || !supabase || !user) {
    return buildErrorResponse(401, "UNAUTHENTICATED", "User session not found")
  }

  const { searchParams } = new URL(request.url)
  const fieldId = searchParams.get("field_id")

  if (fieldId && !isUuid(fieldId)) {
    return buildErrorResponse(400, "INVALID_FIELD_ID", "Provided field_id is not a valid UUID")
  }

  let query = supabase.from("tasks").select("*").order("due_date", { ascending: true }).order("created_at", { ascending: false })
  if (fieldId) {
    query = query.eq("field_id", fieldId)
  }

  const { data: tasks, error } = await query

  if (error) {
    console.error("[Tasks API] Failed to fetch tasks", error)
    return buildErrorResponse(500, "TASKS_FETCH_FAILED", "Unable to load tasks at this time")
  }

  return NextResponse.json(
    {
      code: "SUCCESS",
      message: "Tasks fetched successfully",
      details: { count: tasks?.length ?? 0 },
      tasks: tasks ?? [],
    },
    { status: 200 },
  )
}

export async function POST(request: Request) {
  console.info("[Tasks API] Incoming request", { method: "POST", url: request.url })
  const { supabase, user, error: authError } = await getUserSupabase()
  if (authError || !supabase || !user) {
    return buildErrorResponse(401, "UNAUTHENTICATED", "User session not found")
  }

  let body: TaskPayload
  try {
    body = (await request.json()) as TaskPayload
  } catch (error) {
    console.warn("[Tasks API] Invalid JSON payload", error)
    return buildErrorResponse(400, "INVALID_JSON", "Unable to parse request body")
  }

  const validationErrors: Record<string, string> = {}
  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    validationErrors.name = "Task name is required"
  }
  if (!body.field_id || !isUuid(body.field_id)) {
    validationErrors.field_id = "field_id must be a valid UUID"
  }
  const statusValue = body.status ?? "pending"
  if (statusValue && !ALLOWED_TASK_STATUSES.has(statusValue)) {
    validationErrors.status = "Invalid status provided"
  }

  if (Object.keys(validationErrors).length > 0) {
    return buildErrorResponse(422, "VALIDATION_ERROR", "Task payload validation failed", validationErrors)
  }

  const insertPayload = {
    field_id: body.field_id!,
    user_id: user.id,
    name: body.name!.trim(),
    description: body.description ?? null,
    due_date: body.due_date ?? null,
    status: statusValue,
    recommendations: body.recommendations ?? {},
  }

  const { data: task, error } = await supabase.from("tasks").insert(insertPayload).select("*").single()

  if (error) {
    console.error("[Tasks API] Failed to create task", error)
    return buildErrorResponse(500, "TASK_CREATE_FAILED", "Unable to create task", error.message)
  }

  console.info("[Tasks API] Task created", { taskId: task.id, fieldId: task.field_id })

  return NextResponse.json(
    {
      code: "SUCCESS",
      message: "Task created successfully",
      details: { taskId: task.id },
      task,
    },
    { status: 201 },
  )
}
