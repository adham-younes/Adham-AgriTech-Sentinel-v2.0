import { NextResponse } from "next/server"

import { createServiceSupabaseClient } from "@/lib/supabase/service-client"
import { processFieldsNdvi, type NdviField } from "@/lib/ndvi/pipeline"
import { fetchEOSDAWeatherSnapshots, type EOSDAWeatherSnapshot } from "@/lib/services/eosda"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type SupabaseLike = ReturnType<typeof createServiceSupabaseClient>

type DailyAggregation = {
  date: string
  temperatureSum: number
  humiditySum: number
  windSpeedSum: number
  precipitationSum: number
  count: number
  lastCondition?: string
  snapshots: EOSDAWeatherSnapshot[]
}

type FieldRow = {
  id: string
  latitude: number | null
  longitude: number | null
  farms: { owner_id: string | null } | null
}

type FarmRow = {
  id: string
  latitude: number | null
  longitude: number | null
}

function normaliseDate(dateString: string): string {
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString().slice(0, 10)
  }
  return d.toISOString().slice(0, 10)
}

async function upsertWeatherDay(supabase: SupabaseLike, farmId: string, day: DailyAggregation): Promise<void> {
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

export async function GET() {
  const startedAt = new Date().toISOString()
  const supabase = createServiceSupabaseClient()

  const ndviResult: { summary: any | null; error?: string } = { summary: null }
  const weatherResult: { farms: number; days: number; error?: string } = { farms: 0, days: 1 }

  try {
    // NDVI: run for all fields that have coordinates
    const { data: fieldRows, error: fieldsError } = await supabase
      .from("fields")
      .select("id, latitude, longitude, farms!inner(owner_id)")
      .not("latitude", "is", null)
      .not("longitude", "is", null)

    if (fieldsError) {
      console.error("[CronAnalytics] Unable to load fields for NDVI", fieldsError)
      ndviResult.error = fieldsError.message
    } else if (fieldRows && fieldRows.length > 0) {
      const fields: NdviField[] =
        (fieldRows as unknown as FieldRow[]).map((field) => ({
          id: field.id,
          owner_id: field.farms?.owner_id ?? null,
          latitude: field.latitude,
          longitude: field.longitude,
        })) ?? []

      if (fields.length > 0) {
        const targetDate = new Date().toISOString()
        const summary = await processFieldsNdvi({ supabase, fields, date: targetDate })
        ndviResult.summary = summary
      }
    }
  } catch (error) {
    console.error("[CronAnalytics] NDVI processing failed", error)
    ndviResult.error = error instanceof Error ? error.message : String(error)
  }

  try {
    // Weather: ingest last 24h snapshots per farm (up to 2 days of aggregates)
    const days = 1
    const hours = days * 24
    const { data: farms, error: farmError } = await supabase
      .from("farms")
      .select("id, latitude, longitude")

    if (farmError) {
      console.error("[CronAnalytics] Unable to load farms for weather ingestion", farmError)
      weatherResult.error = farmError.message
    } else if (farms && farms.length > 0) {
      weatherResult.farms = farms.length
      weatherResult.days = days

      for (const farm of farms) {
        if (farm.latitude == null || farm.longitude == null) {
          console.warn("[CronAnalytics] Skipping farm with missing coordinates", { farmId: farm.id })
          continue
        }

        try {
          const snapshots = await fetchEOSDAWeatherSnapshots({
            latitude: farm.latitude,
            longitude: farm.longitude,
            hours,
          })

          if (!snapshots || snapshots.length === 0) {
            console.warn("[CronAnalytics] No weather snapshots from EOSDA", { farmId: farm.id })
            continue
          }

          const perDay = new Map<string, DailyAggregation>()

          for (const snap of snapshots) {
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

          await Promise.all(
            Array.from(perDay.values()).map(async (day) => {
              await upsertWeatherDay(supabase, farm.id, day)
            }),
          )
        } catch (error) {
          console.error("[CronAnalytics] Weather ingestion failed for farm", { farmId: farm.id, error })
        }
      }
    }
  } catch (error) {
    console.error("[CronAnalytics] Weather processing failed", error)
    weatherResult.error = error instanceof Error ? error.message : String(error)
  }

  return NextResponse.json(
    {
      status: "ok",
      startedAt,
      finishedAt: new Date().toISOString(),
      ndvi: ndviResult,
      weather: weatherResult,
    },
    { status: 200 },
  )
}
