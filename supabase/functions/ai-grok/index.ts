// deno-lint-ignore-file no-explicit-any
// Edge Function: ai-grok
// Deploy with: supabase functions deploy ai-grok

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

type RawMessage = { role?: string; content?: string }
type CoreMessage = { role: "user" | "assistant" | "system"; content: string | any[] }
type Payload = {
  messages?: RawMessage[]
  language?: "ar" | "en"
  topic?: string
  context?: { plantInsights?: { summary?: string; generatedAt?: string; provider?: string; matches?: { label?: string; probability?: number }[] } }
}

const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" }, ...init })

function sanitiseMessages(messages?: RawMessage[]): CoreMessage[] {
  if (!Array.isArray(messages)) return []
  return messages
    .filter((m) => m && typeof m === "object")
    .map((m) => ({ role: m.role === "assistant" ? "assistant" : (m.role === "system" ? "system" : "user"), content: String(m.content ?? "") }))
}

function buildSystemPrompt(language: "ar" | "en" = "ar", topic?: string): string {
  const scope = topic ? (language === "ar" ? `ركز على موضوع "${topic}".` : `Focus on the topic "${topic}".`) : ""
  if (language === "ar") {
    return (
      "أنت «أدهم»، المساعد التشغيلي لمنصة «أدهم أغريتك». " +
      "قدّم إجابات عربية مبسطة، واذكر المصطلح الإنجليزي بين قوسين عند الحاجة. " +
      "الأولويات: 1) تلخيص الوضع الحالي، 2) اقتراح قرارات تشغيلية، 3) تشخيص أمراض النبات عند توفر البيانات. " +
      scope
    )
  }
  return (
    "You are ADHAM, the operational co‑pilot for Adham AgriTech. " +
    "Be concise, execution‑focused, and call out missing data. " +
    scope
  )
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

async function buildTelemetryBlock(req: Request, language: "ar" | "en"): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ""

    const { data: fields } = await supabase
      .from("fields")
      .select("id,name,crop_type,ndvi_score,moisture_index,yield_potential,updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(3)

    if (!fields?.length) return ""

    const nf = new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 2 })
    const lines = fields.map((row: any, i: number) => {
      const ndvi = clampNdvi(row.ndvi_score)
      const moisture = asPercent(row.moisture_index)
      const yieldEstimate = asPercent(row.yield_potential)
      const stamp = row.updated_at && Number.isFinite(Date.parse(row.updated_at))
        ? new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", { dateStyle: "medium" }).format(new Date(row.updated_at))
        : null
      if (language === "ar") {
        return `- الحقل ${i + 1}: ${row.name ?? "بدون اسم"} (${row.crop_type ?? "—"}) • NDVI ${ndvi != null ? nf.format(ndvi) : "—"} • رطوبة ${moisture != null ? `${moisture}%` : "—"} • إنتاجية ${yieldEstimate != null ? `${yieldEstimate}%` : "—"}${stamp ? ` • آخر تحديث ${stamp}` : ""}`
      }
      return `- Field ${i + 1}: ${row.name ?? "Unnamed"} (${row.crop_type ?? "—"}) • NDVI ${ndvi != null ? nf.format(ndvi) : "—"} • Moisture ${moisture != null ? `${moisture}%` : "—"} • Yield ${yieldEstimate != null ? `${yieldEstimate}%` : "—"}${stamp ? ` • Updated ${stamp}` : ""}`
    })

    return (language === "ar" ? "ملخص الأقمار الصناعية الجاري:" : "Active satellite intelligence:") +
      "\n" + lines.join("\n")
  } catch {
    return ""
  }
}

function toOpenAIChat(messages: CoreMessage[]) {
  return messages.map((m) => ({ role: m.role, content: typeof m.content === "string" ? m.content : m.content }))
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } })
    }

    const body = (await req.json().catch(() => ({}))) as Payload
    const language: "ar" | "en" = body.language === "en" ? "en" : "ar"
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")
    const GROQ_MODEL = (Deno.env.get("GROQ_MODEL") ?? "llama-3.3-70b-versatile").trim()
    const GROQ_BASE_URL = Deno.env.get("GROQ_BASE_URL") ?? "https://api.groq.com/openai/v1"

    if (!GROQ_API_KEY) {
      return json({ error: "missing GROQ_API_KEY" }, { status: 500 })
    }

    const system = buildSystemPrompt(language, body.topic)
    const telemetry = await buildTelemetryBlock(req, language)
    const systemPrompt = [system, telemetry].filter(Boolean).join("\n\n")

    const coreMessages = sanitiseMessages(body.messages)
    const finalMessages: CoreMessage[] = [{ role: "system", content: systemPrompt }, ...coreMessages]

    const resp = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({ model: GROQ_MODEL, messages: toOpenAIChat(finalMessages), temperature: 0.2, max_tokens: 600 }),
    })

    if (!resp.ok) {
      const err = await resp.text().catch(() => "")
      return json({ error: `Upstream error ${resp.status}`, details: err }, { status: 502 })
    }

    const payload = await resp.json()
    const reply: string = payload?.choices?.[0]?.message?.content ?? ""
    return json({ reply, provider: "grok", model: GROQ_MODEL }, { headers: { "Access-Control-Allow-Origin": "*" } })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return json({ error: message }, { status: 500 })
  }
})

