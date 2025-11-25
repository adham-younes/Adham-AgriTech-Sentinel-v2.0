import { NextResponse } from "next/server"

// Test with service client import specifically
export async function PUT(request: Request) {
  console.log("[SERVICE-CLIENT] Test called")
  
  try {
    console.log("[SERVICE-CLIENT] Importing service client...")
    const { createServiceSupabaseClient } = await import("@/lib/supabase/service-client")
    console.log("[SERVICE-CLIENT] Import successful")
    
    console.log("[SERVICE-CLIENT] Creating client...")
    const client = createServiceSupabaseClient()
    console.log("[SERVICE-CLIENT] Client created")
    
    return NextResponse.json({ 
      success: true, 
      message: "Service client test passed"
    })
  } catch (error) {
    console.error("[SERVICE-CLIENT] Error:", error)
    return NextResponse.json({ 
      error: "SERVICE_CLIENT_FAILED", 
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
