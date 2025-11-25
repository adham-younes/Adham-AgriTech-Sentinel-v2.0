function resolveSensorHubKey(): string | null {
  return (
    process.env.SENSOR_HUB_API_KEY ||
    process.env.SENSORHUB_API_KEY ||
    process.env.NEXT_PUBLIC_SENSOR_HUB_API_KEY ||
    process.env.NEXT_PUBLIC_SENSORHUB_API_KEY ||
    null
  )
}

export async function testSensorNetworkConnection(): Promise<{ status: string; message: string }> {
  try {
    // Accept multiple env names for compatibility
    const baseUrl =
      process.env.SENSOR_HUB_API_URL ||
      process.env.NEXT_PUBLIC_SENSOR_HUB_API_URL ||
      process.env.NEXT_PUBLIC_SENSORHUB_API_URL ||
      process.env.SENSORHUB_API_URL

    if (!baseUrl) {
      return {
        status: "error",
        message:
          "Sensor hub API URL not configured. Set SENSOR_HUB_API_URL (and optional SENSOR_HUB_API_KEY) to enable live probes.",
      }
    }

    const apiKey = resolveSensorHubKey()
    const url = `${baseUrl.replace(/\/$/, "")}/health`
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(apiKey
          ? { [process.env.SENSOR_HUB_API_KEY_HEADER || "X-API-Key"]: apiKey }
          : {}),
      },
      cache: "no-store",
    })

    if (!response.ok) {
      return {
        status: "error",
        message:
          response.status === 401
            ? "Sensor hub authentication failed (401). Double-check SENSOR_HUB_API_KEY or whitelist the deployment IP."
            : `Sensor hub error: ${response.status} ${response.statusText}`,
      }
    }

    const payload = await response.json().catch(() => null)

    if (payload?.status && payload.status !== "ok") {
      return {
        status: "error",
        message: payload.message || "Sensor hub reported a degraded status",
      }
    }

    return {
      status: "success",
      message: "Sensor network reachable",
    }
  } catch (error) {
    return {
      status: "error",
      message: `Sensor hub connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
