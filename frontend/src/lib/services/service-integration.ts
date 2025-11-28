/**
 * Service Integration
 * 
 * Ensures proper integration between all services.
 * Provides unified interface for service interactions.
 * 
 * @module services/service-integration
 * 
 * @author Adham AgriTech
 * @since 1.0.0
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { DashboardService } from './dashboard-service'
import { FarmService } from './core/farm-service'
import { FieldService } from './field-service'
import { getPlatformHealth } from './health-check'

// ============================================================================
// Types
// ============================================================================

export interface ServiceContainer {
  dashboard: DashboardService
  farm: FarmService
  field: FieldService
  supabase: SupabaseClient
}

export interface ServiceIntegrationResult {
  success: boolean
  services: {
    dashboard: boolean
    farm: boolean
    field: boolean
    health: boolean
  }
  errors?: Record<string, string>
}

// ============================================================================
// Service Integration Manager
// ============================================================================

export class ServiceIntegrationManager {
  private container: ServiceContainer

  constructor(supabase: SupabaseClient) {
    this.container = {
      dashboard: new DashboardService(supabase),
      farm: new FarmService(supabase),
      field: new FieldService(supabase),
      supabase,
    }
  }

  /**
   * Get service container
   */
  getContainer(): ServiceContainer {
    return this.container
  }

  /**
   * Test all service integrations
   */
  async testIntegration(): Promise<ServiceIntegrationResult> {
    const result: ServiceIntegrationResult = {
      success: true,
      services: {
        dashboard: false,
        farm: false,
        field: false,
        health: false,
      },
      errors: {},
    }

    // Test Dashboard Service
    try {
      await this.container.dashboard.getDashboardData(null)
      result.services.dashboard = true
    } catch (error) {
      result.success = false
      result.services.dashboard = false
      result.errors = {
        ...result.errors,
        dashboard: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    // Test Farm Service
    try {
      // Test with a dummy user ID (will return empty array if no farms)
      await this.container.farm.getFarmsForUser('00000000-0000-0000-0000-000000000000')
      result.services.farm = true
    } catch (error) {
      result.success = false
      result.services.farm = false
      result.errors = {
        ...result.errors,
        farm: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    // Test Field Service
    try {
      // Test with a dummy field ID (will return null if not found)
      await this.container.field.getField('00000000-0000-0000-0000-000000000000')
      result.services.field = true
    } catch (error) {
      result.success = false
      result.services.field = false
      result.errors = {
        ...result.errors,
        field: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    // Test Health Check
    try {
      await getPlatformHealth({ supabase: this.container.supabase })
      result.services.health = true
    } catch (error) {
      result.success = false
      result.services.health = false
      result.errors = {
        ...result.errors,
        health: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    return result
  }

  /**
   * Verify service dependencies
   */
  verifyDependencies(): {
    valid: boolean
    missing: string[]
  } {
    const missing: string[] = []

    if (!this.container.supabase) {
      missing.push('Supabase client')
    }

    return {
      valid: missing.length === 0,
      missing,
    }
  }
}

/**
 * Create service integration manager
 */
export function createServiceIntegration(supabase: SupabaseClient): ServiceIntegrationManager {
  return new ServiceIntegrationManager(supabase)
}

