/**
 * Type-Safe Translation Keys
 * 
 * This file provides type safety for translation keys.
 * All translation keys should be defined here.
 */

// ============================================================================
// Translation Key Types
// ============================================================================

export type CommonTranslationKey =
  | 'common.loading'
  | 'common.error'
  | 'common.success'
  | 'common.cancel'
  | 'common.save'
  | 'common.edit'
  | 'common.delete'
  | 'common.confirm'
  | 'common.back'
  | 'common.next'
  | 'common.previous'
  | 'common.search'
  | 'common.filter'
  | 'common.sort'
  | 'common.export'
  | 'common.import'
  | 'common.refresh'
  | 'common.close'
  | 'common.open'
  | 'common.view'
  | 'common.details'
  | 'common.settings'
  | 'common.help'
  | 'common.about'
  | 'common.contact'
  | 'common.logout'
  | 'common.login'
  | 'common.register'
  | 'common.welcome'
  | 'common.goodbye'
  | 'common.yes'
  | 'common.no'
  | 'common.ok'
  | 'common.retry'
  | 'common.continue'
  | 'common.finish'
  | 'common.start'
  | 'common.stop'
  | 'common.pause'
  | 'common.resume'
  | 'common.all'

export type FieldsTranslationKey =
  | 'fields.title'
  | 'fields.add'
  | 'fields.name'
  | 'fields.area'
  | 'fields.cropType'
  | 'fields.soilType'
  | 'fields.boundary'
  | 'fields.validation.areaExceedsFarm'
  | 'fields.validation.boundaryRequired'
  | 'fields.validation.nameRequired'

export type FarmsTranslationKey =
  | 'farms.title'
  | 'farms.add'
  | 'farms.name'
  | 'farms.totalArea'
  | 'farms.location'
  | 'farms.coordinates'

export type DashboardTranslationKey =
  | 'dashboard.title'
  | 'dashboard.subtitle'
  | 'dashboard.stats.fields'
  | 'dashboard.stats.farms'
  | 'dashboard.stats.health'
  | 'dashboard.stats.yield'

export type TranslationKey =
  | CommonTranslationKey
  | FieldsTranslationKey
  | FarmsTranslationKey
  | DashboardTranslationKey
  | string

// ============================================================================
// Translation Options
// ============================================================================

export interface TranslateOptions {
  values?: Record<string, string | number>
  fallback?: string
}

// ============================================================================
// Helper to get nested translation value
// ============================================================================

export function getNestedTranslationValue(
  dictionary: Record<string, any>,
  key: string
): string | undefined {
  const keys = key.split('.')
  let value: any = dictionary

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      return undefined
    }
  }

  return typeof value === 'string' ? value : undefined
}

