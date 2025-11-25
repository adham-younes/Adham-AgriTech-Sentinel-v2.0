import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

type WeatherCacheEntry = {
  expiresAt: number
  payload: any
}

const weatherCache = new Map<string, WeatherCacheEntry>()
const CACHE_TTL = 15 * 60 * 1000 // 15 minutes

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const buildCacheKey = (fieldId: string) => `field-weather:${fieldId}`

async function fetchWeather(lat: number, lng: number, language: string) {
  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) {
    throw new Error("OpenWeather API key missing")
  }

  const lang = language === "ar" ? "ar" : "en"
  const currentUrl = new URL("https://api.openweathermap.org/data/2.5/weather")
  currentUrl.searchParams.set("lat", lat.toString())
  currentUrl.searchParams.set("lon", lng.toString())
  currentUrl.searchParams.set("appid", apiKey)
  currentUrl.searchParams.set("units", "metric")
  currentUrl.searchParams.set("lang", lang)

  const forecastUrl = new URL("https://api.openweathermap.org/data/2.5/forecast")
  forecastUrl.searchParams.set("lat", lat.toString())
  forecastUrl.searchParams.set("lon", lng.toString())
  forecastUrl.searchParams.set("appid", apiKey)
  forecastUrl.searchParams.set("units", "metric")
  forecastUrl.searchParams.set("cnt", "40")
  forecastUrl.searchParams.set("lang", lang)

  const [currentRes, forecastRes] = await Promise.all([fetch(currentUrl), fetch(forecastUrl)])

  if (!currentRes.ok) {
    throw new Error(`OpenWeather current request failed: ${currentRes.status}`)
  }
  if (!forecastRes.ok) {
    throw new Error(`OpenWeather forecast request failed: ${forecastRes.status}`)
  }

  const current = await currentRes.json()
  const forecast = await forecastRes.json()

  const daily: Array<{ date: string; temp_min: number; temp_max: number; condition: string }> = []
  const seen = new Set<string>()
  for (const entry of forecast.list ?? []) {
    const day = new Date(entry.dt * 1000).toISOString().split("T")[0]
    if (seen.has(day)) continue
    seen.add(day)
    daily.push({
      date: new Date(entry.dt * 1000).toISOString(),
      temp_min: entry.main?.temp_min,
      temp_max: entry.main?.temp_max,
      condition: entry.weather?.[0]?.description ?? "",
    })
    if (daily.length >= 7) break
  }

  return {
    current: {
      temperature: current.main?.temp ?? null,
      feelsLike: current.main?.feels_like ?? null,
      humidity: current.main?.humidity ?? null,
      pressure: current.main?.pressure ?? null,
      windSpeed: current.wind?.speed ?? null,
      condition: current.weather?.[0]?.description ?? "",
    },
    forecast: daily,
  }
}

export async function GET(request: Request, { params }: { params: { fieldId: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })
    }

    const language = new URL(request.url).searchParams.get("lang") ?? "ar"

    const { data: field, error: fieldError } = await supabase
      .from("fields")
      .select("id, name, latitude, longitude, farms(latitude, longitude)")
      .eq("id", params.fieldId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (fieldError) {
      console.error("[Weather API] Failed to load field", fieldError)
      return NextResponse.json({ error: "FIELD_LOOKUP_FAILED", details: fieldError.message }, { status: 500 })
    }

    if (!field) {
      return NextResponse.json({ error: "FIELD_NOT_FOUND" }, { status: 404 })
    }

    const lat = parseNumber(field.latitude ?? (field.farms as any)?.[0]?.latitude)
    const lng = parseNumber(field.longitude ?? (field.farms as any)?.[0]?.longitude)
    if (lat == null || lng == null) {
      return NextResponse.json({ error: "FIELD_COORDS_MISSING", message: "Field missing coordinates" }, { status: 400 })
    }

    const cacheKey = buildCacheKey(params.fieldId)
    const cached = weatherCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({ field: { id: field.id, name: field.name }, ...cached.payload, cached: true })
    }

    const payload = await fetchWeather(lat, lng, language)

    weatherCache.set(cacheKey, {
      payload,
      expiresAt: Date.now() + CACHE_TTL,
    })

    return NextResponse.json({ field: { id: field.id, name: field.name }, ...payload, cached: false })
  } catch (error) {
    console.error("[Weather API] Failed to process request", error)
    return NextResponse.json({ error: "WEATHER_FETCH_FAILED", message: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
