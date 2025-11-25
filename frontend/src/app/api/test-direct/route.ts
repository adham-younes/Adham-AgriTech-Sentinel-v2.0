import { NextResponse } from "next/server"

// Test with direct import to see if that's the issue
export async function PUT(request: Request) {
  console.log("[DIRECT-IMPORT] Test called")
  
  try {
    console.log("[DIRECT-IMPORT] Importing supabase...")
    const { createClient } = await import("@supabase/supabase-js")
    console.log("[DIRECT-IMPORT] Import successful")
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log("[DIRECT-IMPORT] Creating client...")
    const client = createClient(supabaseUrl!, serviceKey!)
    console.log("[DIRECT-IMPORT] Client created")
    
    return NextResponse.json({ 
      success: true, 
      message: "Direct import test passed"
    })
  } catch (error) {
    console.error("[DIRECT-IMPORT] Error:", error)
    return NextResponse.json({ 
      error: "DIRECT_IMPORT_FAILED", 
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
