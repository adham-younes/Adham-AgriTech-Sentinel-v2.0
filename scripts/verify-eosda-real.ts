
const apiKey = "apk.cefa9921669b0857be282894813d1213ed88c5e8299e29a5e91db105464aa232";
const baseUrl = "https://api-connect.eos.com/v1";

async function verifyEOSDA() {
    console.log("Verifying EOSDA API connection...");
    console.log(`Using API Key: ${apiKey.substring(0, 10)}...`);
    console.log(`Base URL: ${baseUrl}`);

    try {
        // Search for Sentinel-2 scenes in a known agricultural area (Egypt)
        const searchPayload = {
            "search": {
                "satellite": ["sentinel2"],
                "date": {
                    "from": "2024-01-01",
                    "to": "2024-01-30"
                },
                "shape": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [30.8, 26.8],
                            [30.9, 26.8],
                            [30.9, 26.9],
                            [30.8, 26.9],
                            [30.8, 26.8]
                        ]
                    ]
                }
            },
            "limit": 1,
            "fields": ["sceneID", "date", "cloudCoverage", "satellite"]
        };

        const response = await fetch(`${baseUrl}/iw/search`, {
            method: "POST",
            headers: {
                "X-Api-Key": apiKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(searchPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data: any = await response.json();
        console.log("✅ EOSDA API Connection Successful!");
        console.log("Found scenes:", data.results ? data.results.length : 0);
        if (data.results && data.results.length > 0) {
            console.log("Sample Scene:", JSON.stringify(data.results[0], null, 2));
        } else {
            console.warn("No scenes found, but connection was successful.");
        }

    } catch (error) {
        console.error("❌ EOSDA Verification Failed:", error);
    }
}

verifyEOSDA();
