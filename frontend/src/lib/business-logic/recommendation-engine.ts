/**
 * Recommendation Engine Core
 * 
 * Professional business logic for agricultural recommendations based on:
 * - Field health indicators (NDVI, soil moisture, temperature)
 * - Crop type and growth stage
 * - Weather patterns
 * - Historical data analysis
 * 
 * @module business-logic/recommendation-engine
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface FieldData {
    id: string
    name: string
    cropType: string | null
    soilType: string | null
    irrigationType: string | null
    area: number
    lastNdvi: number | null
    lastMoisture: number | null
    lastTemperature: number | null
    lastReadingAt: string | null
    plantingDate: string | null
}

export interface WeatherData {
    temperature: number
    humidity: number
    rainfall: number
    forecast: {
        nextDays: number
        expectedRainfall: number
    }
}

export interface Recommendation {
    id: string
    type: RecommendationType
    priority: Priority
    title: string
    titleAr: string
    description: string
    descriptionAr: string
    actionItems: ActionItem[]
    reasoning: string
    reasoningAr: string
    expectedImpact: string
    expectedImpactAr: string
    confidence: number // 0-1
    createdAt: string
}

export type RecommendationType =
    | 'irrigation'
    | 'fertilization'
    | 'pest_control'
    | 'harvest_timing'
    | 'general_care'

export type Priority = 'critical' | 'high' | 'medium' | 'low'

export interface ActionItem {
    action: string
    actionAr: string
    quantity?: {
        value: number
        unit: string
        unitAr: string
    }
    timing?: string
    timingAr?: string
}

// ============================================================================
// Health Scoring Algorithm
// ============================================================================

/**
 * Calculate overall field health score (0-100)
 * 
 * Weights:
 * - NDVI: 40% (vegetation health)
 * - Soil Moisture: 30% (water availability)
 * - Temperature: 20% (stress conditions)
 * - Data freshness: 10% (reliability)
 */
export function calculateFieldHealthScore(field: FieldData): {
    score: number
    components: {
        ndvi: number
        moisture: number
        temperature: number
        freshness: number
    }
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
} {
    const weights = {
        ndvi: 0.4,
        moisture: 0.3,
        temperature: 0.2,
        freshness: 0.1,
    }

    // NDVI score (0.2-0.8 range mapped to 0-100)
    const ndviScore = field.lastNdvi
        ? Math.max(0, Math.min(100, ((field.lastNdvi - 0.2) / 0.6) * 100))
        : 50 // Default if no data

    // Moisture score (20-80% range mapped to 0-100)
    const moistureScore = field.lastMoisture
        ? Math.max(0, Math.min(100, ((field.lastMoisture - 20) / 60) * 100))
        : 50

    // Temperature score (inverted stress - optimal 15-25°C)
    const tempScore = field.lastTemperature
        ? calculateTemperatureScore(field.lastTemperature)
        : 50

    // Freshness score (data age)
    const freshnessScore = field.lastReadingAt
        ? calculateFreshnessScore(field.lastReadingAt)
        : 30 // Low if no recent data

    // Weighted total
    const totalScore =
        ndviScore * weights.ndvi +
        moistureScore * weights.moisture +
        tempScore * weights.temperature +
        freshnessScore * weights.freshness

    return {
        score: Math.round(totalScore),
        components: {
            ndvi: Math.round(ndviScore),
            moisture: Math.round(moistureScore),
            temperature: Math.round(tempScore),
            freshness: Math.round(freshnessScore),
        },
        status: getHealthStatus(totalScore),
    }
}

/**
 * Temperature stress score calculation
 * Optimal range: 15-25°C
 */
function calculateTemperatureScore(temp: number): number {
    if (temp >= 15 && temp <= 25) return 100 // Optimal
    if (temp >= 10 && temp <= 30) return 75 // Good
    if (temp >= 5 && temp <= 35) return 50 // Fair
    if (temp >= 0 && temp <= 40) return 25 // Poor
    return 10 // Critical (frost or extreme heat)
}

/**
 * Data freshness score based on reading age
 */
function calculateFreshnessScore(lastReading: string): number {
    const now = new Date()
    const lastDate = new Date(lastReading)
    const ageInDays = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)

    if (ageInDays <= 1) return 100 // Very fresh
    if (ageInDays <= 3) return 80 // Recent
    if (ageInDays <= 7) return 60 // Acceptable
    if (ageInDays <= 14) return 40 // Aging
    if (ageInDays <= 30) return 20 // Old
    return 10 // Very old
}

/**
 * Map score to health status category
 */
function getHealthStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (score >= 80) return 'excellent'
    if (score >= 60) return 'good'
    if (score >= 40) return 'fair'
    if (score >= 20) return 'poor'
    return 'critical'
}

// ============================================================================
// Irrigation Recommendations
// ============================================================================

/**
 * Generate irrigation recommendations based on:
 * - Current soil moisture
 * - Crop type water requirements
 * - Weather forecast
 * - Irrigation system type
 */
export function generateIrrigationRecommendation(
    field: FieldData,
    weather: WeatherData,
): Recommendation | null {
    if (!field.lastMoisture || !field.cropType) return null

    const moisture = field.lastMoisture
    const expectedRainfall = weather.forecast.expectedRainfall

    // Crop water requirements (simplified - would come from database)
    const waterRequirements: Record<string, { min: number; optimal: number }> = {
        Wheat: { min: 30, optimal: 60 },
        Corn: { min: 35, optimal: 65 },
        Tomato: { min: 40, optimal: 70 },
        Cotton: { min: 25, optimal: 55 },
        Rice: { min: 70, optimal: 90 },
    }

    const cropReq = waterRequirements[field.cropType] || { min: 30, optimal: 60 }

    // Decision logic
    const needsImmediateWater = moisture < cropReq.min && expectedRainfall < 5
    const needsWaterSoon = moisture < cropReq.optimal && expectedRainfall < 10
    const isOptimal = moisture >= cropReq.min && moisture <= cropReq.optimal + 10

    if (isOptimal && expectedRainfall < 20) {
        return null // No action needed
    }

    // Critical: Immediate irrigation needed
    if (needsImmediateWater) {
        const irrigationAmount = calculateIrrigationAmount(
            field.area,
            cropReq.optimal - moisture,
            field.irrigationType,
        )

        return {
            id: `irrigation-${field.id}-${Date.now()}`,
            type: 'irrigation',
            priority: 'critical',
            title: 'Immediate Irrigation Required',
            titleAr: 'ري فوري مطلوب',
            description: `Soil moisture is critically low at ${moisture}%. Immediate irrigation is required to prevent crop stress.`,
            descriptionAr: `رطوبة التربة منخفضة للغاية عند ${moisture}٪. الري الفوري مطلوب لمنع إجهاد المحصول.`,
            actionItems: [
                {
                    action: 'Irrigate field immediately',
                    actionAr: 'ري الحقل فوراً',
                    quantity: {
                        value: irrigationAmount,
                        unit: 'cubic meters',
                        unitAr: 'متر مكعب',
                    },
                    timing: 'Within next 6 hours',
                    timingAr: 'خلال الـ 6 ساعات القادمة',
                },
            ],
            reasoning: `Current moisture (${moisture}%) is below minimum requirement (${cropReq.min}%) and no significant rainfall expected in next ${weather.forecast.nextDays} days.`,
            reasoningAr: `الرطوبة الحالية (${moisture}٪) أقل من الحد الأدنى المطلوب (${cropReq.min}٪) ولا يُتوقع هطول أمطار كبيرة في الـ ${weather.forecast.nextDays} أيام القادمة.`,
            expectedImpact: 'Prevent crop stress and potential yield loss of 20-40%',
            expectedImpactAr: 'منع إجهاد المحصول وفقدان محتمل للإنتاج بنسبة 20-40٪',
            confidence: 0.95,
            createdAt: new Date().toISOString(),
        }
    }

    // High priority: Irrigation recommended soon
    if (needsWaterSoon) {
        const irrigationAmount = calculateIrrigationAmount(
            field.area,
            cropReq.optimal - moisture,
            field.irrigationType,
        )

        return {
            id: `irrigation-${field.id}-${Date.now()}`,
            type: 'irrigation',
            priority: 'high',
            title: 'Irrigation Recommended',
            titleAr: 'الري موصى به',
            description: `Soil moisture is at ${moisture}%, approaching minimum levels. Irrigation recommended within 24-48 hours.`,
            descriptionAr: `رطوبة التربة عند ${moisture}٪، تقترب من الحد الأدنى. يوصى بالري خلال 24-48 ساعة.`,
            actionItems: [
                {
                    action: 'Schedule irrigation',
                    actionAr: 'جدولة الري',
                    quantity: {
                        value: irrigationAmount,
                        unit: 'cubic meters',
                        unitAr: 'متر مكعب',
                    },
                    timing: 'Within 24-48 hours',
                    timingAr: 'خلال 24-48 ساعة',
                },
            ],
            reasoning: `Moisture level trending towards minimum requirement. Proactive irrigation will maintain optimal growing conditions.`,
            reasoningAr: `مستوى الرطوبة يتجه نحو الحد الأدنى المطلوب. الري الاستباقي سيحافظ على ظروف النمو المثلى.`,
            expectedImpact: 'Maintain optimal growth and prevent yield reduction',
            expectedImpactAr: 'الحفاظ على النمو الأمثل ومنع انخفاض الإنتاج',
            confidence: 0.85,
            createdAt: new Date().toISOString(),
        }
    }

    return null
}

/**
 * Calculate required irrigation amount
 * Accounts for field size, irrigation system efficiency
 */
function calculateIrrigationAmount(
    fieldArea: number,
    moistureDeficit: number,
    irrigationType: string | null,
): number {
    // Base calculation: deficit % * area * depth factor
    // Assuming 1% moisture ≈ 10mm water depth
    const baseAmount = (moistureDeficit / 100) * fieldArea * 10

    // Efficiency factors for different irrigation types
    const efficiencyFactors: Record<string, number> = {
        drip: 0.95, // 95% efficient
        sprinkler: 0.80, // 80% efficient
        flood: 0.60, // 60% efficient
        manual: 0.70, // 70% efficient
    }

    const efficiency = irrigationType ? efficiencyFactors[irrigationType] || 0.75 : 0.75

    // Adjusted for system efficiency
    return Math.round((baseAmount / efficiency) * 10) / 10
}

// ============================================================================
// Multi-Recommendation Generator
// ============================================================================

/**
 * Generate all applicable recommendations for a field
 */
export function generateAllRecommendations(
    field: FieldData,
    weather: WeatherData,
): Recommendation[] {
    const recommendations: Recommendation[] = []

    // Irrigation recommendation
    const irrigationRec = generateIrrigationRecommendation(field, weather)
    if (irrigationRec) recommendations.push(irrigationRec)

    // TODO: Add more recommendation types
    // - Fertilization based on growth stage
    // - Pest control based on weather + crop
    // - Harvest timing based on maturity indicators
    // - General care based on health score

    return recommendations.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
}
