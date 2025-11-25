export const runtime = "nodejs"
import { generateText, type CoreMessage } from "ai"

import { aiProviderRegistry, addProviderHeaders } from "@/lib/ai/provider-registry"
import {
  fetchEOSDANDVI,
  fetchEOSDASatelliteImage,
  fetchEOSDAWeatherSnapshots,
  isEOSDAConfigured,
} from "@/lib/services/eosda"
import { analysePlantImagesFromDataUrls, isPlantIdConfigured, type PlantInspectionReport } from "@/lib/services/plant-id"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { searchArticles } from "@/lib/content/articles"
import { getAllArticlesMetadata } from "@/lib/content/articles"
import {
  getCropByNameOrId,
  getCropCategoryById,
  getGrowthStagesForCrop,
  getPestsForCrop,
  getRecommendedFertilizersForCrop,
  getPesticidesReference,
  getTreatmentsForDiseasePests,
  type TreatmentRecord,
} from "@/lib/domain/crops"
import { computeDiseaseRiskForField } from "@/lib/domain/disease-risk"

type Attachment = { name?: string; type?: string; data?: string; size?: number }
type SanitisedMessage = { role: "user" | "assistant" | "system"; content: string }
type ImageContent = { type: "image"; image: { base64: string; mimeType: string } }
type TextContent = { type: "text"; text: string }
type RichContent = ImageContent | TextContent

type Payload = {
  messages: any
  language?: string
  fieldId?: string
  images?: Attachment[]
}

function sanitiseMessages(rawMessages: unknown): SanitisedMessage[] {
  if (!Array.isArray(rawMessages)) return []
  return rawMessages
    .filter((entry) => entry && typeof entry === "object" && ["user", "assistant", "system"].includes((entry as any).role))
    .map((entry) => ({ role: (entry as any).role, content: String((entry as any).content ?? "") }))
}

const parseNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function toCoreMessages(messages: SanitisedMessage[]): CoreMessage[] {
  return messages.map((message) => ({ role: message.role, content: message.content }))
}

function buildVisionNote(language: string, usedVision: boolean) {
  if (usedVision) {
    return language === "ar"
      ? "تم تحليل الصور المرفقة بواسطة نموذج يدعم الرؤية."
      : "Images were analysed by a vision-capable model."
  }
  return language === "ar"
    ? "تمت معالجة الصور كوصف نصي لأن المزود الحالي لا يدعم الرؤية."
    : "Images were summarised textually because the active provider lacks vision support."
}

function normaliseAttachmentToImage(attachment: Attachment): ImageContent | null {
  if (!attachment?.data) return null
  const match = attachment.data.match(/^data:(.*?);base64,(.+)$/)
  const base64 = match?.[2]?.replace(/\s+/g, "")
  if (!base64) return null
  const mimeType = attachment.type || match?.[1] || "image/jpeg"
  return {
    type: "image",
    image: {
      base64,
      mimeType,
    },
  }
}

function toTextContent(payload: string | RichContent[] | undefined): RichContent[] {
  if (Array.isArray(payload)) {
    return payload
  }
  if (typeof payload === "string") {
    return [{ type: "text", text: payload }]
  }
  return [{ type: "text", text: "" }]
}

/**
 * If the attachments array is empty, return the original messages.
 * Otherwise, map the attachments array to ImageContent objects,
 * filter out any null values, and if the resulting array is empty,
 * return the original messages.
 * Otherwise, find the index of the last user message in the messages array,
 * and if it is -1 (i.e., no user messages were found), return the original messages.
 * Otherwise, find the index of the target message in the messages array,
 * and return a new array with all messages except the target message,
 * which is replaced with a new message containing the original content
 * and the image payloads.
 * @param messages the original messages array
 * @param attachments the attachments array
 * @returns a new messages array with the image payloads added to the target message
 */
function withVisionContent(messages: CoreMessage[], attachments: Attachment[]): CoreMessage[] {
  if (!attachments?.length) return messages;

  const imagePayloads = attachments
    .map(normaliseAttachmentToImage)
    .filter((payload): payload is ImageContent => payload !== null);

  if (imagePayloads.length === 0) return messages;

  const lastUserIndex = [...messages].reverse().findIndex((msg) => msg.role === "user");
  if (lastUserIndex === -1) return messages;

  const targetIndex = messages.length - 1 - lastUserIndex;

  return messages.map((message, index) => {
    if (index !== targetIndex) return message;

    // Handle both string and RichContent[] content types
    const existingContent = Array.isArray(message.content)
      ? message.content
      : toTextContent(message.content || '');

    return {
      ...message,
      content: [...existingContent, ...imagePayloads],
    } as CoreMessage;
  });
}

async function buildSatelliteContext(fieldId?: string, language: string = "ar") {
  if (!fieldId || !isEOSDAConfigured()) return null
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from("fields")
      .select(`
        id, 
        name, 
        last_ndvi, 
        last_moisture, 
        last_temperature, 
        last_reading_at,
        soil_ph,
        soil_nitrogen,
        soil_phosphorus,
        soil_potassium,
        crop_type,
        planting_date,
        farms(latitude, longitude, name)
      `)
      .eq("id", fieldId)
      .maybeSingle()
    if (error || !data) return null

    const lat = (data as any)?.farms?.latitude
    const lng = (data as any)?.farms?.longitude
    if (typeof lat !== "number" || typeof lng !== "number") return null

    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [ndvi, imagery] = await Promise.all([
      fetchEOSDANDVI({ center: { latitude: lat, longitude: lng }, startDate, endDate }),
      fetchEOSDASatelliteImage({ center: { latitude: lat, longitude: lng }, size: { width: 768, height: 768 } }),
    ])

    const nf = new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 2 })
    const lastNdvi = typeof (data as any)?.last_ndvi === "number" ? nf.format((data as any).last_ndvi) : null
    const lastMoisture = typeof (data as any)?.last_moisture === "number" ? nf.format((data as any).last_moisture) : null
    const lastTemperature = typeof (data as any)?.last_temperature === "number" ? nf.format((data as any).last_temperature) : null
    const soilPh = typeof (data as any)?.soil_ph === "number" ? nf.format((data as any).soil_ph) : null
    const soilNitrogen = typeof (data as any)?.soil_nitrogen === "number" ? nf.format((data as any).soil_nitrogen) : null
    const soilPhosphorus = typeof (data as any)?.soil_phosphorus === "number" ? nf.format((data as any).soil_phosphorus) : null
    const soilPotassium = typeof (data as any)?.soil_potassium === "number" ? nf.format((data as any).soil_potassium) : null
    const cropType = (data as any)?.crop_type || null
    const plantingDate = (data as any)?.planting_date 
      ? new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", { dateStyle: "medium" }).format(new Date((data as any).planting_date))
      : null
    const ndviValue = typeof ndvi?.ndvi_value === "number" ? nf.format(ndvi.ndvi_value) : null
    const meanValue = typeof ndvi?.statistics?.mean === "number" ? nf.format(ndvi.statistics.mean) : null
    const dateLabel = ndvi?.date
      ? new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", { dateStyle: "long", timeStyle: "short" }).format(
        new Date(ndvi.date),
      )
      : null
    const lastReadingDate = (data as any)?.last_reading_at
      ? new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", { dateStyle: "long", timeStyle: "short" }).format(
        new Date((data as any).last_reading_at),
      )
      : null

    if (language === "ar") {
      return [
        "بيانات الأقمار الصناعية والحقل المتقدمة:",
        data.name ? `- الحقل: ${data.name}` : null,
        cropType ? `- المحصول: ${cropType}` : null,
        plantingDate ? `- تاريخ الزراعة: ${plantingDate}` : null,
        lastNdvi ? `- آخر NDVI: ${lastNdvi}` : null,
        lastMoisture ? `- الرطوبة: ${lastMoisture}%` : null,
        lastTemperature ? `- درجة الحرارة: ${lastTemperature}°C` : null,
        soilPh ? `- درجة حموضة التربة (pH): ${soilPh}` : null,
        soilNitrogen ? `- النيتروجين في التربة: ${soilNitrogen} mg/kg` : null,
        soilPhosphorus ? `- الفوسفور في التربة: ${soilPhosphorus} mg/kg` : null,
        soilPotassium ? `- البوتاسيوم في التربة: ${soilPotassium} mg/kg` : null,
        lastReadingDate ? `- آخر تحديث: ${lastReadingDate}` : null,
        ndviValue ? `- مؤشر NDVI الحالي: ${ndviValue}` : null,
        meanValue ? `- متوسط NDVI الأسبوعي: ${meanValue}` : null,
        dateLabel ? `- آخر قراءة: ${dateLabel}` : null,
        imagery?.url ? `- رابط الصورة: ${imagery.url}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    }

    return [
      "Advanced field satellite and sensor context:",
      data.name ? `- Field: ${data.name}` : null,
      cropType ? `- Crop: ${cropType}` : null,
      plantingDate ? `- Planting Date: ${plantingDate}` : null,
      lastNdvi ? `- Last NDVI: ${lastNdvi}` : null,
      lastMoisture ? `- Moisture: ${lastMoisture}%` : null,
      lastTemperature ? `- Temperature: ${lastTemperature}°C` : null,
      soilPh ? `- Soil pH: ${soilPh}` : null,
      soilNitrogen ? `- Soil Nitrogen: ${soilNitrogen} mg/kg` : null,
      soilPhosphorus ? `- Soil Phosphorus: ${soilPhosphorus} mg/kg` : null,
      soilPotassium ? `- Soil Potassium: ${soilPotassium} mg/kg` : null,
      lastReadingDate ? `- Last updated: ${lastReadingDate}` : null,
      ndviValue ? `- Current NDVI: ${ndviValue}` : null,
      meanValue ? `- Weekly mean NDVI: ${meanValue}` : null,
      dateLabel ? `- Last capture: ${dateLabel}` : null,
      imagery?.url ? `- Imagery URL: ${imagery.url}` : null,
    ]
      .filter(Boolean)
      .join("\n")
  } catch (error) {
    console.warn("[AI Assistant] Satellite context failed:", error)
    return null
  }
}

async function fetchWeatherSummary(lat: number, lng: number, language: string) {
  try {
    if (!isEOSDAConfigured()) return null
    const snapshots = await fetchEOSDAWeatherSnapshots({
      latitude: lat,
      longitude: lng,
      hours: 24,
    })
    if (!snapshots || snapshots.length === 0) return null
    const latest = snapshots[snapshots.length - 1]
    return {
      temperature: latest.temperature ?? null,
      humidity: latest.humidity ?? null,
      condition: latest.summary ?? null,
    }
  } catch {
    return null
  }
}

async function buildAgronomicKnowledge(language: string = "ar") {
  try {
    const supabase = await createSupabaseServerClient()
    const [{ data: diseases }, { data: fertilizers }, { data: pesticides }, { data: soilStandards }, { data: crops }] =
      await Promise.all([
        supabase.from("diseases").select("*").order("severity_level", { ascending: false }).limit(12),
        supabase.from("fertilizer_types").select("*").limit(12),
        supabase.from("pesticide_types").select("*").limit(10),
        supabase.from("soil_standards").select("*").limit(15),
        supabase.from("crops").select("name_ar,name_en,soil_type_ar,soil_type_en,irrigation_notes,irrigation_notes_ar").limit(8),
      ])

    const sections: string[] = []
    if (language === "ar") {
      if (diseases?.length) {
        const critical = diseases.filter((d: any) => d.severity_level >= 4).map((d: any) => d.name_ar).join("، ")
        sections.push("🦠 الأمراض الحرجة:", critical || "—")
      }
      if (fertilizers?.length) {
        const chem = fertilizers.filter((f: any) => f.category === "chemical").slice(0, 5).map((f: any) => f.name_ar).join("، ")
        const org = fertilizers.filter((f: any) => f.category === "organic").slice(0, 3).map((f: any) => f.name_ar).join("، ")
        sections.push("🌱 أسمدة كيميائية:", chem || "—")
        sections.push("🌿 أسمدة عضوية:", org || "—")
      }
      if (pesticides?.length) {
        const fung = pesticides.filter((p: any) => p.category === "fungicide").slice(0, 3).map((p: any) => p.name_ar).join("، ")
        const insect = pesticides.filter((p: any) => p.category === "insecticide").slice(0, 3).map((p: any) => p.name_ar).join("، ")
        sections.push("🛡️ مبيدات فطرية:", fung || "—")
        sections.push("🪲 مبيدات حشرية:", insect || "—")
      }
      if (soilStandards?.length) {
        const ph = soilStandards.find((s: any) => (s.parameter ?? "").toLowerCase().includes("ph"))
        if (ph) sections.push(`🔬 pH مثالي: ${ph.optimal_min ?? "--"} - ${ph.optimal_max ?? "--"} ${ph.unit ?? ""}`)
      }
      if (crops?.length) {
        const cropLines = crops.slice(0, 4).map((c: any) => {
          const soil = c.soil_type_ar || "تربة جيدة الصرف"
          const irrigation = c.irrigation_notes_ar || c.irrigation_notes || "ري منتظم بدون تغريق"
          return `- ${c.name_ar ?? c.name_en}: تربة ${soil} | ري: ${irrigation}`
        })
        sections.push("🌾 إرشادات المحاصيل:", ...cropLines)
      }
    } else {
      if (diseases?.length) {
        const critical = diseases.filter((d: any) => d.severity_level >= 4).map((d: any) => d.name_en || d.name_ar).join(", ")
        sections.push("🦠 Critical diseases:", critical || "—")
      }
      if (fertilizers?.length) {
        const chem = fertilizers.filter((f: any) => f.category === "chemical").slice(0, 5).map((f: any) => f.name_en || f.name_ar).join(", ")
        const org = fertilizers.filter((f: any) => f.category === "organic").slice(0, 3).map((f: any) => f.name_en || f.name_ar).join(", ")
        sections.push("🌱 Chemical fertilizers:", chem || "—")
        sections.push("🌿 Organic fertilizers:", org || "—")
      }
      if (pesticides?.length) {
        const fung = pesticides.filter((p: any) => p.category === "fungicide").slice(0, 3).map((p: any) => p.name_en || p.name_ar).join(", ")
        const insect = pesticides.filter((p: any) => p.category === "insecticide").slice(0, 3).map((p: any) => p.name_en || p.name_ar).join(", ")
        sections.push("🛡️ Fungicides:", fung || "—")
        sections.push("🪲 Insecticides:", insect || "—")
      }
      if (soilStandards?.length) {
        const ph = soilStandards.find((s: any) => (s.parameter ?? "").toLowerCase().includes("ph"))
        if (ph) sections.push(`🔬 Ideal pH: ${ph.optimal_min ?? "--"} - ${ph.optimal_max ?? "--"} ${ph.unit ?? ""}`)
      }
      if (crops?.length) {
        const cropLines = crops.slice(0, 4).map((c: any) => {
          const soil = c.soil_type_en || c.soil_type_ar || "Well-drained soil"
          const irrigation = c.irrigation_notes || c.irrigation_notes_ar || "Regular irrigation, avoid waterlogging"
          return `- ${c.name_en ?? c.name_ar}: Soil ${soil} | Irrigation: ${irrigation}`
        })
        sections.push("🌾 Crop guidance:", ...cropLines)
      }
    }

    return sections.length ? sections.join("\n") : null
  } catch (error) {
    console.warn("[AI Assistant] Agronomic knowledge failed:", error)
    return null
  }
}

async function buildFieldInsightBlock(fieldId?: string, language: string = "ar") {
  if (!fieldId) return null
  try {
    const supabase = await createSupabaseServerClient()
    const { data: field } = await supabase
      .from("fields")
      .select(
        "id, name, crop_type, soil_type, area, planting_date, last_ndvi, last_moisture, last_temperature, last_reading_at, latitude, longitude, farms(name)",
      )
      .eq("id", fieldId)
      .maybeSingle()

    if (!field) return null

    const nf = new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 2 })
    const areaValue = parseNumber(field.area)
    const areaLabel = areaValue ? `${nf.format(areaValue)} ha` : null

    const lines: string[] = [
      language === "ar" ? "بيانات الحقل:" : "Field snapshot:",
      field.name ? `- ${language === "ar" ? "الاسم" : "Name"}: ${field.name}` : null,
      field.crop_type ? `- ${language === "ar" ? "المحصول" : "Crop"}: ${field.crop_type}` : null,
      field.soil_type ? `- ${language === "ar" ? "نوع التربة" : "Soil"}: ${field.soil_type}` : null,
      areaLabel ? `- ${language === "ar" ? "المساحة" : "Area"}: ${areaLabel}` : null,
      typeof field.last_ndvi === "number" ? `- NDVI: ${nf.format(field.last_ndvi)}` : null,
      typeof field.last_moisture === "number" ? `- Moisture: ${nf.format(field.last_moisture)}%` : null,
      field.last_reading_at
        ? `- ${language === "ar" ? "آخر قياس" : "Last reading"}: ${new Date(field.last_reading_at).toLocaleString(
          language === "ar" ? "ar-EG" : "en-US",
        )}`
        : null,
    ].filter(Boolean) as string[]

    const { data: soil } = await supabase
      .from("soil_analysis")
      .select("analysis_date, ph_level, nitrogen, phosphorus, potassium, moisture, ai_recommendations")
      .eq("field_id", fieldId)
      .order("analysis_date", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (soil) {
      lines.push(
        language === "ar"
          ? `تحليل التربة (${soil.analysis_date ?? "غير محدد"}): pH ${soil.ph_level ?? "?"}, N ${soil.nitrogen ?? "-"}, P ${soil.phosphorus ?? "-"
          }, K ${soil.potassium ?? "-"}`
          : `Soil (${soil.analysis_date ?? "n/a"}): pH ${soil.ph_level ?? "?"}, N ${soil.nitrogen ?? "-"}, P ${soil.phosphorus ?? "-"
          }, K ${soil.potassium ?? "-"}`,
      )
      if (soil.ai_recommendations) {
        lines.push(
          language === "ar" ? `توصيات التربة: ${soil.ai_recommendations}` : `Soil advisory: ${soil.ai_recommendations}`,
        )
      }
    }

    // Enrich with crop knowledge base (global agronomy DB)
    const cropName = typeof field.crop_type === "string" ? field.crop_type.trim() : ""
    if (cropName) {
      const crop = await getCropByNameOrId(supabase, { name: cropName })
      if (crop) {
        const [category, stages, pests, fertilizers, pesticides] = await Promise.all([
          crop.category_id ? getCropCategoryById(supabase, crop.category_id) : Promise.resolve(null),
          getGrowthStagesForCrop(supabase, crop.id),
          getPestsForCrop(supabase, crop.id),
          getRecommendedFertilizersForCrop(supabase, crop.id, 4),
          getPesticidesReference(supabase, 4),
        ])

        lines.push(language === "ar" ? "معرفة المحصول من قاعدة البيانات العالمية:" : "Crop knowledge base profile:")

        const displayName = language === "ar" ? crop.name_ar || crop.name_en : crop.name_en || crop.name_ar
        lines.push(
          language === "ar" ? `- المحصول المرجعي: ${displayName}` : `- Matched crop profile: ${displayName}`,
        )

        if (category) {
          lines.push(
            language === "ar"
              ? `- التصنيف: ${category.name_ar}`
              : `- Category: ${category.name_en}`,
          )
        }

        const phMin = typeof crop.ph_min === "number" ? crop.ph_min : null
        const phMax = typeof crop.ph_max === "number" ? crop.ph_max : null
        if (phMin != null && phMax != null) {
          lines.push(
            language === "ar"
              ? `- المجال المثالي لـ pH التربة: ${phMin.toFixed(1)} – ${phMax.toFixed(1)}`
              : `- Preferred soil pH range: ${phMin.toFixed(1)} – ${phMax.toFixed(1)}`,
          )
        }

        const ecMax = typeof crop.ec_max === "number" ? crop.ec_max : null
        if (ecMax != null || crop.salt_sensitivity_en || crop.salt_sensitivity_ar) {
          const sensitivity = language === "ar" ? crop.salt_sensitivity_ar ?? crop.salt_sensitivity_en : crop.salt_sensitivity_en ?? crop.salt_sensitivity_ar
          const base = language === "ar" ? "تحمل الملوحة" : "Salinity tolerance"
          const label = ecMax != null ? `${base}: ${sensitivity ?? ""} (حتى EC ${ecMax.toFixed(2)} dS/m تقريبًا)` : `${base}: ${sensitivity ?? ""}`
          lines.push(`- ${label}`)
        }

        const tempMin = typeof crop.optimal_temp_min_c === "number" ? crop.optimal_temp_min_c : null
        const tempMax = typeof crop.optimal_temp_max_c === "number" ? crop.optimal_temp_max_c : null
        if (tempMin != null && tempMax != null) {
          lines.push(
            language === "ar"
              ? `- مدى درجة الحرارة المثلى للنمو: ${tempMin.toFixed(1)}–${tempMax.toFixed(1)}°م`
              : `- Optimal growth temperature range: ${tempMin.toFixed(1)}–${tempMax.toFixed(1)}°C`,
          )
        }

        if (stages.length > 0) {
          const stageSummaries = stages.slice(0, 4).map((stage) => {
            const name = language === "ar" ? stage.stage_name_ar : stage.stage_name_en
            const ndviOpt = typeof stage.ndvi_optimal === "number" ? stage.ndvi_optimal.toFixed(2) : null
            const moistureOpt =
              typeof stage.soil_moisture_optimal === "number" ? stage.soil_moisture_optimal.toFixed(1) : null
            if (ndviOpt && moistureOpt) {
              return language === "ar"
                ? `${name}: NDVI≈${ndviOpt}, رطوبة≈${moistureOpt}%`
                : `${name}: NDVI≈${ndviOpt}, soil moisture≈${moistureOpt}%`
            }
            if (ndviOpt) {
              return `${name}: NDVI≈${ndviOpt}`
            }
            return name
          })

          lines.push(
            language === "ar"
              ? `- مراحل النمو (مؤشرات تقريبية): ${stageSummaries.join(" | ")}`
              : `- Growth stages (approximate indices): ${stageSummaries.join(" | ")}`,
          )
        }

        if (pests.length > 0) {
          const topPests = pests.slice(0, 3).map((p) => (language === "ar" ? p.name_ar : p.name_en))
          lines.push(
            language === "ar"
              ? `- أهم الأمراض/الآفات المسجلة للمحصول: ${topPests.join("، ")}`
              : `- Key recorded diseases/pests for this crop: ${topPests.join(", ")}`,
          )
        }

        if (fertilizers.length > 0) {
          const names = fertilizers.map((f) => (language === "ar" ? f.name_ar : f.name_en))
          lines.push(
            language === "ar"
              ? `- أمثلة لأسمدة شائعة الاستخدام (مرجعية فقط، بدون تفضيل تجاري): ${names.join("، ")}`
              : `- Example fertilizer types (reference only, vendor-neutral): ${names.join(", ")}`,
          )
        }

        if (pesticides.length > 0) {
          const names = pesticides.map((p) => (language === "ar" ? p.name_ar : p.name_en))
          lines.push(
            language === "ar"
              ? `- أمثلة لمبيدات معتمدة عالميًا (للاسترشاد فقط): ${names.join("، ")}`
              : `- Example globally used pesticide actives (for guidance only): ${names.join(", ")}`,
          )
        }

        if (pests.length > 0) {
          const issueIds = pests.map((p) => p.id)
          const treatmentsByIssue = await getTreatmentsForDiseasePests(supabase, issueIds)
          const issueIdsWithTreatments = Object.keys(treatmentsByIssue)
            .map((id) => Number.parseInt(id, 10))
            .filter((id) => Number.isFinite(id) && (treatmentsByIssue[id] ?? []).length > 0)

          if (issueIdsWithTreatments.length > 0) {
            lines.push(
              language === "ar"
                ? "خيارات علاجية مرجعية (استرشادية فقط، بدون تفضيل تجاري):"
                : "Reference management options (for guidance only, vendor‑neutral):",
            )

            issueIdsWithTreatments.slice(0, 3).forEach((issueId) => {
              const issue = pests.find((p) => p.id === issueId)
              const treatments: TreatmentRecord[] = treatmentsByIssue[issueId] ?? []
              if (!treatments.length) return
              const issueName = issue ? (language === "ar" ? issue.name_ar : issue.name_en) : null
              const names = treatments.map((t) => (language === "ar" ? t.name_ar : t.name_en))
              if (!names.length) return

              const joined = language === "ar" ? names.join("، ") : names.join(", ")
              const label =
                issueName != null && issueName.trim()
                  ? language === "ar"
                    ? `- ${issueName}: ${joined}`
                    : `- ${issueName}: ${joined}`
                  : `- ${joined}`

              lines.push(label)
            })
          }
        }
      }
    }

    const lat = parseNumber(field.latitude)
    const lng = parseNumber(field.longitude)
    if (lat != null && lng != null) {
      const weather = await fetchWeatherSummary(lat, lng, language)
      if (weather) {
        lines.push(
          language === "ar"
            ? `الطقس الحالي: ${weather.temperature ?? "--"}°C، رطوبة ${weather.humidity ?? "--"}%، ${weather.condition ?? ""}`
            : `Weather: ${weather.temperature ?? "--"}°C, humidity ${weather.humidity ?? "--"}%, ${weather.condition ?? ""}`,
        )
      }
    }

    const diseaseRisk = await computeDiseaseRiskForField({
      client: supabase,
      fieldId,
      cropName: field.crop_type,
      lastNdvi: typeof field.last_ndvi === "number" ? field.last_ndvi : null,
      language,
    })

    if (diseaseRisk) {
      const label =
        diseaseRisk.level === "high"
          ? language === "ar"
            ? "مرتفع"
            : "High"
          : diseaseRisk.level === "medium"
            ? language === "ar"
              ? "متوسط"
              : "Medium"
            : language === "ar"
              ? "منخفض"
              : "Low"

      const header =
        language === "ar"
          ? `مؤشر مخاطر مرضية (تجريبي) – المستوى: ${label} (الدرجة: ${Math.round(
            diseaseRisk.score * 100,
          )} من 100)`
          : `Disease risk index (experimental) – level: ${label} (score: ${Math.round(diseaseRisk.score * 100)} / 100)`

      lines.push(header)
      if (diseaseRisk.reasons.length > 0) {
        const reasonsText = diseaseRisk.reasons.map((r) => `• ${r}`).join("\n")
        lines.push(reasonsText)
      }
    }

    return lines.join("\n")
  } catch (error) {
    console.warn("[AI Assistant] Field context failed:", error)
    return null
  }
}

async function loadContext({
  images,
  fieldId,
  language,
}: {
  images?: Attachment[]
  fieldId?: string
  language: string
}): Promise<{ blocks: string[]; plantReport?: PlantInspectionReport }> {
  const blocks: string[] = []
  let plantReport: PlantInspectionReport | undefined

  if (images && images.length > 0) {
    const head = language === "ar" ? "الصور المرفوعة للتحليل:" : "User-uploaded imagery:"
    const lines = images.slice(0, 4).map((img, index) => `- ${img.name ?? `image-${index + 1}`} (${img.type ?? "image"})`)
    blocks.push([head, ...lines].join("\n"))

    if (isPlantIdConfigured()) {
      const dataUrls = images
        .map((img) => img.data)
        .filter((src): src is string => typeof src === "string" && src.length > 0)
      if (dataUrls.length > 0) {
        try {
          const report = await analysePlantImagesFromDataUrls(dataUrls, language)
          if (report) {
            plantReport = report
            if (report.summary) {
              blocks.push(
                language === "ar"
                  ? `نتائج خدمة Plant.id:\n${report.summary}`
                  : `Plant.id findings:\n${report.summary}`,
              )
            }
          }
        } catch (error) {
          console.warn("[AI Assistant] Plant identification failed:", error)
        }
      }
    }
  }

  const sat = await buildSatelliteContext(fieldId, language)
  if (sat) blocks.push(sat)
  const fieldInsights = await buildFieldInsightBlock(fieldId, language)
  if (fieldInsights) blocks.push(fieldInsights)
  const knowledge = await buildAgronomicKnowledge(language)
  if (knowledge) blocks.push(knowledge)
  return { blocks, plantReport }
}

function buildSystemPrompt(language?: string) {
  const today = new Date().toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { dateStyle: "long" })
  return language === "ar"
    ? `أنت مساعد زراعي ذكي متخصص في المحاصيل المصرية (التاريخ: ${today}).`
    + "\n\nإرشادات الاستجابة:"
    + "\n1) ابدأ بالتشخيص ونسبة الثقة بناءً على الأعراض والبيانات (NDVI، الرطوبة، التربة، الطقس)."
    + "\n2) قدّم خطة تدخل منسقة (ري، تسميد، حماية) مع جرعات وأزمنة دقيقة."
    + "\n3) اربط التوصيات بالصور أو قراءات الأقمار الصناعية، واذكر مؤشرات الخطر إذا غابت البيانات."
    + "\n4) اعتمد على قاعدة بيانات المحاصيل والتربة والآفات المرفقة في السياق، واذكر المواد الفعّالة أو نوع السماد/المبيد دون تفضيل تجاري."
    + "\n5) أختم بخطوات مراقبة الأيام السبعة القادمة ونصائح السلامة."
    + "\nاستخدم قوائم مرقمة أو جداول قصيرة لسهولة التنفيذ."
    : `You are an agronomy copilot for Egyptian farms (date: ${today}).`
    + "\n\nResponse policy:"
    + "\n1) Start with a diagnosis and confidence score that cites imagery, NDVI, soil, or weather signals."
    + "\n2) Provide a staged intervention plan (irrigation, nutrition, protection) with doses, timings, and tools."
    + "\n3) Tie each recommendation back to the uploaded media or satellite context and call out missing data explicitly."
    + "\n4) Ground advice in the attached crop/soil/pest knowledge base, and speak in terms of active ingredients or input types (not brand endorsements)."
    + "\n5) Close with next-7-day monitoring actions and safety notices."
    + "\nPrefer numbered lists or compact tables so agronomists can act immediately."
}

function findRelatedArticles(query: string, limit = 3) {
  if (!query) return []
  return searchArticles(query).slice(0, limit)
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Payload
  const language = payload.language ?? "ar"
  const attachments = payload.images ?? []
  const baseMessages = sanitiseMessages(payload.messages)
  const coreMessages = toCoreMessages(baseMessages)
  const { blocks: contextBlocks, plantReport } = await loadContext({ images: attachments, fieldId: payload.fieldId, language })

  aiProviderRegistry.refreshProviders()
  const providers = aiProviderRegistry.getAvailableProviders()
  if (providers.length === 0) {
    return new Response(
      JSON.stringify({
        reply:
          language === "ar"
            ? "لم يتم ضبط مزود الذكاء الاصطناعي بعد."
            : "No AI provider is configured.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    )
  }

  const articleSuggestions = findRelatedArticles(baseMessages.at(-1)?.content ?? "")

  const visionPreferred =
    attachments.length > 0 ? providers.find((provider) => provider.capabilities.vision) : null
  let active = visionPreferred ? aiProviderRegistry.useProvider(visionPreferred.id) : aiProviderRegistry.getActiveModel()

  const buildConversation = (supportsVision: boolean): CoreMessage[] => {
    const enrichedMessages = supportsVision ? withVisionContent(coreMessages, attachments) : coreMessages
    const blocks = [...contextBlocks]
    if (attachments.length > 0) {
      blocks.push(buildVisionNote(language, supportsVision))
    }
    const systemContent =
      blocks.length > 0
        ? `${buildSystemPrompt(language)}\n\nContext:\n${blocks.join("\n\n")}`
        : buildSystemPrompt(language)
    return [{ role: "system", content: systemContent }, ...enrichedMessages]
  }

  const runWithTimeout = async (provider: typeof active) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000) // 10s per provider
    try {
      const messagesWithContext = buildConversation(provider.provider.capabilities.vision)
      const result = await generateText({
        model: provider.model,
        messages: messagesWithContext,
        temperature: 0.7,
        maxOutputTokens: 1000,
        abortSignal: controller.signal,
      })
      return result
    } finally {
      clearTimeout(timeout)
    }
  }

  const tryProviders = async (): Promise<Response> => {
    let attempts = 0
    const maxAttempts = Math.max(1, aiProviderRegistry.getAvailableProviders().length)

    while (attempts < maxAttempts) {
      try {
        const result = await runWithTimeout(active)
        const payload = JSON.stringify({ reply: result.text, provider: active.provider.id, plantInsights: plantReport ?? null })
        const response = new Response(payload, {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
        addProviderHeaders(response, active.provider)
        response.headers.set("X-Knowledge-Articles", JSON.stringify(articleSuggestions))
        return response
      } catch (err) {
        console.error("[AI Assistant] Provider failed", err)
        aiProviderRegistry.markCurrentProviderUnavailable()
        attempts += 1
        if (attempts >= maxAttempts) break
        try {
          active = aiProviderRegistry.tryNextModel()
        } catch {
          break
        }
      }
    }

    return new Response(
      JSON.stringify({
        reply:
          language === "ar"
            ? "تعذر تشغيل المساعد حالياً. يرجى المحاولة لاحقاً."
            : "Assistant is unavailable right now. Please try again later.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }

  return tryProviders()
}
