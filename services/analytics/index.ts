import { fetchEOSDANDVI, fetchEOSDASatelliteImage, type EOSDANDVIResponse, type EOSDASatelliteImageResponse } from "@/lib/services/eosda"
import { createClient } from "@/lib/supabase/client"

export interface NPKData {
  nitrogen: number
  phosphorus: number
  potassium: number
  trends: {
    n: number
    p: number
    k: number
  }
}

export interface TrendDataPoint {
  date: string
  value: number
}

export interface Alert {
  id: string
  type: "low_moisture" | "high_temp" | "low_ndvi" | "nutrient_deficiency"
  severity: "warning" | "critical"
  message: string
  fieldId: string
  fieldName: string
}

export interface ChlorophyllData {
  current: number
  eosda: number
  trendPercent: number
  lastMonth: number
}

export interface ECSalinityData {
  electricalConductivity: number
  salinityRatio: number
  moistureLevel: number
}

export interface IrrigationAgentStatus {
  readiness: number
  status: {
    soilMoisture: boolean
    weatherIntegration: boolean
    intelligenceEngine: boolean
    sensorNetwork: boolean
  }
}

export interface YieldPredictionData {
  predictedYield: number
  confidence: number
  estimatedHarvest: string
  comparisonToAverage: number
}

export interface SoilCropData {
  fieldId: string
  ndvi: number
  moisture: number
  temperature: number
  healthScore: number
  lastUpdated: string
  npk?: NPKData
  ndviHistory?: TrendDataPoint[]
  alerts?: Alert[]
  chlorophyll?: ChlorophyllData
  ecSalinity?: ECSalinityData
  irrigationAgent?: IrrigationAgentStatus
  yieldPrediction?: YieldPredictionData
  source?: 'simulated' | 'EOSDA' | 'Sentinel-1' | 'Sentinel-2'
}

export class AnalyticsService {
  private static instance: AnalyticsService

  private constructor() { }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  async getFieldAnalytics(fieldId: string): Promise<SoilCropData> {
    // Fetch field data from Supabase
    const supabase = createClient()
    const { data: field } = await supabase
      .from("fields")
      .select("id, name, latitude, longitude")
      .eq("id", fieldId)
      .single()

    if (!field?.latitude || !field?.longitude) {
      throw new Error("Field coordinates not found")
    }

    const center = { latitude: field.latitude, longitude: field.longitude }

    // Fetch real data from EOSDA
    let ndvi = 0.5
    let moisture = 50

    try {
      const ndviStats = await fetchEOSDANDVI({ center })
      ndvi = ndviStats.ndvi_value
      moisture = Math.min(100, Math.max(0, ndvi * 100 + 20))
    } catch (e) {
      console.warn("Failed to fetch EOSDA data, using fallback", e)
    }

    // Generate NPK data (simulated for now - would come from EOSDA in production)
    const npkData: NPKData = {
      nitrogen: 45 + Math.random() * 10,
      phosphorus: 30 + Math.random() * 10,
      potassium: 120 + Math.random() * 20,
      trends: {
        n: (Math.random() - 0.5) * 20, // -10% to +10%
        p: (Math.random() - 0.5) * 20,
        k: (Math.random() - 0.5) * 20
      }
    }

    // Generate 30-day NDVI history (simulated trend data)
    const ndviHistory: TrendDataPoint[] = []
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      ndviHistory.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: ndvi + (Math.random() - 0.5) * 0.2 // Variation around current NDVI
      })
    }

    // Generate alerts based on metrics
    const alerts: Alert[] = []
    if (moisture < 30) {
      alerts.push({
        id: `alert-${fieldId}-moisture`,
        type: "low_moisture",
        severity: moisture < 20 ? "critical" : "warning",
        message: `Low Soil Moisture: ${field.name}`,
        fieldId,
        fieldName: field.name
      })
    }
    const temperature = 28 // This is currently hardcoded, but would come from sensors/weather data
    if (temperature > 35) {
      alerts.push({
        id: `alert-${fieldId}-high-temp`,
        type: "high_temp",
        severity: temperature > 40 ? "critical" : "warning",
        message: `High Soil Temperature: ${field.name}`,
        fieldId: field.id,
        fieldName: field.name
      })
    }
    if (ndvi < 0.3) {
      alerts.push({
        id: `alert-${fieldId}-ndvi`,
        type: "low_ndvi",
        severity: ndvi < 0.2 ? "critical" : "warning",
        message: `Low Vegetation Health (NDVI): ${field.name}`,
        fieldId,
        fieldName: field.name
      })
    }

    const healthScore = Math.round(ndvi * 100)

    // Generate Chlorophyll Data (EOSDA Sentinel-2)
    const chlorophyllData: ChlorophyllData = {
      current: 45 + Math.random() * 30,  // 45-75 μg/cm²
      eosda: 50 + Math.random() * 25,     // EOSDA satellite reading
      trendPercent: (Math.random() - 0.5) * 15,  // ±7.5%
      lastMonth: 55
    }

    // Generate EC & Salinity Data (Sentinel-1 SAR)
    const ecSalinityData: ECSalinityData = {
      electricalConductivity: 1 + Math.random() * 3,  // 1-4 dS/m
      salinityRatio: Math.random() * 60,              // 0-60%
      moistureLevel: moisture                         // Use existing moisture
    }

    // Generate Irrigation Agent Status
    const irrigationAgentData: IrrigationAgentStatus = {
      readiness: 70 + Math.random() * 25,  // 70-95%
      status: {
        soilMoisture: moisture > 25,
        weatherIntegration: true,
        intelligenceEngine: true,
        sensorNetwork: ndvi > 0.4
      }
    }

    // Generate Yield Prediction (AI/ML)
    const yieldPredictionData: YieldPredictionData = {
      predictedYield: 60 + Math.random() * 30,  // 60-90%
      confidence: 75 + Math.random() * 20,       // 75-95%
      estimatedHarvest: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        .toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      comparisonToAverage: (Math.random() - 0.3) * 20  // -6% to +14%
    }

    return {
      fieldId,
      ndvi,
      moisture,
      temperature,
      healthScore,
      lastUpdated: new Date().toISOString(),
      npk: npkData,
      ndviHistory,
      alerts,
      chlorophyll: chlorophyllData,
      ecSalinity: ecSalinityData,
      irrigationAgent: irrigationAgentData,
      yieldPrediction: yieldPredictionData,
      source: 'simulated'
    }
  }

  async getSatelliteImagery(lat: number, lng: number): Promise<EOSDASatelliteImageResponse> {
    return fetchEOSDASatelliteImage({
      center: { latitude: lat, longitude: lng },
      size: { width: 512, height: 512 }
    })
  }

  async getNDVIStats(lat: number, lng: number): Promise<EOSDANDVIResponse> {
    return fetchEOSDANDVI({
      center: { latitude: lat, longitude: lng }
    })
  }
}

export const analyticsService = AnalyticsService.getInstance()
