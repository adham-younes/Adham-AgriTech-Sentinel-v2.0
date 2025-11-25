import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { SupabaseClient } from "@supabase/supabase-js"

// Create a mock client that matches the SupabaseClient interface
// This is used when environment variables are missing during build
function createMockClient(): SupabaseClient {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
  } as unknown as SupabaseClient
}

export async function createClient(): Promise<SupabaseClient> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Ensure BOTH variables are present and non-empty to prevent mixed credentials
  // If either is missing, return mock client to avoid creating client with partial config
  const hasUrl = supabaseUrl && supabaseUrl.trim().length > 0
  const hasKey = supabaseKey && supabaseKey.trim().length > 0

  if (!hasUrl || !hasKey) {
    const missing = []
    if (!hasUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL")
    if (!hasKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    const error = `Missing Supabase environment variables: ${missing.join(", ")}`
    console.error(error)
    // During build or when env vars are missing, return a mock client
    // This prevents build failures and avoids creating clients with mixed credentials
    return createMockClient()
  }

  try {
    const cookieStore = await cookies()
    return createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The "setAll" method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    })
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    return createMockClient()
  }
}
