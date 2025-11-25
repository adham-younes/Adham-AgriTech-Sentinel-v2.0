"use client"

import { useLanguageContext } from "./language-context"

export function useLanguage() {
  return useLanguageContext()
}

export function useTranslation() {
  const { t, language, direction, ready, setLanguage, toggleLanguage } = useLanguageContext()
  return { t, language, direction, ready, setLanguage, toggleLanguage }
}

