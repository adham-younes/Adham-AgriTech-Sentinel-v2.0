import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load environment variables from multiple possible locations
const envPaths = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "frontend", ".env.local"),
    path.resolve(process.cwd(), "frontend", ".env"),
];

for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        console.log("Loading env from:", envPath);
        dotenv.config({ path: envPath });
    }
}

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EOSDA_API_KEY = process.env.EOSDA_API_KEY || "apk.cefa9921669b0857be282894813d1213ed88c5e8299e29a5e91db105464aa232";
const EOSDA_BASE_URL = "https://api-connect.eos.com/v1";

// Validate required env vars
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing required environment variables:");
    console.error("- NEXT_PUBLIC_SUPABASE_URL:", SUPABASE_URL ? "SET" : "MISSING");
    console.error("- SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_ROLE_KEY ? "SET" : "MISSING");
    console.error("\nPlease ensure these are set in your .env.local or frontend/.env.local file.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seedSatelliteData() {
    console.log("Starting satellite data seeding...");

    // Fetch all fields with coordinates
    const { data: fields, error: fieldsError } = await supabase
        .from("fields")
        .select("id, name, latitude, longitude, polygon");

    if (fieldsError) {
        console.error("Error fetching fields:", fieldsError);
        return;
    }

    console.log("Found", fields.length, "fields. Processing...");

    for (const field of fields) {
        const lat = field.latitude;
        const lon = field.longitude;

        if (!lat || !lon) {
            console.warn("Field", field.name, "has no coordinates. Skipping.");
            continue;
        }

        console.log("Processing field:", field.name);

        try {
            // Search EOSDA for scenes (last 30 days)
            const endDate = new Date().toISOString().split("T")[0];
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

            // Construct bounding box around center
            const box = [
                [lon - 0.01, lat - 0.01],
                [lon + 0.01, lat - 0.01],
                [lon + 0.01, lat + 0.01],
                [lon - 0.01, lat + 0.01],
                [lon - 0.01, lat - 0.01],
            ];

            const searchPayload = {
                search: {
                    satellite: ["sentinel2"],
                    date: { from: startDate, to: endDate },
                    shape: { type: "Polygon", coordinates: [box] },
                },
                limit: 5,
                fields: ["sceneID", "date", "cloudCoverage", "satellite"],
            };

            const response = await fetch(EOSDA_BASE_URL + "/iw/search", {
                method: "POST",
                headers: {
                    "X-Api-Key": EOSDA_API_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(searchPayload),
            });

            if (!response.ok) {
                console.error("EOSDA API Error for field", field.name, ":", response.statusText);
                continue;
            }

            const data: any = await response.json();
            const scenes = data.results || [];
            console.log("  Found", scenes.length, "scenes.");

            // Insert satellite readings
            for (const scene of scenes) {
                const isCloudy = scene.cloudCoverage > 20;
                const mockNDVI = isCloudy ? 0.1 : 0.4 + Math.random() * 0.4;
                const mockMoisture = isCloudy ? 0.2 : 0.3 + Math.random() * 0.5;

                const payload = {
                    field_id: field.id,
                    date: scene.date,
                    cloud_coverage: scene.cloudCoverage,
                    ndvi_mean: mockNDVI,
                    ndvi_min: mockNDVI - 0.1,
                    ndvi_max: mockNDVI + 0.1,
                    evi_mean: mockNDVI * 0.8,
                    ndwi_mean: mockNDVI * 0.6,
                    moisture_index: mockMoisture,
                    temperature_c: 25 + Math.random() * 10,
                    image_url: scene.sceneID,
                    source: "eosda",
                };

                // Check for existing reading
                const { data: existing } = await supabase
                    .from("satellite_readings")
                    .select("id")
                    .eq("field_id", field.id)
                    .eq("date", scene.date)
                    .single();

                if (!existing) {
                    const { error: insertError } = await supabase.from("satellite_readings").insert(payload);

                    if (insertError) {
                        console.error("  Failed to insert reading:", insertError.message);
                    } else {
                        console.log("  Inserted reading for", scene.date);
                    }
                } else {
                    console.log("  Skipping duplicate", scene.date);
                }
            }
        } catch (err) {
            console.error("  Failed processing field", field.name, ":", err);
        }
    }

    console.log("Seeding complete.");
}

seedSatelliteData().catch(console.error);
