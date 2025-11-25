"use client"

import type React from "react"
import { Card } from "@/components/ui/card"

interface PaywallNoticeProps {
  featureId?: string
  className?: string
}

export function PaywallNotice({ featureId, className }: PaywallNoticeProps) {
  return (
    <Card className={`border border-dashed border-muted-foreground/40 bg-muted/20 p-6 text-center ${className ?? ""}`}>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Billing not enabled</h3>
        <p className="text-sm text-muted-foreground">
          {featureId
            ? `The ${featureId} feature is available without plan restrictions in this deployment.`
            : "All features are available without a subscription in this deployment."}
        </p>
      </div>
    </Card>
  )
}
