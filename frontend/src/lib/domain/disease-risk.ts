import type { SupabaseClient } from "@supabase/supabase-js"

type DbClient = SupabaseClient<any, any, any>

export type DiseaseRiskLevel = "low" | "medium" | "high"

export interface DiseaseRiskAssessment {
  level: DiseaseRiskLevel
  score: number
  reasons: string[]
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export async function computeDiseaseRiskForField(params: {
  client: DbClient
  fieldId: string
  cropName?: string | null
  lastNdvi?: number | null
  language?: string
}): Promise<DiseaseRiskAssessment | null> {
  const { client, fieldId, cropName, lastNdvi, language = "ar" } = params

  try {
    const { data: fieldRow, error: fieldError } = await client
      .from("fields")
      .select("farm_id, planting_date")
      .eq("id", fieldId)
      .maybeSingle()

    if (fieldError || !fieldRow) {
      return null
    }

    const farmId = (fieldRow as any).farm_id as string | null
    const plantingDateValue = (fieldRow as any).planting_date as string | null

    const today = new Date()
    let daysSincePlanting: number | null = null
    if (plantingDateValue) {
      const planted = new Date(plantingDateValue)
      if (!Number.isNaN(planted.getTime())) {
        const diffMs = today.getTime() - planted.getTime()
        daysSincePlanting = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      }
    }

    const { data: cropRow } = await client
      .from("crops")
      .select("id, name_en, name_ar")
      .or(
        cropName && cropName.trim().length > 0
          ? `name_en.eq.${cropName.trim()},name_ar.eq.${cropName.trim()}`
          : "id.eq.0",
      )
      .limit(1)

    const cropId = cropRow && cropRow.length > 0 ? (cropRow[0] as any).id : null

    let growthStageLabel: string | null = null
    if (cropId && daysSincePlanting != null && daysSincePlanting >= 0) {
      const { data: stages } = await client
        .from("growth_stages")
        .select("stage_name_en, stage_name_ar, ndvi_min, ndvi_max")
        .eq("crop_id", cropId)

      if (stages && stages.length > 0 && typeof lastNdvi === "number") {
        const matching = stages.find((stage: any) => {
          const min = typeof stage.ndvi_min === "number" ? stage.ndvi_min : null
          const max = typeof stage.ndvi_max === "number" ? stage.ndvi_max : null
          if (min == null || max == null) return false
          return lastNdvi >= min - 0.05 && lastNdvi <= max + 0.05
        })
        if (matching) {
          growthStageLabel =
            language === "ar"
              ? matching.stage_name_ar ?? matching.stage_name_en
              : matching.stage_name_en ?? matching.stage_name_ar
        }
      }
    }

    let temperature: number | null = null
    let humidity: number | null = null
    let weatherCondition: string | null = null

    if (farmId) {
      const { data: weatherRow } = await client
        .from("weather_data")
        .select("temperature, humidity, weather_condition, weather_condition_ar")
        .eq("farm_id", farmId)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (weatherRow) {
        temperature = typeof (weatherRow as any).temperature === "number" ? (weatherRow as any).temperature : null
        humidity = typeof (weatherRow as any).humidity === "number" ? (weatherRow as any).humidity : null
        const condEn = (weatherRow as any).weather_condition as string | null
        const condAr = (weatherRow as any).weather_condition_ar as string | null
        weatherCondition = language === "ar" ? condAr ?? condEn : condEn ?? condAr
      }
    }

    let ndviRisk = 0
    if (typeof lastNdvi === "number") {
      const n = clamp(lastNdvi, 0, 1)
      ndviRisk = n > 0.5 ? (n - 0.5) * 2 : 0
    }

    let humidityRisk = 0
    if (typeof humidity === "number") {
      const h = clamp(humidity, 0, 100)
      if (h >= 60) {
        humidityRisk = (h - 60) / 40
      }
    }

    let temperatureRisk = 0
    if (typeof temperature === "number") {
      if (temperature >= 18 && temperature <= 28) {
        temperatureRisk = 0.8
      } else if (temperature >= 12 && temperature <= 34) {
        temperatureRisk = 0.4
      }
    }

    let riskScore = 0.4 * ndviRisk + 0.35 * humidityRisk + 0.25 * temperatureRisk

    let diseaseRiskBoost = 0
    if (cropId) {
      const { data: pestRows } = await client
        .from("crop_diseases")
        .select("disease_pests(severity_en, severity_ar)")
        .eq("crop_id", cropId)

      if (pestRows && pestRows.length > 0) {
        let high = 0
        let medium = 0
        for (const row of pestRows as any[]) {
          const sevEn = row?.disease_pests?.severity_en as string | null
          const sevAr = row?.disease_pests?.severity_ar as string | null
          const sev = ((sevEn ?? sevAr) || "").toLowerCase()
          if (sev.includes("high") || sev.includes("عالية") || sev.includes("شديدة")) {
            high += 1
          } else if (sev.includes("medium") || sev.includes("متوسطة")) {
            medium += 1
          }
        }
        const total = high + medium
        if (total > 0) {
          const highShare = high / total
          diseaseRiskBoost = 0.1 + 0.3 * highShare
        }
      }
    }

    riskScore = clamp(riskScore + diseaseRiskBoost, 0, 1)

    let level: DiseaseRiskLevel = "low"
    if (riskScore >= 0.7) level = "high"
    else if (riskScore >= 0.4) level = "medium"

    const reasons: string[] = []

    if (language === "ar") {
      if (typeof lastNdvi === "number" && lastNdvi > 0.5) {
        reasons.push(`غطاء نباتي كثيف (NDVI ≈ ${lastNdvi.toFixed(2)}).`)
      }
      if (typeof humidity === "number" && humidity >= 60) {
        reasons.push(`رطوبة جوية مرتفعة (~${Math.round(humidity)}٪) تساعد على نشاط الأمراض الفطرية/البكتيرية.`)
      }
      if (temperature != null) {
        reasons.push(`درجة الحرارة الحالية تقارب نطاق نشاط كثير من الأمراض (~${temperature.toFixed(1)}°م).`)
      }
      if (growthStageLabel) {
        reasons.push(`مرحلة النمو الحالية (${growthStageLabel}) عادةً ما تكون حساسة للعدوى إن لم يتم التحصين الوقائي.`)
      }
    } else {
      if (typeof lastNdvi === "number" && lastNdvi > 0.5) {
        reasons.push(`Dense, lush canopy (NDVI ≈ ${lastNdvi.toFixed(2)}).`)
      }
      if (typeof humidity === "number" && humidity >= 60) {
        reasons.push(`High relative humidity (~${Math.round(humidity)}%) favouring fungal/bacterial diseases.`)
      }
      if (temperature != null) {
        reasons.push(`Current temperature (~${temperature.toFixed(1)}°C) is within typical pathogen activity ranges.`)
      }
      if (growthStageLabel) {
        reasons.push(`Current growth stage (${growthStageLabel}) is often more vulnerable if not protected preventively.`)
      }
    }

    return {
      level,
      score: Number(riskScore.toFixed(2)),
      reasons,
    }
  } catch (error) {
    console.warn("[DiseaseRisk] Failed to compute risk:", error)
    return null
  }
}

