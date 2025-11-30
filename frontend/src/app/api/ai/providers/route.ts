export const runtime = "nodejs"

import { aiProviderRegistry } from "@/lib/ai/provider-registry"

export async function GET() {
  try {
    await aiProviderRegistry.initializeFromDB()
    aiProviderRegistry.refreshProviders()
    const status = aiProviderRegistry.getProviderStatus()
    const available = status.filter((s) => s.available)
    return new Response(
      JSON.stringify({ availableCount: available.length, providers: status }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ availableCount: 0, providers: [], error: error?.message ?? "Unknown error" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  }
}

