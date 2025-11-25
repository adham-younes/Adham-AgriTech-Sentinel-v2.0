export type FeatureFlag =
  | 'satelliteAutomation'
  | 'soilAnalysisAutomation'
  | 'sentinelPipeline'
  | 'satelliteCache'

const flagEnvMap: Record<FeatureFlag, keyof NodeJS.ProcessEnv> = {
  satelliteAutomation: 'NEXT_PUBLIC_FEATURE_SATELLITE_AUTOMATION',
  soilAnalysisAutomation: 'NEXT_PUBLIC_FEATURE_SOIL_ANALYSIS_AUTOMATION',
  sentinelPipeline: 'NEXT_PUBLIC_FEATURE_SENTINEL_PIPELINE',
  satelliteCache: 'NEXT_PUBLIC_FEATURE_SATELLITE_CACHE',
}

const defaultFlags: Record<FeatureFlag, boolean> = {
  satelliteAutomation: true,
  soilAnalysisAutomation: true,
  sentinelPipeline: true,
  satelliteCache: true,
}

function toBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback
  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'enabled', 'on', 'yes'].includes(normalized)) return true
  if (['0', 'false', 'disabled', 'off', 'no'].includes(normalized)) return false
  return fallback
}

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const envKey = flagEnvMap[flag]
  const value = typeof process !== 'undefined' ? process.env?.[envKey] : undefined
  return toBoolean(value, defaultFlags[flag])
}

export function getFeatureFlagSnapshot() {
  return (Object.keys(flagEnvMap) as FeatureFlag[]).reduce(
    (acc, flag) => {
      acc[flag] = isFeatureEnabled(flag)
      return acc
    },
    {} as Record<FeatureFlag, boolean>,
  )
}
