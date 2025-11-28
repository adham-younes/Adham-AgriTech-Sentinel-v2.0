/**
 * Predictive Analytics Service
 * Provides yield prediction, disease risk assessment, and crop forecasting
 */

import { createClient } from "@/lib/supabase/server"
import { fetchEOSDANDVI, fetchEOSDASoilMoisture, fetchEOSDAWeatherSnapshots } from "./eosda"

export interface YieldPrediction {
  fieldId: string
  predictedYield: number // tonnes per hectare
  confidence: number // 0-100
  factors: {
    ndvi: number
    moisture: number
    weather: number
    historical: number
  }
  forecastDate: string
  recommendations: string[]
  recommendationsAr: string[]
}

export interface DiseaseRiskAssessment {
  fieldId: string
  riskScore: number // 0-100
  riskLevel: "low" | "medium" | "high" | "critical"
  factors: {
    weather: number
    moisture: number
    cropType: string
    historicalDiseases: number
  }
  recommendations: string[]
  recommendationsAr: string[]
}

/**
 * Predict yield for a field based on current conditions and historical data
 */
export async function predictYield(fieldId: string): Promise<YieldPrediction> {
  const supabase = await createClient()

  try {
    // Get field data
    const { data: field } = await supabase
      .from("fields")
      .select("id, name, crop_type, latitude, longitude, area")
      .eq("id", fieldId)
      .single()

    if (!field) {
      throw new Error("Field not found")
    }

    // Get current metrics
    const center = {
      latitude: field.latitude || 30.0444,
      longitude: field.longitude || 31.2357,
    }

    const [ndviResult, moistureResult, weatherResult] = await Promise.allSettled([
      fetchEOSDANDVI({ center }),
      fetchEOSDASoilMoisture({ center }),
      fetchEOSDAWeatherSnapshots({ latitude: center.latitude, longitude: center.longitude, hours: 168 }), // 7 days
    ])

    const ndvi = ndviResult.status === "fulfilled" ? ndviResult.value?.ndvi_value : null
    const moisture = moistureResult.status === "fulfilled" ? moistureResult.value?.value : null
    const weatherData = weatherResult.status === "fulfilled" ? weatherResult.value : []

    // Calculate factors (simplified ML model)
    const ndviFactor = ndvi != null ? Math.max(0, Math.min(1, (ndvi + 1) / 2)) : 0.5
    const moistureFactor = moisture != null ? Math.max(0, Math.min(1, moisture / 100)) : 0.5
    const avgTemp = weatherData.length > 0
      ? weatherData.reduce((sum, w) => sum + (w.temperature || 0), 0) / weatherData.length
      : 25
    const weatherFactor = avgTemp >= 20 && avgTemp <= 30 ? 1 : avgTemp < 20 || avgTemp > 30 ? 0.7 : 0.5

    // Get historical yield data (if available)
    const { data: historical } = await supabase
      .from("yield_history")
      .select("yield_per_hectare")
      .eq("field_id", fieldId)
      .order("harvest_date", { ascending: false })
      .limit(3)

    const historicalFactor = historical && historical.length > 0
      ? historical.reduce((sum, h) => sum + (h.yield_per_hectare || 0), 0) / historical.length / 10 // Normalize
      : 0.5

    // Weighted prediction (simplified model)
    const factors = {
      ndvi: ndviFactor,
      moisture: moistureFactor,
      weather: weatherFactor,
      historical: historicalFactor,
    }

    // Base yield by crop type (tonnes/hectare)
    const baseYields: Record<string, number> = {
      قمح: 4.5,
      طماطم: 50,
      toomato: 50,
      tomato: 50,
      ذرة: 8,
      برسيم: 12,
      default: 5,
    }

    const baseYield = baseYields[field.crop_type || ""] || baseYields.default

    // Calculate predicted yield
    const weightedAverage = (
      factors.ndvi * 0.3 +
      factors.moisture * 0.25 +
      factors.weather * 0.25 +
      factors.historical * 0.2
    )

    const predictedYield = baseYield * weightedAverage
    const confidence = Math.min(100, Math.max(50, weightedAverage * 100))

    // Generate recommendations
    const recommendations: string[] = []
    const recommendationsAr: string[] = []

    if (ndviFactor < 0.5) {
      recommendations.push("Improve NDVI through better irrigation and fertilization")
      recommendationsAr.push("تحسين NDVI من خلال الري والتسميد الأفضل")
    }

    if (moistureFactor < 0.4) {
      recommendations.push("Increase irrigation to maintain optimal soil moisture")
      recommendationsAr.push("زيادة الري للحفاظ على رطوبة التربة المثلى")
    }

    if (weatherFactor < 0.8) {
      recommendations.push("Monitor weather conditions and adjust irrigation schedule")
      recommendationsAr.push("مراقبة الظروف الجوية وتعديل جدول الري")
    }

    return {
      fieldId,
      predictedYield: Math.round(predictedYield * 10) / 10,
      confidence: Math.round(confidence),
      factors,
      forecastDate: new Date().toISOString(),
      recommendations,
      recommendationsAr,
    }
  } catch (error) {
    console.error("[Predictive Analytics] Error predicting yield:", error)
    throw error
  }
}

/**
 * Assess disease risk for a field
 */
export async function assessDiseaseRisk(fieldId: string): Promise<DiseaseRiskAssessment> {
  const supabase = await createClient()

  try {
    const { data: field } = await supabase
      .from("fields")
      .select("id, crop_type, latitude, longitude")
      .eq("id", fieldId)
      .single()

    if (!field) {
      throw new Error("Field not found")
    }

    const center = {
      latitude: field.latitude || 30.0444,
      longitude: field.longitude || 31.2357,
    }

    // Get weather and moisture data
    const [moistureResult, weatherResult] = await Promise.allSettled([
      fetchEOSDASoilMoisture({ center }),
      fetchEOSDAWeatherSnapshots({ latitude: center.latitude, longitude: center.longitude, hours: 72 }),
    ])

    const moisture = moistureResult.status === "fulfilled" ? moistureResult.value?.value : null
    const weatherData = weatherResult.status === "fulfilled" ? weatherResult.value : []

    // Calculate risk factors
    const avgTemp = weatherData.length > 0
      ? weatherData.reduce((sum, w) => sum + (w.temperature || 0), 0) / weatherData.length
      : 25

    const avgHumidity = weatherData.length > 0
      ? weatherData.reduce((sum, w) => sum + (w.humidity || 0), 0) / weatherData.length
      : 50

    // Disease risk calculation
    let riskScore = 0

    // High moisture + moderate temp = fungal risk
    if (moisture != null && moisture > 70 && avgTemp >= 20 && avgTemp <= 28) {
      riskScore += 40
    }

    // High humidity = disease risk
    if (avgHumidity > 80) {
      riskScore += 30
    }

    // Check historical diseases
    const { data: historicalDiseases } = await supabase
      .from("disease_tracking")
      .select("id")
      .eq("field_id", fieldId)
      .eq("status", "active")
      .limit(10)

    const historicalFactor = (historicalDiseases?.length || 0) * 10
    riskScore += Math.min(30, historicalFactor)

    riskScore = Math.min(100, riskScore)

    const riskLevel: "low" | "medium" | "high" | "critical" =
      riskScore >= 70 ? "critical" :
      riskScore >= 50 ? "high" :
      riskScore >= 30 ? "medium" :
      "low"

    const recommendations: string[] = []
    const recommendationsAr: string[] = []

    if (riskScore >= 50) {
      recommendations.push("Apply preventive fungicide treatment")
      recommendationsAr.push("تطبيق علاج فطري وقائي")
    }

    if (moisture != null && moisture > 80) {
      recommendations.push("Improve drainage to reduce excess moisture")
      recommendationsAr.push("تحسين الصرف لتقليل الرطوبة الزائدة")
    }

    if (avgHumidity > 80) {
      recommendations.push("Monitor for early disease symptoms daily")
      recommendationsAr.push("مراقبة أعراض الأمراض المبكرة يومياً")
    }

    return {
      fieldId,
      riskScore: Math.round(riskScore),
      riskLevel,
      factors: {
        weather: avgTemp,
        moisture: moisture || 0,
        cropType: field.crop_type || "",
        historicalDiseases: historicalDiseases?.length || 0,
      },
      recommendations,
      recommendationsAr,
    }
  } catch (error) {
    console.error("[Predictive Analytics] Error assessing disease risk:", error)
    throw error
  }
}

