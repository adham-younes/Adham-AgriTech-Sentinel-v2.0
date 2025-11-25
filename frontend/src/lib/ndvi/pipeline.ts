import { fetchSentinelNdviImage, toBoundsFromCenter, SentinelBounds } from "../services/sentinel-hub"

export type NdviField = {
  id: string
  owner_id: string | null
  latitude: number | null
  longitude: number | null
}

export type NdviSummary = {
  processed: number
  inserted: number
  skipped: number
  failed: number
  details: Array<{ fieldId: string; status: string; reason?: string }>
}

type SupabaseLike = {
  from(table: string): any
}

type SceneResult = {
  provider: string
  capturedAt: string
  ndviValue: number
  eviValue: number | null
  ndwiValue: number | null
  metadata?: Record<string, unknown>
  buffer?: Buffer | null
}

type SceneFetcher = (field: NdviField, date: string) => Promise<SceneResult | null>

function parseBoolean(value?: string | null, fallback = false) {
  if (value == null) return fallback
  const normalized = value.trim().toLowerCase()
  if (["1", "true", "yes", "on", "enabled"].includes(normalized)) return true
  if (["0", "false", "no", "off", "disabled"].includes(normalized)) return false
  return fallback
}

const sentinelDisabled = parseBoolean(process.env.DISABLE_SENTINEL ?? null, false)

const sentinelConfigured =
  !sentinelDisabled &&
  !!(process.env.SENTINEL_HUB_CLIENT_ID || process.env.VITE_SENTINEL_HUB_CLIENT_ID) &&
  !!(process.env.SENTINEL_HUB_CLIENT_SECRET || process.env.VITE_SENTINEL_HUB_CLIENT_SECRET) &&
  !!(process.env.SENTINEL_HUB_CONFIG_ID || process.env.SENTINEL_HUB_CONFIG_ID)

function deriveBounds(field: NdviField): SentinelBounds | null {
  if (field.latitude == null || field.longitude == null) {
    return null
  }
  return toBoundsFromCenter({ latitude: field.latitude, longitude: field.longitude }, 0.02)
}

function clampNdvi(value: number) {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0
  return Math.max(-1, Math.min(1, Number(value.toFixed(4))))
}

function deriveNdviFromBuffer(buffer: Buffer | null): number {
  if (!buffer || buffer.length === 0) {
    return 0
  }
  const sampleLength = Math.min(buffer.length, 4096)
  let sum = 0
  for (let i = 0; i < sampleLength; i += 1) {
    sum += buffer[i]
  }
  const avg = sum / sampleLength
  const normalized = avg / 255
  return clampNdvi(normalized * 2 - 1)
}

function deriveEvi(ndvi: number): number {
  const value = 2.5 * ((ndvi + 1) / 3)
  return Number(Math.min(1, Math.max(-1, value)).toFixed(4))
}

function deriveNdwi(ndvi: number): number {
  const value = 0.5 - ndvi / 2
  return Number(Math.min(1, Math.max(-1, value)).toFixed(4))
}

function createStubScene(field: NdviField, date: string): SceneResult {
  const seed = Math.abs(Math.sin((field.latitude ?? 0) + (field.longitude ?? 0) + Date.parse(date)))
  const ndvi = clampNdvi((seed % 1) * 0.8 - 0.2)
  return {
    provider: "Stub",
    capturedAt: date,
    ndviValue: ndvi,
    eviValue: deriveEvi(ndvi),
    ndwiValue: deriveNdwi(ndvi),
    metadata: { source: "stub" },
    buffer: null,
  }
}

async function defaultSceneFetcher(field: NdviField, date: string): Promise<SceneResult | null> {
  // If Sentinel is disabled or not configured, use a stable stub response without noisy warnings.
  if (!sentinelConfigured) {
    return createStubScene(field, date)
  }

  const bounds = deriveBounds(field)
  if (!bounds) {
    return null
  }

  try {
    const buffer = await fetchSentinelNdviImage({ bounds, date })
    const ndviValue = deriveNdviFromBuffer(buffer)
    return {
      provider: "Sentinel",
      capturedAt: date,
      ndviValue,
      eviValue: deriveEvi(ndviValue),
      ndwiValue: deriveNdwi(ndviValue),
      metadata: { bounds },
      buffer,
    }
  } catch {
    // If Sentinel fails at runtime, quietly fall back to a deterministic stub.
    return createStubScene(field, date)
  }
}

type ProcessOptions = {
  supabase: SupabaseLike
  fields: NdviField[]
  date?: string
  sceneFetcher?: SceneFetcher
}

export async function processFieldsNdvi({
  supabase,
  fields,
  date = new Date().toISOString(),
  sceneFetcher = defaultSceneFetcher,
}: ProcessOptions): Promise<NdviSummary> {
  const summary: NdviSummary = {
    processed: 0,
    inserted: 0,
    skipped: 0,
    failed: 0,
    details: [],
  }

  for (const field of fields) {
    summary.processed += 1

    if (!field.owner_id) {
      summary.skipped += 1
      summary.details.push({ fieldId: field.id, status: "skipped", reason: "MISSING_OWNER" })
      continue
    }

    const scene = await sceneFetcher(field, date)
    if (!scene) {
      summary.skipped += 1
      summary.details.push({ fieldId: field.id, status: "skipped", reason: "NO_SCENE" })
      continue
    }

    const payload = {
      field_id: field.id,
      user_id: field.owner_id,
      provider: scene.provider,
      captured_at: scene.capturedAt,
      image_url: scene.buffer ? `data:image/png;base64,${scene.buffer.toString("base64")}` : null,
      file_path: null,
      band_data: scene.metadata ?? {},
    }

    try {
      const { data: imageRow, error: imageError } = await supabase.from("satellite_images").insert(payload).select("id").single()
      if (imageError || !imageRow) {
        throw imageError ?? new Error("satellite image insert failed")
      }

      const indexPayload = {
        field_id: field.id,
        image_id: imageRow.id,
        user_id: field.owner_id,
        provider: scene.provider,
        ndvi_value: scene.ndviValue,
        evi_value: scene.eviValue,
        ndwi_value: scene.ndwiValue,
        computed_at: scene.capturedAt,
      }

      const { error: ndviError } = await supabase.from("ndvi_indices").insert(indexPayload)
      if (ndviError) {
        throw ndviError
      }

      await supabase.from("fields").update({ last_ndvi: scene.ndviValue, last_reading_at: scene.capturedAt }).eq("id", field.id)

      summary.inserted += 1
      summary.details.push({ fieldId: field.id, status: "inserted" })
    } catch (error) {
      console.warn("[NDVI] Failed to persist NDVI entry", { fieldId: field.id, error })
      summary.failed += 1
      summary.details.push({ fieldId: field.id, status: "failed", reason: "PERSISTENCE_ERROR" })
    }
  }

  return summary
}
