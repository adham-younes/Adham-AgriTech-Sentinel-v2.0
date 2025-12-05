
const https = require('https');

const API_KEY = 'AIzaSyAfLVKtZFOIuyPuLztWL_cUMqBqzBugohE';
const BASE_URL = 'generativelanguage.googleapis.com';

function makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: BASE_URL,
            path: `${path}?key=${API_KEY}`,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', e => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function analyzeKey() {
    console.log("🔍 Analyzing API Key: " + API_KEY.substring(0, 10) + "...");

    // 1. List Models
    console.log("\n1️⃣  Checking Available Models...");
    try {
        const modelsRes = await makeRequest('/v1beta/models');

        if (modelsRes.status === 200 && modelsRes.data.models) {
            console.log("✅ Key is VALID.");
            console.log(`ℹ️  Found ${modelsRes.data.models.length} accessible models.`);

            const geminiModels = modelsRes.data.models.filter(m => m.name.includes('gemini'));
            console.log("   Gemini Models Available:");
            geminiModels.forEach(m => console.log(`   - ${m.name} (${m.version}) - ${m.displayName}`));

            // 2. Test Generation with Gemini 2.0 Flash (found in list)
            const testModel = 'gemini-2.0-flash-exp';
            console.log(`\n2️⃣  Testing Generation with ${testModel}...`);

            const genRes = await makeRequest(
                `/v1beta/models/${testModel}:generateContent`,
                'POST',
                { contents: [{ parts: [{ text: "Hello, what model are you?" }] }] }
            );

            if (genRes.status === 200) {
                console.log("✅ Generation SUCCESS.");
                const reply = genRes.data.candidates?.[0]?.content?.parts?.[0]?.text;
                console.log("   Response:", reply ? reply.trim() : "No text returned");
            } else {
                console.log("❌ Generation FAILED.");
                console.log("   Error:", JSON.stringify(genRes.data, null, 2));
            }

        } else {
            console.log("❌ Key appears INVALID or has restricted access.");
            console.log("   Status:", modelsRes.status);
            console.log("   Response:", JSON.stringify(modelsRes.data, null, 2));
        }

    } catch (error) {
        console.error("❌ Error during analysis:", error);
    }
}

analyzeKey();
