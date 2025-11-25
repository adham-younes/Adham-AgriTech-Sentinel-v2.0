import type { NextApiRequest, NextApiResponse } from "next"
import {
  getUsageSummary,
  trackUsageEvent,
  flushMemoryUsageEvents,
  type UsageEvent,
} from "@/lib/analytics"
import { DEFAULT_PLAN_ID, type BillingPlanId } from "@/lib/domain/types/billing"

function parsePlanId(value: unknown): BillingPlanId {
  // Current deployment only supports the "free" plan
  return DEFAULT_PLAN_ID
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === "string") {
    return value === "true"
  }
  return Boolean(value)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { userId, planId, from, to, flushMemory } = req.query

      if (typeof userId !== "string" || userId.length === 0) {
        return res.status(400).json({ error: "Missing userId query parameter" })
      }

      const summary = await getUsageSummary({
        userId,
        planId: parsePlanId(planId),
        from: typeof from === "string" ? from : undefined,
        to: typeof to === "string" ? to : undefined,
      })

      if (flushMemory && parseBoolean(flushMemory)) {
        flushMemoryUsageEvents()
      }

      return res.status(200).json(summary)
    }

    if (req.method === "POST") {
      const payload = req.body as UsageEvent | undefined

      if (!payload || typeof payload !== "object") {
        return res.status(400).json({ error: "Missing usage event payload" })
      }

      if (!payload.userId || !payload.featureId) {
        return res.status(400).json({ error: "userId and featureId are required" })
      }

      const result = await trackUsageEvent({
        ...payload,
        planId: parsePlanId(payload.planId),
      })

      const status = result.success ? 201 : 202
      return res.status(status).json({ success: result.success, error: result.error })
    }

    res.setHeader("Allow", ["GET", "POST"])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  } catch (error: any) {
    console.error("/api/analytics/usage error", error)
    return res.status(500).json({ error: error?.message ?? "Unexpected analytics error" })
  }
}
