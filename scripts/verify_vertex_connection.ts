
import { VertexAI } from '@google-cloud/vertexai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.divine
dotenv.config({ path: path.resolve(process.cwd(), '.env.divine') });

async function verifyVertexConnection() {
    console.log('🔮 Verifying Vertex AI Connection...');

    const projectId = 'adham-agritech-sentinel';
    const location = 'us-central1'; // Or your project's location
    const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!keyFile) {
        console.error('❌ GOOGLE_APPLICATION_CREDENTIALS not found in environment.');
        process.exit(1);
    }

    console.log(`🔑 Using Key File: ${keyFile}`);

    try {
        const vertexAI = new VertexAI({
            project: projectId,
            location: location,
        });

        const model = 'gemini-1.5-pro-preview-0409'; // Specific preview version
        const generativeModel = vertexAI.getGenerativeModel({ model: model });

        const prompt = 'Hello, Divine One. Are you operational?';
        console.log(`🗣️ Sending prompt: "${prompt}"`);

        const resp = await generativeModel.generateContent(prompt);
        const contentResponse = await resp.response;

        console.log('✅ Vertex AI Response Received:');
        console.log(JSON.stringify(contentResponse, null, 2));
        console.log('✨ Connection Verified Successfully!');

    } catch (error) {
        console.error('❌ Error connecting to Vertex AI:', error);
        process.exit(1);
    }
}

verifyVertexConnection();
