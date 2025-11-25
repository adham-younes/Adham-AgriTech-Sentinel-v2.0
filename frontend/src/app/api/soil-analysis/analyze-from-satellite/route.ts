import { NextResponse } from "next/server"
import { isFeatureEnabled } from "@/lib/config/feature-flags"
import {
  fetchEOSDANDVI,
  fetchEOSDAWeatherSnapshots,
  fetchEOSDAChlorophyll,
  fetchEOSDASoilMoisture,
  type EOSDANDVIResponse,
  type EOSDAIndexSample,
  type EOSDAWeatherSnapshot,
} from "@/lib/services/eosda"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type SupportedLanguage = "ar" | "en"

interface SoilAnalysisRequestBody {
  fieldId?: string
  language?: SupportedLanguage
  ndviWindowDays?: number
}

interface FieldRecord {
  id: string
  name?: string | null
  area?: number | null
  crop_type?: string | null
  soil_type?: string | null
  latitude?: number | null
  longitude?: number | null
  centroid?: { type: string; coordinates: [number, number] }
  boundary_coordinates?: {
    type: string
    coordinates?: [number, number][][]
  }
  farms?: {
    id: string
    name?: string | null
    latitude?: number | null
    longitude?: number | null
  } | null
}

interface CachedSatelliteSnapshot {
  ndviPayload: EOSDANDVIResponse | null
  weatherSnapshots: EOSDAWeatherSnapshot[]
  chlorophyllSample: EOSDAIndexSample | null
  soilMoistureSample: EOSDAIndexSample | null
  generatedAt: string
}

interface SatelliteCacheEntry {
  value: CachedSatelliteSnapshot
  expiresAt: number
}

const SATELLITE_CACHE_TTL_MS = 15 * 60 * 1000

function getSatelliteCacheStore() {
  const globalScope = globalThis as typeof globalThis & { __soilAutomationCache?: Map<string, SatelliteCacheEntry> }
  if (!globalScope.__soilAutomationCache) {
    globalScope.__soilAutomationCache = new Map<string, SatelliteCacheEntry>()
  }
  return globalScope.__soilAutomationCache
}

const satelliteCacheStore = getSatelliteCacheStore()

function featureDisabledResponse() {
  return NextResponse.json(
    {
      error: "Soil analysis automation is currently disabled",
      flag: "NEXT_PUBLIC_FEATURE_SOIL_ANALYSIS_AUTOMATION",
      action: "Enable the feature flag in your environment to activate this endpoint.",
    },
    { status: 503 },
  )
}

async function getCachedSatelliteSnapshot(cacheKey: string, loader: () => Promise<CachedSatelliteSnapshot>) {
  const cached = satelliteCacheStore.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return { snapshot: cached.value, cacheHit: true }
  }

  const freshValue = await loader()
  satelliteCacheStore.set(cacheKey, { value: freshValue, expiresAt: Date.now() + SATELLITE_CACHE_TTL_MS })
  return { snapshot: freshValue, cacheHit: false }
}

export async function POST(request: Request) {
  if (!isFeatureEnabled("soilAnalysisAutomation")) {
    return featureDisabledResponse()
  }

  let body: SoilAnalysisRequestBody
  try {
    body = (await request.json()) ?? {}
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON body", details: error instanceof Error ? error.message : undefined },
      { status: 400 },
    )
  }

  const fieldId = body.fieldId?.trim()
  if (!fieldId) {
    return NextResponse.json({ error: "fieldId is required" }, { status: 400 })
  }

  const language: SupportedLanguage = body.language === "en" ? "en" : "ar"
  const ndviWindowDays =
    typeof body.ndviWindowDays === "number" && Number.isFinite(body.ndviWindowDays) && body.ndviWindowDays > 3
      ? body.ndviWindowDays
      : 30

  try {
    const supabase = await createSupabaseServerClient()
    const { data: field, error: fieldError } = await supabase
      .from("fields")
      .select(
        `id,name,area,crop_type,soil_type,latitude,longitude,centroid,boundary_coordinates,
         farms:farm_id(id,name,latitude,longitude)`,
      )
      .eq("id", fieldId)
      .maybeSingle()

    if (fieldError) {
      console.error("[Soil Automation] Supabase error:", fieldError)
      return NextResponse.json({ error: "Failed to load field" }, { status: 500 })
    }

    if (!field) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 })
    }

    const center = resolveFieldCoordinates(field as unknown as FieldRecord)
    if (!center) {
      return NextResponse.json({ error: "Field is missing valid coordinates" }, { status: 422 })
    }

    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - ndviWindowDays * 24 * 60 * 60 * 1000)
    const cacheKey = `${fieldId}:${ndviWindowDays}`

    let cacheResult
    try {
      cacheResult = await getCachedSatelliteSnapshot(cacheKey, () =>
        loadSatelliteSnapshot({ center, startDate, endDate }),
      )
    } catch (loadError) {
      console.error("[Soil Automation] Satellite snapshot failed:", loadError)
      return NextResponse.json({ error: "Unable to fetch EOSDA metrics" }, { status: 502 })
    }

    const { snapshot, cacheHit } = cacheResult

    const ndviPayload = snapshot.ndviPayload ?? null
    const weatherSnapshots = snapshot.weatherSnapshots ?? []
    const chlorophyllSample = snapshot.chlorophyllSample ?? null
    const soilMoistureSample = snapshot.soilMoistureSample ?? null

    const ndviValue = typeof ndviPayload?.ndvi_value === "number" ? ndviPayload.ndvi_value : null
    const ndviMean = typeof ndviPayload?.statistics?.mean === "number" ? ndviPayload.statistics.mean : null
    const ndviDate = ndviPayload?.date ?? null
    const weatherSummary = summariseWeather(weatherSnapshots)

    const chlorophyllValue =
      typeof chlorophyllSample?.value === "number" ? Number(chlorophyllSample.value.toFixed(2)) : null
    const soilMoistureRaw =
      typeof soilMoistureSample?.value === "number" ? Number(soilMoistureSample.value.toFixed(3)) : null
    const soilMoisturePercent =
      soilMoistureRaw == null
        ? null
        : soilMoistureRaw > 1
          ? clampNumber(soilMoistureRaw, 5, 100)
          : clampNumber(Math.round(soilMoistureRaw * 100), 5, 100)

    const nutrientEstimates = deriveNutrientEstimates({
      ndvi: ndviValue ?? ndviMean,
      chlorophyll: chlorophyllValue,
      soilMoisturePercent,
      crop: field.crop_type ?? undefined,
    })

    const agronomySummary = buildSatelliteSummary({
      language,
      ndvi: ndviValue ?? ndviMean,
      chlorophyll: chlorophyllValue,
      moisturePercent: soilMoisturePercent,
      crop: field.crop_type ?? undefined,
    })

    const interventions = buildSatelliteRecommendations({
      language,
      moisturePercent: soilMoisturePercent,
      chlorophyll: chlorophyllValue,
      ndvi: ndviValue,
      crop: field.crop_type ?? undefined,
      weather: weatherSummary,
    })

    const monitoringChecklist = buildMonitoringChecklist({
      language,
      moisturePercent: soilMoisturePercent,
      chlorophyll: chlorophyllValue,
      ndvi: ndviValue,
    })

    const confidenceScore = calculateConfidence({
      ndvi: ndviValue ?? ndviMean,
      soilMoisturePercent,
      chlorophyll: chlorophyllValue,
      weather: weatherSummary,
    })

    const responseBody = {
      field: {
        id: fieldId,
        name: field.name,
        cropType: field.crop_type,
        soilType: field.soil_type,
        areaFeddan: field.area,
        center,
      },
      satellite: {
        ndviValue,
        ndviMean,
        chlorophyll: {
          value: chlorophyllValue,
          capturedAt: chlorophyllSample?.date ?? null,
          mapUrl: chlorophyllSample?.mapUrl ?? null,
        },
        soilMoisture: {
          value: soilMoisturePercent,
          capturedAt: soilMoistureSample?.date ?? null,
          sourceRaw: soilMoistureRaw,
        },
        capturedAt: ndviDate ?? snapshot.generatedAt,
        imageUrl: ndviPayload?.url ?? null,
        statistics: ndviPayload?.statistics ?? null,
      },
      weather: weatherSummary,
      analysis: {
        ph_level: nutrientEstimates.ph,
        nitrogen_ppm: nutrientEstimates.nitrogen,
        phosphorus_ppm: nutrientEstimates.phosphorus,
        potassium_ppm: nutrientEstimates.potassium,
        organic_matter_percent: nutrientEstimates.organicMatter,
        moisture_percent: nutrientEstimates.moisturePercent,
        chlorophyll_index: chlorophyllValue,
        summary: agronomySummary,
        recommendations: interventions,
        monitoring: monitoringChecklist,
        advisory: null,
        confidence: confidenceScore,
        source: "satellite-derived",
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        snapshotGeneratedAt: snapshot.generatedAt,
        cacheHit,
        language,
      },
    }

    return NextResponse.json(responseBody, { status: 200 })
  } catch (error) {
    console.error("[Soil Automation] Unexpected failure:", error)
    return NextResponse.json({ error: "Failed to run satellite soil pipeline" }, { status: 500 })
  }
}

function resolveFieldCoordinates(field: FieldRecord): { latitude: number; longitude: number } | null {
  if (typeof field.latitude === "number" && typeof field.longitude === "number") {
    return { latitude: field.latitude, longitude: field.longitude }
  }
  const centroidCoords = Array.isArray(field.centroid?.coordinates) ? field.centroid!.coordinates : null
  if (centroidCoords && centroidCoords.length >= 2) {
    const [lng, lat] = centroidCoords
    if (typeof lat === "number" && typeof lng === "number") {
      return { latitude: lat, longitude: lng }
    }
  }
  if (typeof field.farms?.latitude === "number" && typeof field.farms?.longitude === "number") {
    return { latitude: field.farms.latitude!, longitude: field.farms.longitude! }
  }
  const ring = Array.isArray(field.boundary_coordinates?.coordinates?.[0]) ? field.boundary_coordinates.coordinates![0] : null
  if (ring && ring.length > 0) {
    const sum = ring.reduce(
      (acc, point) => {
        if (!point || point.length < 2) return acc
        return { lng: acc.lng + point[0], lat: acc.lat + point[1] }
      },
      { lng: 0, lat: 0 },
    )
    return { latitude: sum.lat / ring.length, longitude: sum.lng / ring.length }
  }
  return null
}

function summariseWeather(snapshots: EOSDAWeatherSnapshot[]) {
  if (!snapshots || snapshots.length === 0) {
    return null
  }
  const latest = snapshots[snapshots.length - 1]
  const humidityValues = snapshots.map((s) => s.humidity).filter((value): value is number => typeof value === "number")
  const temperatureValues = snapshots.map((s) => s.temperature).filter((value): value is number => typeof value === "number")
  const avgHumidity = humidityValues.length
    ? Number((humidityValues.reduce((a, b) => a + b, 0) / humidityValues.length).toFixed(1))
    : null
  const avgTemperature = temperatureValues.length
    ? Number((temperatureValues.reduce((a, b) => a + b, 0) / temperatureValues.length).toFixed(1))
    : null
  return {
    latest,
    averages: {
      humidity: avgHumidity,
      temperature: avgTemperature,
    },
  }
}

function calculateNitrogenFromNDVI(ndvi: number | null): number {
  if (typeof ndvi !== "number") {
    return 22
  }
  if (ndvi > 0.7) return 45
  if (ndvi > 0.55) return 33
  if (ndvi > 0.35) return 22
  return 15
}

function calculateConfidence({
  ndvi,
  soilMoisturePercent,
  chlorophyll,
  weather,
}: {
  ndvi: number | null
  soilMoisturePercent: number | null
  chlorophyll: number | null
  weather: ReturnType<typeof summariseWeather> | null
}): number {
  let score = 0.35
  if (typeof ndvi === "number") {
    score += Math.min(0.25, Math.max(0, ndvi - 0.25) * 0.5)
  }
  if (typeof soilMoisturePercent === "number") {
    score += 0.2
  }
  if (typeof chlorophyll === "number") {
    score += 0.15
  }
  if (weather?.latest) {
    score += 0.1
  }
  return Number(Math.min(0.95, Math.max(0.35, score)).toFixed(2))
}

function clampNumber(value: number | null, min: number, max: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return min
  }
  return Math.min(max, Math.max(min, value))
}

function deriveNutrientEstimates({
  ndvi,
  chlorophyll,
  soilMoisturePercent,
  crop,
}: {
  ndvi: number | null
  chlorophyll: number | null
  soilMoisturePercent: number | null
  crop?: string
}) {
  const normalizedNdvi = typeof ndvi === "number" ? clampNumber(ndvi, 0.2, 0.9) : 0.45
  const normalizedChl = typeof chlorophyll === "number" ? clampNumber(chlorophyll, 0.3, 0.9) : normalizedNdvi
  const moisture = typeof soilMoisturePercent === "number" ? clampNumber(soilMoisturePercent, 15, 85) : normalizedNdvi > 0.5 ? 55 : 40

  let ph = 6.6
  if (moisture > 70) ph -= 0.2
  if (moisture < 35) ph += 0.2
  if (crop && /rice|paddy|أرز/i.test(crop)) ph -= 0.3
  if (crop && /citrus|حمضيات/i.test(crop)) ph += 0.1

  const nitrogen = calculateNitrogenFromNDVI(normalizedNdvi) + (normalizedChl > 0.55 ? 4 : 0)
  const phosphorus = clampNumber(18 + normalizedNdvi * 18 + normalizedChl * 10, 12, 55)
  const potassium = clampNumber(120 + (moisture - 45) * 1.2, 80, 280)
  const organicMatter = clampNumber(1.4 + normalizedNdvi * 2 + (moisture - 40) / 60, 0.9, 5.5)

  return {
    ph: Number(ph.toFixed(2)),
    nitrogen: Number(nitrogen.toFixed(1)),
    phosphorus: Number(phosphorus.toFixed(1)),
    potassium: Number(potassium.toFixed(1)),
    organicMatter: Number(organicMatter.toFixed(1)),
    moisturePercent: Number(moisture.toFixed(1)),
  }
}

function buildSatelliteSummary({
  language,
  ndvi,
  chlorophyll,
  moisturePercent,
  crop,
}: {
  language: SupportedLanguage
  ndvi: number | null
  chlorophyll: number | null
  moisturePercent: number | null
  crop?: string
}) {
  const ndviDescriptor =
    typeof ndvi === "number"
      ? language === "ar"
        ? `مؤشر NDVI عند ${ndvi.toFixed(2)} مما يدل على ${ndvi > 0.65 ? "غطاء قوي" : ndvi > 0.45 ? "نمو متوسط" : "إجهاد واضح"}`
        : `NDVI at ${ndvi.toFixed(2)} indicating ${ndvi > 0.65 ? "vigorous canopy" : ndvi > 0.45 ? "moderate growth" : "stress"}`
      : language === "ar"
        ? "لا توجد قراءة NDVI مؤكدة"
        : "No recent NDVI reading"

  const chlDescriptor =
    typeof chlorophyll === "number"
      ? language === "ar"
        ? `مستوى الكلوروفيل ${chlorophyll.toFixed(2)} (${chlorophyll > 0.6 ? "ممتاز" : chlorophyll > 0.45 ? "جيد" : "منخفض"})`
        : `Chlorophyll ${chlorophyll.toFixed(2)} (${chlorophyll > 0.6 ? "excellent" : chlorophyll > 0.45 ? "steady" : "low"})`
      : null

  const moistureDescriptor =
    typeof moisturePercent === "number"
      ? language === "ar"
        ? `رطوبة التربة المقدرة ${moisturePercent.toFixed(0)}% (${describeMoistureState(moisturePercent, language)})`
        : `Soil moisture around ${moisturePercent.toFixed(0)}% (${describeMoistureState(moisturePercent, language)})`
      : language === "ar"
        ? "لم يتم تقدير الرطوبة من القراءات"
        : "Moisture estimate unavailable"

  const cropNote = crop
    ? language === "ar"
      ? `تمت القراءة لحقل ${crop}`
      : `Reading tailored for ${crop}`
    : null

  return [ndviDescriptor, chlDescriptor, moistureDescriptor, cropNote].filter(Boolean).join(language === "ar" ? "، " : ". ")
}

function buildSatelliteRecommendations({
  language,
  moisturePercent,
  chlorophyll,
  ndvi,
  crop,
  weather,
}: {
  language: SupportedLanguage
  moisturePercent: number | null
  chlorophyll: number | null
  ndvi: number | null
  crop?: string
  weather: ReturnType<typeof summariseWeather> | null
}) {
  const recs: string[] = []
  if (typeof moisturePercent === "number" && moisturePercent < 35) {
    recs.push(
      language === "ar"
        ? "قم بري خفيف خلال 12 ساعة والتركيز على المناطق الأضعف في الخريطة"
        : "Apply a light irrigation within 12 hours focusing on the stress pockets."
    )
  } else if (typeof moisturePercent === "number" && moisturePercent > 75) {
    recs.push(
      language === "ar"
        ? "أجّل الري الثقيل وراقب الصرف لتجنب الغرق"
        : "Delay heavy irrigation and monitor drainage to avoid waterlogging."
    )
  }

  if (typeof chlorophyll === "number" && chlorophyll < 0.45) {
    recs.push(
      language === "ar"
        ? "اعط دفعة تسميد ورقي غني بالنيتروجين/المغنيسيوم لتحسين الكلوروفيل"
        : "Provide a foliar feed rich in nitrogen/magnesium to lift chlorophyll levels."
    )
  }

  if (typeof ndvi === "number" && ndvi < 0.4) {
    recs.push(
      language === "ar"
        ? "نفذ جولة كشف حقلية للبحث عن آفات أو أعفان بالجذور"
        : "Scout the field for pest or root issues causing vegetation decline."
    )
  }

  if (weather?.latest?.precipitation && weather.latest.precipitation > 2) {
    recs.push(
      language === "ar"
        ? "هناك مطر قصير؛ خفّض الري المجدول وأعد القياس بعد الهطول"
        : "Upcoming rain detected; reduce scheduled irrigation and re-measure after rainfall."
    )
  }

  if (recs.length < 3) {
    recs.push(
      language === "ar"
        ? "استمر في مراقبة صور NDVI الأسبوعية لضبط برنامج التسميد"
        : "Keep tracking weekly NDVI to adjust fertilization program."
    )
  }

  if (recs.length < 4) {
    recs.push(
      language === "ar"
        ? "سجّل قراءات الحقل لتتم مقارنة بيانات القمر الصناعي مع الاختبارات الأرضية"
        : "Log field measurements so satellite signals stay calibrated with lab samples."
    )
  }

  return recs.slice(0, 5)
}

function buildMonitoringChecklist({
  language,
  moisturePercent,
  chlorophyll,
  ndvi,
}: {
  language: SupportedLanguage
  moisturePercent: number | null
  chlorophyll: number | null
  ndvi: number | null
}) {
  const checklist: string[] = []

  checklist.push(
    language === "ar"
      ? "راجع تسجيلات الري السابقة للتأكد من توزيع متوازن"
      : "Review past irrigation runs to confirm even distribution."
  )

  if (typeof moisturePercent === "number") {
    checklist.push(
      language === "ar"
        ? moisturePercent < 40
          ? "اختبر رطوبة التربة يدويًا في 3 نقاط للتأكد من انخفاضها"
          : "تأكد من عدم ارتفاع الرطوبة الزائد في المناطق المنخفضة"
        : moisturePercent < 40
        ? "Verify low moisture with handheld probe at three spots."
        : "Ensure no standing water in low areas."
    )
  }

  if (typeof chlorophyll === "number" && chlorophyll < 0.5) {
    checklist.push(
      language === "ar"
        ? "افحص لون الأوراق لتحديد نقص العناصر الصغرى"
        : "Inspect leaf coloration to confirm micronutrient deficiency."
    )
  }

  if (typeof ndvi === "number") {
    checklist.push(
      language === "ar"
        ? "قارن صورة NDVI الحالية بالصورة السابقة لرصد أي بقع متدهورة"
        : "Compare current NDVI tile to previous week to locate deteriorating spots."
    )
  }

  return checklist
}

function describeMoistureState(value: number, language: SupportedLanguage) {
  if (value < 30) return language === "ar" ? "منخفضة" : "low"
  if (value < 55) return language === "ar" ? "متوازنة" : "balanced"
  if (value < 75) return language === "ar" ? "مرتفعة" : "high"
  return language === "ar" ? "مشبعة" : "saturated"
}

async function loadSatelliteSnapshot({
  center,
  startDate,
  endDate,
}: {
  center: { latitude: number; longitude: number }
  startDate: Date
  endDate: Date
}): Promise<CachedSatelliteSnapshot> {
  const [ndviResult, weatherResult, chlorophyllResult, soilMoistureResult] = await Promise.allSettled([
    fetchEOSDANDVI({ center, startDate, endDate }),
    fetchEOSDAWeatherSnapshots({ latitude: center.latitude, longitude: center.longitude, hours: 48 }),
    fetchEOSDAChlorophyll({ center, startDate, endDate }),
    fetchEOSDASoilMoisture({ center, startDate, endDate }),
  ])

  if (ndviResult.status === "rejected") {
    console.error("[Soil Automation] NDVI fetch failed:", ndviResult.reason)
    throw new Error("Unable to fetch NDVI data from EOSDA")
  }

  if (weatherResult.status === "rejected") {
    console.warn("[Soil Automation] Weather fetch failed:", weatherResult.reason)
  }
  if (chlorophyllResult.status === "rejected") {
    console.warn("[Soil Automation] Chlorophyll fetch failed:", chlorophyllResult.reason)
  }
  if (soilMoistureResult.status === "rejected") {
    console.warn("[Soil Automation] Soil moisture fetch failed:", soilMoistureResult.reason)
  }

  return {
    ndviPayload: ndviResult.value ?? null,
    weatherSnapshots: weatherResult.status === "fulfilled" ? weatherResult.value ?? [] : [],
    chlorophyllSample: chlorophyllResult.status === "fulfilled" ? chlorophyllResult.value ?? null : null,
    soilMoistureSample: soilMoistureResult.status === "fulfilled" ? soilMoistureResult.value ?? null : null,
    generatedAt: new Date().toISOString(),
  }
}
