const OAUTH_URL = "https://services.sentinel-hub.com/oauth/token"
const PROCESS_URL = "https://services.sentinel-hub.com/api/v1/process"
const WMTS_URL = "https://services.sentinel-hub.com/ogc/wmts"

const clientId = process.env.VITE_SENTINEL_HUB_CLIENT_ID || process.env.SENTINEL_HUB_CLIENT_ID
const clientSecret = process.env.VITE_SENTINEL_HUB_CLIENT_SECRET || process.env.SENTINEL_HUB_CLIENT_SECRET
const configId = process.env.VITE_SENTINEL_HUB_CONFIG_ID || process.env.SENTINEL_HUB_CONFIG_ID

const disableFlag = (process.env.DISABLE_SENTINEL ?? "").trim().toLowerCase()
// Treat missing credentials or config as a hard disable so the app always falls back to Mapbox/EOSDA/Esri
const sentinelDisabled =
  disableFlag === "1" ||
  disableFlag === "true" ||
  !clientId ||
  !clientSecret ||
  !configId

if (!clientId || !clientSecret || !configId) {
  console.warn(
    "[SentinelHub] Sentinel features disabled due to missing credentials/config. The platform will fall back to other imagery providers.",
  )
}

export function isSentinelConfigured(): boolean {
  if (sentinelDisabled) return false
  return Boolean(clientId && clientSecret && configId)
}

interface TokenCache {
  token: string
  expiresAt: number
}

let cachedToken: TokenCache | null = null
const TOKEN_BUFFER_MS = 60 * 1000

async function getAccessToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && cachedToken.expiresAt - TOKEN_BUFFER_MS > now) {
    return cachedToken.token
  }

  if (!clientId || !clientSecret) {
    throw new Error("Sentinel Hub credentials are not configured")
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  })

  const response = await fetch(OAUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Sentinel token request failed (${response.status}): ${text}`)
  }

  const result = (await response.json()) as { access_token: string; expires_in: number }
  cachedToken = {
    token: result.access_token,
    expiresAt: now + (result.expires_in ?? 3600) * 1000,
  }
  return cachedToken.token
}

export interface SentinelBounds {
  west: number
  south: number
  east: number
  north: number
}

function requireInstanceId(): string {
  if (!configId) {
    throw new Error("Sentinel Hub instance/config ID is not configured")
  }
  return configId
}

interface SentinelProcessOptions {
  bounds: SentinelBounds
  from: string
  to?: string
  width?: number
  height?: number
  evalscript: string
  format?: "image/png" | "image/jpeg" | "image/tiff"
  responses?: Array<{ identifier: string; format: { type: string } }>
}

function normalizeDate(date: string): { from: string; to: string } {
  const start = new Date(date)
  const end = new Date(date)
  end.setUTCHours(23, 59, 59, 999)
  return { from: start.toISOString(), to: end.toISOString() }
}

async function callProcessApi(options: SentinelProcessOptions): Promise<ArrayBuffer> {
  const token = await getAccessToken()
  const { bounds, from, to, width = 512, height = 512, evalscript, format = "image/png", responses } = options

  const body = {
    input: {
      bounds: {
        bbox: [bounds.west, bounds.south, bounds.east, bounds.north],
      },
      data: [
        {
          type: "sentinel-2-l2a",
          dataFilter: {
            timeRange: {
              from,
              to: to ?? from,
            },
            mosaickingOrder: "mostRecent",
          },
        },
      ],
    },
    output: {
      width,
      height,
      responses:
        responses ?? [
          {
            identifier: "default",
            format: {
              type: format,
            },
          },
        ],
    },
    evalscript,
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
  if (configId) {
    headers["X-INSTANCE-ID"] = configId
  }

  const response = await fetch(PROCESS_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Sentinel process request failed (${response.status}): ${text}`)
  }

  return await response.arrayBuffer()
}

const TRUE_COLOR_EVALSCRIPT = `//version=3
function setup() {
  return {
    input: ["B04", "B03", "B02"],
    output: {
      bands: 3,
      sampleType: "AUTO"
    }
  };
}

function evaluatePixel(sample) {
  return [sample.B04, sample.B03, sample.B02];
}
`

const NDVI_EVALSCRIPT = `//version=3
function setup() {
  return {
    input: ["B08", "B04"],
    output: {
      bands: 1,
      sampleType: "FLOAT32"
    }
  };
}

function evaluatePixel(sample) {
  const ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04 + 0.0000001);
  return [ndvi];
}
`

export interface SentinelImageOptions {
  bounds: SentinelBounds
  date: string
  width?: number
  height?: number
}

export async function fetchSentinelTrueColorImage(options: SentinelImageOptions): Promise<Buffer> {
  const { bounds, date, width, height } = options
  const { from, to } = normalizeDate(date)
  const buffer = await callProcessApi({
    bounds,
    from,
    to,
    width,
    height,
    evalscript: TRUE_COLOR_EVALSCRIPT,
    format: "image/png",
  })
  return Buffer.from(buffer)
}

export async function fetchSentinelNdviImage(options: SentinelImageOptions): Promise<Buffer> {
  const { bounds, date, width, height } = options
  const { from, to } = normalizeDate(date)
  const buffer = await callProcessApi({
    bounds,
    from,
    to,
    width,
    height,
    evalscript: NDVI_EVALSCRIPT,
    format: "image/png",
  })
  return Buffer.from(buffer)
}

export function toBoundsFromPairs(pairs: [number, number][]): SentinelBounds {
  if (!pairs || pairs.length < 2) {
    throw new Error("Invalid bounds: at least two coordinate pairs are required")
  }
  const lngs = pairs.map((p) => p[0])
  const lats = pairs.map((p) => p[1])
  return {
    west: Math.min(...lngs),
    east: Math.max(...lngs),
    south: Math.min(...lats),
    north: Math.max(...lats),
  }
}

export function toBoundsFromCenter(center: { latitude: number; longitude: number }, delta = 0.01): SentinelBounds {
  return {
    west: center.longitude - delta,
    east: center.longitude + delta,
    south: center.latitude - delta,
    north: center.latitude + delta,
  }
}

interface SentinelTileOptions {
  tileMatrixSet?: string
  tileMatrix: string
  tileRow: string
  tileCol: string
  layer?: string
  format?: string
  style?: string
  timeRange?: string
}

export async function fetchSentinelTile({
  tileMatrixSet = "PopularWebMercator512",
  tileMatrix,
  tileRow,
  tileCol,
  layer = "SENTINEL-2-L2A",
  format = "image/png",
  style = "default",
  timeRange,
}: SentinelTileOptions): Promise<Buffer> {
  const instanceId = requireInstanceId()
  const token = await getAccessToken()
  const params = new URLSearchParams({
    service: "WMTS",
    request: "GetTile",
    version: "1.0.0",
    layer,
    style,
    format,
    TileMatrixSet: tileMatrixSet,
    TileMatrix: tileMatrix,
    TileRow: tileRow,
    TileCol: tileCol,
  })
  if (timeRange) {
    params.set("TIME", timeRange)
  }

  const upstream = `${WMTS_URL}/${instanceId}?${params.toString()}`
  const response = await fetch(upstream, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Sentinel tile request failed (${response.status}): ${text}`)
  }

  const buffer = await response.arrayBuffer()
  return Buffer.from(buffer)
}
