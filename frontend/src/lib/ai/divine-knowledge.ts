import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { pipeline } from "@xenova/transformers";

export class DivineKnowledge {
    private supabase: SupabaseClient;
    private embedder: any;

    constructor() {
        this.supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }

    async init() {
        this.embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    }

    private async embed(text: string) {
        const out = await this.embedder(text, { pooling: "mean", normalize: true });
        return Array.from(out.data);
    }

    /** Perform a graph‑based retrieval for a natural‑language query. */
    async omniscientSearch(query: string) {
        const queryEmbedding = await this.embed(query);
        console.log("DEBUG: Query Embedding Length:", queryEmbedding.length);
        console.log("DEBUG: Query Embedding Sample:", queryEmbedding.slice(0, 5));
        const { data: entryNodes, error } = await this.supabase.rpc("match_knowledge_nodes", {
            query_embedding: queryEmbedding,
            match_threshold: -1.0,
        });
        if (error) {
            console.error("RPC Error:", error);
            return "Error consulting the Divine Knowledge.";
        }
        if (!entryNodes?.length) return "No knowledge found.";

        let result = "";
        for (const node of entryNodes) {
            result += `Node [${node.type}] ${node.name}\n${node.content?.slice(0, 200)}…\n`;
            const { data: edges } = await this.supabase
                .from("knowledge_edges")
                .select("relationship, target:knowledge_nodes!target_id(name,type,content)")
                .eq("source_id", node.id);
            if (edges?.length) {
                result += "Related:\n";
                for (const e of edges) {
                    const target = Array.isArray(e.target) ? e.target[0] : e.target;
                    result += `  - ${e.relationship} → ${target.name} (${target.type})\n`;
                }
            }
            result += "\n---\n";
        }
        return result;
    }
}
