import { getPlatformHealth } from "@/lib/services/health-check"

/**
 * Health checks rely on Supabase cookies + no-store fetch calls (OpenWeather, EOSDA).
 * Force dynamic rendering so Next.js doesn't try to prerender this route statically.
 */
export const dynamic = "force-dynamic"
export const revalidate = 0
export const runtime = "nodejs"

export async function GET() {
  try {
    const snapshot = await getPlatformHealth()
    return Response.json(snapshot, { headers: { "cache-control": "no-store" } })
  } catch (error: any) {
    console.error("[SystemHealth] Failed to build health snapshot", error)
    return Response.json(
      {
        error: "Failed to build platform health snapshot",
        details: error?.message ?? "Unknown error",
      },
      { status: 500, headers: { "cache-control": "no-store" } },
    )
  }
}
