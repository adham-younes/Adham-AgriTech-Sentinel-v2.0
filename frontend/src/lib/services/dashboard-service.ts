/**
 * Dashboard Service
 * 
 * Centralized business logic for dashboard operations.
 * Handles data fetching, aggregation, and transformation.
 * 
 * @module services/dashboard-service
 * 
 * @author Adham AgriTech
 * @since 1.0.0
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { FarmService } from './core/farm-service'
import { eosdaPublicConfig } from '@/lib/config/eosda'
import type { FarmAnalyticsFeature } from '@/components/maps/farm-analytics-map'

// ============================================================================
// Types
// ============================================================================

export interface DashboardStats {
  farmsCount: number
  fieldsCount: number
  averageNDVI: number | null
  averageMoisture: number | null
  dryFieldsCount: number
  averageChlorophyll: number | null
}

export interface DashboardData {
  farms: string[]
  fields: FarmAnalyticsFeature[]
  stats: DashboardStats
  notifications: any[]
  healthSnapshot: any
}

export interface FieldRow {
  id: string
  name: string | null
  crop_type?: string | null
  area?: number | string | null
  boundary_coordinates?: unknown
  ndvi_score?: number | string | null
  last_ndvi?: number | string | null
  last_moisture?: number | string | null
  last_temperature?: number | string | null
  last_reading_at?: string | null
  moisture_index?: number | string | null
  yield_potential?: number | string | null
  updated_at?: string | null
  latitude?: number | string | null
  longitude?: number | string | null
  farms?: {
    latitude?: number | string | null
    longitude?: number | string | null
  } | {
    latitude?: number | string | null
    longitude?: number | string | null
  }[] | null
}

// ============================================================================
// Constants
// ============================================================================

const MAX_DASHBOARD_FIELDS = 12
const FEDDAN_IN_SQUARE_METERS = 4200
const DRY_FIELD_THRESHOLD = 40

// ============================================================================
// Dashboard Service Class
// ============================================================================

export class DashboardService {
  private farmService: FarmService

  constructor(private supabase: SupabaseClient) {
    this.farmService = new FarmService(supabase)
  }

  /**
   * Get all dashboard data for a user
   */
  async getDashboardData(userId: string | null): Promise<DashboardData> {
    // Get owned farms
    const farms = await this.getOwnedFarms(userId)
    
    // Get fields for those farms
    const fields = await this.getFieldsForDashboard(farms)
    
    // Calculate statistics
    const stats = this.calculateStats(fields)
    
    // Get notifications
    const notifications = await this.getNotifications(userId)
    
    // Get health snapshot
    const healthSnapshot = await this.getHealthSnapshot()

    return {
      farms,
      fields,
      stats,
      notifications,
      healthSnapshot,
    }
  }

  /**
   * Get owned farm IDs for a user
   */
  private async getOwnedFarms(userId: string | null): Promise<string[]> {
    if (userId) {
      const { data: ownershipRows, error } = await this.supabase
        .from('farm_owners')
        .select('farm_id')
        .eq('user_id', userId)
        .eq('role', 'owner')

      if (error) {
        console.error('[DashboardService] Failed to load farm ownership:', error)
        return []
      }

      return ownershipRows?.map(row => row.farm_id).filter((id): id is string => Boolean(id)) ?? []
    }

    // Demo mode: get all farms
    const { data: farms, error } = await this.supabase
      .from('farms')
      .select('id')

    if (error) {
      console.error('[DashboardService] Failed to load farms for demo mode:', error)
      return []
    }

    return farms?.map(row => row.id).filter((id): id is string => Boolean(id)) ?? []
  }

  /**
   * Get fields for dashboard display
   */
  private async getFieldsForDashboard(farmIds: string[]): Promise<FarmAnalyticsFeature[]> {
    if (farmIds.length === 0) {
      return []
    }

    const { data: fieldsData, error } = await this.supabase
      .from('fields')
      .select(
        'id, name, crop_type, area, boundary_coordinates, ndvi_score, moisture_index, yield_potential, updated_at, latitude, longitude, last_ndvi, last_moisture, last_temperature, last_reading_at, farms!fields_farm_id_fkey(latitude, longitude)'
      )
      .in('farm_id', farmIds)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(MAX_DASHBOARD_FIELDS)

    if (error) {
      console.error('[DashboardService] Failed to load fields:', error)
      return []
    }

    const fieldRows: FieldRow[] = fieldsData ?? []
    return fieldRows
      .map(row => this.mapFieldRowToFeature(row))
      .filter((feature): feature is FarmAnalyticsFeature => feature !== null)
  }

  /**
   * Map database field row to analytics feature
   */
  private mapFieldRowToFeature(row: FieldRow): FarmAnalyticsFeature | null {
    if (!row.id) return null

    const polygon = this.parsePolygonCoordinates(row.boundary_coordinates)
    const center = this.deriveCenter(row, polygon)
    const areaFeddan = this.parseNumber(row.area)
    const footprint = polygon ?? this.computeFallbackPolygon(center, areaFeddan)

    return {
      id: row.id,
      name: row.name ?? 'Unnamed field',
      crop: row.crop_type,
      areaFeddan: areaFeddan ?? null,
      ndvi: this.clampNdvi(row.last_ndvi ?? row.ndvi_score) ?? undefined,
      moisture: this.toPercent(row.last_moisture ?? row.moisture_index) ?? undefined,
      yieldPotential: this.toPercent(row.yield_potential) ?? undefined,
      health: this.clampNdvi(row.last_ndvi ?? row.ndvi_score) ?? undefined,
      lastUpdated: row.last_reading_at ?? row.updated_at ?? null,
      center,
      polygon: footprint,
    }
  }

  /**
   * Calculate dashboard statistics
   */
  private calculateStats(fields: FarmAnalyticsFeature[]): DashboardStats {
    const ndviValues = fields
      .map(f => (typeof f.ndvi === 'number' ? f.ndvi : null))
      .filter((v): v is number => v !== null && Number.isFinite(v))

    const moistureValues = fields
      .map(f => (typeof f.moisture === 'number' ? f.moisture : null))
      .filter((v): v is number => v !== null && Number.isFinite(v))

    let averageNDVI: number | null = null
    let averageMoisture: number | null = null
    let dryFieldsCount = 0
    let averageChlorophyll: number | null = null

    if (ndviValues.length > 0) {
      const ndviSum = ndviValues.reduce((acc, value) => acc + value, 0)
      const ndviAvg = ndviSum / ndviValues.length
      const ndviPercent = Math.round(ndviAvg * 100)
      averageNDVI = ndviPercent
      averageChlorophyll = Math.max(0, Math.min(100, Math.round(ndviPercent * 1.05)))
    }

    if (moistureValues.length > 0) {
      const sum = moistureValues.reduce((acc, value) => acc + value, 0)
      averageMoisture = Math.round(sum / moistureValues.length)
      dryFieldsCount = moistureValues.filter(value => value < DRY_FIELD_THRESHOLD).length
    }

    return {
      farmsCount: 0, // Will be set by caller
      fieldsCount: fields.length,
      averageNDVI,
      averageMoisture,
      dryFieldsCount,
      averageChlorophyll,
    }
  }

  /**
   * Get recent notifications
   */
  private async getNotifications(userId: string | null): Promise<any[]> {
    let query = this.supabase
      .from('notifications')
      .select('*')
      .eq('is_read', false)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data } = await query
      .order('created_at', { ascending: false })
      .limit(5)

    return data || []
  }

  /**
   * Get platform health snapshot
   */
  private async getHealthSnapshot(): Promise<any> {
    // Import dynamically to avoid circular dependencies
    const { getPlatformHealth } = await import('./health-check')
    return getPlatformHealth({ supabase: this.supabase })
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private parseNumber(value: unknown): number | null {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value)
      return Number.isFinite(parsed) ? parsed : null
    }
    return null
  }

  private clampNdvi(value: unknown): number | null {
    const numeric = this.parseNumber(value)
    if (numeric == null) return null
    if (numeric > 1.2) return Math.min(1, Math.max(0, numeric / 100))
    if (numeric < -1) return null
    return Math.min(1, Math.max(0, numeric))
  }

  private toPercent(value: unknown): number | null {
    const numeric = this.parseNumber(value)
    if (numeric == null) return null
    if (numeric <= 1) return Math.round(numeric * 100)
    return Math.round(numeric)
  }

  private parsePolygonCoordinates(value: unknown): [number, number][] | null {
    if (!value) return null
    if (Array.isArray(value)) {
      if (value.length === 0) return null
      if (Array.isArray(value[0]) && value[0].length === 2 && typeof value[0][0] !== 'object') {
        const coords = value
          .map((pair) => {
            const lng = this.parseNumber((pair as any)[0])
            const lat = this.parseNumber((pair as any)[1])
            if (lng == null || lat == null) return null
            return [lng, lat] as [number, number]
          })
          .filter((point): point is [number, number] => point !== null)
        return coords.length >= 3 ? coords : null
      }
      if (Array.isArray(value[0]) && Array.isArray(value[0][0])) {
        return this.parsePolygonCoordinates(value[0])
      }
    }
    if (typeof value === 'object' && value !== null && 'coordinates' in value) {
      return this.parsePolygonCoordinates((value as any).coordinates)
    }
    return null
  }

  private computeFallbackPolygon(center: [number, number], areaFeddan: number | null): [number, number][] {
    const fallbackFeddan = areaFeddan && areaFeddan > 0 ? areaFeddan : 1.2
    const areaSquareMeters = fallbackFeddan * FEDDAN_IN_SQUARE_METERS
    const halfSideMeters = Math.sqrt(areaSquareMeters) / 2
    const latOffset = halfSideMeters / 111_320
    const lngMetersPerDegree = Math.cos((center[1] * Math.PI) / 180) * 111_320 || 111_320
    const lngOffset = halfSideMeters / lngMetersPerDegree
    return [
      [center[0] - lngOffset, center[1] - latOffset],
      [center[0] + lngOffset, center[1] - latOffset],
      [center[0] + lngOffset, center[1] + latOffset],
      [center[0] - lngOffset, center[1] + latOffset],
    ]
  }

  private deriveCenter(row: FieldRow, polygon: [number, number][] | null): [number, number] {
    if (polygon && polygon.length > 0) {
      const { lng, lat } = polygon.reduce(
        (acc, [lon, la]) => ({ lng: acc.lng + lon, lat: acc.lat + la }),
        { lng: 0, lat: 0 }
      )
      return [lng / polygon.length, lat / polygon.length]
    }
    const lat = this.parseNumber(row.latitude)
    const lng = this.parseNumber(row.longitude)
    if (lat != null && lng != null) return [lng, lat]
    const farmLat = this.parseNumber(Array.isArray(row.farms) ? row.farms[0]?.latitude : row.farms?.latitude)
    const farmLng = this.parseNumber(Array.isArray(row.farms) ? row.farms[0]?.longitude : row.farms?.longitude)
    if (farmLat != null && farmLng != null) return [farmLng, farmLat]
    // Default center from config
    return [eosdaPublicConfig.center.lng, eosdaPublicConfig.center.lat]
  }
}

