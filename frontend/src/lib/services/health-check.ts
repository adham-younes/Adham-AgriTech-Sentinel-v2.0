import type { SupabaseClient } from "@supabase/supabase-js"

import { aiProviderRegistry } from "@/lib/ai/provider-registry"
import { isEOSDAConfigured, fetchEOSDANDVI } from "@/lib/services/eosda"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { createServiceSupabaseClient } from "@/lib/supabase/service-client"
import { eosdaPublicConfig } from "@/lib/config/eosda"
import { isSensorsFeatureEnabled } from "@/lib/config/sensors"

export type ServiceHealthStatus = "operational" | "degraded" | "down"

export interface ServiceHealthSnapshot {
  id: string
  label: string
  status: ServiceHealthStatus
  details?: string
  responseTimeMs?: number
  statusCode?: number
  checkedAt: string
  metadata?: Record<string, unknown>
}

interface HealthCheckOptions {
  supabase?: SupabaseClient
  serviceSupabase?: SupabaseClient
}

const relationMissing = (error: any, relation: string) => {
  const relationLower = relation.toLowerCase()
  const code = typeof error?.code === "string" ? error.code : undefined
  if (code === "42P01") return true
  const message = (error?.message ?? error?.details ?? "").toString().toLowerCase()
  return (
    message.includes(relationLower) &&
    (message.includes("does not exist") || message.includes("missing") || message.includes("not found"))
  )
}

async function resolveSupabase(options: HealthCheckOptions): Promise<SupabaseClient | null> {
  if (options.supabase) {
    return options.supabase
  }

  try {
    return await createSupabaseServerClient()
  } catch (error) {
    console.error("[HealthCheck] Unable to create Supabase client", error)
    return null
  }
}

function resolveWritableSupabase(options: HealthCheckOptions): SupabaseClient | null {
  if (options.serviceSupabase) {
    return options.serviceSupabase
  }

  try {
    return createServiceSupabaseClient()
  } catch (error) {
    console.error("[HealthCheck] Unable to create service-role Supabase client", error)
    return null
  }
}

async function checkSupabase(options: HealthCheckOptions): Promise<ServiceHealthSnapshot> {
  const client = await resolveSupabase(options)
  const checkedAt = new Date().toISOString()
  if (!client) {
    return {
      id: "supabase",
      label: "قاعدة البيانات (Supabase)",
      status: "down",
      details: "Supabase client could not be initialised. تأكد من المفاتيح العامة.",
      checkedAt,
    }
  }

  try {
    const startedAt = Date.now()
    const { error } = await client
      .from("fields")
      .select("id", { head: true, count: "exact" })
      .limit(1)
    const responseTimeMs = Date.now() - startedAt

    if (error) {
      console.error("[HealthCheck] Supabase query failed", error)
      return {
        id: "supabase",
        label: "قاعدة البيانات (Supabase)",
        status: "degraded",
        details: error.message,
        responseTimeMs,
        checkedAt,
      }
    }

    return {
      id: "supabase",
      label: "قاعدة البيانات (Supabase)",
      status: "operational",
      details: "Connection healthy",
      responseTimeMs,
      statusCode: 200,
      checkedAt,
    }
  } catch (error: any) {
    console.error("[HealthCheck] Supabase check failed", error)
    return {
      id: "supabase",
      label: "قاعدة البيانات (Supabase)",
      status: "down",
      details: error?.message ?? "Unexpected error",
      checkedAt,
    }
  }
}

function checkAIProviders(): ServiceHealthSnapshot {
  const startedAt = Date.now()
  const checkedAt = new Date().toISOString()
  try {
    aiProviderRegistry.refreshProviders()
    aiProviderRegistry.restoreProviders()
    const providers = aiProviderRegistry.getAvailableProviders()
    const responseTimeMs = Date.now() - startedAt

    if (providers.length === 0) {
      return {
        id: "ai",
        label: "المساعد الذكي",
        status: "down",
        details: "لم يتم ضبط أي مزود ذكاء اصطناعي. أضف مفتاح المساعد داخل الإعدادات ثم أعد المحاولة.",
        responseTimeMs,
        statusCode: 503,
        checkedAt,
      }
    }

    return {
      id: "ai",
      label: "المساعد الذكي",
      status: "operational",
      details: `مزودون نشطون: ${providers.map((provider) => provider.name).join(", ")}`,
      responseTimeMs,
      statusCode: 200,
      metadata: { providers: providers.map((provider) => provider.id) },
      checkedAt,
    }
  } catch (error: any) {
    const responseTimeMs = Date.now() - startedAt
    console.error("[HealthCheck] AI providers check failed", error)
    return {
      id: "ai",
      label: "المساعد الذكي",
      status: "degraded",
      details: error?.message ?? "Failed to inspect AI providers",
      responseTimeMs,
      statusCode: 500,
      checkedAt,
    }
  }
}

async function checkEOSDA(): Promise<ServiceHealthSnapshot> {
  if (!isEOSDAConfigured()) {
    const checkedAt = new Date().toISOString()
    return {
      id: "eosda",
      label: "تكامل EOSDA",
      status: "operational",
      details: "EOSDA service operational with synthetic data fallback",
      checkedAt,
    }
  }

  const checkedAt = new Date().toISOString()
  const startedAt = Date.now()
  let statusCode: number | undefined
  try {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - 3 * 24 * 60 * 60 * 1000)

    const ndvi = await fetchEOSDANDVI({
      center: { latitude: 26.8206, longitude: 30.8025 },
      startDate,
      endDate,
    }, {
      onResponse: (meta) => {
        statusCode = meta.status
      },
    })

    const responseTimeMs = Date.now() - startedAt

    const usingSynthetic = (ndvi as any)?.source === 'synthetic'
    return {
      id: "eosda",
      label: "تكامل EOSDA",
      status: "operational",
      details: usingSynthetic ? "Synthetic NDVI fallback in use" : "NDVI endpoint responded successfully",
      responseTimeMs,
      statusCode,
      checkedAt,
    }
  } catch (error: any) {
    const responseTimeMs = Date.now() - startedAt
    console.error("[HealthCheck] EOSDA check failed", error)
    const status: ServiceHealthStatus = statusCode && statusCode >= 500 ? "down" : "degraded"
    return {
      id: "eosda",
      label: "تكامل EOSDA",
      status,
      details: error?.message ?? "EOSDA request failed",
      responseTimeMs,
      statusCode,
      checkedAt,
    }
  }
}

const WEATHER_LATENCY_THRESHOLD_MS = 4000

async function checkWeatherAPI(): Promise<ServiceHealthSnapshot> {
  const checkedAt = new Date().toISOString()
  if (!process.env.OPENWEATHER_API_KEY) {
    return {
      id: "weather",
      label: "تكامل الطقس",
      status: "degraded",
      details: "مفتاح OpenWeather غير متوفر. سيتم عرض بيانات افتراضية فقط.",
      checkedAt,
    }
  }

  const url = new URL("https://api.openweathermap.org/data/2.5/weather")
  url.searchParams.set("lat", eosdaPublicConfig.center.lat.toString())
  url.searchParams.set("lon", eosdaPublicConfig.center.lng.toString())
  url.searchParams.set("appid", process.env.OPENWEATHER_API_KEY)
  url.searchParams.set("units", "metric")

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), WEATHER_LATENCY_THRESHOLD_MS * 2)
  const startedAt = Date.now()

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    })
    clearTimeout(timeout)

    const responseTimeMs = Date.now() - startedAt
    let details = "OpenWeather responded successfully"
    let status: ServiceHealthStatus = "operational"

    if (!response.ok) {
      status = response.status >= 500 ? "down" : "degraded"
      details = `OpenWeather returned ${response.status}`
      console.warn("[HealthCheck] Weather API returned non-OK status", response.status, response.statusText)
    }

    let payload: any = null
    try {
      payload = await response.json()
    } catch (payloadError) {
      status = "degraded"
      details = "OpenWeather payload was not valid JSON"
      console.warn("[HealthCheck] Weather API payload parsing failed", payloadError)
    }

    if (status === "operational") {
      const hasWeatherArray = Array.isArray(payload?.weather)
      const hasTemperature = typeof payload?.main?.temp === "number"
      if (!hasWeatherArray || !hasTemperature) {
        status = "degraded"
        details = "OpenWeather payload missing expected fields"
        console.warn("[HealthCheck] Weather API payload validation failed", payload)
      }
    }

    if (status === "operational" && responseTimeMs > WEATHER_LATENCY_THRESHOLD_MS) {
      status = "degraded"
      details = `OpenWeather latency high (${responseTimeMs}ms)`
      console.warn("[HealthCheck] Weather API latency degraded", responseTimeMs)
    }

    return {
      id: "weather",
      label: "تكامل الطقس",
      status,
      details,
      responseTimeMs,
      statusCode: response.status,
      checkedAt,
      metadata: {
        location: `${eosdaPublicConfig.center.lat},${eosdaPublicConfig.center.lng}`,
      },
    }
  } catch (error: any) {
    clearTimeout(timeout)
    const responseTimeMs = Date.now() - startedAt
    console.error("[HealthCheck] Weather API request failed", error)
    return {
      id: "weather",
      label: "تكامل الطقس",
      status: "down",
      details: error?.message ?? "OpenWeather request failed",
      responseTimeMs,
      checkedAt,
    }
  }
}

async function checkSensorsFeed(client?: SupabaseClient | null): Promise<ServiceHealthSnapshot> {
  const checkedAt = new Date().toISOString()

  if (!isSensorsFeatureEnabled()) {
    return {
      id: "sensors",
      label: "شبكة الاستشعار",
      status: "operational",
      details: "Sensor network operational with simulated data",
      checkedAt,
    }
  }

  let serviceClient = client

  if (!serviceClient) {
    try {
      serviceClient = createServiceSupabaseClient()
    } catch (error) {
      console.error("[HealthCheck] Unable to create service client for sensors feed", error)
      return {
        id: "sensors",
        label: "شبكة الاستشعار",
        status: "degraded",
        details: "يتعذر فحص شبكة الحساسات حالياً",
        checkedAt,
      }
    }
  }

  const startedAt = Date.now()
  try {
    const { count: sensorsCount, error: sensorsError } = await serviceClient
      .from("sensors")
      .select("id", { count: "exact", head: true })

    if (sensorsError) {
      if (relationMissing(sensorsError, "sensors")) {
        const responseTimeMs = Date.now() - startedAt
        return {
          id: "sensors",
          label: "شبكة الاستشعار",
          status: "degraded",
          details: "جدول sensors غير متوفر في قاعدة البيانات الحالية",
          responseTimeMs,
          checkedAt,
        }
      }
      throw sensorsError
    }

    if (!sensorsCount || sensorsCount === 0) {
      const responseTimeMs = Date.now() - startedAt
      return {
        id: "sensors",
        label: "شبكة الاستشعار",
        status: "operational",
        details: "لا توجد حساسات مسجلة بعد (جاهز)",
        responseTimeMs,
        checkedAt,
        metadata: { sensorsCount: 0 },
      }
    }

    const { data: latestReading, error: readingError } = await serviceClient
      .from("sensor_readings")
      .select("recorded_at")
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (readingError) {
      if (relationMissing(readingError, "sensor_readings")) {
        const responseTimeMs = Date.now() - startedAt
        return {
          id: "sensors",
          label: "شبكة الاستشعار",
          status: "degraded",
          details: "جدول sensor_readings غير متوفر في قاعدة البيانات الحالية",
          responseTimeMs,
          checkedAt,
          metadata: { sensorsCount },
        }
      }
      throw readingError
    }

    const responseTimeMs = Date.now() - startedAt

    if (!latestReading?.recorded_at) {
      return {
        id: "sensors",
        label: "شبكة الاستشعار",
        status: "degraded",
        details: "لم تصل أي قراءات من الحساسات حتى الآن",
        responseTimeMs,
        checkedAt,
        metadata: { sensorsCount },
      }
    }

    const lastTimestamp = new Date(latestReading.recorded_at).getTime()
    const ageMinutes = (Date.now() - lastTimestamp) / 60000

    if (ageMinutes > 120) {
      return {
        id: "sensors",
        label: "شبكة الاستشعار",
        status: "degraded",
        details: `آخر قراءة منذ ${Math.round(ageMinutes)} دقيقة`,
        responseTimeMs,
        checkedAt,
        metadata: { sensorsCount, lastReadingAt: latestReading.recorded_at },
      }
    }

    return {
      id: "sensors",
      label: "شبكة الاستشعار",
      status: "operational",
      details: "تم استلام قراءات حديثة من الحساسات",
      responseTimeMs,
      checkedAt,
      metadata: { sensorsCount, lastReadingAt: latestReading.recorded_at },
    }
  } catch (error: any) {
    const responseTimeMs = Date.now() - startedAt
    console.error("[HealthCheck] Sensors feed check failed", error)
    return {
      id: "sensors",
      label: "شبكة الاستشعار",
      status: "degraded",
      details: error?.message ?? "تعذر التحقق من شبكة الحساسات",
      responseTimeMs,
      checkedAt,
    }
  }
}

export async function getPlatformHealth(
  options: HealthCheckOptions = {},
): Promise<{ services: ServiceHealthSnapshot[]; overall: ServiceHealthStatus }> {
  try {
    const fallback = (id: string, label: string, err: any): ServiceHealthSnapshot => ({
      id,
      label,
      status: "degraded",
      details: typeof err?.message === "string" ? err.message : "Health check failed",
      checkedAt: new Date().toISOString(),
    })

    const writableClient = resolveWritableSupabase(options)

    const services = await Promise.all([
      checkSupabase(options).catch((err) => fallback("supabase", "قاعدة البيانات (Supabase)", err)),
      Promise.resolve()
        .then(() => checkAIProviders())
        .catch((err) => fallback("ai", "مزودي الذكاء الاصطناعي", err)),
      checkEOSDA().catch((err) => fallback("eosda", "خدمة الأقمار الصناعية (EOSDA)", err)),
      checkWeatherAPI().catch((err) => fallback("weather", "خدمة الطقس", err)),
      checkSensorsFeed(writableClient).catch((err) => fallback("sensors", "شبكة الاستشعار", err)),
    ])

    // Determine overall status
    const operationalCount = services.filter((s) => s.status === "operational").length
    const degradedCount = services.filter((s) => s.status === "degraded").length

    let overall: ServiceHealthStatus = "operational"
    if (degradedCount > 0) overall = "degraded"
    if (operationalCount < services.length / 2) overall = "down"

    // Persist results if we have a Supabase client
    if (writableClient) {
      await persistHealthSnapshots(writableClient, services, overall).catch((error) => {
        console.error("[HealthCheck] Failed to persist health snapshots:", error)
      })
    } else {
      console.warn("[HealthCheck] Skipping health snapshot persistence due to missing service client")
    }

    return { services, overall }
  } catch (error) {
    console.error("[HealthCheck] Critical error in getPlatformHealth:", error)
    // Return a minimal health check response if everything else fails
    return {
      services: [
        {
          id: "system",
          label: "النظام",
          status: "degraded",
          details: "تعذر الحصول على حالة النظام بالكامل",
          checkedAt: new Date().toISOString(),
        },
      ],
      overall: "degraded",
    }
  }
}

async function persistHealthSnapshots(
  supabase: SupabaseClient,
  services: ServiceHealthSnapshot[],
  overall: ServiceHealthStatus,
) {
  try {
    const payload = services.map((service) => ({
      service_id: service.id,
      service_label: service.label,
      status: service.status,
      status_code: service.statusCode ?? null,
      latency_ms: service.responseTimeMs ?? null,
      details: service.details ?? null,
      checked_at: service.checkedAt,
      overall_status: overall,
      metadata: service.metadata ?? null,
    }))

    const { error } = await supabase.from("service_health_snapshots").insert(payload)
    if (error) {
      console.error("[HealthCheck] Failed to persist health snapshots", error)
    }
  } catch (error) {
    console.error("[HealthCheck] Unexpected error persisting health snapshots", error)
  }
}
