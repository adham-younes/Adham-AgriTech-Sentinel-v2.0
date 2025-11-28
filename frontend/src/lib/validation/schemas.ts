/**
 * Validation Schemas using Zod
 * 
 * Centralized validation schemas for all domain entities.
 * Provides type-safe validation with localized error messages.
 * 
 * @module validation/schemas
 * 
 * @example
 * ```typescript
 * import { createFieldSchema } from '@/lib/validation/schemas'
 * 
 * const result = createFieldSchema.safeParse(data)
 * if (!result.success) {
 *   console.error(result.error)
 * }
 * ```
 * 
 * @author Adham AgriTech
 * @since 1.0.0
 */

import { z } from 'zod'

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid({
  message: 'Invalid UUID format',
})

/**
 * Coordinate validation schema
 */
export const coordinateSchema = z.number()
  .min(-180, 'Coordinate must be between -180 and 180')
  .max(180, 'Coordinate must be between -180 and 180')

/**
 * Latitude validation schema
 */
export const latitudeSchema = z.number()
  .min(-90, 'Latitude must be between -90 and 90')
  .max(90, 'Latitude must be between -90 and 90')

/**
 * Longitude validation schema
 */
export const longitudeSchema = z.number()
  .min(-180, 'Longitude must be between -180 and 180')
  .max(180, 'Longitude must be between -180 and 180')

/**
 * GeoJSON Polygon schema
 */
export const geoJsonPolygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(
    z.array(
      z.tuple([z.number(), z.number()])
    ).min(4, 'Polygon ring must have at least 4 coordinates')
  ),
}).refine(
  (data) => {
    const ring = data.coordinates[0]
    if (!ring || ring.length < 4) return false
    const first = ring[0]
    const last = ring[ring.length - 1]
    return first[0] === last[0] && first[1] === last[1]
  },
  {
    message: 'Polygon ring must be closed (first and last coordinates must match)',
  }
)

// ============================================================================
// Field Schemas
// ============================================================================

/**
 * Irrigation type enum
 */
export const irrigationTypeEnum = z.enum(['drip', 'sprinkler', 'flood', 'manual'], {
  errorMap: () => ({ message: 'Invalid irrigation type. Must be one of: drip, sprinkler, flood, manual' }),
})

/**
 * Field status enum
 */
export const fieldStatusEnum = z.enum(['active', 'inactive', 'fallow'], {
  errorMap: () => ({ message: 'Invalid field status. Must be one of: active, inactive, fallow' }),
})

/**
 * Create Field Schema
 */
export const createFieldSchema = z.object({
  farmId: uuidSchema,
  name: z.string()
    .min(2, 'Field name must be at least 2 characters')
    .max(100, 'Field name must not exceed 100 characters')
    .trim(),
  area: z.number()
    .positive('Field area must be greater than 0')
    .max(10000, 'Field area exceeds maximum allowed (10,000 hectares)'),
  cropType: z.string().trim().max(100).nullable().optional(),
  soilType: z.string().trim().max(100).nullable().optional(),
  irrigationType: irrigationTypeEnum.nullable().optional(),
  boundaries: geoJsonPolygonSchema.nullable().optional(),
  latitude: latitudeSchema.nullable().optional(),
  longitude: longitudeSchema.nullable().optional(),
})

/**
 * Update Field Schema
 */
export const updateFieldSchema = z.object({
  name: z.string()
    .min(2, 'Field name must be at least 2 characters')
    .max(100, 'Field name must not exceed 100 characters')
    .trim()
    .optional(),
  area: z.number()
    .positive('Field area must be greater than 0')
    .max(10000, 'Field area exceeds maximum allowed (10,000 hectares)')
    .optional(),
  cropType: z.string().trim().max(100).nullable().optional(),
  soilType: z.string().trim().max(100).nullable().optional(),
  irrigationType: irrigationTypeEnum.nullable().optional(),
  status: fieldStatusEnum.optional(),
  boundaries: geoJsonPolygonSchema.nullable().optional(),
  latitude: latitudeSchema.nullable().optional(),
  longitude: longitudeSchema.nullable().optional(),
})

// ============================================================================
// Farm Schemas
// ============================================================================

/**
 * Create Farm Schema
 */
export const createFarmSchema = z.object({
  name: z.string()
    .min(2, 'Farm name must be at least 2 characters')
    .max(100, 'Farm name must not exceed 100 characters')
    .trim(),
  location: z.string().trim().max(200).nullable().optional(),
  totalArea: z.number()
    .nonnegative('Farm area cannot be negative')
    .max(50000, 'Farm area exceeds maximum allowed (50,000 hectares)')
    .nullable()
    .optional(),
  description: z.string().trim().max(500, 'Description must not exceed 500 characters').nullable().optional(),
  latitude: latitudeSchema.nullable().optional(),
  longitude: longitudeSchema.nullable().optional(),
})

/**
 * Update Farm Schema
 */
export const updateFarmSchema = z.object({
  name: z.string()
    .min(2, 'Farm name must be at least 2 characters')
    .max(100, 'Farm name must not exceed 100 characters')
    .trim()
    .optional(),
  location: z.string().trim().max(200).nullable().optional(),
  totalArea: z.number()
    .nonnegative('Farm area cannot be negative')
    .max(50000, 'Farm area exceeds maximum allowed (50,000 hectares)')
    .nullable()
    .optional(),
  description: z.string().trim().max(500, 'Description must not exceed 500 characters').nullable().optional(),
  latitude: latitudeSchema.nullable().optional(),
  longitude: longitudeSchema.nullable().optional(),
})

// ============================================================================
// Irrigation Schedule Schemas
// ============================================================================

/**
 * Irrigation Schedule Schema
 */
export const irrigationScheduleSchema = z.object({
  fieldId: uuidSchema,
  scheduledAt: z.union([
    z.string().datetime(),
    z.date(),
  ]).refine(
    (date) => {
      const d = date instanceof Date ? date : new Date(date)
      return d > new Date()
    },
    {
      message: 'Cannot schedule irrigation in the past',
    }
  ).refine(
    (date) => {
      const d = date instanceof Date ? date : new Date(date)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      return d <= thirtyDaysFromNow
    },
    {
      message: 'Cannot schedule irrigation more than 30 days in advance',
    }
  ),
  durationMinutes: z.number()
    .positive('Duration must be greater than 0')
    .max(1440, 'Duration cannot exceed 24 hours (1440 minutes)'),
  waterAmount: z.number()
    .nonnegative('Water amount cannot be negative')
    .optional()
    .nullable(),
})

// ============================================================================
// Task Schemas
// ============================================================================

/**
 * Task status enum
 */
export const taskStatusEnum = z.enum(['pending', 'in_progress', 'completed'], {
  errorMap: () => ({ message: 'Invalid task status. Must be one of: pending, in_progress, completed' }),
})

/**
 * Create Task Schema
 */
export const createTaskSchema = z.object({
  fieldId: uuidSchema,
  name: z.string()
    .min(1, 'Task name is required')
    .max(100, 'Task name must not exceed 100 characters')
    .trim(),
  description: z.string().trim().max(500).nullable().optional(),
  dueDate: z.string().date().nullable().optional(),
  status: taskStatusEnum.default('pending'),
  recommendations: z.record(z.any()).default({}),
})

/**
 * Update Task Schema
 */
export const updateTaskSchema = z.object({
  name: z.string()
    .min(1, 'Task name is required')
    .max(100, 'Task name must not exceed 100 characters')
    .trim()
    .optional(),
  description: z.string().trim().max(500).nullable().optional(),
  dueDate: z.string().date().nullable().optional(),
  status: taskStatusEnum.optional(),
  recommendations: z.record(z.any()).optional(),
})

// ============================================================================
// Type Exports
// ============================================================================

export type CreateFieldInput = z.infer<typeof createFieldSchema>
export type UpdateFieldInput = z.infer<typeof updateFieldSchema>
export type CreateFarmInput = z.infer<typeof createFarmSchema>
export type UpdateFarmInput = z.infer<typeof updateFarmSchema>
export type IrrigationScheduleInput = z.infer<typeof irrigationScheduleSchema>
export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>

