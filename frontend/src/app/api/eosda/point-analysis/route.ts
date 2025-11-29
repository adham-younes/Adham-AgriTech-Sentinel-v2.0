/**
 * EOSDA Point Analysis API
 * 
 * Fetches EOSDA data for a specific point (coordinates)
 * 
 * @module api/eosda/point-analysis
 */

export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { fetchEOSDANDVI, fetchEOSDASoilMoisture, fetchEOSDAChlorophyll } from '@/lib/services/eosda'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { coordinates } = body

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid coordinates. Expected [lng, lat]' },
        { status: 400 }
      )
    }

    const [lng, lat] = coordinates

    // Create a small bbox around the point (0.01 degrees ≈ 1km)
    const bbox: [number, number, number, number] = [
      lng - 0.005,
      lat - 0.005,
      lng + 0.005,
      lat + 0.005,
    ]

    // Fetch EOSDA data
    const [ndviData, moistureData, chlorophyllData] = await Promise.allSettled([
      fetchEOSDANDVI({ 
        center: { latitude: lat, longitude: lng },
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate: new Date(),
      }),
      fetchEOSDASoilMoisture({ 
        center: { latitude: lat, longitude: lng },
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      }),
      fetchEOSDAChlorophyll({ 
        center: { latitude: lat, longitude: lng },
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      }),
    ])

    const result: {
      ndvi?: number
      soilMoisture?: number
      chlorophyll?: number
      evi?: number
      timestamp?: string
    } = {
      timestamp: new Date().toISOString(),
    }

    if (ndviData.status === 'fulfilled' && ndviData.value) {
      const value = typeof ndviData.value === 'object' && 'value' in ndviData.value
        ? ndviData.value.value
        : ndviData.value
      if (typeof value === 'number') {
        result.ndvi = value
      }
    }

    if (moistureData.status === 'fulfilled' && moistureData.value) {
      const value = typeof moistureData.value === 'object' && 'value' in moistureData.value
        ? moistureData.value.value
        : moistureData.value
      if (typeof value === 'number') {
        result.soilMoisture = value
      }
    }

    if (chlorophyllData.status === 'fulfilled' && chlorophyllData.value) {
      const value = typeof chlorophyllData.value === 'object' && 'value' in chlorophyllData.value
        ? chlorophyllData.value.value
        : chlorophyllData.value
      if (typeof value === 'number') {
        result.chlorophyll = value
      }
    }

    return NextResponse.json(result)
  } catch (error: any) {
    logger.error('[EOSDA Point Analysis] Error', error, {
      endpoint: 'POST /api/eosda/point-analysis'
    })
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch point analysis' },
      { status: 500 }
    )
  }
}

