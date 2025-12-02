import { VertexAI } from '@google-cloud/aiplatform';

// Vertex AI Configuration
const PROJECT_ID = 'adham-agritech-529b0';
const LOCATION = 'us-central1'; // or your preferred region

// Initialize Vertex AI client
export function getVertexAIClient() {
    // For local development, use the credentials file
    if (process.env.NODE_ENV === 'development') {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = require('path').resolve(__dirname, '../../../vertex-ai-credentials.json');
    }

    // For production (Vercel), parse credentials from environment variable
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const authOptions = credentialsJson ? { credentials: JSON.parse(credentialsJson) } : undefined;

    return new VertexAI({
        project: PROJECT_ID,
        location: LOCATION,
        googleAuthOptions: authOptions,
    });
}

// Gemini Pro model configuration
export const GEMINI_MODEL = 'gemini-2.0-flash-exp';

export async function generateWithVertex(prompt: string, options?: {
    temperature?: number;
    maxTokens?: number;
}) {
    const vertexAI = getVertexAIClient();

    const generativeModel = vertexAI.preview.getGenerativeModel({
        model: GEMINI_MODEL,
        generationConfig: {
            maxOutputTokens: options?.maxTokens || 8192,
            temperature: options?.temperature || 0.7,
        },
    });

    const result = await generativeModel.generateContent(prompt);
    const response = await result.response;
    return response.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
