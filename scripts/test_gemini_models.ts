import { GoogleGenerativeAI } from '@google/generative-ai';

const KEY = 'AIzaSyA2m_SH3kGNuJmbmx4CCdCSO8len8TY0pQ';

async function listModels() {
    const genAI = new GoogleGenerativeAI(KEY);
    try {
        // Note: listModels might be on the client or admin API, but let's try to infer or just test standard names
        // The SDK doesn't always expose listModels directly on the instance easily without admin setup in some versions.
        // Instead, let's just test a few known model names.
        const candidates = ['gemini-1.5-pro', 'gemini-1.5-pro-latest', 'gemini-1.5-flash', 'gemini-pro'];

        console.log('Testing Gemini Models...');
        for (const modelName of candidates) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent('Ping');
                const response = await result.response;
                console.log(`✅ ${modelName}: Working`);
            } catch (e: any) {
                console.log(`❌ ${modelName}: Failed (${e.message.substring(0, 50)}...)`);
            }
        }

    } catch (e: any) {
        console.error('Fatal Error:', e.message);
    }
}

listModels();
