/**
 * Analytics Service
 * Provides soil and crop analytics data for fields
 */

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
        // For now, return simulated data
        // In production, this would fetch from the backend API
        return {
            healthScore: 78 + Math.random() * 15,
            ndvi: 0.65 + Math.random() * 0.2,
            moisture: 45 + Math.random() * 20,
            temperature: 22 + Math.random() * 8,
            source: 'simulated',
            chlorophyll: {
                current: 35 + Math.random() * 20,
                trendPercent: -5 + Math.random() * 15,
            },
            npk: {
                nitrogen: 60 + Math.random() * 30,
                phosphorus: 40 + Math.random() * 30,
                potassium: 50 + Math.random() * 30,
            },
            ecSalinity: {
                electricalConductivity: 1.2 + Math.random() * 0.8,
                salinityRatio: 0.5 + Math.random() * 1.5,
            },
            irrigationAgent: {
                readiness: 85 + Math.random() * 10,
                status: {
                    soilMoisture: true,
                    weatherIntegration: true,
                    intelligenceEngine: Math.random() > 0.3,
                },
            },
            yieldPrediction: {
                predictedYield: 8 + Math.random() * 4,
                comparisonToAverage: 5 + Math.random() * 15,
                confidence: 75 + Math.random() * 20,
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
