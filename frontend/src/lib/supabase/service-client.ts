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
    throw new Error("Missing Supabase service configuration")
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
    throw error
  }
}
