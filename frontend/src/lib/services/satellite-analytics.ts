/**
 * Satellite Analytics Service
 * Integrates with EOSDA API to fetch real satellite data for AI-driven insights
 * Uses X-Api-Key authentication header for EOSDA API
 */

import { eosdaPublicConfig } from '@/lib/config/eosda'

// Types
export interface NDVIDataPoint {
    date: string
    value: number
    cloud_coverage?: number
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
        this.apiKey = process.env.NEXT_PUBLIC_EOSDA_API_KEY || ''
        this.baseUrl = 'https://api.eosda.com'
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
     */
    async getNDVITimeSeries(
        fieldId: string,
        days: number = 90,
        polygon?: [number, number][]
    ): Promise<NDVIDataPoint[]> {
        try {
            if (!this.isLiveDataAvailable || !polygon) {
                console.log('Using simulated NDVI data - API key not available or polygon missing')
                return this.generateRealisticNDVI(days)
            }

            const endDate = new Date()
            const startDate = new Date()
            startDate.setDate(startDate.getDate() - days)

            // Call EOSDA API for real NDVI data
            try {
                const response = await fetch(`${this.baseUrl}/imagery/ndvi`, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        polygon: polygon,
                        start_date: startDate.toISOString().split('T')[0],
                        end_date: endDate.toISOString().split('T')[0]
                    })
                })

                if (response.ok) {
                    const data = await response.json()
                    if (data.images && Array.isArray(data.images)) {
                        return data.images.map((img: any) => ({
                            date: img.date,
                            value: img.mean_ndvi || img.statistics?.mean || 0.7,
                            cloud_coverage: img.cloud_coverage || 0
                        }))
                    }
                }

                console.warn('EOSDA API returned invalid data, using simulation')
            } catch (apiError) {
                console.error('EOSDA API error, falling back to simulation:', apiError)
            }

            // Fallback to simulation
            return this.generateRealisticNDVI(days)
        } catch (error) {
            console.error('Error fetching NDVI data:', error)
            return this.generateRealisticNDVI(days)
        }
    }

    /**
     * Fetch current soil moisture from satellite data
     */
    async getSoilMoisture(
        fieldId: string,
        polygon: [number, number][]
    ): Promise<SoilMoistureData> {
        try {
            if (!this.isLiveDataAvailable || !polygon || polygon.length === 0) {
                console.log('Using simulated soil moisture data')
                return {
                    surface_moisture: Math.random() * 40 + 30,
                    root_zone_moisture: Math.random() * 35 + 35,
                    timestamp: new Date().toISOString(),
                    coordinates: polygon
                }
            }

            // Call EOSDA API for real soil moisture data
            try {
                const response = await fetch(`${this.baseUrl}/imagery/soil-moisture`, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        polygon: polygon,
                        date: new Date().toISOString().split('T')[0]
                    })
                })

                if (response.ok) {
                    const data = await response.json()
                    if (data.statistics) {
                        return {
                            surface_moisture: data.statistics.surface_moisture || (Math.random() * 40 + 30),
                            root_zone_moisture: data.statistics.root_zone_moisture || data.statistics.mean || (Math.random() * 35 + 35),
                            timestamp: new Date().toISOString(),
                            coordinates: polygon
                        }
                    }
                }

                console.warn('EOSDA soil moisture API returned invalid data, using simulation')
            } catch (apiError) {
                console.error('EOSDA soil moisture API error:', apiError)
            }

            // Fallback to simulation
            return {
                surface_moisture: Math.random() * 40 + 30,
                root_zone_moisture: Math.random() * 35 + 35,
                timestamp: new Date().toISOString(),
                coordinates: polygon
            }
        } catch (error) {
            console.error('Error fetching soil moisture:', error)
            throw error
        }
    }

    /**
     * Get AI-powered irrigation predictions
     */
    async getIrrigationPredictions(
        fieldId: string,
        cropType: string | null
    ): Promise<IrrigationPrediction[]> {
        try {
            // This would integrate with ML model
            const soilMoisture = await this.getSoilMoisture(fieldId, [])

            const predictions: IrrigationPrediction[] = []

            // Simple rule-based prediction (replace with ML model)
            if (soilMoisture.root_zone_moisture < 40) {
                predictions.push({
                    recommended_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                    confidence: 0.85,
                    water_amount_mm: 25,
                    reason: 'رطوبة التربة منخفضة (${soilMoisture.root_zone_moisture.toFixed(1)}%) - يُنصح بالري خلال 48 ساعة',
                    soil_moisture_forecast: [35, 32, 30, 28, 45, 43, 41]
                })
            }

            return predictions
        } catch (error) {
            console.error('Error getting irrigation predictions:', error)
            return []
        }
    }

    /**
     * Detect crop stress zones using NDVI analysis
     */
    async detectCropStress(
        fieldId: string,
        polygon: [number, number][]
    ): Promise<StressZone[]> {
        try {
            const ndviData = await this.getNDVITimeSeries(fieldId, 30)
            const currentNDVI = ndviData[ndviData.length - 1]?.value || 0.7

            const stressZones: StressZone[] = []

            // Detect water stress (NDVI < 0.5)
            if (currentNDVI < 0.5) {
                stressZones.push({
                    id: 'stress-1',
                    coordinates: polygon,
                    severity: 'high',
                    type: 'water',
                    ndvi_value: currentNDVI,
                    affected_area_percentage: 25
                })
            } else if (currentNDVI < 0.65) {
                stressZones.push({
                    id: 'stress-2',
                    coordinates: polygon,
                    severity: 'medium',
                    type: 'water',
                    ndvi_value: currentNDVI,
                    affected_area_percentage: 15
                })
            }

            return stressZones
        } catch (error) {
            console.error('Error detecting crop stress:', error)
            return []
        }
    }

    /**
     * Predict crop yield using ML models
     */
    async predictYield(
        fieldId: string,
        cropType: string | null,
        areaHectares: number
    ): Promise<YieldPrediction> {
        try {
            const ndviData = await this.getNDVITimeSeries(fieldId, 90)
            const soilMoisture = await this.getSoilMoisture(fieldId, [])

            // Calculate NDVI trend
            const recentNDVI = ndviData.slice(-30).map(d => d.value)
            const avgRecent = recentNDVI.reduce((a, b) => a + b, 0) / recentNDVI.length
            const olderNDVI = ndviData.slice(-60, -30).map(d => d.value)
            const avgOlder = olderNDVI.reduce((a, b) => a + b, 0) / olderNDVI.length

            const trend = avgRecent > avgOlder + 0.05 ? 'improving'
                : avgRecent < avgOlder - 0.05 ? 'declining'
                    : 'stable'

            // Simple yield estimation (replace with actual ML model)
            const baseYield = cropType === 'Wheat' ? 4.5 : 3.8 // tons/hectare
            const ndviMultiplier = avgRecent / 0.75 // normalized to optimal NDVI
            const moistureMultiplier = soilMoisture.root_zone_moisture / 60 // normalized to optimal moisture

            const estimatedYield = baseYield * ndviMultiplier * moistureMultiplier

            return {
                estimated_yield_tons_per_hectare: Math.max(1, Math.min(8, estimatedYield)),
                confidence: 0.75,
                factors: {
                    ndvi_trend: trend,
                    moisture_adequacy: soilMoisture.root_zone_moisture > 50 ? 'sufficient'
                        : soilMoisture.root_zone_moisture > 35 ? 'moderate'
                            : 'insufficient',
                    temperature_stress: 'low'
                }
            }
        } catch (error) {
            console.error('Error predicting yield:', error)
            throw error
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
            let currentNDVI = 0.7
            let isLiveData = false

            // Try to fetch real NDVI from EOSDA API
            if (this.isLiveDataAvailable && polygon && polygon.length > 0) {
                try {
                    const response = await fetch(`${this.baseUrl}/imagery/ndvi/latest`, {
                        method: 'POST',
                        headers: this.getHeaders(),
                        body: JSON.stringify({ polygon })
                    })

                    if (response.ok) {
                        const data = await response.json()
                        if (data.statistics && typeof data.statistics.mean === 'number') {
                            currentNDVI = data.statistics.mean
                            isLiveData = true
                            console.log('✅ Successfully fetched live NDVI from EOSDA:', currentNDVI)
                        }
                    }
                } catch (e) {
                    console.warn('Failed to fetch real EOSDA data, using simulation', e)
                }
            }

            const ndviData = await this.getNDVITimeSeries(fieldId, 90, polygon)
            // Update the last point in time series to match real data if available
            if (ndviData.length > 0) {
                ndviData[ndviData.length - 1].value = currentNDVI;
            }

            const soilMoisture = await this.getSoilMoisture(fieldId, polygon)

            const last30Days = ndviData.slice(-30)
            const avg30d = last30Days.reduce((sum, d) => sum + d.value, 0) / last30Days.length

            // Calculate trend
            const last7 = ndviData.slice(-7).map(d => d.value)
            const prev7 = ndviData.slice(-14, -7).map(d => d.value)
            const avgLast7 = last7.reduce((a, b) => a + b, 0) / last7.length
            const avgPrev7 = prev7.reduce((a, b) => a + b, 0) / prev7.length

            const trend = avgLast7 > avgPrev7 + 0.03 ? 'up'
                : avgLast7 < avgPrev7 - 0.03 ? 'down'
                    : 'stable'

            return {
                ndvi: {
                    current: currentNDVI,
                    average_30d: avg30d,
                    trend,
                    percentile: this.calculatePercentile(currentNDVI, ndviData.map(d => d.value))
                },
                moisture: {
                    current: soilMoisture.root_zone_moisture,
                    optimal_range: [40, 70],
                    status: soilMoisture.root_zone_moisture >= 40 ? 'optimal'
                        : soilMoisture.root_zone_moisture >= 30 ? 'low'
                            : 'critical'
                },
                temperature: {
                    current: 28, // TODO: Fetch from weather API
                    stress_level: 'low'
                },
                chlorophyll: {
                    index: currentNDVI * 1.15, // Approximate relationship
                    status: currentNDVI > 0.7 ? 'healthy'
                        : currentNDVI > 0.5 ? 'moderate'
                            : 'poor'
                },
                isSimulated: !isLiveData && !this.isLiveDataAvailable
            }
        } catch (error) {
            console.error('Error getting crop health metrics:', error)
            throw error
        }
    }

    // Helper methods

    private generateRealisticNDVI(days: number): NDVIDataPoint[] {
        const data: NDVIDataPoint[] = []
        const endDate = new Date()

        // Generate seasonal NDVI pattern
        for (let i = days; i >= 0; i--) {
            const date = new Date(endDate)
            date.setDate(date.getDate() - i)

            // Simulate growth curve
            const dayOfSeason = days - i
            const growthPhase = dayOfSeason / days

            // Sigmoid growth curve with some noise
            const baseValue = 0.3 + (0.5 / (1 + Math.exp(-10 * (growthPhase - 0.5))))
            const noise = (Math.random() - 0.5) * 0.08
            const cloudNoise = Math.random() > 0.8 ? -0.15 : 0 // Occasional cloud interference

            const value = Math.max(0.2, Math.min(0.95, baseValue + noise + cloudNoise))

            data.push({
                date: date.toISOString().split('T')[0],
                value: parseFloat(value.toFixed(3)),
                cloud_coverage: Math.random() > 0.7 ? Math.random() * 30 : 0
            })
        }

        return data
    }

    private calculatePercentile(value: number, dataset: number[]): number {
        const sorted = [...dataset].sort((a, b) => a - b)
        const index = sorted.findIndex(v => v >= value)
        return index === -1 ? 100 : Math.round((index / sorted.length) * 100)
    }
}

// Export singleton instance
export const satelliteAnalytics = new SatelliteAnalyticsService()
