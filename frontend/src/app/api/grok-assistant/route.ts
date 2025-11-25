export const runtime = "nodejs"

import { type CoreMessage, generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type RawMessage = {
  role?: string
  content?: string
}

type Payload = {
  messages?: RawMessage[]
  language?: "ar" | "en"
  topic?: string
  context?: CompanionContext
}

type PlantMatchSummary = {
  label?: string
  probability?: number
}

type PlantInsightsContext = {
  summary?: string
  generatedAt?: string
  provider?: string
  matches?: PlantMatchSummary[]
}

type CompanionContext = {
  plantInsights?: PlantInsightsContext
}

type FieldSnapshot = {
  id: string
  name: string | null
  crop_type?: string | null
  ndvi_score?: number | null
  moisture_index?: number | null
  yield_potential?: number | null
  updated_at?: string | null
  farms?: { name?: string | null } | null
}

type SoilSnapshot = {
  field_id?: string | null
  analysis_date?: string | null
  ph_level?: number | null
  nitrogen_ppm?: number | null
  phosphorus_ppm?: number | null
  potassium_ppm?: number | null
  moisture_percent?: number | null
}

const GROQ_BASE_URL = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1"
const GROQ_MODEL = (process.env.GROQ_MODEL || "llama-3.3-70b-versatile").trim()
const GROQ_API_KEY = process.env.GROQ_API_KEY?.trim()

const groqClient = GROQ_API_KEY
  ? createOpenAI({
    apiKey: GROQ_API_KEY,
    baseURL: GROQ_BASE_URL,
  })
  : null

function sanitiseMessages(messages?: RawMessage[]): CoreMessage[] {
  if (!Array.isArray(messages)) return []
  return messages
    .filter((message): message is RawMessage => !!message && typeof message === "object")
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: typeof message.content === "string" ? message.content : "",
    }))
}

function buildSystemPrompt(language: "ar" | "en" = "ar", topic?: string): string {
  const scope = topic
    ? language === "ar"
      ? `ركز على موضوع "${topic}".`
      : `Focus on the topic "${topic}".`
    : ""

  if (language === "ar") {
    return (
      "أنت «أدهم»، المساعد الزراعي الذكي لمنصة «أدهم أغريتك» (المؤسس: أدهم يونس محمد أحمد). "
      + "قدّم إجابات بالعربية الفصحى المبسطة، واذكر المصطلح الإنجليزي بين قوسين عند الحاجة. "
      + "الأولويات: "
      + "1) تشخيص أمراض النباتات بدقة عالية - عند السؤال عن مرض أو ظهور أعراض، قدم التشخيص مع نسبة الثقة المئوية (مثال: 85% مرض الندوة المتأخرة). "
      + "2) تحليل التربة - عند توفر قراءات pH أو EC أو NPK، قارنها بالمعايير المثلى واقترح التحسينات اللازمة. "
      + "3) التوصية بالأسمدة والمبيدات المناسبة من قاعدة البيانات مع الجرعات الدقيقة. "
      + "4) تقديم خطة علاجية شاملة للأمراض تتضمن: الأعراض، العلاج، الوقاية. "
      + "استخدم قوائم مرقمة أو جداول واضحة مع مؤشرات خطورة ونسب الثقة، واطلب البيانات الناقصة صراحة. "
      + "عند تحليل صور التربة أو النباتات، اذكر الملاحظات الرئيسية (اللون، الرطوبة، الأعراض المرئية). "
      + scope
    )
  }

  return (
    "You are ADHAM, the agricultural AI assistant for Adham AgriTech (founder: Adham Younes Mohamed Ahmed). "
    + "Respond in clear English unless the user switches languages, cite platform modules (farms, fields, marketplace, satellite) when relevant. "
    + "Priorities: "
    + "(1) Diagnose plant diseases with high accuracy - when asked about a disease or symptoms, provide diagnosis with confidence percentage (e.g., 85% Late Blight). "
    + "(2) Analyze soil conditions - compare pH, EC, NPK readings against optimal standards and suggest improvements. "
    + "(3) Recommend appropriate fertilizers and pesticides from the database with precise dosages. "
    + "(4) Provide comprehensive treatment plans including: symptoms, treatment, prevention. "
    + "Use numbered lists or clear tables with risk indicators and confidence percentages. Request missing data explicitly. "
    + "When analyzing soil or plant images, mention key observations (color, moisture, visible symptoms). "
    + scope
  )
}

function buildContextBlock(language: "ar" | "en", context?: CompanionContext): string {
  const plant = context?.plantInsights
  if (!plant) return ""

  const generatedAt =
    plant.generatedAt && Number.isFinite(Date.parse(plant.generatedAt))
      ? new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(plant.generatedAt))
      : null
  const providerLabel = language === "ar" ? "منصة أدهم" : "Adham platform"

  const matches =
    plant.matches?.length && plant.matches.length > 0
      ? plant.matches
        .slice(0, 3)
        .map((match, index) => {
          const label = match.label ?? (language === "ar" ? `تطابق ${index + 1}` : `Match ${index + 1}`)
          const score =
            typeof match.probability === "number"
              ? language === "ar"
                ? `ثقة ${match.probability}%`
                : `Confidence ${match.probability}%`
              : null
          return score ? `${label} (${score})` : label
        })
        .join(language === "ar" ? " | " : " | ")
      : null

  if (language === "ar") {
    return [
      "ملخص فحص النبات الأخير:",
      generatedAt ? `- التاريخ: ${generatedAt}` : null,
      `- المصدر: ${providerLabel}`,
      plant.summary ? `- الاستنتاج: ${plant.summary}` : null,
      matches ? `- أهم التطابقات: ${matches}` : null,
      "اربط التوصيات بمستويات الخطر والعمليات اللازمة في المنصة.",
    ]
      .filter(Boolean)
      .join("\n")
  }

  return [
    "Latest plant inspection context:",
    generatedAt ? `- Timestamp: ${generatedAt}` : null,
    `- Source: ${providerLabel}`,
    plant.summary ? `- Summary: ${plant.summary}` : null,
    matches ? `- Top matches: ${matches}` : null,
    "Reference these findings when drafting diagnoses and action plans.",
  ]
    .filter(Boolean)
    .join("\n")
}

function clampNdvi(value?: number | null): number | null {
  if (value == null || Number.isNaN(value)) return null
  if (value > 1.2) return Math.min(1, Math.max(0, value / 100))
  if (value < -1) return null
  return Math.min(1, Math.max(0, value))
}

function asPercent(value?: number | null): number | null {
  if (value == null || Number.isNaN(value)) return null
  if (value <= 1) return Math.round(value * 100)
  return Math.round(value)
}

async function buildAgriculturalKnowledge(language: "ar" | "en"): Promise<string> {
  try {
    const supabase = await createSupabaseServerClient()

    // Optional: user crops to tailor guidance
    const {
      data: { user },
    } = await supabase.auth.getUser()
    let userCrops: string[] = []
    if (user) {
      try {
        const { data: userFields } = await supabase
          .from("fields")
          .select("crop_type")
          .eq("user_id", user.id)
          .limit(5)
        userCrops = (userFields ?? [])
          .map((f: any) => (f?.crop_type ? String(f.crop_type).trim() : ""))
          .filter(Boolean)
      } catch (err) {
        console.warn("[AYMA Assistant] Could not load user crops", err)
      }
    }

    // Fetch agricultural knowledge data with more details
    const [
      { data: diseases },
      { data: fertilizers },
      { data: pesticides },
      { data: soilStandards },
      { data: crops },
    ] = await Promise.all([
      supabase.from("diseases").select("*").order("severity_level", { ascending: false }).limit(15),
      supabase.from("fertilizer_types").select("*").limit(12),
      supabase.from("pesticide_types").select("*").limit(10),
      supabase.from("soil_standards").select("*"),
      supabase.from("crops").select("*").limit(12),
    ])

    const sections: string[] = []

    if (language === "ar") {
      sections.push("📚 قاعدة المعرفة الزراعية المتقدمة")
      sections.push("=" + "=".repeat(50))

      if (userCrops.length > 0) {
        sections.push(`\n🌾 المحاصيل النشطة لديك: ${userCrops.join("، ")}`)
      }

      if (diseases && diseases.length > 0) {
        sections.push(`\n🦠 **الأمراض (${diseases.length} مرض):**`)

        // Group by severity
        const critical = diseases.filter(d => d.severity_level >= 4)
        const moderate = diseases.filter(d => d.severity_level === 3)
        const mild = diseases.filter(d => d.severity_level <= 2)

        if (critical.length > 0) {
          sections.push(`   الحرجة (خطورة 4-5): ${critical.map(d => d.name_ar).join("، ")}`)
        }
        if (moderate.length > 0) {
          sections.push(`   المتوسطة (خطورة 3): ${moderate.map(d => d.name_ar).join("، ")}`)
        }
        if (mild.length > 0) {
          sections.push(`   البسيطة (خطورة 1-2): ${mild.map(d => d.name_ar).join("، ")}`)
        }
      }

      if (fertilizers && fertilizers.length > 0) {
        sections.push(`\n🌱 **الأسمدة (${fertilizers.length} سماد):**`)
        const organic = fertilizers.filter(f => f.category === 'organic')
        const chemical = fertilizers.filter(f => f.category === 'chemical')

        if (chemical.length > 0) {
          sections.push(`   كيميائية: ${chemical.map(f => `${f.name_ar} (${f.npk_ratio || 'متنوع'})`).join("، ")}`)
        }
        if (organic.length > 0) {
          sections.push(`   عضوية: ${organic.map(f => f.name_ar).join("، ")}`)
        }
      }

      if (pesticides && pesticides.length > 0) {
        sections.push(`\n🛡️ **المبيدات (${pesticides.length} مبيد):**`)
        const byCategory: Record<string, any[]> = {}
        pesticides.forEach(p => {
          const cat = p.category || 'other'
          if (!byCategory[cat]) byCategory[cat] = []
          byCategory[cat].push(p)
        })

        const categoryNames: Record<string, string> = {
          'fungicide': 'مبيدات فطرية',
          'insecticide': 'مبيدات حشرية',
          'herbicide': 'مبيدات أعشاب'
        }

        Object.entries(byCategory).forEach(([cat, items]) => {
          const catName = categoryNames[cat] || cat
          sections.push(`   ${catName}: ${items.map(p => p.name_ar).join("، ")}`)
        })
      }

      if (soilStandards && soilStandards.length > 0) {
        sections.push(`\n🔬 **معايير التربة (${soilStandards.length} معيار):**`)
        sections.push("   " + soilStandards.map(s => {
          const range = s.optimal_min && s.optimal_max
            ? `(${s.optimal_min}-${s.optimal_max} ${s.unit || ''})`
            : ''
          return `${s.parameter} ${range}`
        }).join(" • "))
      }

      if (crops && crops.length > 0) {
        const relevant = userCrops.length
          ? crops.filter((c: any) => userCrops.includes(c.name_ar) || userCrops.includes(c.name_en))
          : crops.slice(0, 6)
        if (relevant.length > 0) {
          sections.push("\n🌿 **إرشادات المحصول:**")
          relevant.forEach((c: any) => {
            const soil = c.soil_type_ar || c.soil_type || c.soil_type_en
            const irrigation = c.irrigation_notes_ar || c.irrigation_notes || c.irrigation_schedule
            const fert = c.fertilization_notes_ar || c.fertilization_notes
            const pests = c.pest_risk_ar || c.pest_risk
            sections.push(
              `   - ${c.name_ar || c.name_en}: تربة ${soil || "—"} | ري: ${irrigation || "—"} | تسميد: ${fert || "—"} | آفات محتملة: ${pests || "—"}`,
            )
          })
        }
      }

      sections.push("\n💡 **كيف أستطيع مساعدتك:**")
      sections.push("   • اسألني عن أي مرض بالاسم أو صِف الأعراض وسأشخصه")
      sections.push("   • أخبرني بقراءات تربتك وسأقارنها بالمعايير")
      sections.push("   • اطلب توصية سماد أو مبيد لمحصول معين")
      sections.push("   • صِف مشكلة نباتك وسأقترح الحل الأمثل")
      sections.push("   • اطلب جدول عمل 7 أيام (ري، تسميد، مكافحة) حسب المحصول والطقس.")
    } else {
      sections.push("📚 Advanced Agricultural Knowledge Base")
      sections.push("=" + "=".repeat(50))

      if (userCrops.length > 0) {
        sections.push(`\n🌾 Active crops: ${userCrops.join(", ")}`)
      }

      if (diseases && diseases.length > 0) {
        sections.push(`\n🦠 **Diseases (${diseases.length} available):**`)

        const critical = diseases.filter(d => d.severity_level >= 4)
        const moderate = diseases.filter(d => d.severity_level === 3)
        const mild = diseases.filter(d => d.severity_level <= 2)

        if (critical.length > 0) {
          sections.push(`   Critical (level 4-5): ${critical.map(d => d.name_en).join(", ")}`)
        }
        if (moderate.length > 0) {
          sections.push(`   Moderate (level 3): ${moderate.map(d => d.name_en).join(", ")}`)
        }
        if (mild.length > 0) {
          sections.push(`   Mild (level 1-2): ${mild.map(d => d.name_en).join(", ")}`)
        }
      }

      if (fertilizers && fertilizers.length > 0) {
        sections.push(`\n🌱 **Fertilizers (${fertilizers.length} available):**`)
        const organic = fertilizers.filter(f => f.category === 'organic')
        const chemical = fertilizers.filter(f => f.category === 'chemical')

        if (chemical.length > 0) {
          sections.push(`   Chemical: ${chemical.map(f => `${f.name_en} (${f.npk_ratio || 'variable'})`).join(", ")}`)
        }
        if (organic.length > 0) {
          sections.push(`   Organic: ${organic.map(f => f.name_en).join(", ")}`)
        }
      }

      if (pesticides && pesticides.length > 0) {
        sections.push(`\n🛡️ **Pesticides (${pesticides.length} available):**`)
        const byCategory: Record<string, any[]> = {}
        pesticides.forEach(p => {
          const cat = p.category || 'other'
          if (!byCategory[cat]) byCategory[cat] = []
          byCategory[cat].push(p)
        })

        Object.entries(byCategory).forEach(([cat, items]) => {
          sections.push(`   ${cat.charAt(0).toUpperCase() + cat.slice(1)}s: ${items.map(p => p.name_en).join(", ")}`)
        })
      }

      if (soilStandards && soilStandards.length > 0) {
        sections.push(`\n🔬 **Soil Standards (${soilStandards.length} parameters):**`)
        sections.push("   " + soilStandards.map(s => {
          const range = s.optimal_min && s.optimal_max
            ? `(${s.optimal_min}-${s.optimal_max} ${s.unit || ''})`
            : ''
          return `${s.parameter} ${range}`
        }).join(" • "))
      }

      if (crops && crops.length > 0) {
        const relevant = userCrops.length
          ? crops.filter((c: any) => userCrops.includes(c.name_en) || userCrops.includes(c.name_ar))
          : crops.slice(0, 6)
        if (relevant.length > 0) {
          sections.push("\n🌿 **Crop-specific guidance:**")
          relevant.forEach((c: any) => {
            const soil = c.soil_type_en || c.soil_type || c.soil_type_ar
            const irrigation = c.irrigation_notes || c.irrigation_schedule || c.irrigation_notes_ar
            const fert = c.fertilization_notes || c.fertilization_notes_ar
            const pests = c.pest_risk || c.pest_risk_ar
            sections.push(
              `   - ${c.name_en || c.name_ar}: Soil ${soil || "—"} | Irrigation: ${irrigation || "—"} | Fert: ${fert || "—"} | Pests: ${pests || "—"}`,
            )
          })
        }
      }

      sections.push("\n💡 **How I can help:**")
      sections.push("   • Ask about any disease by name or describe symptoms for diagnosis")
      sections.push("   • Share your soil readings and I'll compare them to standards")
      sections.push("   • Request fertilizer or pesticide recommendations for specific crops")
      sections.push("   • Describe your plant problem and I'll suggest the best solution")
      sections.push("   • Ask for a 7-day action plan (irrigation, fertilization, scouting) tailored to your crop and weather.")
    }

    return sections.join("\n")
  } catch (error) {
    console.warn("[AYMA Assistant] Agricultural knowledge unavailable:", error)
    return ""
  }
}

async function buildTelemetryBlock(language: "ar" | "en"): Promise<string> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return ""

    const [{ data: fields }, { data: soil }, { data: irrigation }, { data: notifications }] = await Promise.all([
      supabase
        .from("fields")
        .select("id, name, crop_type, ndvi_score, moisture_index, yield_potential, updated_at, farms(name)")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false, nullsFirst: false })
        .limit(3),
      supabase
        .from("soil_analysis")
        .select("field_id, analysis_date, ph_level, nitrogen_ppm, phosphorus_ppm, potassium_ppm, moisture_percent")
        .eq("user_id", user.id)
        .order("analysis_date", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("irrigation_schedules")
        .select("field_id, start_time, duration_minutes, water_amount_liters, status, fields(name)")
        .eq("user_id", user.id)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true })
        .limit(3),
      supabase
        .from("notifications")
        .select("title, message, created_at, type")
        .eq("user_id", user.id)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(3),
    ])

    const nf = new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 2 })

    const fieldLines =
      fields?.length
        ? fields.map((row: any, index: number) => {
          const ndvi = clampNdvi(row.ndvi_score)
          const moisture = asPercent(row.moisture_index)
          const yieldEstimate = asPercent(row.yield_potential)
          const stamp =
            row.updated_at && Number.isFinite(Date.parse(row.updated_at))
              ? new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", {
                dateStyle: "medium",
              }).format(new Date(row.updated_at))
              : null
          if (language === "ar") {
            return `- الحقل ${index + 1}: ${row.name ?? "بدون اسم"} (${row.crop_type ?? "—"}) • NDVI ${ndvi != null ? nf.format(ndvi) : "—"
              } • رطوبة ${moisture != null ? `${moisture}%` : "—"} • إنتاجية ${yieldEstimate != null ? `${yieldEstimate}%` : "—"
              }${stamp ? ` • آخر تحديث ${stamp}` : ""}`
          }
          return `- Field ${index + 1}: ${row.name ?? "Unnamed"} (${row.crop_type ?? "—"}) • NDVI ${ndvi != null ? nf.format(ndvi) : "—"
            } • Moisture ${moisture != null ? `${moisture}%` : "—"} • Yield ${yieldEstimate != null ? `${yieldEstimate}%` : "—"
            }${stamp ? ` • Updated ${stamp}` : ""}`
        })
        : []

    let soilLine = ""
    if (soil) {
      const stamp =
        soil.analysis_date && Number.isFinite(Date.parse(soil.analysis_date))
          ? new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", {
            dateStyle: "medium",
          }).format(new Date(soil.analysis_date))
          : null
      const ph = soil.ph_level != null ? nf.format(soil.ph_level) : null
      const nitrogen = soil.nitrogen_ppm != null ? `${nf.format(soil.nitrogen_ppm)} ppm` : null
      const phosphorus = soil.phosphorus_ppm != null ? `${nf.format(soil.phosphorus_ppm)} ppm` : null
      const potassium = soil.potassium_ppm != null ? `${nf.format(soil.potassium_ppm)} ppm` : null
      const moisture = soil.moisture_percent != null ? `${nf.format(soil.moisture_percent)}%` : null
      soilLine =
        language === "ar"
          ? [
            "نتائج تحليل التربة الأخيرة:",
            stamp ? `- التاريخ: ${stamp}` : null,
            ph ? `- درجة الحموضة: ${ph}` : null,
            nitrogen ? `- نيتروجين: ${nitrogen}` : null,
            phosphorus ? `- فوسفور: ${phosphorus}` : null,
            potassium ? `- بوتاسيوم: ${potassium}` : null,
            moisture ? `- رطوبة التربة: ${moisture}` : null,
          ]
            .filter(Boolean)
            .join("\n")
          : [
            "Latest soil analysis:",
            stamp ? `- Date: ${stamp}` : null,
            ph ? `- pH: ${ph}` : null,
            nitrogen ? `- Nitrogen: ${nitrogen}` : null,
            phosphorus ? `- Phosphorus: ${phosphorus}` : null,
            potassium ? `- Potassium: ${potassium}` : null,
            moisture ? `- Soil moisture: ${moisture}` : null,
          ]
            .filter(Boolean)
            .join("\n")
    }

    const irrigationLines =
      irrigation?.length
        ? irrigation.map((row: any) => {
          const time = new Date(row.start_time).toLocaleString(language === "ar" ? "ar-EG" : "en-US", {
            dateStyle: "short",
            timeStyle: "short",
          })
          const fieldName = row.fields?.name ?? (language === "ar" ? "حقل غير معروف" : "Unknown Field")
          return language === "ar"
            ? `- ري ${fieldName}: ${time} (${row.duration_minutes} دقيقة، ${row.water_amount_liters} لتر)`
            : `- Irrigate ${fieldName}: ${time} (${row.duration_minutes} mins, ${row.water_amount_liters} L)`
        })
        : []

    const notificationLines =
      notifications?.length
        ? notifications.map((row: any) => {
          return language === "ar" ? `- تنبيه: ${row.title} - ${row.message}` : `- Alert: ${row.title} - ${row.message}`
        })
        : []

    const sections: string[] = []
    if (fieldLines.length > 0) {
      sections.push(
        language === "ar" ? "ملخص الأقمار الصناعية الجاري:" : "Active satellite intelligence:",
        ...fieldLines,
      )
    }
    if (soilLine) {
      sections.push(soilLine)
    }
    if (irrigationLines.length > 0) {
      sections.push(
        language === "ar" ? "جدول الري القادم:" : "Upcoming irrigation tasks:",
        ...irrigationLines,
      )
    }
    if (notificationLines.length > 0) {
      sections.push(
        language === "ar" ? "تنبيهات غير مقروءة:" : "Unread alerts:",
        ...notificationLines,
      )
    }

    return sections.length > 0 ? sections.join("\n") : ""
  } catch (error) {
    console.warn("[AYMA Assistant] Telemetry context unavailable:", error)
    return ""
  }
}

export async function POST(request: Request) {
  let body: Payload | null = null
  try {
    if (!groqClient) {
      return Response.json(
        { error: "Assistant provider is not configured. Please set GROQ_API_KEY." },
        { status: 500 },
      )
    }

    body = (await request.json()) as Payload
    const language = body.language === "en" ? "en" : "ar"
    const messages = sanitiseMessages(body.messages)
    const [systemContext, telemetryContext, agricultureContext] = await Promise.all([
      Promise.resolve(buildContextBlock(language, body.context)),
      buildTelemetryBlock(language),
      buildAgriculturalKnowledge(language),
    ])
    const basePrompt = buildSystemPrompt(language, body.topic)
    const systemPrompt = [basePrompt, systemContext, telemetryContext, agricultureContext].filter(Boolean).join("\n\n")

    const response = await generateText({
      model: groqClient(GROQ_MODEL),
      system: systemPrompt,
      messages,
      temperature: 0.2,
      maxOutputTokens: 600,
    })

    return Response.json({
      reply: response.text,
      provider: "grok",
      model: GROQ_MODEL,
    })
  } catch (error) {
    console.error("[AYMA Assistant] Request failed:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    const normalized = message.toLowerCase()
    
    // Log the actual error for debugging
    // console.log("[AYMA Assistant] Error details:", { message, normalized, body: body?.messages?.slice(-2) })
    if (normalized.includes('unauthorized') || normalized.includes('api key')) {
      return (body?.language === "ar") 
        ? 'حدثت مشكلة في إعداد المساعد. حاول مرة أخرى لاحقًا أو تواصل مع مسؤول المنصة.'
        : 'There seems to be a configuration issue with the assistant. Please try again later or contact your platform admin.'
    }
    if (normalized.includes('rate limit')) {
      return (body?.language === "ar") 
        ? 'تم بلوغ الحد الأقصى للطلبات. انتظر قليلاً ثم أعد المحاولة.'
        : 'You hit the request limit. Wait a moment and retry.'
    }

    // Retry logic for unsupported content (likely image issues)
    if (normalized.includes("unsupported content") || normalized.includes("content fields") || normalized.includes("image")) {
      try {
        // console.log("[AYMA Assistant] Retrying without images...")
        // Filter messages to keep only text content
        const textOnlyMessages = body?.messages?.map(m => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : '' // Simplistic text extraction
        })).filter(m => m.content)

        if (textOnlyMessages && textOnlyMessages.length > 0) {
          const response = await generateText({
            model: groqClient!(GROQ_MODEL),
            system: "You are in fallback mode. The user's image could not be processed. Apologize briefly and answer based on the text only.",
            messages: sanitiseMessages(textOnlyMessages),
            temperature: 0.2,
            maxOutputTokens: 600,
          })
          return Response.json({ reply: response.text, provider: "grok", model: GROQ_MODEL })
        }
      } catch (retryError) {
        console.error("[AYMA Assistant] Retry failed:", retryError)
      }

      const friendly =
        "تعذر على المساعد فهم هذا الطلب بالصيغة الحالية (قد تكون الصورة غير مدعومة). أعد صياغة سؤالك كنص واضح، ثم حاول مرة أخرى."
      return Response.json({ reply: friendly, provider: "grok", model: GROQ_MODEL }, { status: 200 })
    }

    // For other errors (API limits, network issues, etc.), provide a more helpful message
    if (normalized.includes("rate limit") || normalized.includes("quota") || normalized.includes("limit")) {
      const rateLimitMessage = body?.language === "en" 
        ? "The assistant is temporarily unavailable due to high demand. Please try again in a few moments."
        : "المساعد غير متاح مؤقتاً بسبب الطلب المرتفع. يرجى المحاولة مرة أخرى بعد لحظات."
      return Response.json({ reply: rateLimitMessage, provider: "grok", model: GROQ_MODEL }, { status: 200 })
    }

    // For network or other errors, try a simple fallback
    try {
      // console.log("[AYMA Assistant] Attempting simple fallback...")
      const simpleResponse = body?.language === "en"
        ? "I'm having trouble connecting right now. Please try again or rephrase your question about farming, crops, or field management."
        : "أواجه صعوبة في الاتصال الآن. يرجى المحاولة مرة أخرى أو إعادة صياغة سؤالك حول الزراعة أو المحاصيل أو إدارة الحقول."
      return Response.json({ reply: simpleResponse, provider: "grok", model: GROQ_MODEL }, { status: 200 })
    } catch (fallbackError) {
      console.error("[AYMA Assistant] Even fallback failed:", fallbackError)
    }

    return Response.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  if (!groqClient || !GROQ_API_KEY) {
    return Response.json({ available: false, reason: "missing_api_key" }, { status: 503 })
  }

  return Response.json({
    available: true,
    provider: "grok",
    model: GROQ_MODEL,
  })
}
