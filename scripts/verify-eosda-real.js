
const https = require('https');

const API_KEY = "apk.cefa9921669b0857be282894813d1213ed88c5e8299e29a5e91db105464aa232";
const HOST = "api-connect.eos.com";
const PATH = "/api/lms/search/v2/sentinel2";

console.log("Verifying EOSDA API connection (Node.js)...");

const searchPayload = JSON.stringify({
    "fields": ["sceneID", "cloudCoverage", "date", "view_id", "dataGeometry"],
    "limit": 1,
    "page": 1,
    "search": {
        "date": { "from": "2024-01-01", "to": "2024-12-31" },
        "cloudCoverage": { "from": 0, "to": 100 },
        "shapeRelation": "INTERSECTS",
        "shape": {
            "type": "Point",
            "coordinates": [32.55524, 25.30084]
        }
    },
    "sort": { "date": "desc" }
});

const options = {
    hostname: HOST,
    port: 443,
    path: PATH,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': API_KEY,
        'Content-Length': searchPayload.length
    }
};

const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode} ${res.statusMessage}`);

    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log("✅ EOSDA API Connection Successful!");
            try {
                const data = JSON.parse(body);
                console.log("Found scenes:", data.results ? data.results.length : 0);
                if (data.results && data.results.length > 0) {
                    console.log("Sample Scene:", JSON.stringify(data.results[0], null, 2));
                }
            } catch (e) {
                console.error("Failed to parse JSON:", e);
                console.log("Body:", body.substring(0, 500));
            }
        } else {
            console.error(`❌ Request Failed: ${res.statusCode}`);
            console.error("Body:", body);
        }
    });
});

req.on('error', (error) => {
    console.error("❌ Connection Failed:", error);
});

req.write(searchPayload);
req.end();
