const TRUE_VALUES = ["1", "true", "yes", "enabled", "on"]
const FALSE_VALUES = ["0", "false", "no", "disabled", "off"]

function parseFlag(value: string | undefined | null): boolean | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (TRUE_VALUES.includes(normalized)) return true
  if (FALSE_VALUES.includes(normalized)) return false
  return null
}

export function isSensorsFeatureEnabled(): boolean {
  if (typeof process === "undefined" || typeof process.env === "undefined") {
    return false
  }

  const envKeys = ["NEXT_PUBLIC_SENSORS_ENABLED", "SENSORS_ENABLED"]
  for (const key of envKeys) {
    const parsed = parseFlag(process.env[key])
    if (parsed !== null) {
      return parsed
    }
  }

  // الافتراضي: الميزة متوقفة حتى يتم تفعيلها صراحة
  return false
}
