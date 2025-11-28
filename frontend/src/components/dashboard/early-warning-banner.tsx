"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X, ChevronDown, ChevronUp } from "lucide-react"
import { useTranslation } from "@/lib/i18n/use-language"

interface EarlyWarningBannerProps {
  fieldId: string
  onDismiss?: () => void
}

export function EarlyWarningBanner({ fieldId, onDismiss }: EarlyWarningBannerProps) {
  const { language } = useTranslation()
  const [warnings, setWarnings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    async function fetchWarnings() {
      try {
        const response = await fetch(`/api/early-warning/check?fieldId=${fieldId}`)
        if (response.ok) {
          const data = await response.json()
          setWarnings(data.warnings || [])
        }
      } catch (error) {
        console.error("[Early Warning Banner] Error:", error)
      } finally {
        setLoading(false)
      }
    }

    if (fieldId) {
      fetchWarnings()
    }
  }, [fieldId])

  if (loading || warnings.length === 0) return null

  const criticalWarnings = warnings.filter((w) => w.severity === "critical" || w.severity === "high")
  const hasCritical = criticalWarnings.length > 0

  return (
    <Alert
      className={`mb-4 border-2 ${
        hasCritical
          ? "border-red-500/50 bg-gradient-to-r from-red-900/40 to-orange-900/40"
          : "border-amber-500/50 bg-gradient-to-r from-amber-900/40 to-yellow-900/40"
      } backdrop-blur-sm`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className={`h-5 w-5 ${hasCritical ? "text-red-400" : "text-amber-400"} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <AlertTitle className={`text-base font-bold ${hasCritical ? "text-red-200" : "text-amber-200"} mb-2`}>
            {language === "ar"
              ? `${warnings.length} ${hasCritical ? "تنبيه حرج" : "تنبيه"} يتطلب ${hasCritical ? "تدخل فوري" : "انتباه"}`
              : `${warnings.length} ${hasCritical ? "Critical" : "Warning"}${warnings.length > 1 ? "s" : ""} Require${hasCritical ? " Immediate" : ""} Attention`}
          </AlertTitle>
          {expanded && (
            <div className="space-y-2 mt-3">
              {warnings.slice(0, 3).map((warning) => (
                <AlertDescription
                  key={warning.id}
                  className={`text-sm ${hasCritical ? "text-red-100" : "text-amber-100"} bg-black/20 p-3 rounded-lg border ${hasCritical ? "border-red-500/30" : "border-amber-500/30"}`}
                >
                  <div className="font-semibold mb-1">
                    {language === "ar" ? warning.message_ar : warning.message}
                  </div>
                  <div className="text-xs opacity-90">
                    {language === "ar" ? warning.recommendation_ar : warning.recommendation}
                  </div>
                </AlertDescription>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 p-0 text-white/70 hover:text-white"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-8 w-8 p-0 text-white/70 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Alert>
  )
}

