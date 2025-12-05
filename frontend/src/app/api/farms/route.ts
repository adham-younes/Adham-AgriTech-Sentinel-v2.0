import { NextResponse } from "next/server"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { createServiceSupabaseClient } from "@/lib/supabase/service-client"
import { logger } from "@/lib/utils/logger"

type FarmPayload = {
  name?: string
  location?: string
  description?: string | null
  total_area?: number | null
  latitude?: number | null
  longitude?: number | null
  user_id?: string
  [key: string]: unknown
}

const FORBIDDEN_KEYS = ["owner_id", "ownerId", "user_id", "userId"] as const
type ForbiddenKey = (typeof FORBIDDEN_KEYS)[number]

function sanitizePayload(payload: Record<string, unknown>): FarmPayload {
  if (!payload || typeof payload !== "object") return {}

  const cleaned = { ...payload } as FarmPayload
  const strippedKeys: ForbiddenKey[] = []

  FORBIDDEN_KEYS.forEach((key) => {
    if (key in cleaned) {
      delete cleaned[key]
      strippedKeys.push(key)
    }
  })

  if (strippedKeys.length > 0) {
    console.warn("[API/farms] Stripped forbidden keys from payload", {
      strippedKeys,
    })
  }

  return cleaned
}

const normalizeNumber = (value?: number | null) => (typeof value === "number" && Number.isFinite(value) ? value : null)

const coerceNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "AUTH_REQUIRED", message: "Please sign in to view farms" }, { status: 401 })
    }

    // Get farms where user is owner or member via farm_owners bridge
    // This ensures we catch shared farms and consistent with Dashboard logic
    const { data: ownerships, error: ownershipsError } = await supabase
      .from('farm_owners')
      .select('farm_id, farms (*)')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false })

    if (ownershipsError) {
      logger.error("[API] Failed to fetch farm ownerships", ownershipsError, { userId: user.id, endpoint: "GET /api/farms" })
      return NextResponse.json(
        { error: "FARMS_FETCH_FAILED", message: ownershipsError.message },
        { status: 500 }
      )
    }

    // Flatten the result structure
    // farm_owners returns { farm_id, farms: { ...farmDetails } }
    // We map it to just [ ...farmDetails ]
    const farms = ownerships
      ?.map(row => row.farms)
      .filter(farm => farm !== null) || []

    logger.info("[API] Successfully fetched farms", { count: farms.length, userId: user.id })
    return NextResponse.json({ farms })
  } catch (error) {
    logger.error("[API] Unexpected farms fetch error", error, { endpoint: "GET /api/farms" })
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "UNEXPECTED_ERROR", message }, { status: 500 })
  }
}

// Test endpoint for debugging
export async function PUT(request: Request) {
  logger.debug("[API] PUT endpoint called", { endpoint: "PUT /api/farms" })

  try {
    // Just test service client creation without database operations
    logger.debug("[API] Creating service client...", { endpoint: "PUT /api/farms" })
    const serviceSupabase = createServiceSupabaseClient()
    logger.debug("[API] Service client created successfully", { endpoint: "PUT /api/farms" })

    return NextResponse.json({
      success: true,
      message: "Service client test passed - no database operations"
    })
  } catch (error) {
    logger.error("[API] Test endpoint error", error, {
      endpoint: "PUT /api/farms",
      type: "test_endpoint"
    })
    return NextResponse.json({
      error: "TEST_ERROR",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : "Unknown"
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const raw = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const body = sanitizePayload(raw)
    const forbiddenInRaw = FORBIDDEN_KEYS.filter((key) => key in raw)

    const name = body.name?.trim()
    const location = body.location?.trim()
    if (!name || !location) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "name_and_location_required" },
        { status: 400 },
      )
    }

    const supabase = await createSupabaseServerClient()
    const serviceSupabase = createServiceSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })
    }

    const basePayload = {
      user_id: user.id,
      name,
      location,
      description: body.description && typeof body.description === "string" ? body.description.trim() : null,
      total_area: normalizeNumber(body.total_area ?? coerceNumber(raw?.total_area)),
      latitude: normalizeNumber(body.latitude ?? coerceNumber(raw?.latitude)),
      longitude: normalizeNumber(body.longitude ?? coerceNumber(raw?.longitude)),
    }

    let insertError: null | { message?: string; details?: string } = null
    let insertedId: string | null = null
    const mutablePayload: FarmPayload = { ...basePayload }

    const payloadToSend = Object.fromEntries(
      Object.entries(mutablePayload).filter(([, value]) => value !== undefined),
    )

    logger.debug("[API/farms] Attempting initial insert", {
      payload: payloadToSend,
      endpoint: "POST /api/farms"
    })

    const { data: initData, error: initError } = await supabase.from("farms").insert(payloadToSend).select("id").single()

    logger.debug("[API/farms] Initial insert result", {
      success: !!initData?.id,
      insertedId: initData?.id,
      error: initError ? {
        message: initError.message,
        details: initError.details,
        hint: initError.hint,
        code: initError.code
      } : null
    })

    if (!initError && initData?.id) {
      insertedId = initData.id
    } else {
      insertError = initError ?? { message: undefined, details: undefined }
      const msg = String(insertError?.message || "")
      const rlsViolation = /row-level security policy/i.test(msg)
      const userIdMissing = /column\s+user_id\s+does\s+not\s+exist/i.test(msg)
      const totalAreaMissing = /column\s+total_area\s+does\s+not\s+exist/i.test(msg)
      const latMissing = /column\s+latitude\s+does\s+not\s+exist/i.test(msg)
      const lngMissing = /column\s+longitude\s+does\s+not\s+exist/i.test(msg)

      logger.debug("[API/farms] Error checks", {
        rlsViolation,
        userIdMissing,
        totalAreaMissing,
        latMissing,
        lngMissing,
        willAttemptLegacy: rlsViolation || userIdMissing || totalAreaMissing || latMissing || lngMissing,
        endpoint: "POST /api/farms"
      })

      if (rlsViolation || userIdMissing || totalAreaMissing || latMissing || lngMissing) {
        logger.debug("[API/farms] Attempting legacy schema fallback", { endpoint: "POST /api/farms" })
        logger.debug("[API/farms] Raw payload for legacy extraction", {
          body_total_area: body.total_area,
          raw_total_area: raw?.total_area,
          raw_area: raw?.area,
          body_latitude: body.latitude,
          raw_latitude: raw?.latitude,
          body_longitude: body.longitude,
          raw_longitude: raw?.longitude
        })

        const legacyArea = normalizeNumber(body.total_area ?? coerceNumber(raw?.total_area) ?? coerceNumber(raw?.area))
        const legacyLat = normalizeNumber(body.latitude ?? coerceNumber(raw?.latitude))
        const legacyLng = normalizeNumber(body.longitude ?? coerceNumber(raw?.longitude))

        logger.debug("[API/farms] Legacy values after normalization", {
          legacyArea,
          legacyLat,
          legacyLng
        })

        if (legacyArea == null || legacyLat == null || legacyLng == null) {
          logger.error("[API/farms] Legacy schema missing required fields", undefined, {
            endpoint: "POST /api/farms",
            schema: "legacy"
          })
          insertError = {
            message: "LEGACY_SCHEMA_REQUIRED_FIELDS_MISSING",
            details: "area, latitude, longitude are required for legacy farms schema",
          }
        } else {
          logger.debug("[API/farms] Attempting legacy insert with owner_id", { endpoint: "POST /api/farms" })
          const legacyPayload: Record<string, unknown> = {
            owner_id: user.id,
            name,
            location,
            area: legacyArea,
            latitude: legacyLat,
            longitude: legacyLng,
            description: body.description && typeof body.description === "string" ? body.description.trim() : null,
          }
          const { data: legacyData, error: legacyError } = await supabase
            .from("farms")
            .insert(legacyPayload)
            .select("id")
            .single()
          if (!legacyError && legacyData?.id) {
            insertedId = legacyData.id
            insertError = null
          } else {
            insertError = legacyError ?? insertError
          }
        }
      }
    }

    if (insertError || !insertedId) {
      logger.error("[API] Failed to create farm", insertError as Error, {
        forbiddenInRaw,
        insertPayloadKeys: Object.keys(mutablePayload),
        endpoint: "POST /api/farms"
      })

      return NextResponse.json(
        {
          error: "FARM_CREATE_FAILED",
          message: insertError?.message ?? "Failed to create farm",
          details: insertError?.details ?? null,
        },
        { status: 500 },
      )
    }

    // Ensure farm_owners bridge table is updated
    try {
      const { error: bridgeError } = await serviceSupabase
        .from("farm_owners")
        .upsert({
          farm_id: insertedId,
          user_id: user.id,
          role: "owner",
          added_at: new Date().toISOString()
        }, {
          onConflict: "farm_id, user_id, role"
        })

      if (bridgeError) {
        logger.error("[API] Failed to update farm_owners bridge", bridgeError, {
          endpoint: "POST /api/farms",
          farmId: insertedId
        })
        // Don't fail the request, but log the error
      }
    } catch (bridgeError) {
      logger.error("[API] Unexpected bridge error", bridgeError, {
        endpoint: "POST /api/farms",
        farmId: insertedId
      })
    }

    return NextResponse.json({ id: insertedId }, { status: 201 })
  } catch (error) {
    logger.error("[API] Unexpected farm creation error", error, {
      endpoint: "POST /api/farms"
    })
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "UNEXPECTED_ERROR", message }, { status: 500 })
  }
}
