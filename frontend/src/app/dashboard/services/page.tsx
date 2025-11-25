"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, Loader2, RefreshCw, Clock3, Repeat } from "lucide-react"
import { useTranslation } from "@/lib/i18n/use-language"
import { toSafeDate, formatDateTimeLocale } from "@/lib/utils/date"

type IntegrationStatus = "success" | "error"
type OverallStatus = "healthy" | "degraded" | "error"

interface ServiceStatus {
  status: IntegrationStatus
  message: string
  latencyMs: number | null
}

interface TimelineEntry {
  service: string
  status: IntegrationStatus | OverallStatus
  latencyMs: number
  startedAt: string
}

interface HealthResponse {
  status: OverallStatus
  mode: "sync" | "async"
  timestamp: string
  services: Record<string, ServiceStatus>
  timeline: TimelineEntry[]
}

const STATUS_COLORS: Record<IntegrationStatus | OverallStatus, string> = {
  success: "bg-green-500/20 border-green-500/50 text-green-400",
  healthy: "bg-green-500/20 border-green-500/50 text-green-400",
  error: "bg-red-500/20 border-red-500/50 text-red-400",
  degraded: "bg-yellow-500/20 border-yellow-500/50 text-yellow-400",
}

const STATUS_ICONS: Record<IntegrationStatus, JSX.Element> = {
  success: <CheckCircle2 className="h-5 w-5 text-green-400" />,
  error: <AlertCircle className="h-5 w-5 text-red-400" />,
}

export default function ServicesPage() {
  const { t, language } = useTranslation()
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"sync" | "async">("async")
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    checkHealth(mode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      checkHealth(mode, true)
    }, 15000)
    return () => clearInterval(interval)
  }, [autoRefresh, mode])

  async function checkHealth(selectedMode: "sync" | "async" = mode, silent = false) {
    if (!silent) {
      setLoading(true)
    }
    try {
      const response = await fetch(`/api/services/health?mode=${selectedMode}`)
      const data: HealthResponse = await response.json()
      setHealth(data)
      if (data.mode !== mode) {
        setMode(data.mode)
      }
    } catch (error) {
      console.error("[services] Error checking services health:", error)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  const overallBadgeClass = useMemo(() => {
    if (!health) return STATUS_COLORS.degraded
    return STATUS_COLORS[health.status]
  }, [health])

  const translateServiceStatus = (status: IntegrationStatus) => {
    if (status === "success") {
      return t("services_status.status_labels.healthy")
    }
    return t("services_status.status_labels.error")
  }

  const sortedTimeline = useMemo(() => {
    if (!health) return []
    return [...health.timeline].sort(
      (a, b) => {
        const da = toSafeDate(a.startedAt)?.getTime() ?? 0
        const db = toSafeDate(b.startedAt)?.getTime() ?? 0
        return da - db
      },
    )
  }, [health])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            {t("services_status.title")}
          </h1>
          <p className="text-gray-400 mt-2 max-w-2xl">{t("services_status.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-xl border border-white/10">
            {(["sync", "async"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setMode(option)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  mode === option
                    ? "bg-green-500/20 text-green-300"
                    : "bg-transparent text-gray-300 hover:bg-white/5"
                }`}
              >
                {option === "sync" ? t("services_status.sync") : t("services_status.async")}
              </button>
            ))}
          </div>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh((prev) => !prev)}
            className={`${autoRefresh ? "bg-emerald-600 hover:bg-emerald-700" : "glass-card border-white/10"} flex items-center gap-2`}
          >
            <Repeat className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} />
            <span>{t("services_status.auto_refresh")}</span>
          </Button>
          <Button
            onClick={() => checkHealth(mode)}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {t("services_status.refresh")}
          </Button>
        </div>
      </div>

      {health && (
        <>
          <Card className="glass-card p-6 border-white/10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-gray-400">{t("services_status.overall_status")}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge className={`${overallBadgeClass} border`}>{t(`services_status.status_labels.${health.status}`)}</Badge>
                  <span className="text-xs text-gray-400">{mode === "sync" ? t("services_status.sync") : t("services_status.async")}</span>
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-sm text-gray-400">{t("services_status.last_update")}</p>
                <p className="mt-1 text-sm font-mono text-green-400">
                  {formatHealthTimestamp(health.timestamp, language)}
                </p>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
              {Object.entries(health.services).map(([key, service]) => (
                <Card key={key} className={`glass-card p-6 border ${STATUS_COLORS[service.status]}`}>
                  <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      {STATUS_ICONS[service.status]}
                      <h3 className="text-lg font-semibold">
                        {t(`services_status.services.${key}`, { fallback: key })}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{service.message}</p>
                    {key === "sensors" && service.status === "error" && (
                      <p className="mt-2 text-xs text-amber-200">
                        {t("services_status.sensors_hint")}
                      </p>
                    )}
                  </div>
                    <div className="text-right text-xs text-gray-400">
                      <p>{t("services_status.latency")}</p>
                      <p className="font-mono text-sm text-green-300">
                        {service.latencyMs !== null ? `${service.latencyMs}ms` : "--"}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="glass-card p-6 border-white/10">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-200 mb-4">
                <Clock3 className="h-4 w-4" />
                {t("services_status.timeline")}
              </div>
              <div className="space-y-3">
                {sortedTimeline.map((entry) => (
                  <div key={`${entry.service}-${entry.startedAt}`} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {t(`services_status.services.${entry.service}`, { fallback: entry.service })}
                      </span>
                      <Badge className={`${STATUS_COLORS[entry.status]} border`}>
                        {translateServiceStatus(entry.status as IntegrationStatus)}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                      <span>{formatHealthTime(entry.startedAt, language)}</span>
                      <span>{entry.latencyMs}ms</span>
                    </div>
                  </div>
                ))}
                {sortedTimeline.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">{t("services_status.timeline_empty")}</p>
                )}
              </div>
            </Card>
          </div>
        </>
      )}

      {loading && !health && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        </div>
      )}
    </div>
  )
}

function formatHealthTimestamp(value: string, language: string) {
  const locale = language === "ar" ? "ar-EG" : "en-US"
  return formatDateTimeLocale(value, locale, { dateStyle: "medium", timeStyle: "short" }, value)
}

function formatHealthTime(value: string, language: string) {
  const locale = language === "ar" ? "ar-EG" : "en-US"
  return formatDateTimeLocale(value, locale, { timeStyle: "short" }, value)
}

