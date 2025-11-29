const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const getEnv = (...keys: string[]) => {
  // Check if we're in browser or server
  if (typeof window !== 'undefined') {
    // Browser: use window.ENV or return undefined
    return undefined
  }
  // Server: use process.env
  for (const key of keys) {
    const value = process.env[key]
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim()
    }
  }
  return undefined
}

const getPublicEnv = (key: string) => {
  if (typeof window !== 'undefined') {
    // Browser: try to get from window or return undefined
    return undefined
  }
  return process.env[key]
}

export const eosdaPublicConfig = {
  apiKey: getEnv("NEXT_PUBLIC_EOSDA_API_KEY") || "apk.cefa9921669b0857be282894813d1213ed88c5e8299e29a5e91db105464aa232",
  apiUrl: (getEnv("NEXT_PUBLIC_EOSDA_API_URL", "NEXT_PUBLIC_EOSDA_API_BASE_URL") || "https://api.eosda.com").replace(/\/$/, ""),
  apiVersion: getEnv("NEXT_PUBLIC_EOSDA_API_VERSION") || "v1",
  center: {
    lat: toNumber(getPublicEnv("NEXT_PUBLIC_EOSDA_CENTER_LAT"), 25.30084), // User's farm location
    lng: toNumber(getPublicEnv("NEXT_PUBLIC_EOSDA_CENTER_LNG"), 32.55524), // User's farm location
  },
  zoom: {
    default: toNumber(getPublicEnv("NEXT_PUBLIC_EOSDA_DEFAULT_ZOOM"), 6),
    min: toNumber(getPublicEnv("NEXT_PUBLIC_EOSDA_MIN_ZOOM"), 1),
    max: toNumber(getPublicEnv("NEXT_PUBLIC_EOSDA_MAX_ZOOM"), 18),
  },
  defaultCloudCoverage: toNumber(getPublicEnv("NEXT_PUBLIC_EOSDA_DEFAULT_CLOUD_COVERAGE"), 20),
}

// Server-only config - should never be accessed from client
export const eosdaServerConfig = (() => {
  // Only access process.env on server-side
  if (typeof window !== 'undefined') {
    // Return safe defaults for client-side
    return {
      apiKey: "",
      apiUrl: "https://api-connect.eos.com",
      apiVersion: "v1",
      accountEmail: "",
      webhookSecret: "",
      rateLimit: {
        perMinute: 300,
        perHour: 10000,
      },
      cacheTTLSeconds: 3600,
      request: {
        timeoutMs: 30000,
        retryAttempts: 3,
        retryDelayMs: 1000,
      },
    }
  }

  // Server-side: safe to access process.env
  return {
    apiKey: getEnv("EOSDA_API_KEY") || "",
    apiUrl: (
      getEnv("EOSDA_API_URL", "EOSDA_API_BASE_URL", "NEXT_PUBLIC_EOSDA_API_URL", "NEXT_PUBLIC_EOSDA_API_BASE_URL") ||
      "https://api-connect.eos.com"
    ).replace(/\/$/, ""),
    apiVersion: getEnv("EOSDA_API_VERSION", "NEXT_PUBLIC_EOSDA_API_VERSION") || "v1",
    accountEmail: getEnv("EOSDA_ACCOUNT_EMAIL") || "",
    webhookSecret: getEnv("EOSDA_WEBHOOK_SECRET") || "",
    rateLimit: {
      perMinute: toNumber(process.env.EOSDA_RATE_LIMIT_PER_MINUTE, 300),
      perHour: toNumber(process.env.EOSDA_RATE_LIMIT_PER_HOUR, 10000),
    },
    cacheTTLSeconds: toNumber(process.env.EOSDA_CACHE_TTL_SECONDS, 3600),
    request: {
      timeoutMs: toNumber(process.env.EOSDA_TIMEOUT_MILLISECONDS, 30000),
      retryAttempts: toNumber(process.env.EOSDA_RETRY_ATTEMPTS, 3),
      retryDelayMs: toNumber(process.env.EOSDA_RETRY_DELAY_MS, 1000),
    },
  }
})()

export const eosdaGlobalBounds = {
  center: [eosdaPublicConfig.center.lat, eosdaPublicConfig.center.lng] as [number, number],
  zoom: eosdaPublicConfig.zoom.default,
  minZoom: eosdaPublicConfig.zoom.min,
  maxZoom: eosdaPublicConfig.zoom.max,
}

export const eosdaRegions = {
  world: {
    label: "World",
    center: [20, 0] as [number, number],
    zoom: 2,
    bounds: [
      [-90, -180],
      [90, 180],
    ] as [number, number][],
  },
  egypt: {
    label: "Egypt",
    center: [25.30084, 32.55524] as [number, number], // User's farm location
    zoom: 10, // Higher zoom for farm-level detail
    bounds: [
      [24.5, 31.5],
      [26.5, 34.0],
    ] as [number, number][],
  },
}

export const hasEOSDACredentials = Boolean(eosdaServerConfig.apiKey)
