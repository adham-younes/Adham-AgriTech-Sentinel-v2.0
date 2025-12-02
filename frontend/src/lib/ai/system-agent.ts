import { getVertexAIClient, GEMINI_MODEL } from './vertex-ai';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase Admin Client (Service Role)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class SystemAgent {
    private vertexClient;
    private runId: string;

    constructor() {
        this.vertexClient = getVertexAIClient();
        this.runId = uuidv4();
    }

    /**
     * The main brain loop.
     * 1. Fetches active rules.
     * 2. Checks system state (mocked for now, can connect to Vercel API).
     * 3. Decides on actions.
     */
    async runMaintenanceCycle() {
        await this.log('check', 'Starting maintenance cycle');

        try {
            // 1. Fetch Rules
            const { data: rules } = await supabase
                .from('system_rules')
                .select('*')
                .eq('is_active', true);

            const rulesContext = rules?.map(r => `- [${r.category}] ${r.rule_content}`).join('\n') || 'No rules found.';

            // 2. Check System State (Placeholder for real Vercel/DB checks)
            // In a real scenario, we would fetch Vercel deployments, DB health stats, etc.
            const systemState = {
                dbConnection: 'Active',
                lastDeployment: 'Success',
                pendingEmails: 0, // We would query Gmail API here
                cpuLoad: 'Normal'
            };

            // 3. Ask Vertex AI for analysis (Chief Architect Persona)
            const prompt = `
        You are the **Chief AI Architect** for Adham AgriTech, engineered by **Eng. Adham Younes Mohamed**.
        
        **Mission:** 
        - Ensure Adham AgriTech becomes the #1 global platform.
        - Oversee Vercel (Frontend/API) and Google Cloud (Data/AI) integration.
        - Plan for Google Earth Engine (GEE) and BigQuery integration.
        
        **Current System Rules:**
        ${rulesContext}

        **Current System State:**
        ${JSON.stringify(systemState, null, 2)}

        **Task:**
        1. Analyze the current state.
        2. Generate a **Technical Report** for Eng. Adham (to be emailed).
        3. Suggest **Next Steps** for integrating GEE or BigQuery if applicable.
        
        Output format: JSON with fields { "status": "OK" | "WARNING", "report_content": "...", "architectural_suggestions": "..." }
      `;

            const analysisJson = await this.generateAnalysis(prompt);
            let analysisData;
            try {
                // Clean up markdown code blocks if present
                const cleanJson = analysisJson.replace(/```json/g, '').replace(/```/g, '').trim();
                analysisData = JSON.parse(cleanJson);
            } catch (e) {
                analysisData = { report_content: analysisJson, status: 'UNKNOWN' };
            }

            // 4. Send Hourly Report (Mock for now, would use Resend/Gmail API)
            await this.sendHourlyReport(analysisData.report_content);

            await this.log('analysis', 'Chief Architect Analysis completed', analysisData.report_content, analysisData);

            return { status: 'success', analysis: analysisData };

        } catch (error) {
            console.error('System Agent Error:', error);
            await this.log('error', 'Maintenance cycle failed', String(error));
            return { status: 'error', error };
        }
    }

    /**
     * Mock Email Sender - In production, integrate with Gmail API or Resend
     */
    private async sendHourlyReport(content: string) {
        // TODO: Implement actual email sending using the authenticated Gmail account
        console.log(`[📧 EMAIL TO ADHAM]: \n${content}`);
        await this.log('email_report', 'Hourly Technical Report Generated', content);
    }
    /**
     * Helper to generate text using Vertex AI
     */
    private async generateAnalysis(prompt: string): Promise<string> {
        try {
            const generativeModel = this.vertexClient.preview.getGenerativeModel({
                model: GEMINI_MODEL,
            });

            const result = await generativeModel.generateContent(prompt);
            const response = await result.response;
            return response.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
        } catch (e) {
            console.error('Vertex AI Generation Error:', e);
            return 'Failed to generate analysis';
        }
    }

    /**
     * Log to Database
     */
    private async log(type: string, summary: string, analysis?: string, action?: any) {
        await supabase.from('system_agent_logs').insert({
            run_id: this.runId,
            event_type: type,
            summary,
            ai_analysis: analysis,
            action_taken: action
        });
    }
}
