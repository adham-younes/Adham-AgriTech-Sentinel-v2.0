import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

export interface FieldImageryRecord {
  fieldId: string
  sceneId: string
  imageUrl: string
  bounds: [number, number, number, number]
  index?: string
  capturedAt?: string
  provider?: string
  cloudCover?: number
  statistics?: {
    index: string
    mean?: number
    min?: number
    max?: number
    stdDev?: number
  }
  tileUrl?: string
  previewUrl?: string
}

interface FieldImageryRow {
  id?: string
  field_id: string
  scene_id: string | null
  image_url: string | null
  tile_url?: string | null
  preview_url?: string | null
  bounds?: number[] | null
  index?: string | null
  captured_at?: string | null
  provider?: string | null
  cloud_cover?: number | null
  statistics?: Record<string, unknown> | null
  created_at?: string | null
  updated_at?: string | null
}

function isBoundsArray(value: unknown): value is [number, number, number, number] {
  return Array.isArray(value) && value.length === 4 && value.every((item) => typeof item === "number")
}

function mapRowToRecord(row: FieldImageryRow | null): FieldImageryRecord | null {
  if (!row) {
    return null
  }

  if (!row.image_url || !row.scene_id || !isBoundsArray(row.bounds)) {
    return null
  }

  const stats = row.statistics as FieldImageryRecord["statistics"] | null

  return {
    fieldId: row.field_id,
    sceneId: row.scene_id,
    imageUrl: row.image_url,
    bounds: row.bounds,
    index: row.index ?? undefined,
    capturedAt: row.captured_at ?? undefined,
    provider: row.provider ?? undefined,
    cloudCover: row.cloud_cover ?? undefined,
    statistics: stats ?? undefined,
    tileUrl: row.tile_url ?? undefined,
    previewUrl: row.preview_url ?? undefined,
  }
}

async function resolveSupabaseClient(
  supabaseOverride?: SupabaseClient,
): Promise<SupabaseClient | null> {
  if (supabaseOverride) {
    return supabaseOverride
  }

  try {
    return await createSupabaseServerClient()
  } catch (error) {
    console.error("[FieldImagery] Failed to create Supabase client", error)
    return null
  }
}

export interface UpsertFieldImageryOptions {
  supabase?: SupabaseClient
}

export async function upsertFieldImagerySnapshot(
  record: FieldImageryRecord,
  options: UpsertFieldImageryOptions = {},
): Promise<FieldImageryRecord | null> {
  const supabase = await resolveSupabaseClient(options.supabase)
  if (!supabase) {
    return null
  }

  const payload = {
    field_id: record.fieldId,
    scene_id: record.sceneId,
    image_url: record.imageUrl,
    bounds: record.bounds,
    index: record.index ?? null,
    captured_at: record.capturedAt ?? null,
    provider: record.provider ?? null,
    cloud_cover: record.cloudCover ?? null,
    statistics: record.statistics ?? null,
    tile_url: record.tileUrl ?? null,
    preview_url: record.previewUrl ?? null,
  }

  const { data, error } = await supabase
    .from("field_satellite_snapshots")
    .upsert(payload, { onConflict: "field_id" })
    .select()
    .single()

  if (error) {
    console.error("[FieldImagery] Failed to upsert snapshot", error)
    return null
  }

  return mapRowToRecord(data)
}

export interface GetFieldImageryOptions {
  supabase?: SupabaseClient
}

export async function getLatestFieldImagerySnapshot(
  fieldId: string,
  options: GetFieldImageryOptions = {},
): Promise<FieldImageryRecord | null> {
  const supabase = await resolveSupabaseClient(options.supabase)
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from("field_satellite_snapshots")
    .select("*")
    .eq("field_id", fieldId)
    .order("captured_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[FieldImagery] Failed to fetch latest snapshot", error)
    return null
  }

  return mapRowToRecord(data)
}

export interface ListFieldImageryOptions {
  supabase?: SupabaseClient
  fieldId?: string
  limit?: number
}

export async function listFieldImagerySnapshots(
  options: ListFieldImageryOptions = {},
): Promise<FieldImageryRecord[]> {
  const supabase = await resolveSupabaseClient(options.supabase)
  if (!supabase) {
    return []
  }

  let query = supabase.from("field_satellite_snapshots").select("*")

  if (options.fieldId) {
    query = query.eq("field_id", options.fieldId)
  }

  query = query.order("captured_at", { ascending: false })

  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error || !data) {
    if (error) {
      console.error("[FieldImagery] Failed to list snapshots", error)
    }
    return []
  }

  return data
    .map((row) => mapRowToRecord(row as FieldImageryRow))
    .filter((record): record is FieldImageryRecord => !!record)
}
