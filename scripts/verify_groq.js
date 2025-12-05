
const https = require('https');

const API_KEY = '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';

function verifyGroq() {
    console.log("🚀 Verifying Groq API Key...");

    const data = JSON.stringify({
        messages: [
            {
                role: "user",
                content: "Hello! Are you working?"
            }
        ],
        model: "llama-3.3-70b-versatile"
    });

    const options = {
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = https.request(options, (res) => {
        let responseBody = '';

        res.on('data', (chunk) => {
            responseBody += chunk;
        });

        res.on('end', () => {
            if (res.statusCode === 200) {
                try {
                    const parsed = JSON.parse(responseBody);
                    const reply = parsed.choices[0].message.content;
                    console.log("✅ Groq Verification SUCCESS!");
                    console.log("🤖 Response:", reply);
                } catch (e) {
                    console.error("❌ Failed to parse response:", e);
                }
            } else {
                console.error(`❌ Verification FAILED. Status: ${res.statusCode}`);
                console.error("Response:", responseBody);
            }
        });
    });

    req.on('error', (error) => {
        console.error("❌ Connection Error:", error);
    });

    req.write(data);
    req.end();
}

verifyGroq();
