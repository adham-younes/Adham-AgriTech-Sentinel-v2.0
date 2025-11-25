import "dotenv/config"
import { createServiceSupabaseClient } from "../lib/supabase/service-client"
import { processFieldsNdvi, NdviField } from "../lib/ndvi/pipeline"

type CliOptions = {
  fieldId?: string
  fromDate?: string
  days?: number
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = { days: 3 }
  for (const arg of args) {
    if (arg.startsWith("--field=")) {
      options.fieldId = arg.replace("--field=", "")
    } else if (arg.startsWith("--date=")) {
      options.fromDate = arg.replace("--date=", "")
    } else if (arg.startsWith("--days=")) {
      const value = Number(arg.replace("--days=", ""))
      if (!Number.isNaN(value) && value > 0) {
        options.days = value
      }
    }
  }
  return options
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const supabase = createServiceSupabaseClient()

  const targetDate =
    options.fromDate ??
    new Date(Date.now() - (options.days ?? 3) * 24 * 60 * 60 * 1000).toISOString()

  console.info("[update-ndvi] Starting NDVI ingestion", {
    fieldId: options.fieldId ?? "ALL",
    targetDate,
  })

  let query = supabase.from("fields").select("id, latitude, longitude, farms!fields_farm_id_fkey(owner_id)")
  if (options.fieldId) {
    query = query.eq("id", options.fieldId)
  }

  const { data: fieldRows, error } = await query
  if (error) {
    console.error("[update-ndvi] Unable to load fields", error)
    process.exit(1)
  }

  const fields: NdviField[] =
    fieldRows?.map((field: any) => ({
      id: field.id,
      owner_id: field.farms?.owner_id ?? null,
      latitude: field.latitude,
      longitude: field.longitude,
    })) ?? []

  if (fields.length === 0) {
    console.warn("[update-ndvi] No fields found for ingestion")
    return
  }

  const summary = await processFieldsNdvi({ supabase, fields, date: targetDate })
  console.info("[update-ndvi] NDVI ingestion completed", summary)
}

if (require.main === module) {
  main().catch((error) => {
    console.error("[update-ndvi] Run failed", error)
    process.exit(1)
  })
}
