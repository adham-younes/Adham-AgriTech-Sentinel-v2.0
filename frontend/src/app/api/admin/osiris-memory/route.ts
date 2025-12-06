import { NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";

// 🚀 God Mode API: Visualizing the Mind of OSIRIS

const bigquery = new BigQuery({
    projectId: process.env.GCP_PROJECT_ID || 'adham-agritech-sentinel',
    credentials: {
        client_email: process.env.GCP_CLIENT_EMAIL,
        private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
});

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit') || '50';

        // Query OSIRIS Memory (Vector Store + Logs)
        const query = `
            SELECT 
                created_at,
                id,
                doc_type,
                LEFT(content, 200) as content_preview,
                content as full_content
            FROM \`adham-agritech-sentinel.agri_sovereign_data.osiris_memory\`
            ORDER BY created_at DESC
            LIMIT @limit
        `;

        const options = {
            query: query,
            params: { limit: parseInt(limit) },
            location: 'us-central1',
        };

        const [rows] = await bigquery.query(options);

        // Also fetch system status from Cloud Scheduler via heartbeat simulation
        // (In a real scenario, we'd query Cloud Monitoring, but for now we return memory)

        return NextResponse.json({
            status: "Divine Interface Active",
            memory_count: rows.length,
            memories: rows,
        });

    } catch (error) {
        console.error("OSIRIS God Mode Error:", error);
        return NextResponse.json(
            { error: "Failed to access Divine Memory", details: String(error) },
            { status: 500 }
        );
    }
}
