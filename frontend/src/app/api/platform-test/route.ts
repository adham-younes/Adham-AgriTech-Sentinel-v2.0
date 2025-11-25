import { NextResponse } from "next/server"

// Comprehensive platform test to identify all issues
export async function GET(request: Request) {
  console.log("[PLATFORM-TEST] Running comprehensive platform test...")
  
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      status: "testing",
      issues: [] as string[],
      working: [] as string[],
      failed: [] as string[]
    }

    // Test 1: Feature Flags
    try {
      const { isFeatureEnabled } = await import("@/lib/config/feature-flags")
      const flags = {
        satelliteAutomation: isFeatureEnabled("satelliteAutomation"),
        soilAnalysisAutomation: isFeatureEnabled("soilAnalysisAutomation"),
        sentinelPipeline: isFeatureEnabled("sentinelPipeline"),
        satelliteCache: isFeatureEnabled("satelliteCache"),
      }
      
      if (Object.values(flags).every(f => f)) {
        results.working.push("✅ All feature flags enabled")
      } else {
        results.failed.push("❌ Some feature flags disabled")
        results.issues.push("Feature flags not properly enabled")
      }
      results.featureFlags = flags
    } catch (error) {
      results.failed.push("❌ Feature flags test failed")
      results.issues.push(`Feature flags error: ${error}`)
    }

    // Test 2: Database Connection
    try {
      const { createServiceSupabaseClient } = await import("@/lib/supabase/service-client")
      const supabase = createServiceSupabaseClient()
      
      // Test farms
      const { data: farms, error: farmsError } = await supabase
        .from("farms")
        .select("id, name")
        .limit(5)
      
      // Test fields
      const { data: fields, error: fieldsError } = await supabase
        .from("fields")
        .select("id, name, farm_id")
        .limit(5)

      if (!farmsError && !fieldsError) {
        results.working.push("✅ Database connection working")
        results.database = {
          farmsCount: farms?.length || 0,
          fieldsCount: fields?.length || 0,
          connected: true
        }
      } else {
        results.failed.push("❌ Database connection failed")
        results.issues.push(`Database error: ${farmsError?.message || fieldsError?.message}`)
        results.database = {
          connected: false,
          farmsError: farmsError?.message,
          fieldsError: fieldsError?.message
        }
      }
    } catch (error) {
      results.failed.push("❌ Database test failed")
      results.issues.push(`Database error: ${error}`)
    }

    // Test 3: API Endpoints
    const apiTests = []
    
    // Test satellite analytics API
    try {
      const response = await fetch("http://localhost:3003/api/soil-analysis/analyze-from-satellite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldId: "test", language: "en" })
      })
      
      apiTests.push({
        endpoint: "satellite-analytics",
        status: response.status,
        working: response.ok
      })
      
      if (response.ok) {
        results.working.push("✅ Satellite analytics API working")
      } else {
        results.failed.push("❌ Satellite analytics API failed")
        results.issues.push("Satellite analytics API not responding correctly")
      }
    } catch (error) {
      apiTests.push({
        endpoint: "satellite-analytics",
        error: error instanceof Error ? error.message : "Unknown error",
        working: false
      })
      results.failed.push("❌ Satellite analytics API error")
      results.issues.push(`Satellite API error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }

    // Test farms API
    try {
      const response = await fetch("http://localhost:3003/api/farms", {
        method: "GET"
      })
      
      apiTests.push({
        endpoint: "farms",
        status: response.status,
        working: response.ok
      })
      
      if (response.ok) {
        results.working.push("✅ Farms API working")
      } else {
        results.failed.push("❌ Farms API failed")
        results.issues.push("Farms API not responding correctly")
      }
    } catch (error) {
      apiTests.push({
        endpoint: "farms",
        error: error instanceof Error ? error.message : "Unknown error",
        working: false
      })
      results.failed.push("❌ Farms API error")
      results.issues.push(`Farms API error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }

    results.apiTests = apiTests

    // Test 4: Map Providers
    const mapTests = []
    
    // Test Esri tiles
    try {
      const esriResponse = await fetch(
        "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/537/374"
      )
      
      mapTests.push({
        provider: "Esri",
        status: esriResponse.status,
        working: esriResponse.ok
      })
      
      if (esriResponse.ok) {
        results.working.push("✅ Esri maps working")
      } else {
        results.failed.push("❌ Esri maps failed")
        results.issues.push("Esri map tiles not loading")
      }
    } catch (error) {
      mapTests.push({
        provider: "Esri",
        error: error instanceof Error ? error.message : "Unknown error",
        working: false
      })
      results.failed.push("❌ Esri maps error")
      results.issues.push(`Esri maps error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }

    results.mapTests = mapTests

    // Test 5: Environment Variables
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_EOSDA_API_KEY: !!process.env.NEXT_PUBLIC_EOSDA_API_KEY,
      NEXT_PUBLIC_EOSDA_API_URL: !!process.env.NEXT_PUBLIC_EOSDA_API_URL,
      NEXT_PUBLIC_SATELLITE_PROVIDER: process.env.NEXT_PUBLIC_SATELLITE_PROVIDER,
    }

    results.environment = envVars

    // Overall status
    const workingCount = results.working.length
    const failedCount = results.failed.length
    
    if (failedCount === 0) {
      results.status = "✅ All systems working"
      results.overall = "healthy"
    } else if (workingCount > failedCount) {
      results.status = "⚠️ Some issues detected"
      results.overall = "degraded"
    } else {
      results.status = "❌ Major issues detected"
      results.overall = "critical"
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error("[PLATFORM-TEST] Critical error:", error)
    return NextResponse.json({
      status: "❌ Critical system failure",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
