/**
 * Early Warning System Service
 * Provides proactive alerts for field health issues
 */

import { createClient } from "@/lib/supabase/server"
import { fetchEOSDANDVI, fetchEOSDASoilMoisture, fetchEOSDAWeatherSnapshots } from "./eosda"

export interface EarlyWarning {
  id: string
  fieldId: string
  type: "vegetation_stress" | "drought_risk" | "disease_risk" | "nutrient_deficiency" | "temperature_stress"
  severity: "low" | "medium" | "high" | "critical"
  message: string
  messageAr: string
  recommendation: string
  recommendationAr: string
  detectedAt: string
  resolvedAt?: string
  status: "active" | "resolved" | "monitoring"
  metrics: {
    ndvi?: number
    moisture?: number
    temperature?: number
    [key: string]: any
  }
}

export interface FieldHealthCheck {
  fieldId: string
  warnings: EarlyWarning[]
  healthScore: number
  criticalCount: number
  lastChecked: string
}

/**
 * Check field health and generate early warnings
 */
export async function checkFieldHealth(fieldId: string): Promise<FieldHealthCheck> {
  const supabase = await createClient()
  const warnings: EarlyWarning[] = []

  try {
    // Get field data
    const { data: field, error: fieldError } = await supabase
      .from("fields")
      .select("id, name, latitude, longitude, crop_type, last_ndvi, last_moisture, last_temperature")
      .eq("id", fieldId)
      .single()

    if (fieldError || !field) {
      throw new Error("Field not found")
    }

    // Get latest metrics from EOSDA
    const center = {
      latitude: field.latitude || 30.0444,
      longitude: field.longitude || 31.2357,
    }

    const [ndviResult, moistureResult, weatherResult] = await Promise.allSettled([
      fetchEOSDANDVI({ center }),
      fetchEOSDASoilMoisture({ center }),
      fetchEOSDAWeatherSnapshots({ latitude: center.latitude, longitude: center.longitude, hours: 24 }),
    ])

    const ndvi = ndviResult.status === "fulfilled" ? ndviResult.value?.ndvi_value : field.last_ndvi
    const moisture = moistureResult.status === "fulfilled" 
      ? moistureResult.value?.value 
      : field.last_moisture
    const temperature = weatherResult.status === "fulfilled" && weatherResult.value.length > 0
      ? weatherResult.value[0].temperature
      : field.last_temperature

    // Check thresholds and generate warnings
    const metrics = { ndvi, moisture, temperature }

    // 1. Vegetation Stress (Low NDVI)
    if (ndvi != null && ndvi < 0.3) {
      warnings.push({
        id: `warning-${fieldId}-vegetation-${Date.now()}`,
        fieldId,
        type: "vegetation_stress",
        severity: ndvi < 0.2 ? "critical" : ndvi < 0.25 ? "high" : "medium",
        message: `Vegetation stress detected (NDVI: ${ndvi.toFixed(2)}). Check irrigation and fertilization.`,
        messageAr: `تم اكتشاف إجهاد نباتي (NDVI: ${ndvi.toFixed(2)}). تحقق من الري والتسميد.`,
        recommendation: "Increase irrigation frequency and apply nitrogen fertilizer. Monitor for 7 days.",
        recommendationAr: "زيادة تكرار الري وتطبيق سماد النيتروجين. مراقبة لمدة 7 أيام.",
        detectedAt: new Date().toISOString(),
        status: "active",
        metrics: { ndvi },
      })
    }

    // 2. Drought Risk (Low Moisture)
    if (moisture != null && moisture < 30) {
      warnings.push({
        id: `warning-${fieldId}-drought-${Date.now()}`,
        fieldId,
        type: "drought_risk",
        severity: moisture < 15 ? "critical" : moisture < 25 ? "high" : "medium",
        message: `Drought risk detected (Moisture: ${moisture.toFixed(1)}%). Immediate irrigation recommended.`,
        messageAr: `تم اكتشاف خطر الجفاف (الرطوبة: ${moisture.toFixed(1)}%). يُنصح بالري الفوري.`,
        recommendation: "Start irrigation immediately. Apply 20-30mm water. Re-check in 24 hours.",
        recommendationAr: "بدء الري فوراً. تطبيق 20-30 ملم من الماء. إعادة الفحص خلال 24 ساعة.",
        detectedAt: new Date().toISOString(),
        status: "active",
        metrics: { moisture },
      })
    }

    // 3. Temperature Stress
    if (temperature != null && temperature > 35) {
      warnings.push({
        id: `warning-${fieldId}-temperature-${Date.now()}`,
        fieldId,
        type: "temperature_stress",
        severity: temperature > 40 ? "critical" : "high",
        message: `High temperature stress (${temperature.toFixed(1)}°C). Increase irrigation to cool crops.`,
        messageAr: `إجهاد حراري عالي (${temperature.toFixed(1)}°C). زيادة الري لتبريد المحاصيل.`,
        recommendation: "Increase irrigation frequency. Consider shade nets for sensitive crops.",
        recommendationAr: "زيادة تكرار الري. النظر في استخدام شباك الظل للمحاصيل الحساسة.",
        detectedAt: new Date().toISOString(),
        status: "active",
        metrics: { temperature },
      })
    }

    // 4. Disease Risk (High moisture + moderate temperature)
    if (moisture != null && moisture > 80 && temperature != null && temperature > 20 && temperature < 30) {
      warnings.push({
        id: `warning-${fieldId}-disease-${Date.now()}`,
        fieldId,
        type: "disease_risk",
        severity: "medium",
        message: "High disease risk conditions detected. High moisture and moderate temperature favor fungal growth.",
        messageAr: "تم اكتشاف ظروف عالية الخطورة للأمراض. الرطوبة العالية ودرجة الحرارة المعتدلة تفضل نمو الفطريات.",
        recommendation: "Apply preventive fungicide. Improve drainage. Monitor for disease symptoms.",
        recommendationAr: "تطبيق مبيد فطري وقائي. تحسين الصرف. مراقبة أعراض الأمراض.",
        detectedAt: new Date().toISOString(),
        status: "active",
        metrics: { moisture, temperature },
      })
    }

    // Calculate health score
    let healthScore = 100
    warnings.forEach((warning) => {
      if (warning.severity === "critical") healthScore -= 30
      else if (warning.severity === "high") healthScore -= 20
      else if (warning.severity === "medium") healthScore -= 10
      else healthScore -= 5
    })
    healthScore = Math.max(0, healthScore)

    // Save warnings to database
    if (warnings.length > 0) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        for (const warning of warnings) {
          await supabase.from("early_warnings").upsert({
            field_id: fieldId,
            user_id: user.id,
            warning_type: warning.type,
            severity: warning.severity,
            message: warning.message,
            message_ar: warning.messageAr,
            recommendation: warning.recommendation,
            recommendation_ar: warning.recommendationAr,
            metrics: warning.metrics,
            status: warning.status,
            detected_at: warning.detectedAt,
          }, {
            onConflict: "field_id,warning_type",
          })
        }
      }
    }

    return {
      fieldId,
      warnings,
      healthScore,
      criticalCount: warnings.filter((w) => w.severity === "critical" || w.severity === "high").length,
      lastChecked: new Date().toISOString(),
    }
  } catch (error) {
    console.error("[Early Warning] Error checking field health:", error)
    return {
      fieldId,
      warnings: [],
      healthScore: 0,
      criticalCount: 0,
      lastChecked: new Date().toISOString(),
    }
  }
}

/**
 * Get active warnings for a field
 */
export async function getFieldWarnings(fieldId: string): Promise<EarlyWarning[]> {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from("early_warnings")
      .select("*")
      .eq("field_id", fieldId)
      .eq("status", "active")
      .order("detected_at", { ascending: false })

    if (error) throw error

    return (data || []).map((row) => ({
      id: row.id,
      fieldId: row.field_id,
      type: row.warning_type,
      severity: row.severity,
      message: row.message,
      messageAr: row.message_ar,
      recommendation: row.recommendation,
      recommendationAr: row.recommendation_ar,
      detectedAt: row.detected_at,
      resolvedAt: row.resolved_at,
      status: row.status,
      metrics: row.metrics || {},
    }))
  } catch (error) {
    console.error("[Early Warning] Error fetching warnings:", error)
    return []
  }
}

