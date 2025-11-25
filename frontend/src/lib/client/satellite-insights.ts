import type { SatelliteAnalysisResponse, SatelliteInsightsMap } from "@/lib/types/satellite"

export type SatelliteLanguage = "ar" | "en"

export async function fetchSatelliteInsights(
  fieldId: string | string[],
  language: SatelliteLanguage = "en",
): Promise<SatelliteAnalysisResponse | SatelliteInsightsMap | null> {
  if (!fieldId || (Array.isArray(fieldId) && fieldId.length === 0)) return null

  // Handle batch request
  if (Array.isArray(fieldId)) {
    const results: SatelliteInsightsMap = {}
    await Promise.all(
      fieldId.map(async (id) => {
        const result = await fetchSatelliteInsights(id, language)
        if (result && "satellite" in result) {
          results[id] = result as SatelliteAnalysisResponse
        }
      }),
    )
    return results
  }

  // Handle single request
  try {
    const response = await fetch("/api/soil-analysis/analyze-from-satellite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fieldId, language }),
      cache: "no-store",
    })

    const payload: SatelliteAnalysisResponse = await response.json()
    if (!response.ok) {
      throw new Error(payload?.error || "Satellites endpoint failed")
    }
    return payload
  } catch (error) {
    console.error("[SatelliteInsights] Failed to load field insights:", error)
    return null
  }
}
