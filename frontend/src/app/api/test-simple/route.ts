import { NextResponse } from "next/server"

// Simple test endpoint to isolate the issue
export async function PUT(request: Request) {
  console.log("[TEST] Simple endpoint called")
  
  try {
    // Just return a simple response first
    return NextResponse.json({ 
      success: true, 
      message: "Simple test works",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("[TEST] Simple test failed", error)
    return NextResponse.json({ 
      error: "SIMPLE_TEST_FAILED", 
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// Test environment variables
export async function PATCH(request: Request) {
  console.log("[TEST] Environment check called")
  
  try {
    const env = {
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING",
      SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "MISSING",
      NODE_ENV: process.env.NODE_ENV
    }
    
    console.log("[TEST] Environment check:", env)
    
    return NextResponse.json({ 
      success: true, 
      env,
      message: "Environment check completed"
    })
  } catch (error) {
    console.error("[TEST] Environment check failed", error)
    return NextResponse.json({ 
      error: "ENV_CHECK_FAILED", 
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
