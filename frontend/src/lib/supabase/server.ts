import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { SupabaseClient } from "@supabase/supabase-js"

// Create a mock client that matches the SupabaseClient interface
// This is used when environment variables are missing during build
function createMockClient(): SupabaseClient {
  const mock: any = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: "Mock client: Auth disabled" } }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
    },
  }

  // Use a Proxy to handle all other DB operations (from, select, insert, etc.)
  // effectively swallowing all calls and returning empty data/errors as appropriate
  const dbHandler = {
    get: (target: any, prop: string) => {
      if (prop in target) return target[prop]

      // Return a function that returns the proxy itself (chaining)
      // or a promise resolving to empty data for final execution
      return (...args: any[]) => {
        // If it looks like a promise (then/catch), resolve it
        if (prop === 'then') {
          return Promise.resolve({ data: [], error: null, count: 0 }).then(args[0], args[1])
        }
        return new Proxy({}, dbHandler)
      }
    }
  }

  // Special handling for 'then' to make the proxy awaitable immediately if needed
  // But usually the client itself isn't awaited, the result of methods are.
  // We'll wrap the main mock in the proxy.
  return new Proxy(mock, {
    get: (target, prop) => {
      if (prop in target) return target[prop]
      // For any other property (like 'from', 'rpc'), return a chainable mock function
      return () => new Proxy({
        // The chainable mock needs to be awaitable to return data
        then: (resolve: any) => resolve({ data: [], error: null, count: 0 }),
        // And also chainable
      }, dbHandler)
    }
  }) as unknown as SupabaseClient
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
