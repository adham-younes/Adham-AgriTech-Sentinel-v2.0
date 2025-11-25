import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type HealthLevel = "excellent" | "good" | "fair" | "poor" | "critical"

function classifyHealth(ndvi?: number | null): HealthLevel {
  if (typeof ndvi !== "number" || Number.isNaN(ndvi)) return "fair"
  if (ndvi >= 0.7) return "excellent"
  if (ndvi >= 0.55) return "good"
  if (ndvi >= 0.4) return "fair"
  if (ndvi >= 0.25) return "poor"
  return "critical"
}

function moistureFromNdwi(ndwi?: number | null, fallback?: number | null): number | null {
  if (typeof ndwi === "number" && Number.isFinite(ndwi)) {
    return Math.min(100, Math.max(0, Math.round(((ndwi + 1) / 2) * 100)))
  }
  if (typeof fallback === "number" && Number.isFinite(fallback)) {
    return Math.round(fallback)
  }
  return null
}

function litresPerHectare(ndvi?: number | null, moisture?: number | null, crop?: string | null) {
  const base =
    typeof ndvi === "number"
      ? Math.max(0, 1 - ndvi) * 2800
      : 1800
  const moisturePenalty = typeof moisture === "number" ? (60 - Math.min(60, moisture)) * 30 : 0
  const cropFactor = crop?.toLowerCase().includes("طماطم") || crop?.toLowerCase().includes("tomato") ? 1.15 : 1
  return Math.round((base + moisturePenalty) * cropFactor)
}

function buildIrrigationSchedule(amountLiters: number) {
  if (amountLiters <= 0) {
    return {
      frequency: "Once this week",
      slot: "Monitor moisture before irrigating again.",
    }
  }
  if (amountLiters < 2000) {
    return {
      frequency: "Every 4 days",
      slot: "06:00 AM for 20 minutes",
    }
  }
  if (amountLiters < 4000) {
    return {
      frequency: "Every 3 days",
      slot: "05:30 AM for 35 minutes",
    }
  }
  return {
    frequency: "Every 2 days",
    slot: "05:00 AM for 45 minutes",
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const fieldId = url.searchParams.get("field_id")

  if (!fieldId || !/^[0-9a-fA-F-]{36}$/.test(fieldId)) {
    return NextResponse.json(
      {
        code: "INVALID_FIELD",
        message: "field_id is required and must be a UUID",
        details: null,
      },
      { status: 400 },
    )
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          code: "UNAUTHENTICATED",
          message: "Authentication required",
          details: null,
        },
        { status: 401 },
      )
    }

    const { data: field, error: fieldError } = await supabase
      .from("fields")
      .select("id, crop_type, soil_type, area, last_ndvi, last_moisture")
      .eq("id", fieldId)
      .maybeSingle()

    if (fieldError || !field) {
      return NextResponse.json(
        {
          code: "FIELD_NOT_FOUND",
          message: "Field not found or access denied",
          details: fieldError?.message ?? null,
        },
        { status: 404 },
      )
    }

    const { data: ndviRow } = await supabase
      .from("ndvi_indices")
      .select("ndvi_value, evi_value, ndwi_value, computed_at")
      .eq("field_id", fieldId)
      .eq("user_id", user.id)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const ndviValue = ndviRow?.ndvi_value ?? field.last_ndvi ?? null
    const eviValue = ndviRow?.evi_value ?? null
    const ndwiValue = ndviRow?.ndwi_value ?? null
    const moisturePercent = moistureFromNdwi(ndwiValue, (field as any).last_moisture)
    const health = classifyHealth(ndviValue)

    // fields.area is stored in feddan; convert to hectares (≈0.42 ha per feddan)
    const areaHectares =
      (field as any).area != null
        ? Number((field as any).area) * 0.42
        : 1

    const litersPerHectareValue = litresPerHectare(ndviValue, moisturePercent, field.crop_type)
    const totalLiters = Math.round(litersPerHectareValue * (Number(areaHectares) || 1))
    const irrigationSchedule = buildIrrigationSchedule(litersPerHectareValue)

    const soilTypeText = (field as any).soil_type?.toString().toLowerCase() ?? ""
    const soilPh =
      soilTypeText.includes("رمل") || soilTypeText.includes("sand")
        ? 7.4
        : 6.8

    const nitrogen = ndviValue ? Math.round((ndviValue + 0.2) * 40) : 32
    const phosphorus = ndviValue ? Math.round((ndviValue + 0.1) * 30) : 24
    const potassium = ndviValue ? Math.round((0.6 + ndviValue) * 90) : 120

    const response = {
      code: "SUCCESS",
      message: "Field insights ready",
      insights: {
        remoteSensing: {
          ndvi: ndviValue,
          evi: eviValue,
          ndwi: ndwiValue,
          capturedAt: ndviRow?.computed_at ?? null,
          health,
        },
        soil: {
          ph_level: soilPh,
          nitrogen_ppm: nitrogen,
          phosphorus_ppm: phosphorus,
          potassium_ppm: potassium,
          organic_matter_percent: 3.1,
          moisture_percent: moisturePercent,
          summary:
            health === "excellent"
              ? "Vegetation vigor is excellent based on the latest satellite pass."
              : health === "good"
                ? "Crop health is good with minor stress signals."
                : "Satellite indicators show noticeable stress. Investigate irrigation and nutrient balance.",
        },
        irrigation: {
          liters_per_hectare: litersPerHectareValue,
          total_recommended_liters: totalLiters,
          schedule: irrigationSchedule,
          notes:
            moisturePercent && moisturePercent < 35
              ? "Soil moisture is below optimal range. Increase irrigation frequency temporarily."
              : "Moisture levels are acceptable. Maintain the recommended schedule.",
        },
        monitoring: {
          health_status: health,
          temperature_celsius: moisturePercent ? Math.round(32 - (moisturePercent / 5)) : 30,
        },
      },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error("[FieldInsightsAPI] Unexpected failure", error)
    return NextResponse.json(
      {
        code: "FIELD_INSIGHTS_FAILED",
        message: "Unable to build field insights",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
