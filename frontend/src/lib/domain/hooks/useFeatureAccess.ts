"use client"

import { useCallback } from "react"
import type { FeatureAccessResult } from "@/lib/domain/types/billing"

const ALWAYS_ALLOWED: FeatureAccessResult = { enabled: true }

export function useFeatureAccess() {
  const isFeatureEnabled = useCallback((): FeatureAccessResult => ALWAYS_ALLOWED, [])

  return {
    planId: "free" as const,
    plan: { id: "free", name: "Free Access" },
    usage: null,
    loadingUsage: false,
    refreshUsage: async () => {
      // Billing is disabled; nothing to refresh.
    },
    checkAccess: isFeatureEnabled,
    trackUsage: async () => {
      // Billing is disabled; no tracking required.
    },
  }
}
