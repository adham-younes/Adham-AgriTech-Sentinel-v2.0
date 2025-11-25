import { NextResponse } from "next/server"

// Test satellite analytics functionality
export async function GET(request: Request) {
  console.log("[SATELLITE-TEST] Testing satellite analytics...")
  
  try {
    // Test 1: Feature Flags
    const { isFeatureEnabled } = await import("@/lib/config/feature-flags")
    
    const featureFlags = {
      satelliteAutomation: isFeatureEnabled("satelliteAutomation"),
      soilAnalysisAutomation: isFeatureEnabled("soilAnalysisAutomation"),
      sentinelPipeline: isFeatureEnabled("sentinelPipeline"),
      satelliteCache: isFeatureEnabled("satelliteCache"),
    }

    console.log("[SATELLITE-TEST] Feature flags:", featureFlags)

    // Test 2: Environment Variables
    const envTests = {
      NEXT_PUBLIC_EOSDA_API_KEY: !!process.env.NEXT_PUBLIC_EOSDA_API_KEY,
      NEXT_PUBLIC_EOSDA_API_URL: !!process.env.NEXT_PUBLIC_EOSDA_API_URL,
      NEXT_PUBLIC_SATELLITE_PROVIDER: process.env.NEXT_PUBLIC_SATELLITE_PROVIDER,
      NEXT_PUBLIC_FEATURE_SATELLITE_AUTOMATION: process.env.NEXT_PUBLIC_FEATURE_SATELLITE_AUTOMATION,
      NEXT_PUBLIC_FEATURE_SOIL_ANALYSIS_AUTOMATION: process.env.NEXT_PUBLIC_FEATURE_SOIL_ANALYSIS_AUTOMATION,
    }

    console.log("[SATELLITE-TEST] Environment variables:", envTests)

    // Test 3: API Endpoint Availability
    const apiTests = []
    
    // Test soil analysis endpoint
    try {
      const testBody = { fieldId: "test-field-id", language: "en" }
      const response = await fetch("http://localhost:3003/api/soil-analysis/analyze-from-satellite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testBody)
      })
      
      const responseText = await response.text()
      
      apiTests.push({
        endpoint: "/api/soil-analysis/analyze-from-satellite",
        status: response.status,
        ok: response.ok,
        response: responseText.substring(0, 200) + (responseText.length > 200 ? "..." : "")
      })
    } catch (error) {
      apiTests.push({
        endpoint: "/api/soil-analysis/analyze-from-satellite",
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }

    // Test 4: Database Connection (simple test)
    let dbTest = null
    try {
      const { createServiceSupabaseClient } = await import("@/lib/supabase/service-client")
      const supabase = createServiceSupabaseClient()
      
      const { data, error } = await supabase
        .from("fields")
        .select("id, name")
        .limit(1)
      
      dbTest = {
        connected: !error,
        fieldsCount: data?.length || 0,
        error: error?.message
      }
    } catch (error) {
      dbTest = {
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }

    // Test 5: Map Providers
    const mapTests = []
    
    // Test Esri tiles
    try {
      const esriResponse = await fetch(
        "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/537/374"
      )
      mapTests.push({
        provider: "Esri",
        status: esriResponse.status,
        ok: esriResponse.ok,
        contentType: esriResponse.headers.get("content-type")
      })
    } catch (error) {
      mapTests.push({
        provider: "Esri",
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }

    return NextResponse.json({
      success: true,
      tests: {
        featureFlags,
        environment: envTests,
        apiEndpoints: apiTests,
        database: dbTest,
        mapProviders: mapTests
      },
      recommendations: {
        satelliteAnalyticsWorking: featureFlags.satelliteAutomation && featureFlags.soilAnalysisAutomation,
        apiWorking: apiTests.some(t => t.ok),
        databaseWorking: dbTest?.connected || false,
        mapsWorking: mapTests.some(t => t.ok),
        primaryIssues: [
          !featureFlags.satelliteAutomation && "Satellite automation feature flag disabled",
          !featureFlags.soilAnalysisAutomation && "Soil analysis automation feature flag disabled",
          !dbTest?.connected && "Database connection failed",
          !mapTests.some(t => t.ok) && "Map providers not working"
        ].filter(Boolean)
      }
    })

  } catch (error) {
    console.error("[SATELLITE-TEST] Test failed:", error)
    return NextResponse.json({
      error: "TEST_FAILED",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
