"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import ar from "./locales/ar.json"
import en from "./locales/en.json"

const dictionaries = { ar, en } as const

export type SupportedLanguage = keyof typeof dictionaries

type TranslateOptions = {
  fallback?: string
  values?: Record<string, string | number>
}

interface LanguageContextValue {
  language: SupportedLanguage
  direction: "ltr" | "rtl"
  toggleLanguage: () => void
  setLanguage: (lang: SupportedLanguage) => void
  t: (key: string, options?: TranslateOptions) => string
  ready: boolean
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const STORAGE_KEY = "adham-agritech-language"

function getNestedValue(dictionary: Record<string, any>, key: string) {
  return key.split(".").reduce((acc: any, part: string) => {
    if (acc && typeof acc === "object" && part in acc) {
      return acc[part]
    }
    return undefined
  }, dictionary as any) as string | undefined
}

function interpolate(template: string, values?: Record<string, string | number>) {
  if (!values) return template
  return template.replace(/\{(\w+)\}/g, (match, token) => {
    const replacement = values[token]
    return replacement !== undefined ? String(replacement) : match
  })
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>("ar")
  const [ready, setReady] = useState(false)

  const updateDocumentLanguage = useCallback((lang: SupportedLanguage) => {
    if (typeof document === "undefined") return
    document.documentElement.lang = lang
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"
    document.body?.setAttribute("dir", document.documentElement.dir)
  }, [])

  const setLanguage = useCallback(
    (lang: SupportedLanguage) => {
      setLanguageState(lang)
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, lang)
        // Persist to cookie so server components can render correct language
        try {
          document.cookie = `${STORAGE_KEY}=${lang}; path=/; max-age=31536000`
        } catch {}
      }
      updateDocumentLanguage(lang)
    },
    [updateDocumentLanguage],
  )

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "ar" ? "en" : "ar")
  }, [language, setLanguage])

  const translate = useCallback(
    (key: string, options?: TranslateOptions) => {
      const dictionary = dictionaries[language] as Record<string, any>
      const result = getNestedValue(dictionary, key)
      if (typeof result === "string" && result.length > 0) {
        return interpolate(result, options?.values)
      }
      const englishFallback = getNestedValue(dictionaries.en as Record<string, any>, key)
      if (typeof englishFallback === "string" && englishFallback.length > 0) {
        return interpolate(englishFallback, options?.values)
      }
      if (options?.fallback) {
        return interpolate(options.fallback, options.values)
      }
      return key
    },
    [language],
  )

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) as SupportedLanguage | null
    if (stored === "ar" || stored === "en") {
      setLanguageState(stored)
      updateDocumentLanguage(stored)
      try {
        if (typeof document !== "undefined") {
          document.cookie = `${STORAGE_KEY}=${stored}; path=/; max-age=31536000`
        }
      } catch {}
    } else {
      const browserLanguage = typeof window !== "undefined" ? navigator.language : "ar"
      const defaultLanguage = browserLanguage?.toLowerCase().startsWith("en") ? "en" : "ar"
      setLanguageState(defaultLanguage)
      updateDocumentLanguage(defaultLanguage)
      try {
        if (typeof document !== "undefined") {
          document.cookie = `${STORAGE_KEY}=${defaultLanguage}; path=/; max-age=31536000`
        }
      } catch {}
    }
    setReady(true)
  }, [updateDocumentLanguage])

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    direction: language === "ar" ? "rtl" : "ltr",
    toggleLanguage,
    setLanguage,
    t: translate,
    ready,
  }), [language, toggleLanguage, translate, setLanguage, ready])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguageContext() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguageContext must be used within a LanguageProvider")
  }
  return context
}

