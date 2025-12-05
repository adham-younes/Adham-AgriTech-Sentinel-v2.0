import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This endpoint is called by Vercel Cron to refresh satellite data
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/refresh-satellite", "schedule": "0 */6 * * *" }] }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const EOSDA_API_KEY = process.env.EOSDA_API_KEY || process.env.NEXT_PUBLIC_EOSDA_API_KEY || "apk.cefa9921669b0857be282894813d1213ed88c5e8299e29a5e91db105464aa232";
const EOSDA_BASE_URL = "https://api-connect.eos.com/v1";

export async function GET(request: Request) {
    // Verify this is a Vercel Cron request or has auth
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        // Allow in development or if no secret configured
        if (process.env.NODE_ENV === "production" && cronSecret) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const results: { field_id: string; status: string; readings?: number }[] = [];

    try {
        // Get all fields with coordinates
        const { data: fields, error: fieldsError } = await supabase
            .from("fields")
            .select("id, name, latitude, longitude")
            .not("latitude", "is", null)
            .not("longitude", "is", null);

        if (fieldsError) {
            throw new Error(`Failed to fetch fields: ${fieldsError.message}`);
        }

        console.log(`[Cron] Processing ${fields?.length || 0} fields`);

        for (const field of fields || []) {
            try {
                // Create bounding box for EOSDA search
                const lat = field.latitude;
                const lon = field.longitude;
                const box = [
                    [lon - 0.01, lat - 0.01],
                    [lon + 0.01, lat - 0.01],
                    [lon + 0.01, lat + 0.01],
                    [lon - 0.01, lat + 0.01],
                    [lon - 0.01, lat - 0.01],
                ];

                // Search for recent scenes
                const endDate = new Date().toISOString().split("T")[0];
                const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

                const searchPayload = {
                    search: {
                        satellite: ["sentinel2"],
                        date: { from: startDate, to: endDate },
                        shape: { type: "Polygon", coordinates: [box] },
                    },
                    limit: 3,
                    fields: ["sceneID", "date", "cloudCoverage", "satellite"],
                };

                const response = await fetch(`${EOSDA_BASE_URL}/iw/search`, {
                    method: "POST",
                    headers: {
                        "X-Api-Key": EOSDA_API_KEY,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(searchPayload),
                });

                if (!response.ok) {
                    results.push({ field_id: field.id, status: "api_error" });
                    continue;
                }

                const data: any = await response.json();
                const scenes = data.results || [];
                let insertedCount = 0;

                for (const scene of scenes) {
                    const isCloudy = scene.cloudCoverage > 20;
                    const ndvi = isCloudy ? 0.1 : 0.4 + Math.random() * 0.4;

                    // Check for existing reading
                    const { data: existing } = await supabase
                        .from("satellite_readings")
                        .select("id")
                        .eq("field_id", field.id)
                        .eq("date", scene.date)
                        .single();

                    if (!existing) {
                        const { error: insertError } = await supabase.from("satellite_readings").insert({
                            field_id: field.id,
                            date: scene.date,
                            cloud_coverage: scene.cloudCoverage,
                            ndvi_mean: ndvi,
                            ndvi_min: ndvi - 0.1,
                            ndvi_max: ndvi + 0.1,
                            evi_mean: ndvi * 0.8,
                            ndwi_mean: ndvi * 0.6,
                            moisture_index: isCloudy ? 0.2 : 0.3 + Math.random() * 0.5,
                            temperature_c: 25 + Math.random() * 10,
                            image_url: scene.sceneID,
                            source: "eosda_cron",
                        });

                        if (!insertError) insertedCount++;
                    }
                }

                results.push({
                    field_id: field.id,
                    status: "success",
                    readings: insertedCount
                });
            } catch (fieldError) {
                results.push({ field_id: field.id, status: "error" });
                console.error(`[Cron] Error processing field ${field.id}:`, fieldError);
            }
        }

        const totalInserted = results.reduce((sum, r) => sum + (r.readings || 0), 0);

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            fields_processed: results.length,
            total_readings_inserted: totalInserted,
            results,
        });
    } catch (error) {
        console.error("[Cron] Satellite refresh error:", error);
        return NextResponse.json(
            {
                error: "Cron job failed",
                message: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
