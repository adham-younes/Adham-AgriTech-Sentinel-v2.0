import { NextResponse } from "next/server"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { createServiceSupabaseClient } from "@/lib/supabase/service-client"

type FieldPayload = {
  farm_id?: string
  name?: string
  area?: number | string | null
  crop_type?: string | null
  soil_type?: string | null
  irrigation_type?: string | null
  status?: string | null
  boundaries?: unknown
  boundary_coordinates?: unknown
  centroid?: unknown
  latitude?: number | string | null
  longitude?: number | string | null
  [key: string]: unknown
}

const FORBIDDEN_KEYS = ["owner_id", "ownerId", "user_id", "userId"] as const
type ForbiddenKey = (typeof FORBIDDEN_KEYS)[number]

const coerceNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const sanitizePayload = (payload: Record<string, unknown>): FieldPayload => {
  if (!payload || typeof payload !== "object") return {}

  const cleaned = { ...payload } as FieldPayload
  const strippedKeys: ForbiddenKey[] = []

  FORBIDDEN_KEYS.forEach((key) => {
    if (key in cleaned) {
      delete cleaned[key]
      strippedKeys.push(key)
    }
  })

  if (strippedKeys.length > 0) {
    console.warn("[API/fields] Stripped forbidden keys from payload", {
      strippedKeys,
    })
  }

  return cleaned
}

const normalizeStatus = (value?: string | null) => {
  if (!value) return "active"
  const normalised = value.toLowerCase()
  return ["active", "inactive", "fallow"].includes(normalised) ? normalised : "active"
}

const cloneJson = <T = unknown>(value: T): T | null => {
  try {
    return JSON.parse(JSON.stringify(value)) as T
  } catch {
    return null
  }
}

const parseJsonInput = (value: unknown): unknown => {
  if (value == null) return null
  if (typeof value === "string") {
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }
  if (typeof value === "object" || Array.isArray(value)) {
    return cloneJson(value)
  }
  return null
}

const normaliseBoundaries = (value: unknown) => {
  const parsed = parseJsonInput(value)
  if (!parsed || typeof parsed !== "object") return null
  if ("type" in parsed && (parsed as { type?: string }).type === "Polygon") {
    return parsed
  }
  return null
}

const normaliseCentroid = (value: unknown) => {
  const parsed = parseJsonInput(value)
  if (!parsed || typeof parsed !== "object") return null
  const candidate = parsed as { type?: string; coordinates?: unknown }
  if (candidate.type !== "Point" || !Array.isArray(candidate.coordinates)) return null
  const [lng, lat] = candidate.coordinates
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  return {
    type: "Point",
    coordinates: [lng, lat],
  }
}

async function ensureFarmOwnership(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  farmId: string,
  userId: string,
) {
  // Primary check: farm_owners bridge
  const { data, error } = await supabase
    .from("farm_owners")
    .select("user_id")
    .eq("farm_id", farmId)
    .eq("user_id", userId)
    .eq("role", "owner")
    .maybeSingle()

  const relationMissing =
    !!error &&
    (
      error.code === "42P01" || // relation does not exist
      error.code?.startsWith("PGRST2") || // schema-cache/table-missing errors from PostgREST
      /schema cache/i.test(error.message ?? "") ||
      /relation .*farm_owners.* does not exist/i.test(error.message ?? "") ||
      /table .*farm_owners.* not found/i.test(error.message ?? "")
    )

  // If the bridge table is missing OR it does not contain any row for this farm/user,
  // fall back to legacy ownership via farms.owner_id / farms.user_id.
  if (relationMissing || !data) {
    // Fallback: use farms.owner_id / farms.user_id
    const { data: farmRow, error: farmError } = await supabase
      .from("farms")
      .select("user_id, owner_id")
      .eq("id", farmId)
      .maybeSingle()

    if (farmError) {
      console.error("[API/fields] Farm lookup failed (fallback)", farmError)
      return { ok: false, status: 500 as const, message: "FARM_VERIFICATION_FAILED" }
    }

    const farmOwner = farmRow?.owner_id ?? farmRow?.user_id
    if (farmOwner && farmOwner === userId) {
      return { ok: true as const }
    }

    return { ok: false, status: 403 as const, message: "NOT_FARM_OWNER" }
  }

  if (error) {
    console.error("[API/fields] Failed to verify farm ownership", error)
    return { ok: false, status: 500 as const, message: "FARM_VERIFICATION_FAILED" }
  }

  if (!data) {
    return { ok: false, status: 403 as const, message: "NOT_FARM_OWNER" }
  }

  return { ok: true as const }
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })
  }

  const searchParams = new URL(request.url).searchParams
  const farmId = searchParams.get("farmId")

  const { data: ownershipRows, error: ownershipError } = await supabase
    .from("farm_owners")
    .select("farm_id")
    .eq("user_id", user.id)
    .eq("role", "owner")

  if (ownershipError) {
    console.error("[API/fields] Failed to load ownership for GET", ownershipError)
    return NextResponse.json({ error: "FARM_LOOKUP_FAILED" }, { status: 500 })
  }

  const accessibleFarmIds =
    ownershipRows?.map((row) => row.farm_id).filter((id): id is string => Boolean(id)) ?? []

  const filterFarmIds = (() => {
    if (farmId) {
      return accessibleFarmIds.includes(farmId) ? [farmId] : []
    }
    return accessibleFarmIds
  })()

  if (filterFarmIds.length === 0) {
    return NextResponse.json({ fields: [] })
  }

  const query = supabase
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
        latitude,
        longitude,
        last_ndvi,
        last_moisture,
        last_temperature,
        last_reading_at,
        updated_at,
        farms!fields_farm_id_fkey ( id, name )
      `,
    )
    .in("farm_id", filterFarmIds)
    .order("updated_at", { ascending: false })
    .limit(100)

  const { data, error } = await query
  if (error) {
    console.error("[API/fields] Failed to fetch fields", error)
    return NextResponse.json({ error: "FIELDS_FETCH_FAILED", details: error.message }, { status: 500 })
  }

  return NextResponse.json({ fields: data ?? [] })
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const serviceSupabase = createServiceSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })
    }

    const raw = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const body = sanitizePayload(raw)

    const farmId = typeof body.farm_id === "string" ? body.farm_id : (typeof raw?.farm_id === "string" ? (raw?.farm_id as string) : null)
    const name = body.name?.trim()
    const area = coerceNumber(body.area ?? raw?.area)

    if (!farmId || !name || !area || area <= 0) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: "farm_id,name,area_required",
        },
        { status: 400 },
      )
    }

    const ownership = await ensureFarmOwnership(supabase, farmId, user.id)
    if (!ownership.ok) {
      return NextResponse.json({ error: ownership.message }, { status: ownership.status })
    }

    const latitude = coerceNumber(body.latitude ?? raw?.latitude)
    const longitude = coerceNumber(body.longitude ?? raw?.longitude)
    const boundaryCoordinates = normaliseBoundaries(
      body.boundary_coordinates ?? body.boundaries ?? raw?.boundary_coordinates ?? raw?.boundaries,
    )
    const centroid = normaliseCentroid(body.centroid ?? raw?.centroid)

    if (boundaryCoordinates) {
      try {
        const { data: isValid, error: validationError } = await serviceSupabase.rpc("is_polygon_geojson_valid", {
          geojson: boundaryCoordinates,
        })

        if (validationError) {
          console.warn("[API/fields] Boundary validation RPC failed", validationError)
        } else if (!isValid) {
          return NextResponse.json(
            { error: "INVALID_BOUNDARY", message: "boundary_coordinates_invalid" },
            { status: 400 },
          )
        }
      } catch (error) {
        console.warn("[API/fields] Boundary validation threw", error)
      }
    }

    const basePayload = {
      farm_id: farmId,
      name,
      area,
      crop_type: body.crop_type && typeof body.crop_type === "string" ? body.crop_type.trim() : null,
      soil_type: body.soil_type && typeof body.soil_type === "string" ? body.soil_type.trim() : null,
      irrigation_type: body.irrigation_type && typeof body.irrigation_type === "string" ? body.irrigation_type.trim() : null,
      status: normalizeStatus(body.status),
      boundaries: boundaryCoordinates,
      boundary_coordinates: boundaryCoordinates,
      centroid,
      latitude,
      longitude,
    }

    let insertError: null | { message?: string; details?: string } = null
    let insertedId: string | null = null
    const mutablePayload: FieldPayload = { ...basePayload }

    const payloadToSend = Object.fromEntries(
      Object.entries(mutablePayload).filter(([, value]) => value !== undefined),
    )
    const { data: initData, error: initError } = await supabase.from("fields").insert(payloadToSend).select("id").single()
    if (!initError && initData?.id) {
      insertedId = initData.id
    } else {
      insertError = initError ?? { message: undefined, details: undefined }

      // Auto-create default field for new users if this is their first field
      const userFieldsCount = await supabase
        .from("fields")
        .select("id", { count: "exact", head: true })
        .eq("farm_id", farmId)

      if (userFieldsCount.count === 0) {
        console.info("[API/fields] Creating default field for new user", { farmId, userId: user.id })

        const defaultFieldPayload = {
          farm_id: farmId,
          name: "Default Field",
          area: 5.0,
          crop_type: "Wheat",
          soil_type: "Clay Loam",
          irrigation_type: "Drip",
          status: "active",
          latitude: 30.0444,
          longitude: 31.2357,
        }

        const { data: defaultData, error: defaultError } = await supabase
          .from("fields")
          .insert(defaultFieldPayload)
          .select("id")
          .single()

        if (!defaultError && defaultData?.id) {
          insertedId = defaultData.id
          insertError = null
          console.info("[API/fields] Default field created successfully", { fieldId: defaultData.id })
        } else {
          insertError = defaultError ?? insertError
        }
      }
    }

    if (insertError || !insertedId) {
      console.error("[API/fields] Failed to create field", {
        error: insertError,
        insertPayloadKeys: Object.keys(mutablePayload),
      })

      return NextResponse.json(
        {
          error: "FIELD_CREATE_FAILED",
          message: insertError?.message ?? "Failed to create field",
          details: insertError?.details ?? null,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ id: insertedId }, { status: 201 })
  } catch (error) {
    console.error("[API/fields] Unexpected error", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "UNEXPECTED_ERROR", message }, { status: 500 })
  }
}
