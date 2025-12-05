
import { VertexAI } from '@google-cloud/vertexai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.divine
dotenv.config({ path: path.resolve(process.cwd(), '.env.divine') });

async function listModels() {
    console.log('🔍 Listing Vertex AI Models...');

    const projectId = 'adham-agritech-sentinel';
    const location = 'us-central1';

    try {
        const vertexAI = new VertexAI({
            project: projectId,
            location: location,
        });

        // There isn't a direct "listModels" method in the high-level GenerativeModel SDK easily accessible 
        // without using the lower-level ModelServiceClient. 
        // However, we can try to instantiate a few common ones and see if they throw immediately, 
        // OR we can just try to use the 'gemini-1.0-pro' which is often the fallback.

        // Let's try a different approach: using the REST API via fetch to list models if the SDK doesn't expose it easily.
        // Actually, let's just try to hit the 'gemini-1.0-pro' as a fallback test in this script.

        const modelsToTest = [
            'gemini-1.5-pro-001',
            'gemini-1.5-pro-preview-0409',
            'gemini-1.0-pro-001',
            'gemini-1.0-pro',
            'gemini-pro'
        ];

        for (const modelName of modelsToTest) {
            console.log(`\n🧪 Testing model: ${modelName}`);
            try {
                const model = vertexAI.getGenerativeModel({ model: modelName });
                const resp = await model.generateContent('Test');
                console.log(`✅ Model ${modelName} is AVAILABLE!`);
                console.log('Response:', await resp.response);
                return; // Found one!
            } catch (e: any) {
                console.log(`❌ Model ${modelName} failed: ${e.message.split('\n')[0]}`);
            }
        }

        console.log('\n❌ All common models failed.');

    } catch (error) {
        console.error('❌ Error initializing Vertex AI:', error);
    }
}

listModels();
