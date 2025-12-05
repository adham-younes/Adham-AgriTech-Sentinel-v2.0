import { VertexAI } from '@google-cloud/vertexai';

// Initialize Vertex AI with fail-safe logic
const project = process.env.NEXT_PUBLIC_GOOGLE_PROJECT_ID || 'adham-agritech-529b0';
const location = 'us-central1';

let vertexClient: VertexAI | null = null;

export function getVertexClient() {
    if (!vertexClient) {
        try {
            // Ensure we only run this on the server-side to avoid browser leaks
            if (typeof window === 'undefined') {
                vertexClient = new VertexAI({ project: project, location: location });
                console.log('[System] Vertex AI Client Initialized Successfully.');
            }
        } catch (error) {
            console.error('[System] Failed to initialize Vertex AI:', error);
            // Fallback logic is handled by the AI Registry, do not crash.
        }
    }
    return vertexClient;
}

export async function getModel(modelName: string = 'gemini-1.5-pro-preview-0409') {
    const client = getVertexClient();
    if (!client) throw new Error("Vertex AI Client not available.");

    return client.getGenerativeModel({
        model: modelName,
        safetySettings: [{ category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }],
        generationConfig: { maxOutputTokens: 2048, temperature: 0.4 },
    });
}
