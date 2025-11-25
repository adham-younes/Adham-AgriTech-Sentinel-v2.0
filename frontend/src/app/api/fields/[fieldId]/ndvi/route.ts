import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

const MAX_LIMIT = 90
const DEFAULT_LIMIT = 30

const badRequest = (message: string, code: string) =>
  NextResponse.json({ error: code, message }, { status: 400 })

const parseLimit = (value: string | null): number => {
  if (!value) return DEFAULT_LIMIT
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT
  return Math.min(parsed, MAX_LIMIT)
}

const parseDate = (value: string | null): string | null => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

export async function GET(request: Request, { params }: { params: { fieldId: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })
  }

  const fieldId = params.fieldId
  if (!fieldId || !/^[0-9a-fA-F-]{36}$/.test(fieldId)) {
    return badRequest("Invalid field identifier", "INVALID_FIELD")
  }

  const searchParams = new URL(request.url).searchParams
  const limit = parseLimit(searchParams.get("limit"))
  const fromQuery = parseDate(searchParams.get("from"))
  const toQuery = parseDate(searchParams.get("to"))
  const daysQuery = Number.parseInt(searchParams.get("days") ?? "", 10)

  let from = fromQuery
  if (!from && Number.isFinite(daysQuery) && daysQuery > 0) {
    const start = new Date(Date.now() - daysQuery * 24 * 60 * 60 * 1000)
    from = start.toISOString()
  }

  const { data: fieldRow, error: fieldError } = await supabase
    .from("fields")
    .select("id, name, last_ndvi, last_reading_at")
    .eq("id", fieldId)
    .maybeSingle()

  if (fieldError) {
    console.error("[NDVI API] Failed to lookup field", fieldError)
    return NextResponse.json({ error: "FIELD_LOOKUP_FAILED", message: fieldError.message }, { status: 500 })
  }

  if (!fieldRow) {
    return NextResponse.json({ error: "FIELD_NOT_FOUND", message: "Field not found or inaccessible" }, { status: 404 })
  }

  let query = supabase
    .from("ndvi_indices")
    .select(
      `
        id,
        provider,
        ndvi_value,
        evi_value,
        ndwi_value,
        computed_at,
        satellite_images (
          id,
          captured_at,
          image_url
        )
      `,
    )
    .eq("field_id", fieldId)
    .order("computed_at", { ascending: false })
    .limit(limit)

  if (from) {
    query = query.gte("computed_at", from)
  }
  if (toQuery) {
    query = query.lte("computed_at", toQuery)
  }

  const { data: ndviRows, error: ndviError } = await query
  if (ndviError) {
    console.error("[NDVI API] Failed to fetch NDVI records", ndviError)
    return NextResponse.json({ error: "NDVI_FETCH_FAILED", message: ndviError.message }, { status: 500 })
  }

  const series =
    ndviRows?.map((row) => ({
      id: row.id,
      provider: row.provider,
      ndvi: row.ndvi_value,
      evi: row.evi_value,
      ndwi: row.ndwi_value,
      computedAt: row.computed_at,
      image: Array.isArray(row.satellite_images) && row.satellite_images[0]
        ? {
          id: row.satellite_images[0].id,
          capturedAt: row.satellite_images[0].captured_at,
          previewUrl: row.satellite_images[0].image_url,
        }
        : !Array.isArray(row.satellite_images) && row.satellite_images
          ? {
            id: (row.satellite_images as any).id,
            capturedAt: (row.satellite_images as any).captured_at,
            previewUrl: (row.satellite_images as any).image_url,
          }
          : null,
    })) ?? []

  return NextResponse.json({
    field: {
      id: fieldRow.id,
      name: fieldRow.name,
      lastNdvi: fieldRow.last_ndvi,
      lastReadingAt: fieldRow.last_reading_at,
    },
    count: series.length,
    series,
    latest: series[0] ?? null,
    filters: {
      limit,
      from,
      to: toQuery,
    },
  })
}
