
import { GoogleAuth } from 'google-auth-library';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.divine') });

async function listAllModels() {
    const projectId = 'adham-agritech-sentinel';
    const location = 'us-central1';
    const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    console.log('🔍 Authenticating and fetching model list...');

    if (!keyFile) {
        console.error('❌ GOOGLE_APPLICATION_CREDENTIALS not found in environment.');
        process.exit(1);
    }

    try {
        const auth = new GoogleAuth({
            keyFile: keyFile,
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });

        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();

        if (!accessToken.token) {
            throw new Error('Failed to generate access token');
        }

        const url = `https://${location}-aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/${location}/publishers/google/models`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken.token}`,
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${await response.text()}`);
        }

        const data = await response.json() as any;
        const models = data.models || [];

        console.log(`\n📚 Found ${models.length} models available in ${location}.`);

        console.log('\n--- 💎 Gemini Models ---');
        const geminiModels = models.filter((m: any) => m.name.toLowerCase().includes('gemini'));

        geminiModels.forEach((m: any) => {
            // The name is in format: projects/{project}/locations/{location}/publishers/google/models/{modelId}
            const modelId = m.name.split('/').pop();
            console.log(`- ${modelId}`);
        });

        console.log('\n--- 🤖 Other Models (Top 5) ---');
        const otherModels = models.filter((m: any) => !m.name.toLowerCase().includes('gemini')).slice(0, 5);
        otherModels.forEach((m: any) => {
            const modelId = m.name.split('/').pop();
            console.log(`- ${modelId}`);
        });

    } catch (error) {
        console.error('❌ Error listing models:', error);
    }
}

listAllModels();
