
const https = require('https');

const API_KEY = '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';

function listGroqModels() {
    console.log("🔍 Fetching available Groq models...");

    const options = {
        hostname: 'api.groq.com',
        path: '/openai/v1/models',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                if (parsed.data) {
                    console.log(`✅ Found ${parsed.data.length} models:\n`);
                    parsed.data.forEach(model => {
                        console.log(`- ID: ${model.id}`);
                        console.log(`  Owner: ${model.owned_by}`);
                        console.log(`  Context Window: ${model.context_window || 'Unknown'}`);
                        console.log('---');
                    });
                } else {
                    console.log("❌ No models found in response:", parsed);
                }
            } catch (e) {
                console.error("❌ Failed to parse response:", e);
            }
        });
    });

    req.on('error', e => console.error("❌ Connection Error:", e));
    req.end();
}

listGroqModels();
