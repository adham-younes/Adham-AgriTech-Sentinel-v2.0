export interface SatelliteAnalysisResponse {
  field?: {
    id: string
    name?: string | null
    cropType?: string | null
    soilType?: string | null
    areaFeddan?: number | null
    center?: { latitude: number; longitude: number }
  }
  satellite?: {
    ndviValue?: number | null
    ndviMean?: number | null
    chlorophyll?: {
      value?: number | null
      capturedAt?: string | null
      mapUrl?: string | null
    }
    soilMoisture?: {
      value?: number | null
      capturedAt?: string | null
      sourceRaw?: number | null
    }
    capturedAt?: string | null
    imageUrl?: string | null
    statistics?: {
      mean?: number | null
      min?: number | null
      max?: number | null
    } | null
  }
  weather?: {
    latest?: {
      capturedAt?: string
      temperature?: number
      humidity?: number
      windSpeed?: number
      precipitation?: number
      summary?: string
    }
    averages?: {
      humidity?: number | null
      temperature?: number | null
    }
  } | null
  analysis?: {
    ph_level?: number | null
    nitrogen_ppm?: number | null
    phosphorus_ppm?: number | null
    potassium_ppm?: number | null
    organic_matter_percent?: number | null
    moisture_percent?: number | null
    chlorophyll_index?: number | null
    summary?: string | null
    advisory?: string | null
    recommendations?: string[] | string | null
    monitoring?: string[] | string | null
    confidence?: number | null
    source?: string | null
  }
  metadata?: {
    generatedAt?: string
    snapshotGeneratedAt?: string
    cacheHit?: boolean
    language?: string
  }
  error?: string
}

export type SatelliteInsightsMap = Record<string, SatelliteAnalysisResponse>
