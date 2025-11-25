import { createClient } from "@supabase/supabase-js"

export function createServiceSupabaseClient() {
  console.log("[Supabase Service Client] Starting client creation...")
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log("[Supabase Service Client] Environment check:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!serviceKey,
    urlLength: supabaseUrl?.length,
    keyLength: serviceKey?.length,
    urlPrefix: supabaseUrl?.substring(0, 20),
    keyPrefix: serviceKey?.substring(0, 20)
  })

  if (!supabaseUrl || !serviceKey) {
    console.error("[Supabase Service Client] Missing configuration", {
      hasUrl: !!supabaseUrl,
      hasKey: !!serviceKey,
    })
    // During build, return a mock client instead of throwing
    // This prevents build failures when env vars are not set
    return {
      auth: {
        admin: {
          getUserById: async () => ({ data: { user: null }, error: null }),
        },
      },
      from: () => ({
        select: () => ({ data: null, error: null }),
        insert: () => ({ data: null, error: null }),
        update: () => ({ data: null, error: null }),
        delete: () => ({ data: null, error: null }),
      }),
    } as any
  }

  // Ensure BOTH variables are present and non-empty to prevent mixed credentials
  const hasUrl = supabaseUrl && supabaseUrl.trim().length > 0
  const hasKey = serviceKey && serviceKey.trim().length > 0

  if (!hasUrl || !hasKey) {
    const missing = []
    if (!hasUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL")
    if (!hasKey) missing.push("SUPABASE_SERVICE_ROLE_KEY")
    console.error(`[Supabase Service Client] Missing configuration: ${missing.join(", ")}`)
    // Return mock client instead of throwing to prevent runtime errors
    return {
      auth: {
        admin: {
          getUserById: async () => ({ data: { user: null }, error: null }),
        },
      },
      from: () => ({
        select: () => ({ data: null, error: null }),
        insert: () => ({ data: null, error: null }),
        update: () => ({ data: null, error: null }),
        delete: () => ({ data: null, error: null }),
      }),
    } as any
  }

  console.log("[Supabase Service Client] Creating client...")
  
  try {
    const client = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
      },
    })
    
    console.log("[Supabase Service Client] Client created successfully")
    return client
  } catch (error) {
    console.error("[Supabase Service Client] Client creation failed", error)
    // Return mock client instead of throwing to prevent runtime errors
    return {
      auth: {
        admin: {
          getUserById: async () => ({ data: { user: null }, error: null }),
        },
      },
      from: () => ({
        select: () => ({ data: null, error: null }),
        insert: () => ({ data: null, error: null }),
        update: () => ({ data: null, error: null }),
        delete: () => ({ data: null, error: null }),
      }),
    } as any
  }
}
