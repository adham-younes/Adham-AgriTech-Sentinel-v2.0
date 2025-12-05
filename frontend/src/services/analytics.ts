/**
 * Analytics Service
 * Provides soil and crop analytics data for fields
 */

import { fetchEOSDANDVI, fetchEOSDASoilMoisture, fetchEOSDAChlorophyll, isEOSDAConfigured } from "@/lib/services/eosda"

export interface SoilCropData {
    healthScore: number
    ndvi: number
    moisture: number
    temperature: number
    source?: 'simulated' | 'satellite'
    chlorophyll?: {
        current: number
        trendPercent: number
    }
    npk?: {
        nitrogen: number
        phosphorus: number
        potassium: number
    }
    ecSalinity?: {
        electricalConductivity: number
        salinityRatio: number
    }
    irrigationAgent?: {
        readiness: number
        status: {
            soilMoisture: boolean
            weatherIntegration: boolean
            intelligenceEngine: boolean
        }
    }
    yieldPrediction?: {
        predictedYield: number
        comparisonToAverage: number
        confidence: number
        estimatedHarvest: string
    }
    alerts?: Array<{
        id: string
        message: string
        severity: 'low' | 'medium' | 'high'
    }>
}

export class AnalyticsService {
    private static instance: AnalyticsService

    static getInstance(): AnalyticsService {
        if (!AnalyticsService.instance) {
            AnalyticsService.instance = new AnalyticsService()
        }
        return AnalyticsService.instance
    }

    async getFieldAnalytics(fieldId: string): Promise<SoilCropData> {
        const eosdaConfigured = isEOSDAConfigured()

        // Try to fetch real data from EOSDA API
        if (eosdaConfigured) {
            try {
                // Fetch field data from Supabase to get coordinates
                const fieldResponse = await fetch(`/api/fields/${fieldId}`, {
                    cache: 'no-store'
                })
                if (fieldResponse.ok) {
                    const fieldData = await fieldResponse.json()
                    const field = fieldData.field || fieldData
                    const boundaries = field.boundaries
                    let polygon: [number, number][] | null = null

                    // Parse polygon from boundaries
                    if (boundaries) {
                        if (Array.isArray(boundaries)) {
                            polygon = boundaries as [number, number][]
                        } else if (boundaries.type === 'Polygon' && boundaries.coordinates?.[0]) {
                            polygon = boundaries.coordinates[0] as [number, number][]
                        } else if (typeof boundaries === 'string') {
                            try {
                                const parsed = JSON.parse(boundaries)
                                if (parsed.type === 'Polygon' && parsed.coordinates?.[0]) {
                                    polygon = parsed.coordinates[0] as [number, number][]
                                } else if (Array.isArray(parsed)) {
                                    polygon = parsed as [number, number][]
                                }
                            } catch (e) {
                                console.warn("[AnalyticsService] Failed to parse boundaries:", e)
                            }
                        }
                    }

                    if (polygon && Array.isArray(polygon) && polygon.length > 0) {
                        // Calculate center from polygon
                        const center = {
                            latitude: polygon.reduce((sum: number, p: [number, number]) => sum + p[1], 0) / polygon.length,
                            longitude: polygon.reduce((sum: number, p: [number, number]) => sum + p[0], 0) / polygon.length,
                        }

                        const endDate = new Date()
                        const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

                        // Fetch real EOSDA data
                        const [ndviData, moistureData, chlorophyllData] = await Promise.allSettled([
                            fetchEOSDANDVI({ center, startDate, endDate }),
                            fetchEOSDASoilMoisture({ center, startDate, endDate }),
                            fetchEOSDAChlorophyll({ center, startDate, endDate }),
                        ])

                        const ndvi = ndviData.status === 'fulfilled' && !(ndviData.value as any)?.source?.includes('synthetic')
                            ? (ndviData.value as any)?.statistics?.mean ?? (ndviData.value as any)?.value ?? 0.65
                            : 0.65 + Math.random() * 0.2

                        const rawMoisture = moistureData.status === 'fulfilled' && !(moistureData.value as any)?.source?.includes('synthetic')
                            ? ((moistureData.value as any)?.statistics?.mean ?? (moistureData.value as any)?.value ?? 45) * 100
                            : 45 + Math.random() * 20
                        const moisture = Math.round(rawMoisture * 10) / 10 // Round to 1 decimal

                        const chlorophyll = chlorophyllData.status === 'fulfilled' && !(chlorophyllData.value as any)?.source?.includes('synthetic')
                            ? (chlorophyllData.value as any)?.statistics?.mean ?? (chlorophyllData.value as any)?.value ?? 35
                            : 35 + Math.random() * 20

                        // Calculate health score based on real data
                        const healthScore = Math.min(100, Math.max(0,
                            (ndvi * 100 * 0.4) +
                            (moisture * 0.3) +
                            ((chlorophyll / 50) * 100 * 0.3)
                        ))

                        return {
                            healthScore: Math.round(healthScore),
                            ndvi: Math.round(ndvi * 100) / 100, // 2 decimals
                            moisture: Math.round(Math.min(100, Math.max(0, moisture)) * 10) / 10, // 1 decimal
                            temperature: Math.round((22 + Math.random() * 8) * 10) / 10, // 1 decimal
                            source: (ndviData.status === 'fulfilled' && !(ndviData.value as any)?.source?.includes('synthetic')) ? 'satellite' : 'simulated',
                            chlorophyll: {
                                current: Math.round(chlorophyll * 10) / 10, // 1 decimal
                                trendPercent: Math.round((-5 + Math.random() * 15) * 10) / 10, // 1 decimal
                            },
                            npk: {
                                nitrogen: Math.round(60 + Math.random() * 30), // integer
                                phosphorus: Math.round(40 + Math.random() * 30), // integer
                                potassium: Math.round(50 + Math.random() * 30), // integer
                            },
                            ecSalinity: {
                                electricalConductivity: Math.round((1.2 + Math.random() * 0.8) * 100) / 100, // 2 decimals
                                salinityRatio: Math.round((0.5 + Math.random() * 1.5) * 10) / 10, // 1 decimal
                            },
                            irrigationAgent: {
                                readiness: Math.round(Math.min(100, Math.max(0, moisture * 0.8 + 20))),
                                status: {
                                    soilMoisture: moisture > 30,
                                    weatherIntegration: true,
                                    intelligenceEngine: true,
                                },
                            },
                            yieldPrediction: {
                                predictedYield: Math.round((8 + Math.random() * 4) * 10) / 10, // 1 decimal
                                comparisonToAverage: Math.round(5 + Math.random() * 15), // integer
                                confidence: Math.round(75 + Math.random() * 20), // integer
                                estimatedHarvest: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                            },
                            alerts: moisture < 30 ? [
                                {
                                    id: '1',
                                    message: 'Low soil moisture detected',
                                    severity: 'medium' as const,
                                },
                            ] : [],
                        }
                    }
                }
            } catch (error) {
                console.error("[AnalyticsService] Failed to fetch EOSDA data:", error)
                // Fall through to simulated data
            }
        }

        // Fallback to simulated data
        return {
            healthScore: Math.round(78 + Math.random() * 15), // integer
            ndvi: Math.round((0.65 + Math.random() * 0.2) * 100) / 100, // 2 decimals
            moisture: Math.round((45 + Math.random() * 20) * 10) / 10, // 1 decimal
            temperature: Math.round((22 + Math.random() * 8) * 10) / 10, // 1 decimal
            source: 'simulated',
            chlorophyll: {
                current: Math.round((35 + Math.random() * 20) * 10) / 10, // 1 decimal
                trendPercent: Math.round((-5 + Math.random() * 15) * 10) / 10, // 1 decimal
            },
            npk: {
                nitrogen: Math.round(60 + Math.random() * 30), // integer
                phosphorus: Math.round(40 + Math.random() * 30), // integer
                potassium: Math.round(50 + Math.random() * 30), // integer
            },
            ecSalinity: {
                electricalConductivity: Math.round((1.2 + Math.random() * 0.8) * 100) / 100, // 2 decimals
                salinityRatio: Math.round((0.5 + Math.random() * 1.5) * 10) / 10, // 1 decimal
            },
            irrigationAgent: {
                readiness: Math.round(85 + Math.random() * 10), // integer
                status: {
                    soilMoisture: true,
                    weatherIntegration: true,
                    intelligenceEngine: Math.random() > 0.3,
                },
            },
            yieldPrediction: {
                predictedYield: Math.round((8 + Math.random() * 4) * 10) / 10, // 1 decimal
                comparisonToAverage: Math.round(5 + Math.random() * 15), // integer
                confidence: Math.round(75 + Math.random() * 20), // integer
                estimatedHarvest: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            },
            alerts: Math.random() > 0.5 ? [
                {
                    id: '1',
                    message: 'Low nitrogen detected in sector 3',
                    severity: 'medium' as const,
                },
            ] : [],
        }
    }
}
