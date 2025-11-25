import { NextResponse } from "next/server"
import { createServiceSupabaseClient } from "@/lib/supabase/service-client"

// Test Supabase connection specifically
export async function PUT(request: Request) {
  console.log("[SUPABASE-TEST] Endpoint called")
  
  try {
    console.log("[SUPABASE-TEST] Creating service client...")
    const serviceSupabase = createServiceSupabaseClient()
    console.log("[SUPABASE-TEST] Service client created")
    
    // Test basic connection with a simple query
    console.log("[SUPABASE-TEST] Testing simple query...")
    const { data: testData, error: testError } = await serviceSupabase
      .from("profiles")
      .select("count")
      .limit(1)
    
    if (testError) {
      console.error("[SUPABASE-TEST] Query failed", testError)
      return NextResponse.json({ 
        error: "QUERY_FAILED", 
        message: testError.message,
        details: testError.details,
        code: testError.code
      }, { status: 500 })
    }
    
    console.log("[SUPABASE-TEST] Query OK:", testData)
    
    return NextResponse.json({ 
      success: true, 
      message: "Supabase test passed",
      data: testData
    })
  } catch (error) {
    console.error("[SUPABASE-TEST] Unexpected error", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : "Unknown"
    })
    return NextResponse.json({ 
      error: "UNEXPECTED_ERROR", 
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
