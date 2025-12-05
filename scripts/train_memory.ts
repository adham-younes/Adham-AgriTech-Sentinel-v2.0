import * as fs from 'fs';
import * as path from 'path';
import { memoryManager } from '../frontend/src/lib/ai/memory-manager';

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..');
const IGNORE_DIRS = ['node_modules', '.git', '.next', 'dist', 'build', 'coverage', '.gemini'];
const INCLUDE_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.sql', '.md', '.css'];

async function getFiles(dir: string): Promise<string[]> {
    const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
        const res = path.resolve(dir, dirent.name);
        if (dirent.isDirectory()) {
            if (IGNORE_DIRS.includes(dirent.name)) return [];
            return getFiles(res);
        } else {
            const ext = path.extname(res);
            if (INCLUDE_EXTS.includes(ext)) return [res];
            return [];
        }
    }));
    return Array.prototype.concat(...files);
}

async function trainMemory() {
    console.log('🧠 Starting Sovereign Memory Training...');

    const files = await getFiles(ROOT_DIR);
    console.log(`📂 Found ${files.length} files to index.`);

    let processed = 0;

    for (const file of files) {
        try {
            const content = await fs.promises.readFile(file, 'utf-8');
            const relativePath = path.relative(ROOT_DIR, file);

            // Simple chunking strategy: Split by functions or just size
            // For now, let's just take the whole file if it's small, or chunks of 1000 chars
            // Better: Chunk by lines to keep context

            const lines = content.split('\n');
            const CHUNK_SIZE = 50; // lines

            for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
                const chunk = lines.slice(i, i + CHUNK_SIZE).join('\n');
                if (chunk.trim().length < 50) continue; // Skip tiny chunks

                await memoryManager.store(relativePath, chunk);
            }

            processed++;
            if (processed % 10 === 0) {
                process.stdout.write(`\r✅ Indexed ${processed}/${files.length} files...`);
            }
        } catch (e) {
            console.error(`\n❌ Error processing ${file}:`, e);
        }
    }

    console.log('\n🎉 Memory Training Complete!');
}

trainMemory().catch(console.error);
