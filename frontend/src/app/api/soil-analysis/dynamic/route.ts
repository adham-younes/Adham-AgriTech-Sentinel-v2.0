import { NextResponse } from "next/server"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { createServiceSupabaseClient } from "@/lib/supabase/service-client"
import { fetchEOSDANDVI } from "@/lib/services/eosda"
import { logger } from "@/lib/utils/logger"

interface SoilAnalysisRequest {
  fieldId?: string
  latitude?: number
  longitude?: number
  includeHistorical?: boolean
  dateRange?: { start: string; end: string }
}

interface SoilMetrics {
  nitrogen: { value: number; status: "low" | "optimal" | "high"; trend: "up" | "down" | "stable" }
  phosphorus: { value: number; status: "low" | "optimal" | "high"; trend: "up" | "down" | "stable" }
  potassium: { value: number; status: "low" | "optimal" | "high"; trend: "up" | "down" | "stable" }
  ph: { value: number; status: "acidic" | "optimal" | "alkaline"; trend: "up" | "down" | "stable" }
  moisture: { value: number; status: "dry" | "optimal" | "wet"; trend: "up" | "down" | "stable" }
  organic_matter: { value: number; status: "low" | "optimal" | "high"; trend: "up" | "down" | "stable" }
  temperature: { value: number; status: "cold" | "optimal" | "hot"; trend: "up" | "down" | "stable" }
  conductivity: { value: number; status: "low" | "optimal" | "high"; trend: "up" | "down" | "stable" }
}

interface DynamicSoilAnalysis {
  fieldId: string
  fieldName: string
  location: { latitude: number; longitude: number }
  timestamp: string
  metrics: SoilMetrics
  satelliteData: {
    ndvi: number | null
    ndmi: number | null
    evi: number | null
    lastUpdated: string | null
  }
  recommendations: {
    nitrogen: string[]
    phosphorus: string[]
    potassium: string[]
    ph: string[]
    moisture: string[]
    overall: string[]
  }
  healthScore: number
  trendAnalysis: {
    improving: string[]
    declining: string[]
    stable: string[]
  }
}

function calculateStatus(value: number, ranges: { low: number[]; optimal: number[]; high: number[] }): "low" | "optimal" | "high" {
  if (value >= ranges.optimal[0] && value <= ranges.optimal[1]) return "optimal"
  if (value < ranges.optimal[0]) return "low"
  return "high"
}

function calculatePHStatus(value: number): "acidic" | "optimal" | "alkaline" {
  if (value >= 6.0 && value <= 7.5) return "optimal"
  if (value < 6.0) return "acidic"
  return "alkaline"
}

function calculateMoistureStatus(value: number): "dry" | "optimal" | "wet" {
  if (value >= 20 && value <= 40) return "optimal"
  if (value < 20) return "dry"
  return "wet"
}

function calculateTemperatureStatus(value: number): "cold" | "optimal" | "hot" {
  if (value >= 15 && value <= 30) return "optimal"
  if (value < 15) return "cold"
  return "hot"
}

function calculateTrend(current: number, historical: number[]): "up" | "down" | "stable" {
  if (historical.length < 2) return "stable"
  
  const avg = historical.reduce((a, b) => a + b, 0) / historical.length
  const change = ((current - avg) / avg) * 100
  
  if (Math.abs(change) < 5) return "stable"
  return change > 0 ? "up" : "down"
}

function generateRecommendations(metrics: SoilMetrics, language: string = "ar") {
  const recommendations = {
    nitrogen: [] as string[],
    phosphorus: [] as string[],
    potassium: [] as string[],
    ph: [] as string[],
    moisture: [] as string[],
    overall: [] as string[]
  }

  // Nitrogen recommendations
  if (metrics.nitrogen.status === "low") {
    recommendations.nitrogen.push(
      language === "ar" ? "أضف سماد نيتروجيني (اليوريا أو نترات الأمونيوم)" : "Add nitrogen fertilizer (urea or ammonium nitrate)"
    )
    recommendations.nitrogen.push(
      language === "ar" ? "ضعف الجرعة الموصى بها للنمو السريع" : "Apply recommended rate for rapid growth"
    )
  } else if (metrics.nitrogen.status === "high") {
    recommendations.nitrogen.push(
      language === "ar" ? "قلل الأسمدة النيتروجينية لتجنب الحروق" : "Reduce nitrogen fertilizers to prevent burn"
    )
    recommendations.nitrogen.push(
      language === "ar" ? "راقب نمو النباتات للإفراط في النيتروجين" : "Monitor plants for nitrogen excess"
    )
  }

  // Phosphorus recommendations
  if (metrics.phosphorus.status === "low") {
    recommendations.phosphorus.push(
      language === "ar" ? "أضف سماد فوسفوري (سوبر فوسفات)" : "Add phosphorus fertilizer (super phosphate)"
    )
    recommendations.phosphorus.push(
      language === "ar" ? "ركز على تطوير الجذور" : "Focus on root development"
    )
  }

  // Potassium recommendations
  if (metrics.potassium.status === "low") {
    recommendations.potassium.push(
      language === "ar" ? "أضف سماد البوتاس (سلفات البوتاسيوم)" : "Add potassium fertilizer (potassium sulfate)"
    )
    recommendations.potassium.push(
      language === "ar" ? "مهم لمقاومة الأمراض والجفاف" : "Important for disease and drought resistance"
    )
  }

  // pH recommendations
  if (metrics.ph.status === "acidic") {
    recommendations.ph.push(
      language === "ar" ? "أضف كربونات الكالسيوم أو جير الزراعة" : "Add calcium carbonate or agricultural lime"
    )
  } else if (metrics.ph.status === "alkaline") {
    recommendations.ph.push(
      language === "ar" ? "أضف كبريتات أو مواد عضوية لخفض درجة الحموضة" : "Add sulfur or organic matter to lower pH"
    )
  }

  // Moisture recommendations
  if (metrics.moisture.status === "dry") {
    recommendations.moisture.push(
      language === "ar" ? "زيادة الري أو تحسين الاحتفاظ بالرطوبة" : "Increase irrigation or improve moisture retention"
    )
    recommendations.moisture.push(
      language === "ar" ? "استخدم المهاد العضوي" : "Use organic mulch"
    )
  } else if (metrics.moisture.status === "wet") {
    recommendations.moisture.push(
      language === "ar" ? "قلل الري أو تحسين الصرف" : "Reduce irrigation or improve drainage"
    )
  }

  // Overall recommendations
  const lowCount = Object.values(metrics).filter(m => 
    typeof m === 'object' && 'status' in m && m.status === 'low'
  ).length

  if (lowCount >= 3) {
    recommendations.overall.push(
      language === "ar" ? "التربة بحاجة إلى تغذية شاملة" : "Soil needs comprehensive nutrition"
    )
    recommendations.overall.push(
      language === "ar" ? "ضعف برنامج التسميد الموصى به" : "Double the recommended fertilization program"
    )
  } else if (lowCount === 0) {
    recommendations.overall.push(
      language === "ar" ? "التربة في حالة ممتازة" : "Soil is in excellent condition"
    )
    recommendations.overall.push(
      language === "ar" ? "حافظ على برنامج التسميد الحالي" : "Maintain current fertilization program"
    )
  }

  return recommendations
}

function calculateHealthScore(metrics: SoilMetrics): number {
  const weights = {
    nitrogen: 0.15,
    phosphorus: 0.15,
    potassium: 0.15,
    ph: 0.20,
    moisture: 0.15,
    organic_matter: 0.10,
    temperature: 0.05,
    conductivity: 0.05
  }

  let score = 0
  Object.entries(weights).forEach(([key, weight]) => {
    const metric = metrics[key as keyof SoilMetrics]
    const statusScore = metric.status === "optimal" ? 100 : metric.status === "low" ? 40 : 60
    score += statusScore * weight
  })

  return Math.round(score)
}

export async function POST(request: Request) {
  try {
    let body: SoilAnalysisRequest
    try {
      body = await request.json()
    } catch (parseError) {
      logger.error("[Soil Analysis] Failed to parse request body", parseError, {
        endpoint: "POST /api/soil-analysis/dynamic"
      })
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "Invalid JSON in request body" },
        { status: 400 }
      )
    }
    
    const { fieldId, latitude, longitude, includeHistorical = false, dateRange } = body

    if (!fieldId && (!latitude || !longitude)) {
      return NextResponse.json(
        { error: "MISSING_PARAMS", message: "Either fieldId or coordinates (latitude, longitude) are required" },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })
    }

    let fieldData: any = null
    let fieldLatitude = latitude
    let fieldLongitude = longitude

    // Get field data if fieldId is provided
    if (fieldId) {
      const { data: field, error: fieldError } = await supabase
        .from("fields")
        .select(`
          id,
          name,
          latitude,
          longitude,
          soil_nitrogen,
          soil_phosphorus,
          soil_potassium,
          soil_ph,
          last_moisture,
          last_temperature,
          farms!fields_farm_id_fkey ( id, name, latitude, longitude )
        `)
        .eq("id", fieldId)
        .maybeSingle()

      if (fieldError) {
        logger.error("[Soil Analysis] Field query error", fieldError, {
          fieldId,
          endpoint: "POST /api/soil-analysis/dynamic"
        })
        return NextResponse.json({ error: "FIELD_QUERY_FAILED", message: fieldError.message }, { status: 500 })
      }

      if (!field) {
        return NextResponse.json({ error: "FIELD_NOT_FOUND" }, { status: 404 })
      }

      fieldData = field
      fieldLatitude = field.latitude || latitude
      fieldLongitude = field.longitude || longitude
    }

    // Fetch satellite data
    let satelliteData = {
      ndvi: null as number | null,
      ndmi: null as number | null,
      evi: null as number | null,
      lastUpdated: null as string | null
    }

    if (fieldLatitude && fieldLongitude) {
      try {
        const endDate = new Date()
        const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)

        const ndviData = await fetchEOSDANDVI({
          center: { latitude: fieldLatitude, longitude: fieldLongitude },
          startDate,
          endDate
        })

        if (ndviData?.ndvi_value) {
          satelliteData.ndvi = ndviData.ndvi_value
          satelliteData.lastUpdated = ndviData.date || new Date().toISOString()
        }
      } catch (error) {
        logger.warn("[Soil Analysis] Failed to fetch satellite data", error, { fieldId, service: "satellite" })
      }
    }

    // Calculate soil metrics
    const metrics: SoilMetrics = {
      nitrogen: {
        value: fieldData?.soil_nitrogen || 25,
        status: calculateStatus(fieldData?.soil_nitrogen || 25, {
          low: [0, 20],
          optimal: [20, 40],
          high: [40, 100]
        }),
        trend: "stable"
      },
      phosphorus: {
        value: fieldData?.soil_phosphorus || 15,
        status: calculateStatus(fieldData?.soil_phosphorus || 15, {
          low: [0, 10],
          optimal: [10, 25],
          high: [25, 100]
        }),
        trend: "stable"
      },
      potassium: {
        value: fieldData?.soil_potassium || 20,
        status: calculateStatus(fieldData?.soil_potassium || 20, {
          low: [0, 15],
          optimal: [15, 30],
          high: [30, 100]
        }),
        trend: "stable"
      },
      ph: {
        value: fieldData?.soil_ph || 6.5,
        status: calculatePHStatus(fieldData?.soil_ph || 6.5),
        trend: "stable"
      },
      moisture: {
        value: fieldData?.last_moisture || 30,
        status: calculateMoistureStatus(fieldData?.last_moisture || 30),
        trend: "stable"
      },
      organic_matter: {
        value: 2.5,
        status: calculateStatus(2.5, {
          low: [0, 2],
          optimal: [2, 4],
          high: [4, 10]
        }),
        trend: "stable"
      },
      temperature: {
        value: fieldData?.last_temperature || 25,
        status: calculateTemperatureStatus(fieldData?.last_temperature || 25),
        trend: "stable"
      },
      conductivity: {
        value: 1.2,
        status: calculateStatus(1.2, {
          low: [0, 0.8],
          optimal: [0.8, 2.0],
          high: [2.0, 10]
        }),
        trend: "stable"
      }
    }

    // Generate recommendations
    const recommendations = generateRecommendations(metrics, "ar")

    // Calculate health score
    const healthScore = calculateHealthScore(metrics)

    // Analyze trends
    const trendAnalysis = {
      improving: [] as string[],
      declining: [] as string[],
      stable: [] as string[]
    }

    Object.entries(metrics).forEach(([key, metric]) => {
      if (metric.trend === "up") {
        trendAnalysis.improving.push(key)
      } else if (metric.trend === "down") {
        trendAnalysis.declining.push(key)
      } else {
        trendAnalysis.stable.push(key)
      }
    })

    const analysis: DynamicSoilAnalysis = {
      fieldId: fieldData?.id || "custom",
      fieldName: fieldData?.name || "Custom Location",
      location: {
        latitude: fieldLatitude || 0,
        longitude: fieldLongitude || 0
      },
      timestamp: new Date().toISOString(),
      metrics,
      satelliteData,
      recommendations,
      healthScore,
      trendAnalysis
    }

    return NextResponse.json({ analysis })

  } catch (error) {
    let body: SoilAnalysisRequest | undefined
    try {
      body = await request.json().catch(() => undefined)
    } catch {
      // Ignore JSON parse errors in catch block
    }
    
    logger.error("[Soil Analysis] Error", error, {
      endpoint: "POST /api/soil-analysis/dynamic",
      fieldId: body?.fieldId,
      hasCoordinates: !!(body?.latitude && body?.longitude)
    })
    
    // Return a more helpful error message
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const isNetworkError = /fetch|network|timeout|ENOTFOUND|ECONNREFUSED/i.test(errorMessage)
    
    return NextResponse.json(
      { 
        error: "ANALYSIS_FAILED", 
        message: isNetworkError 
          ? "Unable to connect to satellite data service. Please try again later."
          : errorMessage
      },
      { status: 500 }
    )
  }
}
