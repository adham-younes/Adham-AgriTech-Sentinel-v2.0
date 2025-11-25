// ===========================================
// Adham AgriTech - Usage Analytics Utilities
// ===========================================

import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { BillingPlanId } from "@/lib/domain/types/billing"

export interface UsageEvent {
  userId: string
  workspaceId?: string
  featureId: string
  action: "view" | "generate" | "update" | "export"
  planId: BillingPlanId
  units?: number
  metadata?: Record<string, any>
  occurredAt?: string
}

interface TrackUsageResult {
  success: boolean
  error?: string
}

const usageMemoryStore: UsageEvent[] = []

const globalSupabase = globalThis as unknown as {
  __billingSupabaseClient?: SupabaseClient
}

function getServiceSupabaseClient(): SupabaseClient | null {
  if (typeof window !== "undefined") {
    return null
  }

  if (globalSupabase.__billingSupabaseClient) {
    return globalSupabase.__billingSupabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !serviceKey) {
    return null
  }

  globalSupabase.__billingSupabaseClient = createSupabaseClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return globalSupabase.__billingSupabaseClient
}

async function getBrowserSupabaseClient(): Promise<SupabaseClient | null> {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const { createClient } = await import("@/lib/supabase/client")
    return createClient()
  } catch (error) {
    console.warn("analytics:getBrowserSupabaseClient", error)
    return null
  }
}

async function resolveSupabaseClient(): Promise<SupabaseClient | null> {
  return getServiceSupabaseClient() ?? (await getBrowserSupabaseClient())
}

function pushToMemoryStore(event: UsageEvent) {
  usageMemoryStore.push({ ...event, occurredAt: event.occurredAt ?? new Date().toISOString() })
}

export async function trackUsageEvent(event: UsageEvent, supabaseOverride?: SupabaseClient): Promise<TrackUsageResult> {
  const supabase = supabaseOverride ?? (await resolveSupabaseClient())
  const payload = {
    user_id: event.userId,
    workspace_id: event.workspaceId ?? null,
    feature_id: event.featureId,
    action: event.action,
    plan_id: event.planId,
    units: event.units ?? 1,
    metadata: event.metadata ?? {},
    occurred_at: event.occurredAt ?? new Date().toISOString(),
  }

  if (!supabase) {
    pushToMemoryStore(event)
    return { success: false, error: "Supabase client unavailable - stored in memory." }
  }

  try {
    const { error } = await supabase.from("usage_metrics").insert([payload])
    if (error) {
      console.warn("analytics:trackUsageEvent", error)
      pushToMemoryStore(event)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("analytics:trackUsageEvent", error)
    pushToMemoryStore(event)
    return { success: false, error: error?.message ?? "Unexpected error" }
  }
}

export interface UsageSummaryOptions {
  userId: string
  planId: BillingPlanId
  from?: string
  to?: string
  supabaseOverride?: SupabaseClient
}

export interface UsageSummary {
  totalEvents: number
  totalUnits: number
  byFeature: Record<string, UsageMetricSummary>
}

export interface UsageMetricSummary {
  featureId: string
  count: number
  unit?: string
  lastUsedAt?: string
  metadata?: Record<string, any>
}

export async function getUsageSummary(options: UsageSummaryOptions): Promise<UsageSummary> {
  const { userId, planId, from, to, supabaseOverride } = options
  const supabase = supabaseOverride ?? (await resolveSupabaseClient())

  const aggregate: UsageSummary = {
    totalEvents: 0,
    totalUnits: 0,
    byFeature: {},
  }

  const applyEvent = (event: UsageEvent) => {
    if (event.userId !== userId) return
    const occurredAt = event.occurredAt ? new Date(event.occurredAt) : new Date()
    if (from && occurredAt < new Date(from)) return
    if (to && occurredAt > new Date(to)) return

    const entry = aggregate.byFeature[event.featureId] ?? {
      featureId: event.featureId,
      count: 0,
      unit: undefined,
      lastUsedAt: undefined,
      metadata: undefined,
    }

    entry.count += event.units ?? 1
    entry.lastUsedAt = !entry.lastUsedAt || occurredAt > new Date(entry.lastUsedAt) ? occurredAt.toISOString() : entry.lastUsedAt
    aggregate.byFeature[event.featureId] = entry
    aggregate.totalEvents += 1
    aggregate.totalUnits += event.units ?? 1
  }

  if (!supabase) {
    usageMemoryStore.forEach(applyEvent)
    return aggregate
  }

  try {
    const query = supabase
      .from("usage_metrics")
      .select("feature_id, units, occurred_at, metadata")
      .eq("user_id", userId)
      .eq("plan_id", planId)
      .order("occurred_at", { ascending: false })

    if (from) {
      query.gte("occurred_at", from)
    }

    if (to) {
      query.lte("occurred_at", to)
    }

    const { data, error } = await query

    if (error) {
      console.warn("analytics:getUsageSummary", error)
      usageMemoryStore.forEach(applyEvent)
      return aggregate
    }

    data?.forEach((row: any) => {
      applyEvent({
        userId,
        planId,
        featureId: row.feature_id,
        action: "view",
        units: row.units ?? 1,
        metadata: row.metadata ?? undefined,
        occurredAt: row.occurred_at,
      })
    })
  } catch (error) {
    console.error("analytics:getUsageSummary", error)
    usageMemoryStore.forEach(applyEvent)
  }

  return aggregate
}

export function flushMemoryUsageEvents(): UsageEvent[] {
  return usageMemoryStore.splice(0, usageMemoryStore.length)
}
