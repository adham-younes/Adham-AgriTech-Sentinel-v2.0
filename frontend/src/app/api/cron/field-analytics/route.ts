/**
 * Field Analytics Cron Job
 * 
 * Runs daily at midnight (00:00 UTC) to process satellite analytics for all fields.
 * Configured in vercel.json with schedule: "0 0 * * *"
 * 
 * Features:
 * - NDVI time series analysis
 * - Soil moisture estimation
 * - Irrigation recommendations
 * - Stress zone detection
 */
export const runtime = 'nodejs'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { satelliteAnalytics } from '@/lib/services/satellite-analytics'
import { fieldAnalytics } from '@/lib/business-logic/field-analytics'

export async function GET(request: Request) {
  const startTime = Date.now()
  
  try {
    // Verify cron authorization
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Fetch all fields with boundary coordinates
    const { data: fields, error: fieldsError } = await supabase
      .from('fields')
      .select('id, name, area, boundary_coordinates, latitude, longitude')
      .not('boundary_coordinates', 'is', null)
      .limit(100) // Process max 100 fields per run

    if (!fields || fields.length === 0) {
      return NextResponse.json({ message: 'No fields', processed: 0 })
    }

    let processed = 0
    const results = []

    for (const field of fields) {
      try {
        const polygon = field.boundary_coordinates?.type === 'Polygon'
          ? field.boundary_coordinates.coordinates[0]
          : null

        if (!polygon) continue

        const ndviData = await satelliteAnalytics.getNDVITimeSeries(field.id, 30, polygon)
        if (ndviData.length === 0) continue

        const soilAnalysis = fieldAnalytics.generateSoilAnalysis(field.id, ndviData)
        const fieldArea = typeof field.area === 'number' ? field.area : 1.0
        const irrigationPlan = fieldAnalytics.generateIrrigationPlan(field.id, soilAnalysis, fieldArea)

        await supabase.from('field_analytics').insert({
          field_id: field.id,
          ndvi_mean: soilAnalysis.ndvi_mean,
          ndvi_trend: soilAnalysis.ndvi_trend,
          moisture_level: soilAnalysis.moisture_level,
          stress_zones: soilAnalysis.stress_zones,
          irrigation_recommended: irrigationPlan.irrigation_recommended,
          irrigation_priority: irrigationPlan.priority,
          irrigation_zones: irrigationPlan.recommended_zones,
          total_water_volume_m3: irrigationPlan.total_water_volume_m3,
          recommendations: soilAnalysis.recommendations,
        })

        processed++
        results.push({ field_id: field.id, ndvi: soilAnalysis.ndvi_mean })
      } catch (err) {
        console.error(`Field ${field.id} error:`, err)
      }
    }

    const duration = Date.now() - startTime
    
    return NextResponse.json({ 
      success: true, 
      processed, 
      total_fields: fields.length,
      duration_ms: duration,
      results: results.slice(0, 10),
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[Cron/field-analytics] Error:', error)
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
