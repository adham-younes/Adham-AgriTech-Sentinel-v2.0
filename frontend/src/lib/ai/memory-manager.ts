import { pipeline } from '@xenova/transformers';
import { createClient } from '@supabase/supabase-js';

// We need Supabase credentials. 
// In a real app, use process.env.NEXT_PUBLIC_SUPABASE_URL etc.
// For this script/agent context, we might need to hardcode or read from a config if env vars aren't loaded in this context.
// I will assume they are available or I will use a placeholder that the user needs to fill if running locally.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Singleton for the extractor to avoid reloading model
let extractor: any = null;

export class MemoryManager {
    private supabase;

    constructor() {
        if (!SUPABASE_URL || !SUPABASE_KEY) {
            console.warn('⚠️ MemoryManager: Supabase credentials not found. Memory will be disabled.');
        }
        this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    }

    private async getExtractor() {
        if (!extractor) {
            // Use a smaller, faster model for local embeddings
            extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        }
        return extractor;
    }

    public async generateEmbedding(text: string): Promise<number[]> {
        const pipe = await this.getExtractor();
        const output = await pipe(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    }

    public async search(query: string, limit: number = 5): Promise<string[]> {
        if (!this.supabase) return [];

        try {
            const embedding = await this.generateEmbedding(query);

            const { data, error } = await this.supabase.rpc('match_code_embeddings', {
                query_embedding: embedding,
                match_threshold: 0.5, // Minimum similarity
                match_count: limit
            });

            if (error) {
                console.error('Memory Search Error:', error);
                return [];
            }

            return data.map((item: any) => `[File: ${item.file_path}]\n${item.content}`);
        } catch (e) {
            console.error('Memory Search Exception:', e);
            return [];
        }
    }

    public async store(filePath: string, content: string) {
        if (!this.supabase) return;

        try {
            const embedding = await this.generateEmbedding(content);

            const { error } = await this.supabase
                .from('code_embeddings')
                .upsert({
                    file_path: filePath,
                    content: content,
                    embedding: embedding
                }, { onConflict: 'file_path,content' });

            if (error) {
                console.error(`Failed to store memory for ${filePath}:`, error);
            }
        } catch (e) {
            console.error(`Exception storing memory for ${filePath}:`, e);
        }
    }
}

export const memoryManager = new MemoryManager();
