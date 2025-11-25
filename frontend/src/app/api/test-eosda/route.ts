import { NextResponse } from "next/server"

// Test EOSDA API configuration and functionality
export async function GET(request: Request) {
  console.log("[EOSDA-TEST] Testing EOSDA configuration...")
  
  try {
    // Test 1: Environment Variables
    const envTests = {
      NEXT_PUBLIC_EOSDA_API_KEY: !!process.env.NEXT_PUBLIC_EOSDA_API_KEY,
      NEXT_PUBLIC_EOSDA_API_URL: !!process.env.NEXT_PUBLIC_EOSDA_API_URL,
      NEXT_PUBLIC_EOSDA_CENTER_LAT: !!process.env.NEXT_PUBLIC_EOSDA_CENTER_LAT,
      NEXT_PUBLIC_EOSDA_CENTER_LNG: !!process.env.NEXT_PUBLIC_EOSDA_CENTER_LNG,
      EOSDA_API_KEY_VALUE: process.env.NEXT_PUBLIC_EOSDA_API_KEY?.substring(0, 20) + "...",
      EOSDA_API_URL_VALUE: process.env.NEXT_PUBLIC_EOSDA_API_URL,
      CENTER_LAT: process.env.NEXT_PUBLIC_EOSDA_CENTER_LAT,
      CENTER_LNG: process.env.NEXT_PUBLIC_EOSDA_CENTER_LNG,
    }

    console.log("[EOSDA-TEST] Environment variables:", envTests)

    // Test 2: EOSDA API Direct Call
    const apiKey = process.env.NEXT_PUBLIC_EOSDA_API_KEY
    const apiUrl = process.env.NEXT_PUBLIC_EOSDA_API_URL || "https://api-connect.eos.com"
    
    if (!apiKey) {
      return NextResponse.json({
        error: "MISSING_API_KEY",
        envTests,
        message: "EOSDA API key is missing"
      }, { status: 400 })
    }

    console.log("[EOSDA-TEST] Testing API call to:", apiUrl)
    
    // Test a simple API call - try different endpoints
    const endpoints = [
      `${apiUrl}/v1/polygons/search`,
      `${apiUrl}/v1/images/search`,
      `${apiUrl}/v1/data/zones`,
      `${apiUrl}/v1/auth/verify` // Test if API key is valid
    ]

    let apiResults = []
    
    for (const endpoint of endpoints) {
      try {
        console.log("[EOSDA-TEST] Testing endpoint:", endpoint)
        
        let testUrl = endpoint
        let testOptions: RequestInit = {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          }
        }

        // For search endpoints, use POST
        if (endpoint.includes('/search')) {
          testOptions.method = "POST"
          testOptions.body = JSON.stringify({
            bbox: [32.55524 - 0.01, 25.30084 - 0.01, 32.55524 + 0.01, 25.30084 + 0.01],
            dates: ["2024-01-01", "2024-12-31"],
            source: "sentinel2"
          })
        }

        const apiResponse = await fetch(testUrl, testOptions)
        const apiData = await apiResponse.text() // Get as text first to avoid JSON parsing errors
        
        apiResults.push({
          endpoint,
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          ok: apiResponse.ok,
          data: apiData.substring(0, 500) + (apiData.length > 500 ? "..." : ""),
          headers: Object.fromEntries(apiResponse.headers.entries())
        })

        console.log("[EOSDA-TEST] API Response for", endpoint, ":", apiResponse.status)

      } catch (error) {
        apiResults.push({
          endpoint,
          error: error instanceof Error ? error.message : "Unknown error"
        })
        console.error("[EOSDA-TEST] API call failed for", endpoint, ":", error)
      }
    }

    // Test 3: Map Configuration
    const mapConfig = {
      center: {
        lat: parseFloat(process.env.NEXT_PUBLIC_EOSDA_CENTER_LAT || "25.30084"),
        lng: parseFloat(process.env.NEXT_PUBLIC_EOSDA_CENTER_LNG || "32.55524")
      },
      esriTileUrl: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      eosdaTileUrl: process.env.NEXT_PUBLIC_EOSDA_TILE_URL || "https://api.eosda.com",
      zoom: {
        default: parseInt(process.env.NEXT_PUBLIC_EOSDA_DEFAULT_ZOOM || "6"),
        min: parseInt(process.env.NEXT_PUBLIC_EOSDA_MIN_ZOOM || "1"),
        max: parseInt(process.env.NEXT_PUBLIC_EOSDA_MAX_ZOOM || "18")
      }
    }

    console.log("[EOSDA-TEST] Map configuration:", mapConfig)

    // Test 4: Esri Tiles (fallback)
    let esriTest = null
    try {
      const esriResponse = await fetch(
        `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/537/374`,
        { method: "GET" }
      )
      esriTest = {
        status: esriResponse.status,
        ok: esriResponse.ok,
        contentType: esriResponse.headers.get("content-type")
      }
    } catch (error) {
      esriTest = { error: error instanceof Error ? error.message : "Unknown error" }
    }

    return NextResponse.json({
      success: true,
      tests: {
        environment: envTests,
        api: apiResults,
        mapConfig,
        esriTiles: esriTest
      },
      recommendations: {
        useEsri: esriTest?.ok || false,
        eosdaStatus: apiResults.some(r => r.ok) ? "WORKING" : "FAILED",
        workingEndpoints: apiResults.filter(r => r.ok).map(r => r.endpoint),
        failedEndpoints: apiResults.filter(r => !r.ok && !r.error).map(r => r.endpoint)
      }
    })

  } catch (error) {
    console.error("[EOSDA-TEST] Test failed:", error)
    return NextResponse.json({
      error: "TEST_FAILED",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
