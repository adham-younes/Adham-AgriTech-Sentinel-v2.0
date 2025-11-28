/**
 * Field Service
 * 
 * Clean architecture service layer for field operations.
 * Abstracts database access and integrates business logic.
 * 
 * @module services/field-service
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { FieldData } from '../business-logic/recommendation-engine'
import {
    validateField,
    validateBoundary,
    type FieldInput,
    type ValidationResult,
} from '../business-logic/validation-rules'

// ============================================================================
// Types
// ============================================================================

export interface CreateFieldParams {
    farmId: string
    name: string
    area: number
    cropType?: string | null
    soilType?: string | null
    irrigationType?: string | null
    boundaries?: unknown
    latitude?: number | null
    longitude?: number | null
}

export interface UpdateFieldParams {
    name?: string
    area?: number
    cropType?: string | null
    soilType?: string | null
    irrigationType?: string | null
    status?: 'active' | 'inactive' | 'fallow'
    boundaries?: unknown
    latitude?: number | null
    longitude?: number | null
}

export interface ServiceResult<T> {
    success: boolean
    data?: T
    error?: {
        code: string
        message: string
        details?: unknown
    }
}

// ============================================================================
// Field Service Class
// ============================================================================

export class FieldService {
    constructor(private supabase: SupabaseClient) { }

    /**
     * Create a new field with validation
     */
    async createField(params: CreateFieldParams): Promise<ServiceResult<{ id: string }>> {
        // Validate input
        const validation = validateField(params as FieldInput)
        if (!validation.valid) {
            return {
                success: false,
                error: {
                    code: 'VALIDATION_FAILED',
                    message: validation.errors[0].message,
                    details: validation.errors,
                },
            }
        }

        // Verify farm ownership
        const {
            data: { user },
        } = await this.supabase.auth.getUser()
        if (!user) {
            return {
                success: false,
                error: {
                    code: 'AUTH_REQUIRED',
                    message: 'Authentication required',
                },
            }
        }

        // Build insert payload
        const payload = {
            farm_id: params.farmId,
            name: params.name.trim(),
            area: params.area,
            crop_type: params.cropType?.trim() || null,
            soil_type: params.soilType?.trim() || null,
            irrigation_type: params.irrigationType?.toLowerCase() || null,
            boundaries: params.boundaries || null,
            boundary_coordinates: params.boundaries || null,
            latitude: params.latitude || null,
            longitude: params.longitude || null,
            status: 'active',
        }

        // Insert into database
        const { data, error } = await this.supabase
            .from('fields')
            .insert(payload)
            .select('id')
            .single()

        if (error) {
            return {
                success: false,
                error: {
                    code: 'DB_ERROR',
                    message: error.message,
                    details: error,
                },
            }
        }

        return {
            success: true,
            data: { id: data.id },
        }
    }

    /**
     * Get field by ID
     */
    async getField(fieldId: string): Promise<ServiceResult<FieldData>> {
        const { data, error } = await this.supabase
            .from('fields')
            .select(
                `
        id,
        name,
        area,
        crop_type,
        soil_type,
        irrigation_type,
        status,
        latitude,
        longitude,
        last_ndvi,
        last_moisture,
        last_temperature,
        last_reading_at,
        planting_date,
        farms!fields_farm_id_fkey (id, name)
      `,
            )
            .eq('id', fieldId)
            .single()

        if (error) {
            return {
                success: false,
                error: {
                    code: error.code === 'PGRST116' ? 'NOT_FOUND' : 'DB_ERROR',
                    message: error.message,
                },
            }
        }

        return {
            success: true,
            data: {
                id: data.id,
                name: data.name,
                cropType: data.crop_type,
                soilType: data.soil_type,
                irrigationType: data.irrigation_type,
                area: data.area,
                lastNdvi: data.last_ndvi,
                lastMoisture: data.last_moisture,
                lastTemperature: data.last_temperature,
                lastReadingAt: data.last_reading_at,
                plantingDate: data.planting_date,
            },
        }
    }

    /**
     * Get all fields for a farm
     */
    async getFieldsByFarm(farmId: string): Promise<ServiceResult<FieldData[]>> {
        const { data, error } = await this.supabase
            .from('fields')
            .select(
                `
        id,
        name,
        area,
        crop_type,
        soil_type,
        irrigation_type,
        status,
        latitude,
        longitude,
        last_ndvi,
        last_moisture,
        last_temperature,
        last_reading_at,
        planting_date
      `,
            )
            .eq('farm_id', farmId)
            .order('created_at', { ascending: false })

        if (error) {
            return {
                success: false,
                error: {
                    code: 'DB_ERROR',
                    message: error.message,
                },
            }
        }

        const fields = data.map((f) => ({
            id: f.id,
            name: f.name,
            cropType: f.crop_type,
            soilType: f.soil_type,
            irrigationType: f.irrigation_type,
            area: f.area,
            lastNdvi: f.last_ndvi,
            lastMoisture: f.last_moisture,
            lastTemperature: f.last_temperature,
            lastReadingAt: f.last_reading_at,
            plantingDate: f.planting_date,
        }))

        return {
            success: true,
            data: fields,
        }
    }

    /**
     * Update field
     */
    async updateField(
        fieldId: string,
        params: UpdateFieldParams,
    ): Promise<ServiceResult<{ id: string }>> {
        // Validate input if provided
        if (params.name || params.area !== undefined) {
            const validation = validateField({
                name: params.name || 'temp', // Temp name for validation if not updating
                area: params.area ?? 1, // Temp area for validation if not updating
                ...(params as FieldInput),
            })

            if (!validation.valid) {
                return {
                    success: false,
                    error: {
                        code: 'VALIDATION_FAILED',
                        message: validation.errors[0].message,
                        details: validation.errors,
                    },
                }
            }
        }

        // Build update payload
        const payload: Record<string, unknown> = {}
        if (params.name) payload.name = params.name.trim()
        if (params.area !== undefined) payload.area = params.area
        if (params.cropType !== undefined) payload.crop_type = params.cropType?.trim() || null
        if (params.soilType !== undefined) payload.soil_type = params.soilType?.trim() || null
        if (params.irrigationType !== undefined)
            payload.irrigation_type = params.irrigationType?.toLowerCase() || null
        if (params.status) payload.status = params.status
        if (params.boundaries) {
            payload.boundaries = params.boundaries
            payload.boundary_coordinates = params.boundaries
        }
        if (params.latitude !== undefined) payload.latitude = params.latitude
        if (params.longitude !== undefined) payload.longitude = params.longitude

        // Update database
        const { data, error } = await this.supabase
            .from('fields')
            .update(payload)
            .eq('id', fieldId)
            .select('id')
            .single()

        if (error) {
            return {
                success: false,
                error: {
                    code: 'DB_ERROR',
                    message: error.message,
                },
            }
        }

        return {
            success: true,
            data: { id: data.id },
        }
    }

    /**
     * Delete field
     */
    async deleteField(fieldId: string): Promise<ServiceResult<void>> {
        const { error } = await this.supabase.from('fields').delete().eq('id', fieldId)

        if (error) {
            return {
                success: false,
                error: {
                    code: 'DB_ERROR',
                    message: error.message,
                },
            }
        }

        return {
            success: true,
        }
    }

    /**
     * Update field health metrics
     */
    async updateHealthMetrics(
        fieldId: string,
        metrics: {
            ndvi?: number
            moisture?: number
            temperature?: number
            readingAt?: string
        },
    ): Promise<ServiceResult<void>> {
        const payload: Record<string, unknown> = {}
        if (metrics.ndvi !== undefined) payload.last_ndvi = metrics.ndvi
        if (metrics.moisture !== undefined) payload.last_moisture = metrics.moisture
        if (metrics.temperature !== undefined) payload.last_temperature = metrics.temperature
        if (metrics.readingAt) payload.last_reading_at = metrics.readingAt

        const { error } = await this.supabase.from('fields').update(payload).eq('id', fieldId)

        if (error) {
            return {
                success: false,
                error: {
                    code: 'DB_ERROR',
                    message: error.message,
                },
            }
        }

        return {
            success: true,
        }
    }

    /**
     * Get fields near a location (spatial query)
     */
    async getFieldsNearLocation(
        latitude: number,
        longitude: number,
        radiusMeters: number = 5000,
    ): Promise<ServiceResult<FieldData[]>> {
        // This requires PostGIS spatial functions
        // Simplified implementation - would use ST_DWithin in production
        const { data, error } = await this.supabase
            .from('fields')
            .select(
                `
        id,
        name,
        area,
        crop_type,
        soil_type,
        irrigation_type,
        latitude,
        longitude,
        last_ndvi,
        last_moisture,
        last_temperature,
        last_reading_at,
        planting_date
      `,
            )
            .not('latitude', 'is', null)
            .not('longitude', 'is', null)

        if (error) {
            return {
                success: false,
                error: {
                    code: 'DB_ERROR',
                    message: error.message,
                },
            }
        }

        // Client-side filtering by distance
        // In production, this would be done in SQL with PostGIS
        const fieldsWithDistance = data
            .map((f) => ({
                field: f,
                distance: calculateDistance(latitude, longitude, f.latitude!, f.longitude!),
            }))
            .filter((item) => item.distance <= radiusMeters)
            .sort((a, b) => a.distance - b.distance)

        const fields = fieldsWithDistance.map((item) => ({
            id: item.field.id,
            name: item.field.name,
            cropType: item.field.crop_type,
            soilType: item.field.soil_type,
            irrigationType: item.field.irrigation_type,
            area: item.field.area,
            lastNdvi: item.field.last_ndvi,
            lastMoisture: item.field.last_moisture,
            lastTemperature: item.field.last_temperature,
            lastReadingAt: item.field.last_reading_at,
            plantingDate: item.field.planting_date,
        }))

        return {
            success: true,
            data: fields,
        }
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate distance between two points (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3 // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
}
