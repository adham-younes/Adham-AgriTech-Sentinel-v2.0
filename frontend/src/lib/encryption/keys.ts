/**
 * Encryption utilities for sensitive API keys
 * This file provides secure handling of environment variables
 */

export function validateApiKeys(): {
  valid: boolean
  missing: string[]
  warnings: string[]
} {
  const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]

  const optional = [
    "OPENWEATHER_API_KEY",
    "OPENAI_API_KEY",
    "ESD_CLIENT_ID",
    "ESD_CLIENT_SECRET",
    "ESD_AUTH_URL",
    "ESD_API_BASE_URL"
  ]

  const exposed = ["NEXT_PUBLIC_INFURA_API_KEY", "NEXT_PUBLIC_ETHERSCAN_API_KEY"]

  const missing: string[] = []
  const warnings: string[] = []

  // Check required keys
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  // Check optional keys
  for (const key of optional) {
    if (!process.env[key]) {
      warnings.push(`Optional key missing: ${key}`)
    }
  }

  // Warn about exposed keys
  for (const key of exposed) {
    if (process.env[key]) {
      warnings.push(`⚠️ Exposed key detected: ${key} - Renew before production`)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  }
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return "***"
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`
}

export function getApiKeyStatus(keyName: string): "configured" | "missing" | "exposed" {
  const value = process.env[keyName]

  if (!value) return "missing"
  if (keyName.startsWith("NEXT_PUBLIC_")) return "exposed"
  return "configured"
}
