import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { processFieldsNdvi } from "@/lib/ndvi/pipeline"

type RequestBody = {
  field_id?: string
  date?: string
}

function badRequest(message: string, code: string, status = 400) {
  return NextResponse.json(
    {
      code,
      message,
      details: null,
    },
    { status },
  )
}

export async function POST(request: Request) {
  console.info("[NDVI API] /api/ndvi/update invoked")

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      {
        code: "UNAUTHENTICATED",
        message: "Authentication required | \u064a\u062a\u0637\u0644\u0628 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644",
        details: authError?.message ?? null,
      },
      { status: 401 },
    )
  }

  let payload: RequestBody = {}
  if (request.headers.get("content-type")?.includes("application/json")) {
    try {
      payload = (await request.json()) as RequestBody
    } catch (error) {
      console.warn("[NDVI API] Invalid JSON payload", error)
      return badRequest("Invalid JSON payload | \u062a\u0646\u0633\u064a\u0642 JSON \u063a\u064a\u0631 \u0635\u0627\u0644\u062d", "INVALID_JSON")
    }
  }

  const fieldId = payload.field_id ?? new URL(request.url).searchParams.get("field_id") ?? undefined
  if (fieldId && !/^[0-9a-fA-F-]{36}$/.test(fieldId)) {
    return badRequest("Invalid field identifier | \u0645\u0639\u0631\u0641 \u0627\u0644\u062d\u0642\u0644 \u063a\u064a\u0631 \u0635\u0627\u0644\u062d", "INVALID_FIELD")
  }

  const date = payload.date ?? new Date().toISOString()

  let query = supabase
    .from("fields")
    .select("id, latitude, longitude, farms!inner(owner_id)")
    .eq("farms.owner_id", user.id)

  if (fieldId) {
    query = query.eq("id", fieldId)
  }

  const { data: fieldRows, error: fieldsError } = await query
  if (fieldsError) {
    console.error("[NDVI API] Unable to load fields", fieldsError)
    return NextResponse.json(
      {
        code: "FIELDS_ERROR",
        message: "Unable to load fields | \u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u062d\u0642\u0648\u0644",
        details: fieldsError.message,
      },
      { status: 500 },
    )
  }

  const shapedFields =
    fieldRows?.map((field) => ({
      id: field.id,
      owner_id: user.id,
      latitude: field.latitude,
      longitude: field.longitude,
    })) ?? []

  if (shapedFields.length === 0) {
    return NextResponse.json(
      {
        code: "NO_FIELDS",
        message: "No fields available for NDVI update | \u0644\u0627 \u062a\u0648\u062c\u062f \u062d\u0642\u0648\u0644 \u0644\u062a\u062d\u062f\u064a\u062b \u0645\u0624\u0634\u0631 NDVI",
        details: null,
      },
      { status: 200 },
    )
  }

  try {
    const summary = await processFieldsNdvi({ supabase, fields: shapedFields, date })
    return NextResponse.json(
      {
        code: "SUCCESS",
        message: "NDVI update completed | \u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0645\u0624\u0634\u0631\u0627\u062a NDVI",
        details: summary,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[NDVI API] NDVI processing failed", error)
    return NextResponse.json(
      {
        code: "NDVI_UPDATE_FAILED",
        message: "NDVI update failed | \u0641\u0634\u0644 \u062a\u062d\u062f\u064a\u062b \u0645\u0624\u0634\u0631\u0627\u062a NDVI",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
