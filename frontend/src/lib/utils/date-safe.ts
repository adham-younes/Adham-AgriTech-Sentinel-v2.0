import { parseISO, isValid } from "date-fns"

export type DateInput = string | number | Date | null | undefined

export function safeDate(value: DateInput): Date | null {
  if (value == null) return null
  if (value instanceof Date) {
    return isValid(value) ? value : null
  }
  if (typeof value === "number") {
    const parsed = new Date(value)
    return isValid(parsed) ? parsed : null
  }
  const text = String(value).trim()
  if (!text) return null
  const iso = parseISO(text)
  if (isValid(iso)) return iso
  const normalized = text.includes("T") ? text : text.replace(" ", "T")
  const fallback = new Date(normalized)
  return isValid(fallback) ? fallback : null
}

export function formatDateSafe(
  value: DateInput,
  locale: string,
  options: Intl.DateTimeFormatOptions,
  fallback = "",
): string {
  const date = safeDate(value)
  if (!date) return fallback
  try {
    return new Intl.DateTimeFormat(locale, options).format(date)
  } catch {
    try {
      return new Intl.DateTimeFormat("en-US", options).format(date)
    } catch {
      return fallback
    }
  }
}

export function formatDateTimeSafe(
  value: DateInput,
  locale: string,
  options: Intl.DateTimeFormatOptions,
  fallback = "",
): string {
  return formatDateSafe(value, locale, options, fallback)
}

export function formatWeekdaySafe(value: DateInput, locale: string, fallback = ""): string {
  return formatDateSafe(value, locale, { weekday: "short" }, fallback)
}
