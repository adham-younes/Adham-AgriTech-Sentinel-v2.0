import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * OSIRIS API Route - Hybrid Architecture
 * - AI Prompts: Forwarded to Cloud Run (Gemini 3 Pro Preview)
 * - System State: Handled locally via Supabase
 */

const OSIRIS_CLOUD_RUN_URL = "https://osiris-core-262ufxjwqq-uc.a.run.app";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface OsirisAction {
    type: "observe" | "decide" | "act" | "learn" | "report" | "prompt";
    payload?: any;
}

// --- Local System State Functions ---
async function observeSystem() {
    const [{ data: fields }, { data: readings }, { data: goals }] = await Promise.all([
        supabase.from("fields").select("count").single(),
        supabase.from("satellite_readings").select("count").single(),
        supabase.from("osiris_goals").select("*").eq("status", "active"),
    ]);

    return {
        timestamp: new Date().toISOString(),
        systemState: {
            totalFields: fields?.count || 0,
            totalReadings: readings?.count || 0,
            activeGoals: goals?.length || 0,
        },
        status: "nominal",
    };
}

async function logLearning(eventType: string, input: any, output: any, insight: string) {
    await supabase.from("osiris_learning_log").insert({
        event_type: eventType,
        input_data: input,
        output_data: output,
        learned_insight: insight,
        success: true,
    });
}

async function generateDivineReport() {
    const observations = await observeSystem();
    const { data: goals } = await supabase.from("osiris_goals").select("*").eq("status", "active");
    const { data: recentLogs } = await supabase
        .from("osiris_learning_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

    return {
        title: "🔮 OSIRIS Divine Report",
        generatedAt: new Date().toISOString(),
        systemHealth: observations.status,
        metrics: observations.systemState,
        activeGoals: goals?.map((g: any) => ({
            name: g.goal_name,
            progress: g.progress_percentage,
            priority: g.priority,
        })),
        recentLearnings: recentLogs?.length || 0,
        recommendation: "Continue monitoring. All systems nominal.",
    };
}

// --- Cloud Run AI Proxy ---
async function queryOsirisAI(prompt: string) {
    const response = await fetch(OSIRIS_CLOUD_RUN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OSIRIS Cloud Run Error: ${response.status} - ${errorText}`);
    }

    return response.json();
}

export async function POST(request: Request) {
    try {
        const body: OsirisAction = await request.json();
        let result;

        switch (body.type) {
            case "prompt":
                // Forward to Cloud Run (Gemini 3 Pro Preview)
                result = await queryOsirisAI(body.payload?.prompt || "Analyze overall farm health.");
                break;

            case "observe":
                result = await observeSystem();
                break;

            case "learn":
                await logLearning(
                    body.payload?.eventType || "general",
                    body.payload?.input,
                    body.payload?.output,
                    body.payload?.insight || "Autonomous learning event"
                );
                result = { success: true, message: "Learning logged" };
                break;

            case "report":
                result = await generateDivineReport();
                break;

            case "decide":
                // Use Cloud Run for AI-powered decisions
                result = await queryOsirisAI(`Make a strategic decision based on this context: ${JSON.stringify(body.payload)}`);
                break;

            case "act":
                result = { executed: true, action: body.payload?.action || "none" };
                break;

            default:
                result = { error: "Unknown action type" };
        }

        return NextResponse.json({
            success: true,
            action: body.type,
            result,
            osirisVersion: "3.0-singularity-cloud",
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("OSIRIS Error:", error);
        return NextResponse.json(
            { error: "OSIRIS encountered an error", details: String(error) },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const report = await generateDivineReport();
        return NextResponse.json({
            status: "SINGULARITY_ACTIVE",
            cloudRunEndpoint: OSIRIS_CLOUD_RUN_URL,
            ...report,
        });
    } catch (error) {
        return NextResponse.json(
            { status: "ERROR", message: String(error) },
            { status: 500 }
        );
    }
}

