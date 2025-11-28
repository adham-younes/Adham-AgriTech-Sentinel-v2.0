import type { LanguageModel } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { createOpenAI } from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"

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

    // Priority 1: xAI Grok (User Requested Primary)
    if (trim(process.env.XAI_API_KEY)) {
      const xaiKey = trim(process.env.XAI_API_KEY) as string
      const xaiModel = trim(process.env.XAI_MODEL) || "grok-2-latest"
      const xaiClient = createOpenAI({
        apiKey: xaiKey,
        baseURL: trim(process.env.XAI_BASE_URL) || "https://api.x.ai/v1",
      })
      providers.push({
        id: "xai",
        name: "xAI Grok",
        modelId: xaiModel,
        getModel: () => xaiClient(xaiModel),
        isAvailable: true,
        capabilities: { vision: false },
      })
    }

    // Priority 2: OpenAI (Fallback)
    if (trim(process.env.OPENAI_API_KEY)) {
      const openaiKey = trim(process.env.OPENAI_API_KEY) as string
      const openaiClient = createOpenAI({ apiKey: openaiKey })
      const openaiModel = trim(process.env.OPENAI_MODEL) || "gpt-4o-mini"
      providers.push({
        id: "openai",
        name: "OpenAI",
        modelId: openaiModel,
        getModel: () => openaiClient(openaiModel),
        isAvailable: true,
        capabilities: { vision: true },
      })
    }

    // Priority 3: Groq
    if (trim(process.env.GROQ_API_KEY)) {
      const groqKey = trim(process.env.GROQ_API_KEY) as string
      const groqClient = createGroq({ apiKey: groqKey })
      const groqModel = trim(process.env.GROQ_MODEL) || "llama-3.3-70b-versatile"
      providers.push({
        id: "groq",
        name: "Groq",
        modelId: groqModel,
        getModel: () => groqClient(groqModel),
        isAvailable: true,
        capabilities: { vision: false },
      })
    }

    // Priority 4: Google Gemini
    if (trim(process.env.GOOGLE_AI_API_KEY)) {
      const googleKey = trim(process.env.GOOGLE_AI_API_KEY) as string
      const googleClient = createGoogleGenerativeAI({ apiKey: googleKey })
      const googleModel = trim(process.env.GOOGLE_AI_MODEL) || "gemini-1.5-flash"
      providers.push({
        id: "google",
        name: "Google Gemini",
        modelId: googleModel,
        getModel: () => googleClient(googleModel),
        isAvailable: true,
        capabilities: { vision: true },
      })
    }

    // Allow operator to control provider priority without code changes
    // AI_PROVIDER_ORDER: comma-separated ids e.g. "xai,groq,openai,google"
    // AI_PRIMARY_PROVIDER: single id e.g. "xai"
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
}

export const aiProviderRegistry = new AIProviderRegistry()

export function addProviderHeaders(response: Response, provider: AIProvider): Response {
  response.headers.set("X-AI-Provider", provider.id)
  response.headers.set("X-AI-Provider-Name", provider.name)
  response.headers.set("X-AI-Model", provider.modelId)
  return response
}
