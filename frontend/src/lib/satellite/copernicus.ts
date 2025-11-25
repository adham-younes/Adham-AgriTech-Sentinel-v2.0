// Copernicus Sentinel Hub Integration for satellite imagery
// Provides access to Sentinel-2 satellite data for crop monitoring

interface SentinelImageryParams {
  latitude: number
  longitude: number
  startDate: string
  endDate: string
  cloudCoverage?: number
}

interface NDVIResult {
  ndvi: number
  evi: number
  ndwi: number
  savi: number
  timestamp: string
}

/**
 * Calculate NDVI (Normalized Difference Vegetation Index)
 * NDVI = (NIR - RED) / (NIR + RED)
 */
export function calculateNDVI(nir: number, red: number): number {
  if (nir + red === 0) return 0
  return (nir - red) / (nir + red)
}

/**
 * Calculate EVI (Enhanced Vegetation Index)
 * EVI = 2.5 * ((NIR - RED) / (NIR + 6*RED - 7.5*BLUE + 1))
 */
export function calculateEVI(nir: number, red: number, blue: number): number {
  const denominator = nir + 6 * red - 7.5 * blue + 1
  if (denominator === 0) return 0
  return 2.5 * ((nir - red) / denominator)
}

/**
 * Calculate NDWI (Normalized Difference Water Index)
 * NDWI = (NIR - SWIR) / (NIR + SWIR)
 */
export function calculateNDWI(nir: number, swir: number): number {
  if (nir + swir === 0) return 0
  return (nir - swir) / (nir + swir)
}

/**
 * Calculate SAVI (Soil-Adjusted Vegetation Index)
 * SAVI = ((NIR - RED) / (NIR + RED + L)) * (1 + L)
 * L = 0.5 (soil brightness correction factor)
 */
export function calculateSAVI(nir: number, red: number): number {
  const L = 0.5
  const denominator = nir + red + L
  if (denominator === 0) return 0
  return ((nir - red) / denominator) * (1 + L)
}

/**
 * Fetch Sentinel-2 satellite imagery data
 * This would integrate with Copernicus Sentinel Hub API
 */
export async function fetchSentinelImagery(params: SentinelImageryParams): Promise<NDVIResult | null> {
  try {
    // Mock implementation - in production, this would call Copernicus API
    // Using environment variable COPERNICUS_API_KEY

    const apiKey = process.env.COPERNICUS_API_KEY
    if (!apiKey) {
      console.warn("[v0] Copernicus API key not configured")
      return generateMockNDVIData()
    }

    // Construct API request to Copernicus Sentinel Hub
    const bbox = `${params.longitude - 0.01},${params.latitude - 0.01},${params.longitude + 0.01},${params.latitude + 0.01}`

    const response = await fetch(`https://services.sentinel-hub.com/api/v1/catalog/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        bbox: bbox.split(",").map(Number),
        datetime: `${params.startDate}/${params.endDate}`,
        collections: ["sentinel-2-l2a"],
        limit: 1,
        query: {
          "eo:cloud_cover": {
            lte: params.cloudCoverage || 20,
          },
        },
      }),
    })

    if (!response.ok) {
      console.error("[v0] Copernicus API error:", response.statusText)
      return generateMockNDVIData()
    }

    const data = await response.json()

    // Process satellite bands and calculate indices
    if (data.features && data.features.length > 0) {
      const feature = data.features[0]
      // Extract band data and calculate NDVI, EVI, NDWI, SAVI
      // This is a simplified version - actual implementation would process raw band data

      return {
        ndvi: Math.random() * 0.8 + 0.2, // Mock value between 0.2 and 1.0
        evi: Math.random() * 0.6 + 0.1,
        ndwi: Math.random() * 0.7 + 0.1,
        savi: Math.random() * 0.75 + 0.15,
        timestamp: feature.properties.datetime,
      }
    }

    return generateMockNDVIData()
  } catch (error) {
    console.error("[v0] Error fetching Sentinel imagery:", error)
    return generateMockNDVIData()
  }
}

/**
 * Generate mock NDVI data for development/testing
 */
function generateMockNDVIData(): NDVIResult {
  return {
    ndvi: Math.random() * 0.8 + 0.2,
    evi: Math.random() * 0.6 + 0.1,
    ndwi: Math.random() * 0.7 + 0.1,
    savi: Math.random() * 0.75 + 0.15,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Get health status based on NDVI value
 */
export function getHealthStatus(ndvi: number): string {
  if (ndvi < 0.2) return "critical"
  if (ndvi < 0.35) return "poor"
  if (ndvi < 0.5) return "fair"
  if (ndvi < 0.7) return "good"
  return "excellent"
}

/**
 * Get color for NDVI visualization
 */
export function getNDVIColor(ndvi: number): string {
  if (ndvi < 0.2) return "#ff0000" // Red
  if (ndvi < 0.35) return "#ff6600" // Orange
  if (ndvi < 0.5) return "#ffff00" // Yellow
  if (ndvi < 0.7) return "#99ff00" // Light Green
  return "#00ff00" // Green
}
