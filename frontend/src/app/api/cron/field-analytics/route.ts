// Field Analytics Cron Job
export const runtime = 'nodejs'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { satelliteAnalytics } from '@/lib/services/satellite-analytics'
import { fieldAnalytics } from '@/lib/business-logic/field-analytics'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
    const { data: fields } = await supabase
      .from('fields')
      .select('id, name, area, boundary_coordinates')
      .not('boundary_coordinates', 'is', null)

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

    return NextResponse.json({ success: true, processed, results: results.slice(0, 10) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
