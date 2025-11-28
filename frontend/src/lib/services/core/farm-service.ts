/**
 * Farm Service
 * 
 * Clean architecture service layer for farm operations.
 * Abstracts database access and integrates business logic.
 * 
 * @module services/core/farm-service
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// Types
// ============================================================================

export interface Farm {
  id: string
  name: string
  total_area: number | null
  latitude: number | null
  longitude: number | null
  owner_id?: string
}

export interface ValidationResult {
  valid: boolean
  error?: string
  warning?: string
}

export interface GetFarmsOptions {
  userId: string
  includeFields?: boolean
}

// ============================================================================
// Farm Service Class
// ============================================================================

export class FarmService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all farms for a user
   */
  async getFarmsForUser(userId: string): Promise<Farm[]> {
    try {
      // First try farm_owners table
      const { data: ownershipRows, error: ownershipError } = await this.supabase
        .from('farm_owners')
        .select('farm_id')
        .eq('user_id', userId)
        .eq('role', 'owner')

      const farmIds =
        ownershipRows?.map((row) => row.farm_id).filter((id): id is string => Boolean(id)) ?? []

      const shouldFallbackToFarmsTable = ownershipError || farmIds.length === 0

      if (shouldFallbackToFarmsTable) {
        // Legacy path: rely on farms.owner_id
        const { data, error } = await this.supabase
          .from('farms')
          .select('id, name, total_area, latitude, longitude, owner_id')
          .eq('owner_id', userId)
          .order('name')

        if (error) throw error
        return (data || []) as Farm[]
      }

      // Modern path: use farm_owners bridge table
      const { data, error } = await this.supabase
        .from('farms')
        .select('id, name, total_area, latitude, longitude, owner_id')
        .in('id', farmIds)
        .order('name')

      if (error) throw error
      return (data || []) as Farm[]
    } catch (error) {
      console.error('[FarmService] Error fetching farms:', error)
      throw error
    }
  }

  /**
   * Get a single farm by ID
   */
  async getFarmById(farmId: string): Promise<Farm | null> {
    try {
      const { data, error } = await this.supabase
        .from('farms')
        .select('id, name, total_area, latitude, longitude, owner_id')
        .eq('id', farmId)
        .maybeSingle()

      if (error) throw error
      return data as Farm | null
    } catch (error) {
      console.error('[FarmService] Error fetching farm:', error)
      throw error
    }
  }

  /**
   * Get total area of a farm
   */
  async getFarmTotalArea(farmId: string): Promise<number | null> {
    try {
      const farm = await this.getFarmById(farmId)
      return farm?.total_area ?? null
    } catch (error) {
      console.error('[FarmService] Error getting farm area:', error)
      return null
    }
  }

  /**
   * Validate if a new field area is acceptable for a farm
   */
  async validateFarmArea(
    farmId: string,
    newFieldArea: number,
    lang: 'ar' | 'en' = 'ar'
  ): Promise<ValidationResult> {
    try {
      const farmArea = await this.getFarmTotalArea(farmId)

      if (farmArea === null) {
        return {
          valid: false,
          error: lang === 'ar'
            ? 'لم يتم العثور على مساحة المزرعة'
            : 'Farm area not found'
        }
      }

      // Block if field area is more than 150% of farm area (clearly wrong)
      if (newFieldArea > farmArea * 1.5) {
        return {
          valid: false,
          error: lang === 'ar'
            ? `خطأ: مساحة الحقل (${newFieldArea.toFixed(2)} فدان) أكبر بكثير من مساحة المزرعة (${farmArea.toFixed(2)} فدان). يرجى مراجعة الحدود المرسومة.`
            : `Error: Field area (${newFieldArea.toFixed(2)} feddan) is much larger than farm area (${farmArea.toFixed(2)} feddan). Please review the drawn boundary.`
        }
      }

      // Warn if field area is more than 120% of farm area
      if (newFieldArea > farmArea * 1.2) {
        return {
          valid: true,
          warning: lang === 'ar'
            ? `تنبيه: مساحة الحقل (${newFieldArea.toFixed(2)} فدان) أكبر من مساحة المزرعة (${farmArea.toFixed(2)} فدان) بنسبة ${((newFieldArea / farmArea - 1) * 100).toFixed(0)}%. يرجى مراجعة الحدود قبل الحفظ.`
            : `Warning: Field area (${newFieldArea.toFixed(2)} feddan) is ${((newFieldArea / farmArea - 1) * 100).toFixed(0)}% larger than farm area (${farmArea.toFixed(2)} feddan). Please review the boundary before saving.`
        }
      }

      return { valid: true }
    } catch (error) {
      console.error('[FarmService] Error validating farm area:', error)
      return {
        valid: false,
        error: lang === 'ar'
          ? 'حدث خطأ أثناء التحقق من المساحة'
          : 'An error occurred while validating area'
      }
    }
  }

  /**
   * Get sum of all field areas for a farm
   */
  async getTotalFieldsArea(farmId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('fields')
        .select('area')
        .eq('farm_id', farmId)

      if (error) throw error

      const total = (data || []).reduce((sum, field) => {
        const area = typeof field.area === 'number' ? field.area : 0
        return sum + area
      }, 0)

      return total
    } catch (error) {
      console.error('[FarmService] Error calculating total fields area:', error)
      return 0
    }
  }

  /**
   * Check if farm can accommodate a new field
   */
  async canAccommodateField(
    farmId: string,
    newFieldArea: number
  ): Promise<{ canAccommodate: boolean; reason?: string }> {
    try {
      const farmArea = await this.getFarmTotalArea(farmId)
      const existingFieldsArea = await this.getTotalFieldsArea(farmId)

      if (farmArea === null) {
        return {
          canAccommodate: false,
          reason: 'Farm area not found'
        }
      }

      const totalAfterNewField = existingFieldsArea + newFieldArea

      if (totalAfterNewField > farmArea * 1.5) {
        return {
          canAccommodate: false,
          reason: `Total field area (${totalAfterNewField.toFixed(2)} feddan) would exceed farm area (${farmArea.toFixed(2)} feddan) by more than 50%`
        }
      }

      return { canAccommodate: true }
    } catch (error) {
      console.error('[FarmService] Error checking accommodation:', error)
      return {
        canAccommodate: false,
        reason: 'An error occurred while checking accommodation'
      }
    }
  }
}

