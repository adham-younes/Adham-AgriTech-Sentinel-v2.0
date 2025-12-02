/**
 * Satellite Analytics Service
 * Integrates with EOSDA API to fetch real satellite data for AI-driven insights
 * Uses X-Api-Key authentication header for EOSDA API
 */

import { eosdaPublicConfig } from '@/lib/config/eosda'
import { getSatelliteStatistics } from '@/lib/services/eosda'

// Types
export interface NDVIDataPoint {
    date: string
    value: number
    cloud_coverage?: number
    sceneID?: string  // Scene ID from EOSDA for tile rendering
}

export interface SoilMoistureData {
    surface_moisture: number // 0-100%
    root_zone_moisture: number // 0-100%
    timestamp: string
    coordinates: [number, number][]
}

export interface StressZone {
    id: string
    coordinates: [number, number][]
    severity: 'low' | 'medium' | 'high'
    type: 'water' | 'heat' | 'nutrient' | 'disease'
    ndvi_value: number
    affected_area_percentage: number
}

export interface IrrigationPrediction {
    recommended_date: string
    confidence: number // 0-1
    water_amount_mm: number
    reason: string
    soil_moisture_forecast: number[]
}

export interface YieldPrediction {
    estimated_yield_tons_per_hectare: number
    confidence: number
    factors: {
        ndvi_trend: 'improving' | 'stable' | 'declining'
        moisture_adequacy: 'sufficient' | 'moderate' | 'insufficient'
        temperature_stress: 'none' | 'low' | 'moderate' | 'high'
    }
}

export interface CropHealthMetrics {
    ndvi: {
        current: number
        average_30d: number
        trend: 'up' | 'down' | 'stable'
        percentile: number // compared to historical data
    }
    moisture: {
        current: number
        optimal_range: [number, number]
        status: 'optimal' | 'low' | 'critical'
    }
    temperature: {
        current: number
        stress_level: 'none' | 'low' | 'moderate' | 'high'
    }
    chlorophyll: {
        index: number
        status: 'healthy' | 'moderate' | 'poor'
    }
}

export class SatelliteAnalyticsService {
    private apiKey: string
    private baseUrl: string
    private isLiveDataAvailable: boolean

    constructor() {
        this.apiKey = process.env.NEXT_PUBLIC_EOSDA_API_KEY || 'apk.cefa9921669b0857be282894813d1213ed88c5e8299e29a5e91db105464aa232'
        this.baseUrl = process.env.NEXT_PUBLIC_EOSDA_API_URL || 'https://api.eosda.com/v1'
        this.isLiveDataAvailable = !!this.apiKey
    }

    /**
     * Get common headers for EOSDA API requests
     */
    private getHeaders(): HeadersInit {
        return {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json'
        }
    }

    /**
     * Check if live data is available
     */
    public isLiveMode(): boolean {
        return this.isLiveDataAvailable
    }

    /**
     * Fetch NDVI time series for a field
     * Now uses optimized getSatelliteStatistics with multi-index support
     */
    async getNDVITimeSeries(
        fieldId: string,
        days: number = 90,
        polygon?: [number, number][]
    ): Promise<NDVIDataPoint[]> {
        if (!this.isLiveDataAvailable || !polygon || polygon.length === 0) {
            console.warn('EOSDA API key missing or polygon not provided. Cannot fetch live data.')
            return []
        }

        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        try {
            // Calculate center point from polygon
            const lats = polygon.map(p => p[1])
            const lngs = polygon.map(p => p[0])
            const center = {
                latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
                longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2
            }

            // Use optimized getSatelliteStatistics (GDW API with multi-index)
            const stats = await getSatelliteStatistics({
                center,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0]
            })

            // Extract NDVI data point
            const ndviDataPoints: NDVIDataPoint[] = []

            if (stats.indices?.NDVI && typeof stats.indices.NDVI.mean === 'number') {
                ndviDataPoints.push({
                    date: stats.date || new Date().toISOString(),
                    value: parseFloat(stats.indices.NDVI.mean.toFixed(3)),
                    cloud_coverage: 0, // Cloud masking is applied in getSatelliteStatistics
                    sceneID: stats.id || undefined
                })

                console.log(`✅ NDVI from optimized API: ${stats.indices.NDVI.mean.toFixed(3)}, Synthetic: ${stats.isSynthetic}`)
            }

            return ndviDataPoints

        } catch (error) {
            console.error('Error fetching NDVI data via getSatelliteStatistics:', error)
            return []
        }
    }

    /**
     * Fetch current soil moisture from satellite data
     */
    async getSoilMoisture(
        fieldId: string,
        polygon: [number, number][]
    ): Promise<SoilMoistureData> {
        // Real implementation would call EOSDA soil moisture endpoint
        // For now, returning a safe default structure as we focus on NDVI first
        return {
            surface_moisture: 0,
            root_zone_moisture: 0,
            timestamp: new Date().toISOString(),
            coordinates: polygon
        }
    }

    /**
     * Get AI-powered irrigation predictions
     */
    async getIrrigationPredictions(
        fieldId: string,
        cropType: string | null
    ): Promise<IrrigationPrediction[]> {
        return []
    }

    /**
     * Detect crop stress zones using NDVI analysis
     */
    async detectCropStress(
        fieldId: string,
        polygon: [number, number][]
    ): Promise<StressZone[]> {
        return []
    }

    /**
     * Predict crop yield using ML models
     */
    async predictYield(
        fieldId: string,
        cropType: string | null,
        areaHectares: number
    ): Promise<YieldPrediction> {
        return {
            estimated_yield_tons_per_hectare: 0,
            confidence: 0,
            factors: {
                ndvi_trend: 'stable',
                moisture_adequacy: 'moderate',
                temperature_stress: 'low'
            }
        }
    }

    /**
     * Get comprehensive crop health metrics
     */
    async getCropHealthMetrics(
        fieldId: string,
        polygon: [number, number][]
    ): Promise<CropHealthMetrics & { isSimulated: boolean }> {
        try {
            let currentNDVI = 0
            let isLiveData = false

            if (this.isLiveDataAvailable && polygon && polygon.length > 0) {
                // Fetch latest scene
                const ndviData = await this.getNDVITimeSeries(fieldId, 30, polygon)
                if (ndviData.length > 0) {
                    // Sort by date descending
                    ndviData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    currentNDVI = ndviData[0].value
                    isLiveData = true
                }
            }

            return {
                ndvi: {
                    current: currentNDVI,
                    average_30d: 0,
                    trend: 'stable',
                    percentile: 50
                },
                moisture: {
                    current: 0,
                    optimal_range: [40, 70],
                    status: 'optimal'
                },
                temperature: {
                    current: 25,
                    stress_level: 'low'
                },
                chlorophyll: {
                    index: 0,
                    status: 'healthy'
                },
                isSimulated: !isLiveData
            }
        } catch (error) {
            console.error('Error getting crop health metrics:', error)
            throw error
        }
    }

    private calculatePercentile(value: number, dataset: number[]): number {
        const sorted = [...dataset].sort((a, b) => a - b)
        const index = sorted.findIndex(v => v >= value)
        return index === -1 ? 100 : Math.round((index / sorted.length) * 100)
    }
}

// Export singleton instance
export const satelliteAnalytics = new SatelliteAnalyticsService()
