import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const vars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'GOOGLE_AI_API_KEY',
        'EOSDA_API_KEY',
        'NEXT_PUBLIC_EOSDA_API_KEY',
        'NEXT_PUBLIC_MAPBOX_TOKEN'
    ];

    const status = vars.reduce((acc, key) => {
        const value = process.env[key];
        acc[key] = value ? (value.length > 5 ? '✅ Configured' : '⚠️ Short/Invalid') : '❌ Missing';
        return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({
        status: 'Environment Check',
        timestamp: new Date().toISOString(),
        variables: status
    });
}
