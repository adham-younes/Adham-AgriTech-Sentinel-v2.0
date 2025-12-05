import type { LanguageModel } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"

export interface AIProvider {
  id: string
  name: string
  modelId: string
  getModel: () => LanguageModel
  isAvailable: boolean
  capabilities: {
    vision: boolean
  }
}

interface ActiveModel {
  provider: AIProvider
  model: LanguageModel
}

export class AIProviderRegistry {
  private providers: AIProvider[] = []
  private currentProviderIndex = 0

  constructor() {
    this.refreshProviders()
  }

  public refreshProviders() {
    this.providers = []
    this.currentProviderIndex = 0
    this.initializeProviders()
  }

  public restoreProviders() {
    this.currentProviderIndex = 0
    this.providers.forEach((provider) => {
      provider.isAvailable = true
    })
  }

  private initializeProviders() {
    const providers: AIProvider[] = []

    const trim = (v?: string) => (typeof v === "string" ? v.trim() : v)

    // Priority 0: OpenAI (Highest Quality - "Opus-like")
    if (trim(process.env.OPENAI_API_KEY)) {
      try {
        const openaiKey = trim(process.env.OPENAI_API_KEY) as string
        const openaiClient = createOpenAI({ apiKey: openaiKey })
        const openaiModel = trim(process.env.OPENAI_MODEL) || "gpt-4o"
        providers.push({
          id: "openai",
          name: "OpenAI (GPT-4o)",
          modelId: openaiModel,
          getModel: () => openaiClient(openaiModel),
          isAvailable: true,
          capabilities: { vision: true },
        })
        console.log("[AI Registry] OpenAI initialized successfully")
      } catch (error) {
        console.warn("[AI Registry] Failed to initialize OpenAI:", error)
      }
    }

    // Priority 1: Vertex AI (Enterprise) - DISABLED on Vercel
    // Vertex AI requires GCP Application Default Credentials which aren't available in Vercel.
    // Use Google AI (Standard) instead which works with just an API key.
    // To enable Vertex AI, deploy OSIRIS backend to Cloud Run with proper GCP credentials.
    /*
    const vertexLocation = trim(process.env.VERTEX_AI_LOCATION);
    const vertexProject = trim(process.env.GOOGLE_CLOUD_PROJECT);

    if (vertexLocation && vertexProject) {
      try {
        const { getVertexAIClient, GEMINI_MODEL } = require('./vertex-ai');
        const vertexClient = getVertexAIClient();
        const vertexModelWrapper = (modelId: string) => {
          return { provider: 'vertex', modelId: modelId } as any;
        };
        providers.push({
          id: "vertex",
          name: "Google Vertex AI (Enterprise)",
          modelId: GEMINI_MODEL,
          getModel: () => vertexModelWrapper(GEMINI_MODEL),
          isAvailable: true,
          capabilities: { vision: true },
        });
        console.log("[AI Registry] Vertex AI initialized successfully");
      } catch (error) {
        console.warn("[AI Registry] Failed to initialize Vertex AI:", error);
      }
    }
    */

    // Priority 2: Groq
    if (trim(process.env.GROQ_API_KEY)) {
      const groqKey = trim(process.env.GROQ_API_KEY) as string
      const groqClient = createGroq({ apiKey: groqKey })
      const groqModel = trim(process.env.GROQ_MODEL) || "llama-3.3-70b-versatile" // Latest Llama 3.3 (Dec 2024)
      providers.push({
        id: "groq",
        name: "Groq",
        modelId: groqModel,
        getModel: () => groqClient(groqModel),
        isAvailable: true,
        capabilities: { vision: false },
      })
    }

    // Priority 3: Google Gemini (Standard API Fallback)
    const googleKey = trim(process.env.GOOGLE_AI_API_KEY)
    if (googleKey && googleKey.length > 10) {
      try {
        const googleClient = createGoogleGenerativeAI({ apiKey: googleKey })
        const googleModel = trim(process.env.GOOGLE_AI_MODEL) || "gemini-3-pro-preview-11-2025" // Gemini 3 Pro (Nov 2025) - Latest
        providers.push({
          id: "google",
          name: "Google Gemini (Standard)",
          modelId: googleModel,
          getModel: () => googleClient(googleModel),
          isAvailable: true,
          capabilities: { vision: true },
        })
      } catch (error) {
        console.warn("[AI Registry] Failed to initialize Google AI client:", error)
      }
    }

    // Allow operator to control provider priority without code changes
    // AI_PROVIDER_ORDER: comma-separated ids e.g. "groq,google"
    // AI_PRIMARY_PROVIDER: single id e.g. "groq"
    const orderEnv = (trim(process.env.AI_PROVIDER_ORDER) || trim(process.env.NEXT_PUBLIC_AI_PROVIDER_ORDER) || "")
      .toLowerCase()
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const primaryEnv = trim(process.env.AI_PRIMARY_PROVIDER)

    if (orderEnv.length > 0) {
      providers.sort((a, b) => {
        const ia = orderEnv.indexOf(a.id)
        const ib = orderEnv.indexOf(b.id)
        const va = ia === -1 ? Number.MAX_SAFE_INTEGER : ia
        const vb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib
        return va - vb
      })
    } else if (primaryEnv) {
      providers.sort((a, b) => (a.id === primaryEnv ? -1 : b.id === primaryEnv ? 1 : 0))
    }

    this.providers = providers

    if (this.providers.length === 0) {
      console.warn("[AI Registry] No providers configured. Set at least one API key.")
      return
    }

    console.log(
      `[AI Registry] Initialized ${this.providers.length} providers (priority: ${orderEnv.length ? orderEnv.join(" → ") : primaryEnv || "default"
      }):`,
      this.providers.map((p) => `${p.id}:${p.modelId}`).join(", "),
    )
  }

  private resolveActiveProvider(): AIProvider {
    if (this.providers.length === 0) {
      throw new Error("No AI providers available. Please configure at least one AI service.")
    }

    let inspected = 0
    while (inspected < this.providers.length) {
      const provider = this.providers[this.currentProviderIndex]
      if (provider.isAvailable) {
        console.log(`[AI Registry] Using provider: ${provider.name} (${provider.modelId})`)
        return provider
      }
      inspected += 1
      this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length
    }

    throw new Error("No AI providers are currently marked as available.")
  }

  public getActiveModel(): ActiveModel {
    const provider = this.resolveActiveProvider()
    return { provider, model: provider.getModel() }
  }

  public useProvider(id: string): ActiveModel {
    const index = this.providers.findIndex((provider) => provider.id === id && provider.isAvailable)
    if (index === -1) {
      throw new Error(`Requested AI provider "${id}" is not available.`)
    }
    this.currentProviderIndex = index
    const provider = this.providers[index]
    console.log(`[AI Registry] Forcing provider: ${provider.name} (${provider.modelId})`)
    return { provider, model: provider.getModel() }
  }

  public tryNextModel(): ActiveModel {
    if (this.providers.length <= 1) {
      throw new Error("No fallback providers available")
    }

    const startIndex = this.currentProviderIndex
    let inspected = 0

    do {
      this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length
      inspected += 1
      const candidate = this.providers[this.currentProviderIndex]
      if (candidate.isAvailable) {
        console.log(`[AI Registry] Falling back to: ${candidate.name} (${candidate.modelId})`)
        return { provider: candidate, model: candidate.getModel() }
      }
    } while (inspected < this.providers.length && this.currentProviderIndex !== startIndex)

    throw new Error("No fallback providers available")
  }

  public markCurrentProviderUnavailable(): void {
    if (this.providers.length === 0) {
      return
    }
    const provider = this.providers[this.currentProviderIndex]
    provider.isAvailable = false
    console.warn(`[AI Registry] Marked provider as unavailable: ${provider.name} (${provider.modelId})`)
  }

  public getAvailableProviders(): AIProvider[] {
    return this.providers.filter((p) => p.isAvailable)
  }

  public getProviderStatus(): {
    id: string
    name: string
    model: string
    available: boolean
    capabilities: AIProvider["capabilities"]
  }[] {
    return this.providers.map((p) => ({
      id: p.id,
      name: p.name,
      model: p.modelId,
      available: p.isAvailable,
      capabilities: p.capabilities,
    }))
  }

  public resetProviderIndex(): void {
    this.currentProviderIndex = 0
    this.providers.forEach((provider) => {
      provider.isAvailable = true
    })
  }

  public async initializeFromDB() {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !serviceRoleKey) {
        console.warn("[AI Registry] Missing Supabase credentials for DB initialization")
        return
      }

      const { createClient } = await import("@supabase/supabase-js")
      const supabase = createClient(supabaseUrl, serviceRoleKey)

      const { data: keys, error } = await supabase
        .from("ai_api_keys")
        .select("*")
        .eq("is_active", true)

      if (error) {
        console.warn("[AI Registry] Failed to fetch API keys from DB:", error)
        return
      }

      if (keys && keys.length > 0) {
        const trim = (v?: string) => (typeof v === "string" ? v.trim() : v)
        const dbProviders: AIProvider[] = []

        for (const key of keys) {
          if (key.provider_id === "groq") {
            const groqKey = trim(key.api_key)
            if (groqKey) {
              const { createGroq } = await import("@ai-sdk/groq")
              const groqClient = createGroq({ apiKey: groqKey })
              const groqModel = trim(key.model_id) || "llama-3.3-70b-versatile"
              dbProviders.push({
                id: "groq",
                name: "Groq (DB)",
                modelId: groqModel,
                getModel: () => groqClient(groqModel),
                isAvailable: true,
                capabilities: { vision: false },
              })
            }
          } else if (key.provider_id === "google") {
            const googleKey = trim(key.api_key)
            if (googleKey) {
              try {
                const { createGoogleGenerativeAI } = await import("@ai-sdk/google")
                const googleClient = createGoogleGenerativeAI({ apiKey: googleKey })
                const googleModel = trim(key.model_id) || "gemini-2.0-flash"
                dbProviders.push({
                  id: "google",
                  name: "Google Gemini (DB)",
                  modelId: googleModel,
                  getModel: () => googleClient(googleModel),
                  isAvailable: true,
                  capabilities: { vision: true },
                })
              } catch (e) {
                console.warn("[AI Registry] Failed to init Google from DB key", e)
              }
            }
          } else if (key.provider_id === "openai") {
            const openaiKey = trim(key.api_key)
            if (openaiKey) {
              try {
                const { createOpenAI } = await import("@ai-sdk/openai")
                const openaiClient = createOpenAI({ apiKey: openaiKey })
                const openaiModel = trim(key.model_id) || "gpt-4o"
                dbProviders.push({
                  id: "openai",
                  name: "OpenAI (DB)",
                  modelId: openaiModel,
                  getModel: () => openaiClient(openaiModel),
                  isAvailable: true,
                  capabilities: { vision: true },
                })
              } catch (e) {
                console.warn("[AI Registry] Failed to init OpenAI from DB key", e)
              }
            }
          }
        }

        if (dbProviders.length > 0) {
          // Merge with existing providers, prioritizing DB providers
          // Or just append them?
          // Let's prepend them so they are tried first if no order is set
          this.providers = [...dbProviders, ...this.providers]
          console.log(`[AI Registry] Added ${dbProviders.length} providers from DB`)
        }
      }
    } catch (error) {
      console.error("[AI Registry] DB initialization error:", error)
    }
  }
}

export const aiProviderRegistry = new AIProviderRegistry()

export function addProviderHeaders(response: Response, provider: AIProvider): Response {
  response.headers.set("X-AI-Provider", provider.id)
  response.headers.set("X-AI-Provider-Name", provider.name)
  response.headers.set("X-AI-Model", provider.modelId)
  return response
}
