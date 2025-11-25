import { NextResponse } from "next/server"

// Test without any imports to isolate the issue
export async function PUT(request: Request) {
  console.log("[NO-IMPORTS] Test called")
  
  try {
    // Test environment variables directly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log("[NO-IMPORTS] Environment check:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!serviceKey,
      urlLength: supabaseUrl?.length,
      keyLength: serviceKey?.length
    })
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ 
        error: "MISSING_ENV",
        hasUrl: !!supabaseUrl,
        hasKey: !!serviceKey
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Environment variables are set",
      urlPrefix: supabaseUrl.substring(0, 30),
      keyPrefix: serviceKey.substring(0, 30)
    })
  } catch (error) {
    console.error("[NO-IMPORTS] Error:", error)
    return NextResponse.json({ 
      error: "TEST_FAILED", 
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
