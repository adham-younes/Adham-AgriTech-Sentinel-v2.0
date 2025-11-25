import "dotenv/config"

import { createServiceSupabaseClient } from "../lib/supabase/service-client"
import { fetchEOSDAWeatherSnapshots } from "../lib/services/eosda"

type CliOptions = {
  farmId?: string
  days?: number
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = { days: 1 }
  for (const arg of args) {
    if (arg.startsWith("--farm=")) {
      options.farmId = arg.replace("--farm=", "")
    } else if (arg.startsWith("--days=")) {
      const value = Number(arg.replace("--days=", ""))
      if (!Number.isNaN(value) && value > 0) {
        options.days = value
      }
    }
  }
  return options
}

type SupabaseLike = ReturnType<typeof createServiceSupabaseClient>

async function loadFarms(supabase: SupabaseLike, farmId?: string) {
  let query = supabase.from("farms").select("id, latitude, longitude")
  if (farmId) {
    query = query.eq("id", farmId)
  }
  const { data, error } = await query
  if (error) {
    throw error
  }
  return (data as Array<{ id: string; latitude: number | null; longitude: number | null }>) ?? []
}

type DailyAggregation = {
  date: string
  temperatureSum: number
  humiditySum: number
  windSpeedSum: number
  precipitationSum: number
  count: number
  lastCondition?: string
  snapshots: any[]
}

function normaliseDate(dateString: string): string {
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString().slice(0, 10)
  }
  return d.toISOString().slice(0, 10)
}

async function upsertWeatherDay(
  supabase: SupabaseLike,
  farmId: string,
  day: DailyAggregation,
): Promise<void> {
  const temperature = day.count > 0 ? day.temperatureSum / day.count : null
  const humidity = day.count > 0 ? day.humiditySum / day.count : null
  const windSpeed = day.count > 0 ? day.windSpeedSum / day.count : null
  const precipitation = day.count > 0 ? day.precipitationSum / day.count : null

  await supabase
    .from("weather_data")
    .delete()
    .eq("farm_id", farmId)
    .eq("date", day.date)

  const payload = {
    farm_id: farmId,
    date: day.date,
    temperature,
    humidity,
    precipitation,
    wind_speed: windSpeed,
    wind_direction: null,
    pressure: null,
    weather_condition: day.lastCondition ?? null,
    weather_condition_ar: null,
    forecast_data: day.snapshots,
  }

  const { error } = await supabase.from("weather_data").insert(payload)
  if (error) {
    throw error
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const days = Math.max(1, Math.min(options.days ?? 1, 7))

  const supabase = createServiceSupabaseClient()

  console.info("[update-weather] Starting EOSDA weather ingestion", {
    farmId: options.farmId ?? "ALL",
    days,
  })

  const farms = await loadFarms(supabase, options.farmId)
  if (farms.length === 0) {
    console.warn("[update-weather] No farms found for ingestion")
    return
  }

  const hours = days * 24

  for (const farm of farms) {
    if (farm.latitude == null || farm.longitude == null) {
      console.warn("[update-weather] Skipping farm with missing coordinates", { farmId: farm.id })
      continue
    }

    try {
      const snapshots = await fetchEOSDAWeatherSnapshots({
        latitude: farm.latitude,
        longitude: farm.longitude,
        hours,
      })

      if (!snapshots || snapshots.length === 0) {
        console.warn("[update-weather] No weather snapshots from EOSDA", { farmId: farm.id })
        continue
      }

      const perDay = new Map<string, DailyAggregation>()

      for (const snap of snapshots as any[]) {
        const dateKey = normaliseDate(snap.capturedAt)
        let agg = perDay.get(dateKey)
        if (!agg) {
          agg = {
            date: dateKey,
            temperatureSum: 0,
            humiditySum: 0,
            windSpeedSum: 0,
            precipitationSum: 0,
            count: 0,
            lastCondition: undefined,
            snapshots: [],
          }
          perDay.set(dateKey, agg)
        }

        const temperature = typeof snap.temperature === "number" ? snap.temperature : null
        const humidity = typeof snap.humidity === "number" ? snap.humidity : null
        const windSpeed = typeof snap.windSpeed === "number" ? snap.windSpeed : null
        const precipitation = typeof snap.precipitation === "number" ? snap.precipitation : null

        if (temperature != null) agg.temperatureSum += temperature
        if (humidity != null) agg.humiditySum += humidity
        if (windSpeed != null) agg.windSpeedSum += windSpeed
        if (precipitation != null) agg.precipitationSum += precipitation
        agg.count += 1
        if (snap.summary) {
          agg.lastCondition = snap.summary
        }
        agg.snapshots.push(snap)
      }

      for (const day of perDay.values()) {
        await upsertWeatherDay(supabase, farm.id, day)
        console.info("[update-weather] Upserted weather_data", {
          farmId: farm.id,
          date: day.date,
          count: day.count,
        })
      }
    } catch (error) {
      console.error("[update-weather] Failed for farm", { farmId: farm.id, error })
    }
  }

  console.info("[update-weather] Completed EOSDA weather ingestion")
}

if (require.main === module) {
  main().catch((error) => {
    console.error("[update-weather] Run failed", error)
    process.exit(1)
  })
}

