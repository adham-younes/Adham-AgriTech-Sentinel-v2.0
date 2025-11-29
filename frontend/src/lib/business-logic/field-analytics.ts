/**
 * Field Analytics Service
 * Generates automated soil analysis and irrigation recommendations from satellite data
 */

import type { NDVIDataPoint } from '../services/satellite-analytics'

// ============================================================================
// Types
// ============================================================================

export interface SoilAnalysis {
    field_id: string
    analysis_date: string
    ndvi_mean: number
    ndvi_trend: 'improving' | 'stable' | 'declining'
    moisture_level: 'low' | 'medium' | 'high'
    stress_zones: StressZone[]
    recommendations: string[]
}

export interface StressZone {
    id: string
    severity: 'low' | 'medium' | 'high'
    type: 'moisture' | 'nutrient' | 'disease'
    estimated_area_percentage: number
    coordinates?: [number, number][]
}

export interface IrrigationPlan {
    field_id: string
    plan_date: string
    irrigation_recommended: boolean
    priority: 'low' | 'medium' | 'high' | 'urgent'
    recommended_zones: IrrigationZone[]
    total_water_volume_m3?: number
    schedule?: {
        start_date: string
        frequency_days: number
        duration_hours: number
    }
    rationale: string
}

export interface IrrigationZone {
    zone_id: string
    coordinates: [number, number][]
    water_need_mm: number
    priority: 'low' | 'medium' | 'high'
    reason: string
}

// ============================================================================
// Service Class
// ============================================================================

export class FieldAnalyticsService {
    /**
     * Generate soil analysis from NDVI time series data
     */
    generateSoilAnalysis(
        fieldId: string,
        ndviData: NDVIDataPoint[]
    ): SoilAnalysis {
        if (ndviData.length === 0) {
            return this.getDefaultSoilAnalysis(fieldId)
        }

        // Calculate mean NDVI from recent data
        const recentData = ndviData.slice(-10) // Last 10 observations
        const ndvi_mean = recentData.reduce((acc, d) => acc + d.value, 0) / recentData.length

        // Determine trend by comparing first half vs second half
        const ndvi_trend = this.calculateNDVITrend(ndviData)

        // Estimate moisture level from NDVI (simplified heuristic)
        const moisture_level = this.estimateMoistureLevel(ndvi_mean, ndvi_trend)

        // Identify stress zones based on NDVI patterns
        const stress_zones = this.identifyStressZones(ndviData, ndvi_mean)

        // Generate recommendations
        const recommendations = this.generateSoilRecommendations(
            ndvi_mean,
            ndvi_trend,
            moisture_level,
            stress_zones
        )

        return {
            field_id: fieldId,
            analysis_date: new Date().toISOString(),
            ndvi_mean: parseFloat(ndvi_mean.toFixed(3)),
            ndvi_trend,
            moisture_level,
            stress_zones,
            recommendations,
        }
    }

    /**
     * Generate irrigation plan based on soil analysis
     */
    generateIrrigationPlan(
        fieldId: string,
        soilAnalysis: SoilAnalysis,
        fieldArea = 1.0 // hectares
    ): IrrigationPlan {
        const { ndvi_mean, ndvi_trend, moisture_level, stress_zones } = soilAnalysis

        // Determine if irrigation is needed
        const irrigation_recommended =
            moisture_level === 'low' ||
            (moisture_level === 'medium' && ndvi_trend === 'declining')

        // Calculate priority
        const priority = this.calculateIrrigationPriority(
            ndvi_mean,
            moisture_level,
            stress_zones
        )

        // Generate irrigation zones
        const recommended_zones = this.generateIrrigationZones(
            stress_zones,
            ndvi_mean,
            moisture_level
        )

        // Calculate total water volume (simplified)
        const total_water_volume_m3 = irrigation_recommended
            ? this.calculateWaterVolume(fieldArea, moisture_level)
            : 0

        // Generate rationale
        const rationale = this.generateIrrigationRationale(
            irrigation_recommended,
            ndvi_mean,
            ndvi_trend,
            moisture_level
        )

        return {
            field_id: fieldId,
            plan_date: new Date().toISOString(),
            irrigation_recommended,
            priority,
            recommended_zones,
            total_water_volume_m3: parseFloat(total_water_volume_m3.toFixed(2)),
            schedule: irrigation_recommended
                ? {
                    start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
                    frequency_days: moisture_level === 'low' ? 2 : 3,
                    duration_hours: moisture_level === 'low' ? 3 : 2,
                }
                : undefined,
            rationale,
        }
    }

    // ============================================================================
    // Private Helper Methods
    // ============================================================================

    private calculateNDVITrend(
        ndviData: NDVIDataPoint[]
    ): 'improving' | 'stable' | 'declining' {
        if (ndviData.length < 4) return 'stable'

        const mid = Math.floor(ndviData.length / 2)
        const firstHalf = ndviData.slice(0, mid)
        const secondHalf = ndviData.slice(mid)

        const firstAvg = firstHalf.reduce((acc, d) => acc + d.value, 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((acc, d) => acc + d.value, 0) / secondHalf.length

        const diff = secondAvg - firstAvg

        if (diff > 0.05) return 'improving'
        if (diff < -0.05) return 'declining'
        return 'stable'
    }

    private estimateMoistureLevel(
        ndvi: number,
        trend: string
    ): 'low' | 'medium' | 'high' {
        // Simplified heuristic: NDVI < 0.3 suggests low moisture, > 0.6 suggests high
        if (ndvi < 0.3 || (ndvi < 0.4 && trend === 'declining')) return 'low'
        if (ndvi > 0.6 && trend !== 'declining') return 'high'
        return 'medium'
    }

    private identifyStressZones(
        ndviData: NDVIDataPoint[],
        meanNDVI: number
    ): StressZone[] {
        const stressZones: StressZone[] = []

        // Check for recent drops in NDVI (last 3 observations)
        const recentData = ndviData.slice(-3)
        const recentDecline = recentData.every((d, i) => i === 0 || d.value < recentData[i - 1].value)

        if (recentDecline && meanNDVI < 0.4) {
            stressZones.push({
                id: `stress-${Date.now()}`,
                severity: meanNDVI < 0.25 ? 'high' : 'medium',
                type: 'moisture',
                estimated_area_percentage: meanNDVI < 0.25 ? 40 : 20,
            })
        }

        return stressZones
    }

    private generateSoilRecommendations(
        ndvi: number,
        trend: string,
        moisture: string,
        stressZones: StressZone[]
    ): string[] {
        const recommendations: string[] = []

        if (moisture === 'low') {
            recommendations.push('⚠️ إرواء عاجل موصى به - رطوبة التربة منخفضة')
            recommendations.push('💧 زيادة وتيرة الري إلى مرتين أسبوعياً')
        }

        if (trend === 'declining') {
            recommendations.push('📉 الاتجاه متراجع - فحص العناصر الغذائية والري')
        }

        if (ndvi < 0.3) {
            recommendations.push('🌱 NDVI منخفض جداً - فحصميداني للجذور والآفات')
        }

        if (stressZones.length > 0) {
            recommendations.push(`⚠️ ${stressZones.length} مناطق إجهاد محددة - استهداف بمعالجة موضعية`)
        }

        if (recommendations.length === 0) {
            recommendations.push('✅ صحة الحقل جيدة - استمرار بالممارسات الحالية')
        }

        return recommendations
    }

    private calculateIrrigationPriority(
        ndvi: number,
        moisture: string,
        stressZones: StressZone[]
    ): 'low' | 'medium' | 'high' | 'urgent' {
        if (moisture === 'low' && ndvi < 0.25) return 'urgent'
        if (moisture === 'low' || stressZones.some((z) => z.severity === 'high')) return 'high'
        if (moisture === 'medium' && ndvi < 0.4) return 'medium'
        return 'low'
    }

    private generateIrrigationZones(
        stressZones: StressZone[],
        ndvi: number,
        moisture: string
    ): IrrigationZone[] {
        const zones: IrrigationZone[] = []

        if (moisture === 'low') {
            // Full field irrigation
            zones.push({
                zone_id: 'full-field',
                coordinates: [], // Would be field boundary  
                water_need_mm: ndvi < 0.3 ? 35 : 25,
                priority: 'high',
                reason: 'رطوبة منخفضة في كامل الحقل',
            })
        } else if (stressZones.length > 0) {
            // Targeted irrigation for stress zones
            stressZones.forEach((zone, i) => {
                zones.push({
                    zone_id: `stress-zone-${i + 1}`,
                    coordinates: zone.coordinates || [],
                    water_need_mm: zone.severity === 'high' ? 30 : 20,
                    priority: zone.severity === 'high' ? 'high' : 'medium',
                    reason: `منطقة إجهاد ${zone.severity === 'high' ? 'عالية' : 'متوسطة'}`,
                })
            })
        }

        return zones
    }

    private calculateWaterVolume(fieldArea: number, moisture: string): number {
        // Calculate water volume in m³ based on field area and moisture level
        // Assuming 25-35mm water depth needed
        const waterDepthMM = moisture === 'low' ? 35 : 25
        const waterDepthM = waterDepthMM / 1000
        const areaM2 = fieldArea * 10000 // hectares to m²
        return areaM2 * waterDepthM
    }

    private generateIrrigationRationale(
        recommended: boolean,
        ndvi: number,
        trend: string,
        moisture: string
    ): string {
        if (!recommended) {
            return `رطوبة التربة ${moisture === 'high' ? 'عالية' : 'كافية'} (NDVI: ${ndvi.toFixed(2)}). لا حاجة للري حالياً.`
        }

        const parts: string[] = []

        if (moisture === 'low') {
            parts.push('رطوبة التربة منخفضة')
        }

        if (trend === 'declining') {
            parts.push('اتجاه NDVI متراجع')
        }

        if (ndvi < 0.3) {
            parts.push(`قيمة NDVI منخفضة (${ndvi.toFixed(2)})`)
        }

        return `الري موصى به بسبب: ${parts.join('، ')}.`
    }

    private getDefaultSoilAnalysis(fieldId: string): SoilAnalysis {
        return {
            field_id: fieldId,
            analysis_date: new Date().toISOString(),
            ndvi_mean: 0,
            ndvi_trend: 'stable',
            moisture_level: 'medium',
            stress_zones: [],
            recommendations: ['⚠️ لا توجد بيانات NDVI كافية للتحليل'],
        }
    }
}

// ============================================================================
// Export Singleton
// ============================================================================

export const fieldAnalytics = new FieldAnalyticsService()
