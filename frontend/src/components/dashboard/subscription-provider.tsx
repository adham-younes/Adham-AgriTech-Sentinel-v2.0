"use client"

import type React from "react"
import type { FeatureAccessResult } from "@/lib/domain/types/billing"

const ALWAYS_ALLOWED: FeatureAccessResult = { enabled: true }

interface SubscriptionProviderProps {
  children: React.ReactNode
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  return <>{children}</>
}

export function useSubscription() {
  return {
    planId: "free" as const,
    plan: { id: "free", name: "Free Access" },
    featureOverrides: [] as string[],
    usage: null,
    loadingUsage: false,
    refreshUsage: async () => {
      // Billing is disabled; no usage data to refresh.
    },
    checkFeatureAccess: () => ALWAYS_ALLOWED,
    trackFeatureUsage: async () => {
      // Billing is disabled; usage tracking is not required.
    },
  }
}
