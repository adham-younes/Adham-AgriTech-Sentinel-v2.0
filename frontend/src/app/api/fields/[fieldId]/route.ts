import { NextResponse } from "next/server"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { createServiceSupabaseClient } from "@/lib/supabase/service-client"

const coerceNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const normalizeStatus = (value?: string | null) => {
  if (!value) return undefined
  const normalised = value.toLowerCase()
  return ["active", "inactive", "fallow"].includes(normalised) ? normalised : undefined
}

const normaliseBoundaries = (value: unknown) => {
  if (!value) return undefined
  if (Array.isArray(value) || typeof value === "object") {
    try {
      return JSON.parse(JSON.stringify(value))
    } catch {
      return undefined
    }
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) || typeof parsed === "object" ? parsed : undefined
    } catch {
      return undefined
    }
  }
  return undefined
}

async function ensureFieldOwnership(fieldId: string, userId: string) {
  const serviceClient = createServiceSupabaseClient()
  const { data: field, error } = await serviceClient
    .from("fields")
    .select("id, farm_id")
    .eq("id", fieldId)
    .maybeSingle()

  if (error) {
    console.error("[API/fields/:id] Failed to load field", error)
    return { ok: false as const, status: 500 as const, message: "FIELD_LOOKUP_FAILED" }
  }

  if (!field) {
    return { ok: false as const, status: 404 as const, message: "FIELD_NOT_FOUND" }
  }

  const { data: membership, error: membershipError } = await serviceClient
    .from("farm_owners")
    .select("user_id")
    .eq("farm_id", field.farm_id)
    .eq("user_id", userId)
    .eq("role", "owner")
    .maybeSingle()

  if (membershipError) {
    console.error("[API/fields/:id] Failed to verify membership", membershipError)
    return { ok: false as const, status: 500 as const, message: "FARM_VERIFICATION_FAILED" }
  }

  if (!membership) {
    return { ok: false as const, status: 403 as const, message: "NOT_FIELD_OWNER" }
  }

  return { ok: true as const, field, serviceClient }
}

export async function GET(_request: Request, { params }: { params: { fieldId: string } }) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("fields")
    .select(
      `
        id,
        farm_id,
        name,
        area,
        crop_type,
        soil_type,
        status,
        boundaries,
        latitude,
        longitude,
        last_ndvi,
        last_moisture,
        last_temperature,
        last_rainfall,
        last_reading_at,
        created_at,
        updated_at,
        farms ( id, name )
      `,
    )
    .eq("id", params.fieldId)
    .maybeSingle()

  if (error) {
    console.error("[API/fields/:id] Failed to fetch field", error)
    return NextResponse.json({ error: "FIELD_FETCH_FAILED", details: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: "FIELD_NOT_FOUND" }, { status: 404 })
  }

  return NextResponse.json({ field: data })
}

export async function PUT(request: Request, { params }: { params: { fieldId: string } }) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })
    }

    const ownership = await ensureFieldOwnership(params.fieldId, user.id)
    if (!ownership.ok) {
      return NextResponse.json({ error: ownership.message }, { status: ownership.status })
    }

    const raw = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const updates: Record<string, unknown> = {}

    if (typeof raw.name === "string" && raw.name.trim().length) updates.name = raw.name.trim()
    const area = coerceNumber(raw.area)
    if (area && area > 0) updates.area = area
    if (typeof raw.crop_type === "string") updates.crop_type = raw.crop_type.trim()
    if (typeof raw.soil_type === "string") updates.soil_type = raw.soil_type.trim()

    const status = normalizeStatus(typeof raw.status === "string" ? raw.status : undefined)
    if (status) updates.status = status

    const latitude = coerceNumber(raw.latitude)
    const longitude = coerceNumber(raw.longitude)
    if (latitude != null) updates.latitude = latitude
    if (longitude != null) updates.longitude = longitude

    const boundaries = normaliseBoundaries(raw.boundaries)
    if (boundaries !== undefined) updates.boundaries = boundaries

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "NO_CHANGES" }, { status: 400 })
    }

    const { error } = await ownership.serviceClient
      .from("fields")
      .update(updates)
      .eq("id", params.fieldId)

    if (error) {
      console.error("[API/fields/:id] Failed to update field", error)
      return NextResponse.json(
        {
          error: "FIELD_UPDATE_FAILED",
          message: error.message ?? "Failed to update field",
          details: error.details ?? null,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ status: "updated" })
  } catch (error) {
    console.error("[API/fields/:id] Unexpected error", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "UNEXPECTED_ERROR", message }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: { fieldId: string } }) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })
    }

    const ownership = await ensureFieldOwnership(params.fieldId, user.id)
    if (!ownership.ok) {
      return NextResponse.json({ error: ownership.message }, { status: ownership.status })
    }

    const { error } = await ownership.serviceClient.from("fields").delete().eq("id", params.fieldId)
    if (error) {
      console.error("[API/fields/:id] Failed to delete field", error)
      return NextResponse.json(
        {
          error: "FIELD_DELETE_FAILED",
          message: error.message ?? "Failed to delete field",
          details: error.details ?? null,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ status: "deleted" })
  } catch (error) {
    console.error("[API/fields/:id] Unexpected error", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "UNEXPECTED_ERROR", message }, { status: 500 })
  }
}
