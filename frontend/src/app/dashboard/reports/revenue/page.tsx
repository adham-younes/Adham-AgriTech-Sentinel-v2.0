"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RevenueDashboardPage() {
  return (
    <Card className="border border-dashed border-muted-foreground/40 bg-muted/20">
      <CardHeader>
        <CardTitle>Billing dashboard unavailable</CardTitle>
        <CardDescription>
          Billing integrations are disabled in this deployment, so revenue analytics are not available.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>All product features are available without requiring a subscription.</p>
        <p>If you need billing enabled, please contact the platform administrator.</p>
      </CardContent>
    </Card>
  )
}
