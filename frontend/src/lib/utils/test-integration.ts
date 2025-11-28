/**
 * Integration Test Utility
 * 
 * Tests service integration locally.
 * 
 * @module utils/test-integration
 */

import { createClient } from '@/lib/supabase/server'
import { createServiceIntegration } from '@/lib/services/service-integration'

/**
 * Test all service integrations
 */
export async function testServiceIntegration() {
  try {
    const supabase = await createClient()
    const serviceIntegration = createServiceIntegration(supabase)

    // Verify dependencies
    const dependencies = serviceIntegration.verifyDependencies()
    if (!dependencies.valid) {
      console.error('❌ Missing dependencies:', dependencies.missing)
      return false
    }

    // Test integration
    const result = await serviceIntegration.testIntegration()

    if (result.success) {
      console.log('✅ All services integrated successfully')
      console.log('Services status:', result.services)
      return true
    } else {
      console.error('❌ Service integration failed')
      console.error('Errors:', result.errors)
      return false
    }
  } catch (error) {
    console.error('❌ Integration test failed:', error)
    return false
  }
}

