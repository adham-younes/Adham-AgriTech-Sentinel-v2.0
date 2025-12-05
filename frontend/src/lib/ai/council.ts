import { keyManager } from './key-manager';
import { Groq } from 'groq-sdk';

// We will use a simple fetch for OpenAI to avoid conflicts/deps for now, or just use the SDK if installed.
// Since we installed 'openai' (or not? we installed groq-sdk and google-generative-ai).
// Let's use fetch for OpenAI to keep it lightweight as requested in previous steps.

interface CouncilResponse {
    consensus: string;
    votes: {
        groq: string;
        openai: string;
        cerebras?: string;
        // anthropic: string; // Disabled for now
    };
    meta: {
        duration: number;
        models_used: string[];
    };
}

export class CouncilOfMinds {

    async consult(prompt: string, systemPrompt: string = 'You are a helpful AI.'): Promise<CouncilResponse> {
        const start = Date.now();

        // 1. Launch Parallel Requests
        // We try to get Groq (Speed), OpenRouter (Intelligence), and maybe Cerebras (Speed Backup).

        const groqPromise = this.callGroq(prompt, systemPrompt);
        const openRouterPromise = this.callOpenRouter(prompt, systemPrompt);
        const cerebrasPromise = this.callCerebras(prompt, systemPrompt);

        // Wait for all
        const [groqResult, openRouterResult, cerebrasResult] = await Promise.allSettled([groqPromise, openRouterPromise, cerebrasPromise]);

        const groqContent = groqResult.status === 'fulfilled' ? groqResult.value : '';
        const openRouterContent = openRouterResult.status === 'fulfilled' ? openRouterResult.value : '';
        const cerebrasContent = cerebrasResult.status === 'fulfilled' ? cerebrasResult.value : '';

        // 2. Synthesize / Consensus
        // "God Mode" Synthesis:
        // We prioritize OpenRouter (Claude) for depth, Groq (Llama 3) for structure, Cerebras for backup.

        let consensus = openRouterContent || groqContent || cerebrasContent;

        if (openRouterContent && groqContent) {
            // If we have both, we present the "Sovereign Decision" (OpenRouter) backed by "Speed Analysis" (Groq)
            consensus = `**Sovereign Decision (Claude 3.5):**\n${openRouterContent}\n\n---\n**Tactical Analysis (Llama 3.3):**\n${groqContent}`;
        }

        return {
            consensus,
            votes: {
                groq: groqContent,
                openai: openRouterContent, // Advisor
                cerebras: cerebrasContent // Backup
            },
            meta: {
                duration: Date.now() - start,
                models_used: ['llama-3.3-70b', 'claude-3.5-sonnet', 'llama-3.1-8b']
            }
        };
    }

    private async callGroq(prompt: string, systemPrompt: string): Promise<string> {
        const key = keyManager.getBestKey('GROQ');
        if (!key) throw new Error('No Groq keys available');

        const groq = new Groq({ apiKey: key, dangerouslyAllowBrowser: true });
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.3-70b-versatile',
        });
        return completion.choices[0]?.message?.content || '';
    }

    private async callOpenRouter(prompt: string, systemPrompt: string): Promise<string> {
        const key = keyManager.getBestKey('OPENROUTER');
        if (!key) return '';

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://adham-agritech.com',
                    'X-Title': 'Adham AgriTech Sovereign Agent'
                },
                body: JSON.stringify({
                    model: 'anthropic/claude-3.5-sonnet',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt }
                    ]
                })
            });
            if (!response.ok) return '';
            const data = await response.json();
            return data.choices[0]?.message?.content || '';
        } catch (e) {
            return '';
        }
    }

    private async callCerebras(prompt: string, systemPrompt: string): Promise<string> {
        const key = keyManager.getBestKey('CEREBRAS');
        if (!key) return '';

        try {
            const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama3.1-8b',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 1024
                })
            });
            if (!response.ok) return '';
            const data = await response.json();
            return data.choices[0]?.message?.content || '';
        } catch (e) {
            return '';
        }
    }
}

export const council = new CouncilOfMinds();
