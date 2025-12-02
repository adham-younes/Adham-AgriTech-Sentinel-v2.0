import { logger } from "../utils/logger"
import { eosdaRateLimiter } from "./eosda-rate-limiter"

const EOSDA_API_KEY = process.env.EOSDA_API_KEY
const EOSDA_API_URL = process.env.EOSDA_API_URL || "https://api-connect.eos.com/v1"

// Types
export interface VegetationMapRequest {
    fieldId: string
    vegetationIndex: "NDVI" | "NDWI" | "EVI" | "NDMI"
    zoneQuantity: 3 | 5 | 7
    minZoneArea?: number
    dateStart?: string
    dateEnd?: string
}

export interface ZoneData {
    zone_id: string
    area: number // in m²
    area_percent: number
    productivity_level: "low" | "medium" | "high"
    fertilizer_recommendation?: {
        N?: number // Nitrogen
        P?: number // Phosphorus
        K?: number // Potassium
    }
    geometry: {
        type: "Polygon"
        coordinates: number[][][]
    }
}

export interface VegetationMapResponse {
    zmap_id: string
    field_id: string
    status: "processing" | "completed" | "failed"
    zones?: ZoneData[]
    shapefile_download_url?: string
    created_at: string
    error?: string
}

/**
 * Create a vegetation-based productivity map for a field
 * Documentation: https://doc.eos.com/docs/zoning-api
 */
export async function createVegetationMap({
    fieldId,
    vegetationIndex = "NDVI",
    zoneQuantity = 5,
    minZoneArea = 1000,
    dateStart,
    dateEnd
}: VegetationMapRequest): Promise<{ zmapId: string; taskId: string }> {

    if (!EOSDA_API_KEY) {
        throw new Error("EOSDA_API_KEY is not configured")
    }

    // Check rate limit
    if (!eosdaRateLimiter.checkLimit('default')) {
        throw new Error("Rate limit exceeded for zoning API")
    }

    try {
        const requestBody: any = {
            field_id: fieldId,
            vegetation_index: vegetationIndex,
            zone_quantity: zoneQuantity,
        }

        if (minZoneArea) {
            requestBody.min_zone_area = minZoneArea
        }

        if (dateStart) {
            requestBody.date_start = dateStart
        }

        if (dateEnd) {
            requestBody.date_end = dateEnd
        }

        logger.info("Creating vegetation map", { fieldId, vegetationIndex, zoneQuantity })

        const response = await fetch(`${EOSDA_API_URL}/zoning/vegetation-map`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": EOSDA_API_KEY
            },
            body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`EOSDA Zoning API error: ${response.status} - ${errorText}`)
        }

        const data = await response.json()

        return {
            zmapId: data.zmap_id,
            taskId: data.task_id || data.zmap_id
        }
    } catch (error) {
        logger.error("Failed to create vegetation map", { error, fieldId })
        throw error
    }
}

/**
 * Get the status and results of a vegetation map
 */
export async function getVegetationMapStatus(
    fieldId: string,
    zmapId: string
): Promise<VegetationMapResponse> {

    if (!EOSDA_API_KEY) {
        throw new Error("EOSDA_API_KEY is not configured")
    }

    try {
        const response = await fetch(
            `${EOSDA_API_URL}/zoning/maps/${fieldId}/${zmapId}`,
            {
                headers: {
                    "x-api-key": EOSDA_API_KEY
                }
            }
        )

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`EOSDA Zoning API error: ${response.status} - ${errorText}`)
        }

        const data = await response.json()

        // Parse the response
        const zones = parseZones(data.zones || data.result)

        return {
            zmap_id: zmapId,
            field_id: fieldId,
            status: data.status === "finished" ? "completed" : data.status === "error" ? "failed" : "processing",
            zones: zones,
            shapefile_download_url: data.shapefile_download_url,
            created_at: data.created_at || new Date().toISOString(),
            error: data.error || data.errors?.[0]?.message
        }
    } catch (error) {
        logger.error("Failed to get vegetation map status", { error, fieldId, zmapId })
        throw error
    }
}

/**
 * Helper to parse zone data from EOSDA response
 */
function parseZones(zonesData: any): ZoneData[] | undefined {
    if (!zonesData) return undefined

    const zones: ZoneData[] = []

    // EOSDA returns zones as an array of objects with keys like "zone_1", "zone_2"
    for (const zoneObj of zonesData) {
        const zoneKey = Object.keys(zoneObj)[0] // e.g., "zone_1"
        const zoneData = zoneObj[zoneKey]

        if (!zoneData) continue

        // Determine productivity level based on zone number
        // Lower zone numbers typically = lower productivity
        const zoneNumber = parseInt(zoneKey.replace("zone_", ""))
        let productivityLevel: "low" | "medium" | "high" = "medium"

        if (zoneNumber === 1) productivityLevel = "low"
        else if (zoneNumber >= 4) productivityLevel = "high"

        zones.push({
            zone_id: zoneKey,
            area: zoneData.area || 0,
            area_percent: zoneData.area_percent || 0,
            productivity_level: productivityLevel,
            fertilizer_recommendation: zoneData.fertilizer,
            geometry: zoneData.geometry
        })
    }

    return zones.length > 0 ? zones : undefined
}

/**
 * Poll for vegetation map completion
 * @param fieldId Field ID
 * @param zmapId Zoning map ID
 * @param maxAttempts Maximum polling attempts (default: 60, ~5 minutes)
 * @param intervalMs Polling interval in ms (default: 5000 = 5 seconds)
 */
export async function pollVegetationMapCompletion(
    fieldId: string,
    zmapId: string,
    maxAttempts: number = 60,
    intervalMs: number = 5000
): Promise<VegetationMapResponse> {

    let attempts = 0

    while (attempts < maxAttempts) {
        const result = await getVegetationMapStatus(fieldId, zmapId)

        if (result.status === "completed") {
            return result
        }

        if (result.status === "failed") {
            throw new Error(result.error || "Vegetation map generation failed")
        }

        // Still processing
        attempts++
        await new Promise(resolve => setTimeout(resolve, intervalMs))
    }

    throw new Error("Vegetation map polling timed out")
}
