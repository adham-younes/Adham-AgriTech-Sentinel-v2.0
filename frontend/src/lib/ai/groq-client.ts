const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
import { Groq } from 'groq-sdk';
import { keyManager } from './key-manager';
const MODEL = 'llama-3.3-70b-versatile';

export interface GroqMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface GroqResponse {
    choices: {
        message: {
            content: string;
        };
    }[];
}

export async function generateText(prompt: string, systemPrompt?: string): Promise<string> {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        const apiKey = keyManager.getBestKey('GROQ');
        if (!apiKey) throw new Error('No Groq keys available (Rate Limited or Exhausted).');

        try {
            const groq = new Groq({
                apiKey: apiKey,
                dangerouslyAllowBrowser: true // Note: In production, move to server-side
            });

            const completion = await groq.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt || 'You are a helpful AI assistant.' },
                    { role: 'user', content: prompt }
                ],
                model: MODEL,
                temperature: 0.5,
                max_tokens: 4096,
            });

            return completion.choices[0]?.message?.content || '';
        } catch (error: any) {
            console.error(`Groq API Error (Attempt ${attempts + 1}):`, error.message);

            // If it's a rate limit or auth error, report it and retry
            if (error.status === 429 || error.status === 401) {
                keyManager.reportFailure('GROQ', apiKey);
                attempts++;
                continue;
            }

            throw error; // Throw other errors immediately
        }
    }

    throw new Error('Failed to generate text after multiple attempts with different keys.');
}
