import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client only if environment variables are provided
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient<any, "public", any> | null = null;
if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export async function GET(request: Request) {
    if (!supabase) {
        return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    if (!userId) {
        return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }
    const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
}

export async function POST(request: Request) {
    if (!supabase) {
        return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }
    const body = await request.json();
    const { user_id, role, content } = body;
    if (!user_id || !role || !content) {
        return NextResponse.json({ error: 'user_id, role, and content required' }, { status: 400 });
    }
    const { data, error } = await supabase
        .from('chat_messages')
        .insert({ user_id, role, content });
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data[0]);
}

