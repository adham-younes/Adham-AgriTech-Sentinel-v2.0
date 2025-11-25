export interface ESDTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}

export interface ESDSatelliteImageRequest {
  center: { latitude: number; longitude: number }
  zoom: number
  size: { width: number; height: number }
}

interface ESDSatelliteImageApiResponse {
  id?: string
  product_id?: string
  url?: string
  image_url?: string
  asset_url?: string
  bounds?: {
    north: number
    south: number
    east: number
    west: number
  }
  bounding_box?: {
    north: number
    south: number
    east: number
    west: number
  }
  resolution?: number
  gsd?: number
  cloudCoverage?: number
  cloud_coverage?: number
  capturedAt?: string
  captured_at?: string
  timestamp?: string
}

export interface ESDSatelliteImageResponse {
  id?: string
  url: string
  bounds?: {
    north: number
    south: number
    east: number
    west: number
  }
  resolution?: number
  cloudCoverage?: number
  capturedAt?: string
}

export interface ESDNDVIRequest {
  center: { latitude: number; longitude: number }
  dateRange: { start: Date; end: Date }
}

interface ESDNDVIImageApiResponse {
  id?: string
  map_url?: string
  url?: string
  bounds?: {
    north: number
    south: number
    east: number
    west: number
  }
  bounding_box?: {
    north: number
    south: number
    east: number
    west: number
  }
  ndvi_value?: number
  average_ndvi?: number
  statistics?: {
    mean?: number
  }
  date?: string
  captured_at?: string
}

export interface ESDNDVIResponse {
  id?: string
  url: string
  bounds?: {
    north: number
    south: number
    east: number
    west: number
  }
  ndvi_value: number
  date: string
}

interface TokenCache {
  token: string
  expiresAt: number
}

let cachedToken: TokenCache | null = null

function getESDConfig() {
  const clientId = process.env.ESD_CLIENT_ID
  const clientSecret = process.env.ESD_CLIENT_SECRET
  const authUrl = process.env.ESD_AUTH_URL
  const apiBaseUrl = process.env.ESD_API_BASE_URL

  return {
    clientId,
    clientSecret,
    authUrl,
    apiBaseUrl,
    isValid: Boolean(clientId && clientSecret && authUrl && apiBaseUrl),
  }
}

export function isESDConfigured(): boolean {
  return getESDConfig().isValid
}

async function requestToken(): Promise<TokenCache> {
  const { clientId, clientSecret, authUrl, isValid } = getESDConfig()

  if (!isValid || !clientId || !clientSecret || !authUrl) {
    throw new Error('ESD credentials not configured')
  }

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to obtain ESD token: ${response.status} ${errorText}`)
  }

  const data = (await response.json()) as ESDTokenResponse

  return {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - 60_000,
  }
}

export async function getESDAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token
  }

  cachedToken = await requestToken()
  return cachedToken.token
}

async function requestFromESD<T>(path: string, init?: RequestInit & { query?: Record<string, string> }): Promise<T> {
  const { apiBaseUrl } = getESDConfig()

  if (!apiBaseUrl) {
    throw new Error('ESD API base URL not configured')
  }

  const url = new URL(path, apiBaseUrl)
  if (init?.query) {
    Object.entries(init.query).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, value)
      }
    })
  }

  const token = await getESDAccessToken()

  const response = await fetch(url.toString(), {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ESD request failed (${response.status}): ${errorText}`)
  }

  return (await response.json()) as T
}

function normalizeBounds(bounds?: {
  north: number
  south: number
  east: number
  west: number
} | null): ESDSatelliteImageResponse['bounds'] {
  if (!bounds) {
    return undefined
  }

  return {
    north: bounds.north,
    south: bounds.south,
    east: bounds.east,
    west: bounds.west,
  }
}

export async function fetchESDSatelliteImage({ center, zoom, size }: ESDSatelliteImageRequest): Promise<ESDSatelliteImageResponse> {
  const response = await requestFromESD<ESDSatelliteImageApiResponse>('/imagery/satellite', {
    query: {
      lat: center.latitude.toString(),
      lon: center.longitude.toString(),
      zoom: zoom.toString(),
      width: size.width.toString(),
      height: size.height.toString(),
    },
  })

  const imageUrl = response.url || response.image_url || response.asset_url || ''

  if (!imageUrl) {
    throw new Error('Missing satellite image URL in ESD response')
  }

  return {
    id: response.id || response.product_id,
    url: imageUrl,
    bounds: normalizeBounds(response.bounds || response.bounding_box || null),
    resolution: response.resolution ?? response.gsd,
    cloudCoverage: response.cloudCoverage ?? response.cloud_coverage,
    capturedAt: response.capturedAt || response.captured_at || response.timestamp,
  }
}

export async function fetchESDNDVIImage({ center, dateRange }: ESDNDVIRequest): Promise<ESDNDVIResponse> {
  const response = await requestFromESD<ESDNDVIImageApiResponse>('/analytics/ndvi', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      latitude: center.latitude,
      longitude: center.longitude,
      start_date: dateRange.start.toISOString(),
      end_date: dateRange.end.toISOString(),
    }),
  })

  const bounds = response.bounds || response.bounding_box || undefined
  const ndviValue =
    response.ndvi_value ?? response.average_ndvi ?? response.statistics?.mean

  if (typeof ndviValue !== 'number') {
    throw new Error('Invalid NDVI response from ESD API')
  }

  const url = response.url || response.map_url || ''
  if (!url) {
    throw new Error('Missing NDVI URL in ESD response')
  }

  return {
    id: response.id,
    url,
    bounds: normalizeBounds(bounds ?? null),
    ndvi_value: ndviValue,
    date: response.date || response.captured_at || new Date().toISOString(),
  }
}

export async function testESDConnection(): Promise<{ status: 'success' | 'error'; message: string }> {
  try {
    await getESDAccessToken()
    return {
      status: 'success',
      message: 'ESD authentication successful',
    }
  } catch (error) {
    return {
      status: 'error',
      message: `ESD connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
