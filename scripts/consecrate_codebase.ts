import { Project, SyntaxKind } from "ts-morph";
import { createClient } from "@supabase/supabase-js";
import { pipeline } from "@xenova/transformers";
import * as dotenv from "dotenv";

dotenv.config({ path: '.env.divine' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const project = new Project({
    tsConfigFilePath: "frontend/tsconfig.json",
});

async function generateEmbedding(extractor: any, text: string) {
    const out = await extractor(text, { pooling: "mean", normalize: true });
    return Array.from(out.data);
}

async function main() {
    console.log("⚡ Starting Divine Consecration (Graph Ingestion)…");
    const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

    // Explicitly target src directory and exclude common build/generated folders
    project.addSourceFilesAtPaths([
        "frontend/src/**/*.{ts,tsx}",
        "!**/node_modules/**",
        "!**/.next/**",
        "!**/dist/**",
        "!**/build/**"
    ]);
    const sourceFiles = project.getSourceFiles();

    console.log(`📁 Found ${sourceFiles.length} source files to consecrate.`);

    for (const file of sourceFiles) {
        const filePath = file.getFilePath();
        const fileContent = file.getFullText();

        console.log(`👁️  Processing: ${filePath}`);

        const fileEmbedding = await generateEmbedding(embedder, fileContent.slice(0, 500));

        // Insert file node
        const { data: fileNode, error: fileErr } = await supabase
            .from("knowledge_nodes")
            .insert({
                name: filePath,
                type: "file",
                content: fileContent,
                embedding: fileEmbedding,
                metadata: { path: filePath },
            })
            .select("id")
            .single();

        if (fileErr) {
            console.error(`❌ File node insert error for ${filePath}:`, fileErr.message);
            continue;
        }

        // Functions inside the file
        const functions = file.getDescendantsOfKind(SyntaxKind.FunctionDeclaration);
        for (const fn of functions) {
            const fnName = fn.getName();
            if (!fnName) continue;
            const fnBody = fn.getText();
            const fnEmbedding = await generateEmbedding(embedder, fnBody);
            const { data: fnNode, error: fnErr } = await supabase
                .from("knowledge_nodes")
                .insert({
                    name: fnName,
                    type: "function",
                    content: fnBody,
                    embedding: fnEmbedding,
                    metadata: { parent_file: filePath },
                })
                .select("id")
                .single();

            if (fnErr) {
                console.error(`⚠️  Function node error for ${fnName}:`, fnErr.message);
                continue;
            }

            // Edge: function DEFINED_IN file
            await supabase.from("knowledge_edges").insert({
                source_id: fnNode.id,
                target_id: fileNode.id,
                relationship: "DEFINED_IN",
            });
        }

        // Classes inside the file
        const classes = file.getDescendantsOfKind(SyntaxKind.ClassDeclaration);
        for (const cls of classes) {
            const clsName = cls.getName();
            if (!clsName) continue;
            const clsBody = cls.getText();
            const clsEmbedding = await generateEmbedding(embedder, clsBody);
            const { data: clsNode, error: clsErr } = await supabase
                .from("knowledge_nodes")
                .insert({
                    name: clsName,
                    type: "class",
                    content: clsBody,
                    embedding: clsEmbedding,
                    metadata: { parent_file: filePath },
                })
                .select("id")
                .single();

            if (clsErr) {
                console.error(`⚠️  Class node error for ${clsName}:`, clsErr.message);
                continue;
            }

            await supabase.from("knowledge_edges").insert({
                source_id: clsNode.id,
                target_id: fileNode.id,
                relationship: "DEFINED_IN",
            });
        }

        // Imports – create IMPORTS_FROM edges between files
        const imports = file.getImportDeclarations();
        for (const imp of imports) {
            const resolved = imp.getModuleSpecifierSourceFile();
            if (!resolved) continue;
            const targetPath = resolved.getFilePath();

            // Find target file node (lightweight lookup)
            const { data: targetNode } = await supabase
                .from("knowledge_nodes")
                .select("id")
                .eq("name", targetPath)
                .eq("type", "file")
                .single();

            if (!targetNode) continue;

            await supabase.from("knowledge_edges").insert({
                source_id: fileNode.id,
                target_id: targetNode.id,
                relationship: "IMPORTS_FROM",
            });
        }
    }

    console.log("✅ Divine Consecration completed. The Knowledge Graph is alive.");
}

main().catch((e) => console.error("💥 Consecration failed:", e));
