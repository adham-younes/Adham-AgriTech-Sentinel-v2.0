import { GoogleGenerativeAI } from '@google/generative-ai';
import { keyManager } from './key-manager';

const MODEL_NAME = 'gemini-1.5-flash'; // Reverting to generic alias which often works better model as requested

export async function analyzeImage(imageUrl: string, prompt: string): Promise<string> {
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
        const apiKey = keyManager.getBestKey('GEMINI');
        if (!apiKey) throw new Error('No Gemini keys available.');

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: MODEL_NAME });

            // Fetch the image and convert to base64
            const imageResp = await fetch(imageUrl);
            if (!imageResp.ok) throw new Error(`Failed to fetch image: ${imageUrl}`);
            const imageBuffer = await imageResp.arrayBuffer();
            const base64Image = Buffer.from(imageBuffer).toString('base64');

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64Image,
                        mimeType: imageResp.headers.get('content-type') || 'image/jpeg',
                    },
                },
            ]);

            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.error(`Gemini Vision Error (Attempt ${attempts + 1}):`, error.message);

            if (error.message?.includes('429') || error.message?.includes('401')) {
                keyManager.reportFailure('GEMINI', apiKey);
                attempts++;
                continue;
            }

            throw error;
        }
    }

    throw new Error('Failed to analyze image with Gemini.');
}
