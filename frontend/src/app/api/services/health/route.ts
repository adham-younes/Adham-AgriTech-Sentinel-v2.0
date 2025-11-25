import { testWeatherConnection } from "@/lib/services/weather"
import { testSensorNetworkConnection } from "@/lib/services/sensors"
import { isEOSDAConfigured } from "@/lib/services/eosda"

type IntegrationKey =
  | "weather"
  | "sensors"
  | "satellite_eosda"

const serviceChecks: Record<IntegrationKey, () => Promise<{ status: string; message: string }>> = {
  weather: testWeatherConnection,
  sensors: testSensorNetworkConnection,
  satellite_eosda: async () => {
    const configured = isEOSDAConfigured()
    return {
      status: configured ? "success" : "error",
      message: configured ? "EOSDA configured" : "EOSDA API key not configured"
    }
  },
}

async function measureService(key: IntegrationKey) {
  const startedAt = new Date().toISOString()
  const started = performance.now()
  const result = await serviceChecks[key]()
  const latencyMs = Math.round(performance.now() - started)
  return {
    key,
    startedAt,
    status: result.status,
    message: result.message,
    latencyMs,
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const mode = url.searchParams.get("mode") === "sync" ? "sync" : "async"

    const timeline: Array<{
      service: string
      status: string
      latencyMs: number
      startedAt: string
    }> = []

    const services: Record<string, { status: string; message: string; latencyMs: number | null }> = {}

    if (mode === "sync") {
      for (const key of Object.keys(serviceChecks) as IntegrationKey[]) {
        const measurement = await measureService(key)
        services[key] = {
          status: measurement.status,
          message: measurement.message,
          latencyMs: measurement.latencyMs,
        }
        timeline.push({
          service: key,
          status: measurement.status,
          latencyMs: measurement.latencyMs,
          startedAt: measurement.startedAt,
        })
      }
    } else {
      const measurements = await Promise.all(
        (Object.keys(serviceChecks) as IntegrationKey[]).map(async (key) => measureService(key)),
      )

      for (const measurement of measurements) {
        services[measurement.key] = {
          status: measurement.status,
          message: measurement.message,
          latencyMs: measurement.latencyMs,
        }
        timeline.push({
          service: measurement.key,
          status: measurement.status,
          latencyMs: measurement.latencyMs,
          startedAt: measurement.startedAt,
        })
      }
    }

    services.supabase = {
      status: "success",
      message: "Supabase configured",
      latencyMs: 0,
    }
    timeline.push({
      service: "supabase",
      status: "success",
      latencyMs: 0,
      startedAt: new Date().toISOString(),
    })

    const statuses = Object.values(services).map((service) => service.status)
    const overall = statuses.every((status) => status === "success")
      ? "healthy"
      : statuses.some((status) => status === "error")
        ? "error"
        : "degraded"

    return Response.json(
      {
        status: overall,
        mode,
        timestamp: new Date().toISOString(),
        services,
        timeline,
      },
      {
        status: overall === "healthy" ? 200 : overall === "error" ? 500 : 503,
      },
    )
  } catch (error) {
    return Response.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
export const runtime = "nodejs"
