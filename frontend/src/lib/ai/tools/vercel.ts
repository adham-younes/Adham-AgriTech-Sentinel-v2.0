import { logger } from "@/lib/utils/logger";

const VERCEL_API_BASE = "https://api.vercel.com/v13";

/**
 * Triggers a redeployment of the project on Vercel.
 */
export async function redeployProject(projectId: string = "adham-agritech-529b0"): Promise<boolean> {
    const token = process.env.VERCEL_TOKEN;

    if (!token) {
        logger.warn("[Vercel Tool] No VERCEL_TOKEN found. Skipping redeploy.");
        return false;
    }

    try {
        const response = await fetch(`${VERCEL_API_BASE}/deployments`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: "adham-agritech-sentinel-v2",
                project: projectId,
                target: "production", // or 'preview'
                gitSource: {
                    type: "github",
                    repo: "adham-younes/Adham-AgriTech-Sentinel-v2.0",
                    ref: "main"
                }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            logger.error(`[Vercel Tool] Redeploy failed: ${error}`);
            return false;
        }

        const data = await response.json();
        logger.info(`[Vercel Tool] Redeployment triggered. ID: ${data.id}`);
        return true;

    } catch (error) {
        logger.error("[Vercel Tool] Redeploy error", error);
        return false;
    }
}
