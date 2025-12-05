import { API_KEYS } from './api-keys';

type Provider = 'GROQ' | 'GEMINI' | 'ANTHROPIC' | 'OPENAI' | 'OPENROUTER' | 'HUGGINGFACE' | 'CEREBRAS';

interface KeyStats {
    usageCount: number;
    lastUsed: number;
    rpm: number; // Requests per minute
}

class KeyManager {
    private keyPools: Record<Provider, string[]>;
    private keyStats: Map<string, KeyStats>;
    private failedKeys: Record<Provider, Set<string>>;

    // Rate Limits (Requests Per Minute per Key)
    private readonly RATE_LIMITS: Record<Provider, number> = {
        GROQ: 30,
        GEMINI: 60,
        ANTHROPIC: 5,
        OPENAI: 3,
        OPENROUTER: 50,
        HUGGINGFACE: 100,
        CEREBRAS: 60
    };

    constructor() {
        // @ts-ignore
        this.keyPools = { ...API_KEYS };
        this.keyStats = new Map();
        this.failedKeys = {
            GROQ: new Set(),
            GEMINI: new Set(),
            ANTHROPIC: new Set(),
            OPENAI: new Set(),
            OPENROUTER: new Set(),
            HUGGINGFACE: new Set(),
            CEREBRAS: new Set()
        };

        // Initialize stats
        Object.values(this.keyPools).flat().forEach(key => {
            this.keyStats.set(key, { usageCount: 0, lastUsed: 0, rpm: 0 });
        });
    }

    public getBestKey(provider: Provider): string | null {
        const pool = this.keyPools[provider];
        if (!pool || pool.length === 0) return null;

        const now = Date.now();
        const limit = this.RATE_LIMITS[provider];

        // Filter out failed keys and rate-limited keys
        const validKeys = pool.filter(key => {
            if (this.failedKeys[provider].has(key)) return false;

            const stats = this.keyStats.get(key)!;
            // Reset RPM if minute has passed
            if (now - stats.lastUsed > 60000) {
                stats.rpm = 0;
                stats.lastUsed = now; // Update timestamp roughly
            }
            return stats.rpm < limit;
        });

        if (validKeys.length === 0) {
            console.warn(`All keys for ${provider} are busy or failed.`);
            return null;
        }

        // Round-robin or least used? Let's pick the one with lowest RPM
        validKeys.sort((a, b) => this.keyStats.get(a)!.rpm - this.keyStats.get(b)!.rpm);

        const selectedKey = validKeys[0];
        this.trackUsage(selectedKey);
        return selectedKey;
    }

    private trackUsage(key: string) {
        const stats = this.keyStats.get(key)!;
        stats.usageCount++;
        stats.rpm++;
        stats.lastUsed = Date.now();
    }

    public reportFailure(provider: Provider, key: string) {
        console.warn(`Reporting failure for ${provider} key: ${key.substring(0, 8)}...`);
        this.failedKeys[provider].add(key);
    }
}

export const keyManager = new KeyManager();
