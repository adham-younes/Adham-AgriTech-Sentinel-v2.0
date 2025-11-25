import { NextResponse } from "next/server"

// Test map functionality without database operations
export async function POST(request: Request) {
  console.log("[FIELD-MAP-TEST] Testing map functionality...")
  
  try {
    const body = await request.json()
    console.log("[FIELD-MAP-TEST] Request body:", body)

    // Test 1: Test map tile loading for different providers
    const mapTests = []
    
    // Test Esri tiles (primary provider)
    try {
      const esriTileUrl = `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/537/374`
      const esriResponse = await fetch(esriTileUrl)
      mapTests.push({
        provider: "Esri",
        url: esriTileUrl,
        status: esriResponse.status,
        ok: esriResponse.ok,
        contentType: esriResponse.headers.get("content-type"),
        size: esriResponse.headers.get("content-length")
      })
    } catch (error) {
      mapTests.push({
        provider: "Esri",
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }

    // Test Mapbox tiles (if token available)
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    if (mapboxToken) {
      try {
        const mapboxUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/10/537/374?access_token=${mapboxToken}`
        const mapboxResponse = await fetch(mapboxUrl)
        mapTests.push({
          provider: "Mapbox",
          url: mapboxUrl,
          status: mapboxResponse.status,
          ok: mapboxResponse.ok,
          contentType: mapboxResponse.headers.get("content-type")
        })
      } catch (error) {
        mapTests.push({
          provider: "Mapbox",
          error: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }

    // Test Sentinel tiles (if configured)
    const sentinelUrl = process.env.NEXT_PUBLIC_SENTINEL_TILE_URL
    if (sentinelUrl) {
      try {
        const testSentinelUrl = sentinelUrl.replace("{z}", "10").replace("{x}", "537").replace("{y}", "374")
        const sentinelResponse = await fetch(testSentinelUrl)
        mapTests.push({
          provider: "Sentinel",
          url: testSentinelUrl,
          status: sentinelResponse.status,
          ok: sentinelResponse.ok,
          contentType: sentinelResponse.headers.get("content-type")
        })
      } catch (error) {
        mapTests.push({
          provider: "Sentinel",
          error: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }

    // Test 2: Test field coordinates and boundary validation
    const testField = {
      name: "Test Field " + Date.now(),
      latitude: body.latitude || 25.30084,
      longitude: body.longitude || 32.55524,
      boundary_coordinates: body.boundary_coordinates || [
        [32.55524, 25.30084],
        [32.55624, 25.30084], 
        [32.55624, 25.30184],
        [32.55524, 25.30184],
        [32.55524, 25.30084]
      ]
    }

    // Validate coordinates
    const coordValidation = {
      validLat: testField.latitude >= -90 && testField.latitude <= 90,
      validLng: testField.longitude >= -180 && testField.longitude <= 180,
      validBoundary: Array.isArray(testField.boundary_coordinates) && testField.boundary_coordinates.length >= 3
    }

    // Test 3: Test map configuration
    const mapConfig = {
      center: {
        lat: parseFloat(process.env.NEXT_PUBLIC_EOSDA_CENTER_LAT || "25.30084"),
        lng: parseFloat(process.env.NEXT_PUBLIC_EOSDA_CENTER_LNG || "32.55524")
      },
      providers: {
        esri: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        mapbox: mapboxToken ? `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${mapboxToken}` : null,
        sentinel: sentinelUrl || null
      },
      zoom: {
        default: parseInt(process.env.NEXT_PUBLIC_EOSDA_DEFAULT_ZOOM || "6"),
        min: parseInt(process.env.NEXT_PUBLIC_EOSDA_MIN_ZOOM || "1"),
        max: parseInt(process.env.NEXT_PUBLIC_EOSDA_MAX_ZOOM || "18")
      }
    }

    return NextResponse.json({
      success: true,
      tests: {
        mapTiles: mapTests,
        fieldValidation: coordValidation,
        mapConfig: mapConfig,
        testField: testField
      },
      recommendations: {
        primaryProvider: mapTests.find(t => t.provider === "Esri")?.ok ? "Esri" : 
                        mapTests.find(t => t.provider === "Mapbox")?.ok ? "Mapbox" : "None",
        workingProviders: mapTests.filter(t => t.ok).map(t => t.provider),
        failedProviders: mapTests.filter(t => !t.ok && !t.error).map(t => t.provider),
        coordinatesValid: coordValidation.validLat && coordValidation.validLng,
        boundaryValid: coordValidation.validBoundary
      }
    })

  } catch (error) {
    console.error("[FIELD-MAP-TEST] Test failed:", error)
    return NextResponse.json({
      error: "TEST_FAILED",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

// Get test results
export async function GET() {
  return NextResponse.json({
    message: "Field and Map Test API - Use POST to test map functionality",
    endpoints: {
      POST: "Test map tile loading and field validation",
      parameters: {
        latitude: "number (optional)",
        longitude: "number (optional)",
        boundary_coordinates: "array of coordinates (optional)"
      }
    }
  })
}
