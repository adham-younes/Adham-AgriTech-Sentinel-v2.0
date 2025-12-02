import { aiProviderRegistry } from '@/lib/ai/provider-registry';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";

export const maxDuration = 60; // Allow longer timeout for image analysis

export async function POST(req: Request) {
    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json(
                { error: 'Image data is required' },
                { status: 400 }
            );
        }

        // Find a provider with vision capabilities
        const visionProvider = aiProviderRegistry.getAvailableProviders().find(p => p.capabilities.vision);

        if (!visionProvider) {
            return NextResponse.json(
                { error: 'No AI provider with vision capabilities is currently available.' },
                { status: 503 }
            );
        }

        const model = visionProvider.getModel();

        const systemPrompt = SYSTEM_PROMPT('en'); // Default to English for JSON structure consistency, or pass user lang if available

        const prompt = `
    ${systemPrompt}

    TASK: Analyze this image of a plant/crop.
    
    Provide the output in the following JSON format ONLY:
    {
      "diagnosis": "Name of the disease, pest, or deficiency (or 'Healthy' if no issue)",
      "confidence": "High/Medium/Low",
      "symptoms": ["List of observed symptoms"],
      "cause": "Brief explanation of the cause",
      "treatment": ["Step-by-step treatment recommendations (organic and chemical)"],
      "prevention": ["Tips to prevent future occurrence"]
    }

    If the image is not related to agriculture or plants, return:
    {
      "diagnosis": "Not a plant",
      "confidence": "High",
      "symptoms": [],
      "cause": "Image does not appear to be a plant or crop.",
      "treatment": [],
      "prevention": []
    }
    `;

        const result = await generateText({
            model: model,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image', image: image }, // Expecting base64 data URL
                    ],
                },
            ],
        });

        // Attempt to parse the JSON response
        let analysis;
        try {
            // Clean up markdown code blocks if present
            const text = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
            analysis = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse AI response:', result.text);
            analysis = {
                diagnosis: 'Error parsing analysis',
                confidence: 'Low',
                symptoms: [],
                cause: 'Raw output: ' + result.text,
                treatment: [],
                prevention: []
            };
        }

        return NextResponse.json(analysis);

    } catch (error) {
        console.error('AI Analysis Error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze image', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
