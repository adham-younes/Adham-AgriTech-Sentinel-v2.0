import { NextResponse } from 'next/server';

export const runtime = 'edge';

const OSIRIS_URL = process.env.OSIRIS_URL || "https://osiris-core-262ufxjwqq-uc.a.run.app";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { prompt, context } = body;

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // Call OSIRIS Cloud Function
        const response = await fetch(OSIRIS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt,
                context
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: `OSIRIS Error: ${errorText}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error communicating with OSIRIS:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
