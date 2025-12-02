import { NextRequest, NextResponse } from 'next/server';
import { SovereignAgent } from '@/lib/ai/sovereign-agent';

export const runtime = 'nodejs'; // Vertex AI SDK requires Node.js runtime

export async function GET(request: NextRequest) {
    // Security Check: Ensure call is from Vercel Cron or authorized source
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Allow local testing if needed, or strict check
        // return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const agent = new SovereignAgent();
        const result = await agent.run();

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
