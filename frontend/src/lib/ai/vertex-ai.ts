import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';

// Gemini 3 Pro - Latest Model (November 2025)
// Best for: Advanced reasoning, 1M token context, multimodal, agentic
export const GEMINI_MODEL = 'gemini-3-pro-preview-11-2025';

// Initialize Vertex AI with fail-safe logic
const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.NEXT_PUBLIC_GOOGLE_PROJECT_ID || 'adham-agritech-529b0';
const location = process.env.VERTEX_AI_LOCATION || 'us-central1';

let vertexClient: VertexAI | null = null;

export function getVertexAIClient() {
    if (!vertexClient) {
        try {
            // Ensure we only run this on the server-side to avoid browser leaks
            if (typeof window === 'undefined') {
                vertexClient = new VertexAI({ project, location });
                console.log(`[Vertex AI] Client Initialized (Project: ${project}, Location: ${location})`);
            }
        } catch (error) {
            console.error('[Vertex AI] Failed to initialize:', error);
        }
    }
    return vertexClient;
}

// Backward compatibility
export const getVertexClient = getVertexAIClient;

export async function getModel(modelName: string = GEMINI_MODEL) {
    const client = getVertexAIClient();
    if (!client) throw new Error("Vertex AI Client not available.");

    return client.getGenerativeModel({
        model: modelName,
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ],
        generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.4,
            topP: 0.95,
            topK: 40,
        },
    });
}

