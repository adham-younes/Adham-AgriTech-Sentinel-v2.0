import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// Create a mock client that matches the SupabaseClient interface
// This is used when environment variables are missing
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

export function createClient(): SupabaseClient {
  // In Next.js, NEXT_PUBLIC_* variables are available in both server and client
  // They are replaced at build time, so safe to access directly
  let supabaseUrl: string | undefined
  let supabaseKey: string | undefined

  try {
    // NEXT_PUBLIC_* vars are available in client-side
    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  } catch (error) {
    // If process.env access fails (shouldn't happen with NEXT_PUBLIC_*), use fallback
    console.warn("[Supabase Client] Failed to access env vars:", error)
  }

  // Ensure BOTH variables are present and non-empty to prevent mixed credentials
  // If either is missing, return mock client to avoid creating client with partial config
  const hasUrl = supabaseUrl && typeof supabaseUrl === 'string' && supabaseUrl.trim().length > 0
  const hasKey = supabaseKey && typeof supabaseKey === 'string' && supabaseKey.trim().length > 0

  if (!hasUrl || !hasKey) {
    const missing = []
    if (!hasUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL")
    if (!hasKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    console.error(`Missing Supabase environment variables: ${missing.join(", ")}. Client operations will fail.`)
    // Return a mock client to prevent runtime errors and avoid mixed credentials
    return createMockClient()
  }

  // At this point, TypeScript knows both are truthy strings due to the checks above
  // But TypeScript flow analysis doesn't narrow the type, so we assert
  try {
    return createBrowserClient(supabaseUrl!, supabaseKey!)
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    return createMockClient()
  }
}
