import { NextResponse } from 'next/server'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type SearchParams = {
    query?: string
    type?: 'disease' | 'fertilizer' | 'pesticide' | 'soil'
    language?: 'ar' | 'en'
}

/**
 * GET /api/agricultural-knowledge
 * Search agricultural knowledge base
 * Query params: query (search term), type (knowledge type), language (ar/en)
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('query') || ''
        const type = searchParams.get('type') as SearchParams['type']
        const language = (searchParams.get('language') || 'ar') as 'ar' | 'en'

        const supabase = await createSupabaseServerClient()

        const results: any = {}

        // Search diseases
        if (!type || type === 'disease') {
            const nameField = language === 'ar' ? 'name_ar' : 'name_en'
            const symptomsField = language === 'ar' ? 'symptoms_ar' : 'symptoms_en'

            let diseasesQuery = supabase.from('diseases').select('*')

            if (query) {
                diseasesQuery = diseasesQuery.or(
                    `${nameField}.ilike.%${query}%,${symptomsField}.ilike.%${query}%`
                )
            }

            const { data: diseases } = await diseasesQuery.limit(20)
            results.diseases = diseases || []
        }

        // Search fertilizers
        if (!type || type === 'fertilizer') {
            const nameField = language === 'ar' ? 'name_ar' : 'name_en'

            let fertilizersQuery = supabase.from('fertilizer_types').select('*')

            if (query) {
                fertilizersQuery = fertilizersQuery.ilike(nameField, `%${query}%`)
            }

            const { data: fertilizers } = await fertilizersQuery.limit(20)
            results.fertilizers = fertilizers || []
        }

        // Search pesticides
        if (!type || type === 'pesticide') {
            const nameField = language === 'ar' ? 'name_ar' : 'name_en'

            let pesticidesQuery = supabase.from('pesticide_types').select('*')

            if (query) {
                pesticidesQuery = pesticidesQuery.ilike(nameField, `%${query}%`)
            }

            const { data: pesticides } = await pesticidesQuery.limit(20)
            results.pesticides = pesticides || []
        }

        // Search soil standards
        if (!type || type === 'soil') {
            let soilQuery = supabase.from('soil_standards').select('*')

            if (query) {
                soilQuery = soilQuery.ilike('parameter', `%${query}%`)
            }

            const { data: soilStandards } = await soilQuery
            results.soilStandards = soilStandards || []
        }

        return NextResponse.json({
            success: true,
            data: results,
            query,
            type,
            language
        })
    } catch (error) {
        console.error('[Agricultural Knowledge API] Error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

/**
 * POST /api/agricultural-knowledge
 * Get detailed information about specific item
 * Body: { id: string, type: 'disease' | 'fertilizer' | 'pesticide' | 'soil' }
 */
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { id, type } = body

        if (!id || !type) {
            return NextResponse.json(
                { success: false, error: 'Missing id or type' },
                { status: 400 }
            )
        }

        const supabase = await createSupabaseServerClient()
        let data = null

        switch (type) {
            case 'disease':
                const { data: disease } = await supabase
                    .from('diseases')
                    .select('*')
                    .eq('id', id)
                    .single()
                data = disease
                break

            case 'fertilizer':
                const { data: fertilizer } = await supabase
                    .from('fertilizer_types')
                    .select('*')
                    .eq('id', id)
                    .single()
                data = fertilizer
                break

            case 'pesticide':
                const { data: pesticide } = await supabase
                    .from('pesticide_types')
                    .select('*')
                    .eq('id', id)
                    .single()
                data = pesticide
                break

            case 'soil':
                const { data: soil } = await supabase
                    .from('soil_standards')
                    .select('*')
                    .eq('id', id)
                    .single()
                data = soil
                break

            default:
                return NextResponse.json(
                    { success: false, error: 'Invalid type' },
                    { status: 400 }
                )
        }

        if (!data) {
            return NextResponse.json(
                { success: false, error: 'Item not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data,
            type
        })
    } catch (error) {
        console.error('[Agricultural Knowledge API] Error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
