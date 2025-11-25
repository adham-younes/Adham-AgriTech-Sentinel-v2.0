import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// Create a mock client that matches the SupabaseClient interface
// This is used when environment variables are missing
function createMockClient(): SupabaseClient {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
  } as unknown as SupabaseClient
}

export function createClient(): SupabaseClient {
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
    console.error(`Missing Supabase environment variables: ${missing.join(", ")}. Client operations will fail.`)
    // Return a mock client to prevent runtime errors and avoid mixed credentials
    return createMockClient()
  }

  try {
    return createBrowserClient(supabaseUrl, supabaseKey)
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    return createMockClient()
  }
}
