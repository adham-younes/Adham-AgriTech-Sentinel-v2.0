#!/usr/bin/env node

const endpoint = process.env.HEALTH_ENDPOINT || "http://localhost:3003/api/system/health"
const intervalMs = Number(process.env.HEALTH_INTERVAL_MS || 60000)
const alertThreshold = Number(process.env.HEALTH_ALERT_THRESHOLD || 3)
const iterations = Number(process.env.HEALTH_MAX_ITERATIONS || 0)

const consecutiveIssues = new Map()
let checksExecuted = 0

async function runHealthCheck() {
  const startedAt = Date.now()
  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    })
    const durationMs = Date.now() - startedAt
    const payload = await response.json()

    if (!response.ok) {
      console.error(
        `[HealthMonitor] Health endpoint returned ${response.status} in ${durationMs}ms: ${response.statusText}`,
      )
    }

    const degradedServices = []

    for (const service of payload?.services ?? []) {
      if (service.status === "operational") {
        consecutiveIssues.set(service.id, 0)
        continue
      }

      const count = (consecutiveIssues.get(service.id) || 0) + 1
      consecutiveIssues.set(service.id, count)
      degradedServices.push({ service, count })

      if (count >= alertThreshold) {
        console.error(
          `[HealthMonitor][ALERT] ${service.label} reported '${service.status}' ${count} times consecutively. Details: ${service.details ?? "n/a"}`,
        )
      } else {
        console.warn(
          `[HealthMonitor] ${service.label} reported '${service.status}' (streak ${count}/${alertThreshold}). Details: ${service.details ?? "n/a"}`,
        )
      }
    }

    if (degradedServices.length === 0) {
      console.log(
        `[HealthMonitor] All services operational after ${durationMs}ms. Overall status: ${payload?.overall ?? "unknown"}.`,
      )
    }
  } catch (error) {
    console.error("[HealthMonitor] Failed to call health endpoint", error)
  } finally {
    checksExecuted += 1
    if (iterations > 0 && checksExecuted >= iterations) {
      process.exit(0)
    }
  }
}

async function main() {
  console.log(
    `[HealthMonitor] Monitoring ${endpoint} every ${intervalMs}ms (alert threshold: ${alertThreshold}, iterations: ${
      iterations || "∞"
    }).`,
  )
  await runHealthCheck()
  if (iterations > 0 && checksExecuted >= iterations) {
    return
  }
  setInterval(runHealthCheck, intervalMs)
}

main().catch((error) => {
  console.error("[HealthMonitor] Unexpected error", error)
  process.exit(1)
})
