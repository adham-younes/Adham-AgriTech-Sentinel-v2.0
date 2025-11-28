/**
 * Validation Rules Module
 * 
 * Centralized business validation logic for all domain entities.
 * Ensures data integrity before database operations.
 * 
 * @module business-logic/validation-rules
 */

// ============================================================================
// Types
// ============================================================================

export interface ValidationResult {
    valid: boolean
    errors: ValidationError[]
}

export interface ValidationError {
    field: string
    code: string
    message: string
    messageAr: string
}

// ============================================================================
// Field Validation
// ============================================================================

export interface FieldInput {
    name: string
    area: number
    cropType?: string | null
    soilType?: string | null
    irrigationType?: string | null
    boundaries?: unknown
    latitude?: number | null
    longitude?: number | null
}

/**
 * Validate field creation/update data
 */
export function validateField(input: FieldInput): ValidationResult {
    const errors: ValidationError[] = []

    // Name validation
    if (!input.name || input.name.trim().length === 0) {
        errors.push({
            field: 'name',
            code: 'REQUIRED',
            message: 'Field name is required',
            messageAr: 'اسم الحقل مطلوب',
        })
    } else if (input.name.trim().length < 2) {
        errors.push({
            field: 'name',
            code: 'TOO_SHORT',
            message: 'Field name must be at least 2 characters',
            messageAr: 'يجب أن يكون اسم الحقل حرفين على الأقل',
        })
    } else if (input.name.length > 100) {
        errors.push({
            field: 'name',
            code: 'TOO_LONG',
            message: 'Field name must not exceed 100 characters',
            messageAr: 'يجب ألا يتجاوز اسم الحقل 100 حرف',
        })
    }

    // Area validation
    if (typeof input.area !== 'number' || isNaN(input.area)) {
        errors.push({
            field: 'area',
            code: 'INVALID_TYPE',
            message: 'Field area must be a valid number',
            messageAr: 'يجب أن تكون مساحة الحقل رقماً صحيحاً',
        })
    } else if (input.area <= 0) {
        errors.push({
            field: 'area',
            code: 'OUT_OF_RANGE',
            message: 'Field area must be greater than 0',
            messageAr: 'يجب أن تكون مساحة الحقل أكبر من 0',
        })
    } else if (input.area > 10000) {
        // Arbitrary max: 10,000 hectares
        errors.push({
            field: 'area',
            code: 'OUT_OF_RANGE',
            message: 'Field area exceeds maximum allowed (10,000 hectares)',
            messageAr: 'تتجاوز مساحة الحقل الحد الأقصى المسموح به (10,000 هكتار)',
        })
    }

    // Irrigation type validation
    if (input.irrigationType) {
        const validTypes = ['drip', 'sprinkler', 'flood', 'manual']
        if (!validTypes.includes(input.irrigationType.toLowerCase())) {
            errors.push({
                field: 'irrigationType',
                code: 'INVALID_VALUE',
                message: `Irrigation type must be one of: ${validTypes.join(', ')}`,
                messageAr: `يجب أن يكون نوع الري أحد: ${validTypes.join('، ')}`,
            })
        }
    }

    // Coordinates validation
    if (input.latitude !== null && input.latitude !== undefined) {
        if (typeof input.latitude !== 'number' || input.latitude < -90 || input.latitude > 90) {
            errors.push({
                field: 'latitude',
                code: 'OUT_OF_RANGE',
                message: 'Latitude must be between -90 and 90',
                messageAr: 'يجب أن يكون خط العرض بين -90 و 90',
            })
        }
    }

    if (input.longitude !== null && input.longitude !== undefined) {
        if (typeof input.longitude !== 'number' || input.longitude < -180 || input.longitude > 180) {
            errors.push({
                field: 'longitude',
                code: 'OUT_OF_RANGE',
                message: 'Longitude must be between -180 and 180',
                messageAr: 'يجب أن يكون خط الطول بين -180 و 180',
            })
        }
    }

    // Boundary validation (if provided)
    if (input.boundaries) {
        const boundaryValidation = validateBoundary(input.boundaries)
        errors.push(...boundaryValidation.errors)
    }

    return {
        valid: errors.length === 0,
        errors,
    }
}

/**
 * Validate GeoJSON boundary
 */
export function validateBoundary(boundary: unknown): ValidationResult {
    const errors: ValidationError[] = []

    if (!boundary || typeof boundary !== 'object') {
        errors.push({
            field: 'boundaries',
            code: 'INVALID_TYPE',
            message: 'Boundary must be a valid GeoJSON object',
            messageAr: 'يجب أن تكون الحدود كائن GeoJSON صحيح',
        })
        return { valid: false, errors }
    }

    const geojson = boundary as { type?: string; coordinates?: unknown }

    if (geojson.type !== 'Polygon') {
        errors.push({
            field: 'boundaries',
            code: 'INVALID_TYPE',
            message: 'Boundary type must be "Polygon"',
            messageAr: 'يجب أن يكون نوع الحدود "Polygon"',
        })
    }

    if (!Array.isArray(geojson.coordinates)) {
        errors.push({
            field: 'boundaries',
            code: 'MISSING_COORDINATES',
            message: 'Boundary must have coordinates array',
            messageAr: 'يجب أن تحتوي الحدود على مصفوفة إحداثيات',
        })
    } else {
        // Validate polygon structure
        const coords = geojson.coordinates as unknown[][]
        if (coords.length === 0) {
            errors.push({
                field: 'boundaries',
                code: 'EMPTY_POLYGON',
                message: 'Polygon cannot be empty',
                messageAr: 'لا يمكن أن يكون المضلع فارغاً',
            })
        } else {
            const ring = coords[0]
            if (!Array.isArray(ring) || ring.length < 4) {
                errors.push({
                    field: 'boundaries',
                    code: 'INVALID_POLYGON',
                    message: 'Polygon ring must have at least 4 coordinates',
                    messageAr: 'يجب أن يحتوي حلقة المضلع على 4 إحداثيات على الأقل',
                })
            }

            // Check if first and last coordinates are the same (closed ring)
            const firstCoord = ring[0] as number[]
            const lastCoord = ring[ring.length - 1] as number[]
            if (
                !Array.isArray(firstCoord) ||
                !Array.isArray(lastCoord) ||
                firstCoord[0] !== lastCoord[0] ||
                firstCoord[1] !== lastCoord[1]
            ) {
                errors.push({
                    field: 'boundaries',
                    code: 'UNCLOSED_RING',
                    message: 'Polygon ring must be closed (first and last coordinates must match)',
                    messageAr: 'يجب أن تكون حلقة المضلع مغلقة (يجب أن تتطابق الإحداثيات الأولى والأخيرة)',
                })
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    }
}

// ============================================================================
// Farm Validation
// ============================================================================

export interface FarmInput {
    name: string
    location?: string | null
    area?: number | null
    description?: string | null
}

/**
 * Validate farm creation/update data
 */
export function validateFarm(input: FarmInput): ValidationResult {
    const errors: ValidationError[] = []

    // Name validation
    if (!input.name || input.name.trim().length === 0) {
        errors.push({
            field: 'name',
            code: 'REQUIRED',
            message: 'Farm name is required',
            messageAr: 'اسم المزرعة مطلوب',
        })
    } else if (input.name.trim().length < 2) {
        errors.push({
            field: 'name',
            code: 'TOO_SHORT',
            message: 'Farm name must be at least 2 characters',
            messageAr: 'يجب أن يكون اسم المزرعة حرفين على الأقل',
        })
    } else if (input.name.length > 100) {
        errors.push({
            field: 'name',
            code: 'TOO_LONG',
            message: 'Farm name must not exceed 100 characters',
            messageAr: 'يجب ألا يتجاوز اسم المزرعة 100 حرف',
        })
    }

    // Area validation (optional)
    if (input.area !== null && input.area !== undefined) {
        if (typeof input.area !== 'number' || isNaN(input.area)) {
            errors.push({
                field: 'area',
                code: 'INVALID_TYPE',
                message: 'Farm area must be a valid number',
                messageAr: 'يجب أن تكون مساحة المزرعة رقماً صحيحاً',
            })
        } else if (input.area < 0) {
            errors.push({
                field: 'area',
                code: 'OUT_OF_RANGE',
                message: 'Farm area cannot be negative',
                messageAr: 'لا يمكن أن تكون مساحة المزرعة سالبة',
            })
        } else if (input.area > 50000) {
            errors.push({
                field: 'area',
                code: 'OUT_OF_RANGE',
                message: 'Farm area exceeds maximum allowed (50,000 hectares)',
                messageAr: 'تتجاوز مساحة المزرعة الحد الأقصى المسموح به (50,000 هكتار)',
            })
        }
    }

    // Description validation (optional)
    if (input.description && input.description.length > 500) {
        errors.push({
            field: 'description',
            code: 'TOO_LONG',
            message: 'Description must not exceed 500 characters',
            messageAr: 'يجب ألا يتجاوز الوصف 500 حرف',
        })
    }

    return {
        valid: errors.length === 0,
        errors,
    }
}

// ============================================================================
// Irrigation Schedule Validation
// ============================================================================

export interface IrrigationScheduleInput {
    fieldId: string
    scheduledAt: string | Date
    durationMinutes: number
    waterAmount?: number | null
}

/**
 * Validate irrigation schedule
 */
export function validateIrrigationSchedule(input: IrrigationScheduleInput): ValidationResult {
    const errors: ValidationError[] = []

    // Field ID validation
    if (!input.fieldId || input.fieldId.trim().length === 0) {
        errors.push({
            field: 'fieldId',
            code: 'REQUIRED',
            message: 'Field ID is required',
            messageAr: 'معرف الحقل مطلوب',
        })
    }

    // Schedule time validation
    try {
        const scheduledDate = new Date(input.scheduledAt)
        if (isNaN(scheduledDate.getTime())) {
            errors.push({
                field: 'scheduledAt',
                code: 'INVALID_DATE',
                message: 'Invalid schedule date/time',
                messageAr: 'تاريخ/وقت الجدولة غير صحيح',
            })
        } else {
            const now = new Date()
            if (scheduledDate < now) {
                errors.push({
                    field: 'scheduledAt',
                    code: 'PAST_DATE',
                    message: 'Cannot schedule irrigation in the past',
                    messageAr: 'لا يمكن جدولة الري في الماضي',
                })
            }

            // Warn if scheduled more than 30 days in advance
            const thirtyDaysFromNow = new Date()
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
            if (scheduledDate > thirtyDaysFromNow) {
                errors.push({
                    field: 'scheduledAt',
                    code: 'TOO_FAR_FUTURE',
                    message: 'Cannot schedule irrigation more than 30 days in advance',
                    messageAr: 'لا يمكن جدولة الري لأكثر من 30 يوماً مقدماً',
                })
            }
        }
    } catch {
        errors.push({
            field: 'scheduledAt',
            code: 'INVALID_DATE',
            message: 'Invalid schedule date/time format',
            messageAr: 'تنسيق تاريخ/وقت الجدولة غير صحيح',
        })
    }

    // Duration validation
    if (typeof input.durationMinutes !== 'number' || isNaN(input.durationMinutes)) {
        errors.push({
            field: 'durationMinutes',
            code: 'INVALID_TYPE',
            message: 'Duration must be a valid number',
            messageAr: 'يجب أن تكون المدة رقماً صحيحاً',
        })
    } else if (input.durationMinutes <= 0) {
        errors.push({
            field: 'durationMinutes',
            code: 'OUT_OF_RANGE',
            message: 'Duration must be greater than 0',
            messageAr: 'يجب أن تكون المدة أكبر من 0',
        })
    } else if (input.durationMinutes > 1440) {
        // Max 24 hours
        errors.push({
            field: 'durationMinutes',
            code: 'OUT_OF_RANGE',
            message: 'Duration cannot exceed 24 hours (1440 minutes)',
            messageAr: 'لا يمكن أن تتجاوز المدة 24 ساعة (1440 دقيقة)',
        })
    }

    // Water amount validation (optional)
    if (input.waterAmount !== null && input.waterAmount !== undefined) {
        if (typeof input.waterAmount !== 'number' || isNaN(input.waterAmount)) {
            errors.push({
                field: 'waterAmount',
                code: 'INVALID_TYPE',
                message: 'Water amount must be a valid number',
                messageAr: 'يجب أن تكون كمية الماء رقماً صحيحاً',
            })
        } else if (input.waterAmount < 0) {
            errors.push({
                field: 'waterAmount',
                code: 'OUT_OF_RANGE',
                message: 'Water amount cannot be negative',
                messageAr: 'لا يمكن أن تكون كمية الماء سالبة',
            })
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    }
}

// ============================================================================
// Crop Compatibility Validation
// ============================================================================

/**
 * Check if crop is compatible with soil type
 * (Simplified - would come from database in production)
 */
export function validateCropSoilCompatibility(
    cropType: string,
    soilType: string,
): ValidationResult {
    const errors: ValidationError[] = []

    // Simplified compatibility matrix
    const incompatiblePairs: Record<string, string[]> = {
        Rice: ['Sandy'], // Rice needs water-retaining soil
        Cactus: ['Clay'], // Cactus needs well-draining soil
        Wheat: ['Heavy Clay'], // Wheat struggles in dense clay
    }

    const incompatibleSoils = incompatiblePairs[cropType] || []
    if (incompatibleSoils.includes(soilType)) {
        errors.push({
            field: 'cropType',
            code: 'INCOMPATIBLE_SOIL',
            message: `${cropType} is not recommended for ${soilType} soil`,
            messageAr: `${cropType} غير موصى به لتربة ${soilType}`,
        })
    }

    return {
        valid: errors.length === 0,
        errors,
    }
}
