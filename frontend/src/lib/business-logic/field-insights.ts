/**
 * Field Insights Generator
 * 
 * Generates human-readable "field stories" and actionable insights
 * from raw analytics data using natural language processing patterns.
 * 
 * @module business-logic/field-insights
 */

import type { FieldData, Recommendation } from './recommendation-engine'

// ============================================================================
// Types
// ============================================================================

export interface FieldInsight {
    id: string
    fieldId: string
    narrative: string
    narrativeAr: string
    keyMetrics: KeyMetric[]
    trends: Trend[]
    alerts: Alert[]
    score: number
    generatedAt: string
}

export interface KeyMetric {
    name: string
    nameAr: string
    value: number
    unit: string
    unitAr: string
    status: 'excellent' | 'good' | 'fair' | 'poor'
    changeFromPrevious?: number
}

export interface Trend {
    metric: string
    metricAr: string
    direction: 'improving' | 'stable' | 'declining'
    description: string
    descriptionAr: string
}

export interface Alert {
    severity: 'info' | 'warning' | 'critical'
    message: string
    messageAr: string
    recommendation?: string
    recommendationAr?: string
}

// ============================================================================
// Narrative Generation
// ============================================================================

/**
 * Generate comprehensive field story from current data
 */
export function generateFieldStory(
    field: FieldData,
    recommendations: Recommendation[],
    historicalData?: {
        avgNdvi: number
        avgMoisture: number
        avgTemperature: number
    },
): FieldInsight {
    const keyMetrics = extractKeyMetrics(field, historicalData)
    const trends = analyzeTrends(field, historicalData)
    const alerts = generateAlerts(field, recommendations)
    const score = calculateOverallScore(keyMetrics, trends, alerts)

    // Build narrative
    const narrative = buildNarrative(field, keyMetrics, trends, recommendations)
    const narrativeAr = buildNarrativeAr(field, keyMetrics, trends, recommendations)

    return {
        id: `insight-${field.id}-${Date.now()}`,
        fieldId: field.id,
        narrative,
        narrativeAr,
        keyMetrics,
        trends,
        alerts,
        score,
        generatedAt: new Date().toISOString(),
    }
}

/**
 * Extract key metrics with status assessment
 */
function extractKeyMetrics(
    field: FieldData,
    historical?: { avgNdvi: number; avgMoisture: number; avgTemperature: number },
): KeyMetric[] {
    const metrics: KeyMetric[] = []

    // NDVI metric
    if (field.lastNdvi !== null) {
        metrics.push({
            name: 'Vegetation Health (NDVI)',
            nameAr: 'صحة النباتات (NDVI)',
            value: Math.round(field.lastNdvi * 100) / 100,
            unit: 'index',
            unitAr: 'مؤشر',
            status: getNdviStatus(field.lastNdvi),
            changeFromPrevious: historical?.avgNdvi
                ? Math.round(((field.lastNdvi - historical.avgNdvi) / historical.avgNdvi) * 100)
                : undefined,
        })
    }

    // Soil Moisture metric
    if (field.lastMoisture !== null) {
        metrics.push({
            name: 'Soil Moisture',
            nameAr: 'رطوبة التربة',
            value: Math.round(field.lastMoisture * 10) / 10,
            unit: '%',
            unitAr: '%',
            status: getMoistureStatus(field.lastMoisture),
            changeFromPrevious: historical?.avgMoisture
                ? Math.round((field.lastMoisture - historical.avgMoisture) * 10) / 10
                : undefined,
        })
    }

    // Temperature metric
    if (field.lastTemperature !== null) {
        metrics.push({
            name: 'Temperature',
            nameAr: 'درجة الحرارة',
            value: Math.round(field.lastTemperature * 10) / 10,
            unit: '°C',
            unitAr: '°م',
            status: getTemperatureStatus(field.lastTemperature),
            changeFromPrevious: historical?.avgTemperature
                ? Math.round((field.lastTemperature - historical.avgTemperature) * 10) / 10
                : undefined,
        })
    }

    return metrics
}

/**
 * Analyze trends from historical data
 */
function analyzeTrends(
    field: FieldData,
    historical?: { avgNdvi: number; avgMoisture: number; avgTemperature: number },
): Trend[] {
    if (!historical) return []

    const trends: Trend[] = []

    // NDVI trend
    if (field.lastNdvi !== null && historical.avgNdvi) {
        const change = ((field.lastNdvi - historical.avgNdvi) / historical.avgNdvi) * 100
        trends.push({
            metric: 'Vegetation Health',
            metricAr: 'صحة النباتات',
            direction: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
            description:
                change > 5
                    ? `Vegetation health improving by ${Math.abs(Math.round(change))}%`
                    : change < -5
                        ? `Vegetation health declining by ${Math.abs(Math.round(change))}%`
                        : 'Vegetation health stable',
            descriptionAr:
                change > 5
                    ? `تحسن صحة النباتات بنسبة ${Math.abs(Math.round(change))}٪`
                    : change < -5
                        ? `تراجع صحة النباتات بنسبة ${Math.abs(Math.round(change))}٪`
                        : 'صحة النباتات مستقرة',
        })
    }

    // Moisture trend
    if (field.lastMoisture !== null && historical.avgMoisture) {
        const change = field.lastMoisture - historical.avgMoisture
        trends.push({
            metric: 'Soil Moisture',
            metricAr: 'رطوبة التربة',
            direction: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
            description:
                change > 5
                    ? `Soil moisture increasing (${Math.abs(Math.round(change))}% higher)`
                    : change < -5
                        ? `Soil moisture decreasing (${Math.abs(Math.round(change))}% lower)`
                        : 'Soil moisture levels stable',
            descriptionAr:
                change > 5
                    ? `رطوبة التربة في ازدياد (${Math.abs(Math.round(change))}٪ أعلى)`
                    : change < -5
                        ? `رطوبة التربة في انخفاض (${Math.abs(Math.round(change))}٪ أقل)`
                        : 'مستويات رطوبة التربة مستقرة',
        })
    }

    return trends
}

/**
 * Generate alerts from field data and recommendations
 */
function generateAlerts(field: FieldData, recommendations: Recommendation[]): Alert[] {
    const alerts: Alert[] = []

    // Critical recommendations become alerts
    recommendations
        .filter((rec) => rec.priority === 'critical')
        .forEach((rec) => {
            alerts.push({
                severity: 'critical',
                message: rec.title,
                messageAr: rec.titleAr,
                recommendation: rec.actionItems[0]?.action,
                recommendationAr: rec.actionItems[0]?.actionAr,
            })
        })

    // High priority recommendations become warnings
    recommendations
        .filter((rec) => rec.priority === 'high')
        .forEach((rec) => {
            alerts.push({
                severity: 'warning',
                message: rec.title,
                messageAr: rec.titleAr,
                recommendation: rec.actionItems[0]?.action,
                recommendationAr: rec.actionItems[0]?.actionAr,
            })
        })

    // Data freshness alert
    if (field.lastReadingAt) {
        const ageInDays =
            (new Date().getTime() - new Date(field.lastReadingAt).getTime()) / (1000 * 60 * 60 * 24)

        if (ageInDays > 7) {
            alerts.push({
                severity: 'info',
                message: `Field data is ${Math.round(ageInDays)} days old`,
                messageAr: `بيانات الحقل عمرها ${Math.round(ageInDays)} يوم`,
                recommendation: 'Consider requesting updated satellite imagery',
                recommendationAr: 'فكر في طلب صور أقمار صناعية محدثة',
            })
        }
    }

    return alerts
}

/**
 * Calculate overall insight score
 */
function calculateOverallScore(
    metrics: KeyMetric[],
    trends: Trend[],
    alerts: Alert[],
): number {
    let score = 100

    // Deduct for poor metrics
    metrics.forEach((metric) => {
        if (metric.status === 'poor') score -= 15
        else if (metric.status === 'fair') score -= 5
    })

    // Deduct for declining trends
    const decliningCount = trends.filter((t) => t.direction === 'declining').length
    score -= decliningCount * 10

    // Deduct for alerts
    const criticalCount = alerts.filter((a) => a.severity === 'critical').length
    const warningCount = alerts.filter((a) => a.severity === 'warning').length
    score -= criticalCount * 20
    score -= warningCount * 10

    return Math.max(0, Math.min(100, score))
}

/**
 * Build English narrative
 */
function buildNarrative(
    field: FieldData,
    metrics: KeyMetric[],
    trends: Trend[],
    recommendations: Recommendation[],
): string {
    const parts: string[] = []

    // Opening
    parts.push(
        `Field "${field.name}" (${field.area} hectares${field.cropType ? ` of ${field.cropType}` : ''})`,
    )

    // Health assessment
    const healthMetric = metrics.find((m) => m.name.includes('NDVI'))
    if (healthMetric) {
        parts.push(
            `shows ${healthMetric.status} vegetation health with an NDVI of ${healthMetric.value}`,
        )
    }

    // Moisture status
    const moistureMetric = metrics.find((m) => m.name.includes('Moisture'))
    if (moistureMetric) {
        parts.push(`Soil moisture is at ${moistureMetric.value}% (${moistureMetric.status} level)`)
    }

    // Trends
    if (trends.length > 0) {
        const improvingTrends = trends.filter((t) => t.direction === 'improving')
        const decliningTrends = trends.filter((t) => t.direction === 'declining')

        if (improvingTrends.length > 0) {
            parts.push(`Positive trends: ${improvingTrends.map((t) => t.description).join(', ')}`)
        }
        if (decliningTrends.length > 0) {
            parts.push(
                `Areas of concern: ${decliningTrends.map((t) => t.description).join(', ')}`,
            )
        }
    }

    // Recommendations summary
    if (recommendations.length > 0) {
        const criticalRecs = recommendations.filter((r) => r.priority === 'critical')
        if (criticalRecs.length > 0) {
            parts.push(`⚠️ URGENT: ${criticalRecs[0].title}`)
        } else {
            parts.push(`Recommendation: ${recommendations[0].title}`)
        }
    } else {
        parts.push('No immediate actions required - field is in good condition')
    }

    return parts.join('. ') + '.'
}

/**
 * Build Arabic narrative
 */
function buildNarrativeAr(
    field: FieldData,
    metrics: KeyMetric[],
    trends: Trend[],
    recommendations: Recommendation[],
): string {
    const parts: string[] = []

    // Opening
    parts.push(
        `الحقل "${field.name}" (${field.area} هكتار${field.cropType ? ` من ${field.cropType}` : ''})`,
    )

    // Health assessment
    const healthMetric = metrics.find((m) => m.name.includes('NDVI'))
    if (healthMetric) {
        const statusAr = {
            excellent: 'ممتازة',
            good: 'جيدة',
            fair: 'متوسطة',
            poor: 'ضعيفة',
        }
        parts.push(
            `يظهر صحة نباتات ${statusAr[healthMetric.status]} بمؤشر NDVI قدره ${healthMetric.value}`,
        )
    }

    // Moisture status
    const moistureMetric = metrics.find((m) => m.name.includes('Moisture'))
    if (moistureMetric) {
        const statusAr = {
            excellent: 'ممتاز',
            good: 'جيد',
            fair: 'متوسط',
            poor: 'ضعيف',
        }
        parts.push(
            `رطوبة التربة عند ${moistureMetric.value}٪ (مستوى ${statusAr[moistureMetric.status]})`,
        )
    }

    // Trends
    if (trends.length > 0) {
        const improvingTrends = trends.filter((t) => t.direction === 'improving')
        const decliningTrends = trends.filter((t) => t.direction === 'declining')

        if (improvingTrends.length > 0) {
            parts.push(`اتجاهات إيجابية: ${improvingTrends.map((t) => t.descriptionAr).join('، ')}`)
        }
        if (decliningTrends.length > 0) {
            parts.push(`مجالات تحتاج اهتمام: ${decliningTrends.map((t) => t.descriptionAr).join('، ')}`)
        }
    }

    // Recommendations summary
    if (recommendations.length > 0) {
        const criticalRecs = recommendations.filter((r) => r.priority === 'critical')
        if (criticalRecs.length > 0) {
            parts.push(`⚠️ عاجل: ${criticalRecs[0].titleAr}`)
        } else {
            parts.push(`توصية: ${recommendations[0].titleAr}`)
        }
    } else {
        parts.push('لا توجد إجراءات فورية مطلوبة - الحقل في حالة جيدة')
    }

    return parts.join('. ') + '.'
}

// ============================================================================
// Status Assessment Helpers
// ============================================================================

function getNdviStatus(ndvi: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (ndvi >= 0.6) return 'excellent'
    if (ndvi >= 0.4) return 'good'
    if (ndvi >= 0.2) return 'fair'
    return 'poor'
}

function getMoistureStatus(moisture: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (moisture >= 60 && moisture <= 75) return 'excellent'
    if (moisture >= 40 && moisture <= 85) return 'good'
    if (moisture >= 25 && moisture <= 90) return 'fair'
    return 'poor'
}

function getTemperatureStatus(temp: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (temp >= 18 && temp <= 25) return 'excellent'
    if (temp >= 12 && temp <= 30) return 'good'
    if (temp >= 5 && temp <= 35) return 'fair'
    return 'poor'
}
