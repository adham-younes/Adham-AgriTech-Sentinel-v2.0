"use client"

import { useLanguageContext } from "./language-context"
import type { TranslationKey, TranslateOptions } from "./types"

export function useLanguage() {
  return useLanguageContext()
}

/**
 * Type-safe translation hook
 * Provides type safety for translation keys
 */
export function useTranslation() {
  const { t: baseTranslate, language, direction, ready, setLanguage, toggleLanguage } = useLanguageContext()
  
  // Type-safe wrapper for translation function
  const t = (key: TranslationKey, options?: TranslateOptions) => {
    return baseTranslate(key, options)
  }
  
  return { t, language, direction, ready, setLanguage, toggleLanguage }
}

