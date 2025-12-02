import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { SupabaseClient } from "@supabase/supabase-js"

// Create a mock client that matches the SupabaseClient interface
// This is used when environment variables are missing during build
function createMockClient(): SupabaseClient {
  // Create a chainable mock that properly supports .from(), .select(), .insert(), etc.
  const createChainableMock = (): any => {
    const chain: any = {
      // Database query methods
      select: () => chain,
      insert: () => chain,
      update: () => chain,
      delete: () => chain,
      upsert: () => chain,

      // Filter methods
      eq: () => chain,
      neq: () => chain,
      gt: () => chain,
      gte: () => chain,
      lt: () => chain,
      lte: () => chain,
      like: () => chain,
      ilike: () => chain,
      is: () => chain,
      in: () => chain,
      contains: () => chain,
      containedBy: () => chain,
      rangeGt: () => chain,
      rangeGte: () => chain,
      rangeLt: () => chain,
      rangeLte: () => chain,
      rangeAdjacent: () => chain,
      overlaps: () => chain,
      textSearch: () => chain,
      match: () => chain,
      not: () => chain,
      or: () => chain,
      filter: () => chain,

      // Modifier methods
      order: () => chain,
      limit: () => chain,
      range: () => chain,
      abortSignal: () => chain,
      returns: () => chain,

      // Result methods
      single: async () => ({ data: null, error: { message: "Mock client: No data available" }, count: 0 }),
      maybeSingle: async () => ({ data: null, error: null, count: 0 }),

      // Make the chain awaitable (Promise-like)
      then: async (resolve: any, reject?: any) => {
        const result = { data: null, error: null, count: 0 }
        return resolve ? await Promise.resolve(result).then(resolve, reject) : result
      },
      catch: async (reject: any) => reject ? await Promise.reject(null).catch(reject) : null,
      finally: async (onFinally: any) => onFinally ? await Promise.resolve().finally(onFinally) : null,
    }

    return chain
  }

  const mock = {
    // Auth methods
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: { message: "Mock client: Supabase auth not configured" }
      }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => { } } }
      }),
    },

    // Database methods
    from: (table: string) => createChainableMock(),
    rpc: (fn: string, params?: any) => createChainableMock(),

    // Storage methods
    storage: {
      from: (bucket: string) => ({
        upload: async () => ({ data: null, error: { message: "Mock client: Storage not configured" } }),
        download: async () => ({ data: null, error: { message: "Mock client: Storage not configured" } }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
        remove: async () => ({ data: null, error: null }),
      })
    },
  }

  return mock as unknown as SupabaseClient
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
