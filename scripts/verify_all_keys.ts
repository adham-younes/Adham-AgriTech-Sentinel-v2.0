import { Groq } from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Embedded keys to avoid import resolution issues in standalone script
const API_KEYS = {
    GROQ: [
        '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',
        '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',
        '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',
        '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',
        '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',
        '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',
        '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',
        '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',
        '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',
        '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'
    ],
    GEMINI: [
        'AIzaSyA2m_SH3kGNuJmbmx4CCdCSO8len8TY0pQ',
        'AIzaSyCDa_ZWr7i05O7Cs4B1bb4mXmMZ1CQkIhk'
    ],
    ANTHROPIC: [
        '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'
    ],
    OPENAI: [
        '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',
        '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'
    ],
    OPENROUTER: [
        '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',
        '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'
    ],
    HUGGINGFACE: [
        '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',
        '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'
    ],
    CEREBRAS: [
        'csk-f63kp9h9fcr4m22hemx9dtr5eyfh4f5xm8w8m9fkcr8mh4n5',
        'csk-d2hrpjmdfk4kkhh3yc4kyp58c3khptvmcm9d5c4k382mv2h8'
    ]
};

async function verifyGroq(key: string, index: number) {
    const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];
    const model = models[index % models.length];
    try {
        const start = Date.now();
        const groq = new Groq({ apiKey: key });
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: 'Ping' }],
            model: model,
        });
        const duration = Date.now() - start;
        return { status: '✅ OK', latency: `${duration}ms`, model: model, response: completion.choices[0]?.message?.content?.substring(0, 20) };
    } catch (e: any) {
        return { status: '❌ FAILED', error: e.message };
    }
}

async function verifyGemini(key: string) {
    try {
        const start = Date.now();
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-001' });
        const result = await model.generateContent('Ping');
        const response = await result.response;
        const duration = Date.now() - start;
        return { status: '✅ OK', latency: `${duration}ms`, model: 'gemini-1.5-flash-001', response: response.text().substring(0, 20) };
    } catch (e: any) {
        return { status: '❌ FAILED', error: e.message };
    }
}

async function verifyOpenRouter(key: string) {
    try {
        const start = Date.now();
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://test.com',
                'X-Title': 'Test Script'
            },
            body: JSON.stringify({
                model: 'anthropic/claude-3-haiku', // Cheap model for testing
                messages: [{ role: 'user', content: 'Ping' }]
            })
        });
        const duration = Date.now() - start;
        if (response.ok) {
            return { status: '✅ OK', latency: `${duration}ms`, model: 'claude-3-haiku' };
        } else {
            const err = await response.text();
            return { status: '❌ FAILED', error: `${response.status} ${err.substring(0, 50)}` };
        }
    } catch (e: any) {
        return { status: '❌ FAILED', error: e.message };
    }
}

async function verifyHuggingFace(key: string) {
    try {
        const start = Date.now();
        const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${key}` },
            body: JSON.stringify({ inputs: 'Ping' })
        });
        const duration = Date.now() - start;
        if (response.ok) {
            return { status: '✅ OK', latency: `${duration}ms`, model: 'gpt2' };
        } else {
            return { status: '❌ FAILED', error: `${response.status} ${response.statusText}` };
        }
    } catch (e: any) {
        return { status: '❌ FAILED', error: e.message };
    }
}

async function verifyCerebras(key: string) {
    try {
        const start = Date.now();
        // Cerebras uses OpenAI-compatible API
        const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama3.1-8b',
                messages: [{ role: 'user', content: 'Ping' }],
                max_tokens: 10
            })
        });
        const duration = Date.now() - start;
        if (response.ok) {
            return { status: '✅ OK', latency: `${duration}ms`, model: 'llama3.1-8b' };
        } else {
            const err = await response.text();
            return { status: '❌ FAILED', error: `${response.status} ${err.substring(0, 50)}` };
        }
    } catch (e: any) {
        return { status: '❌ FAILED', error: e.message };
    }
}

async function main() {
    console.log('🚀 Starting Expanded Hydra Verification...\n');

    console.log('🧠 Groq:');
    console.table(await Promise.all(API_KEYS.GROQ.map((k, i) => verifyGroq(k, i).then(r => ({ Key: `...${k.slice(-6)}`, ...r })))));

    console.log('\n👁️ Gemini:');
    console.table(await Promise.all(API_KEYS.GEMINI.map(k => verifyGemini(k).then(r => ({ Key: `...${k.slice(-6)}`, ...r })))));

    console.log('\n🌐 OpenRouter:');
    console.table(await Promise.all(API_KEYS.OPENROUTER.map(k => verifyOpenRouter(k).then(r => ({ Key: `...${k.slice(-6)}`, ...r })))));

    console.log('\n� HuggingFace:');
    console.table(await Promise.all(API_KEYS.HUGGINGFACE.map(k => verifyHuggingFace(k).then(r => ({ Key: `...${k.slice(-6)}`, ...r })))));

    console.log('\n⚡ Cerebras:');
    console.table(await Promise.all(API_KEYS.CEREBRAS.map(k => verifyCerebras(k).then(r => ({ Key: `...${k.slice(-6)}`, ...r })))));
}

main().catch(console.error);
