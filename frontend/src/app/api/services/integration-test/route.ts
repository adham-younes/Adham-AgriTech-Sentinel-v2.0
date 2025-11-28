/**
 * Service Integration Test API
 * 
 * Tests integration between all services.
 * 
 * @module api/services/integration-test
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceIntegration } from '@/lib/services/service-integration'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const serviceIntegration = createServiceIntegration(supabase)

    // Verify dependencies
    const dependencies = serviceIntegration.verifyDependencies()
    if (!dependencies.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing dependencies',
          missing: dependencies.missing,
        },
        { status: 500 }
      )
    }

    // Test integration
    const result = await serviceIntegration.testIntegration()

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    })
  } catch (error) {
    console.error('[Integration Test] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

