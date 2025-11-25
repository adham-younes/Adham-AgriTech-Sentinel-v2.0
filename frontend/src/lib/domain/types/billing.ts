// ===========================================
// Adham AgriTech - Billing & Pricing Types (stubbed)
// ===========================================

export type BillingPlanId = "free"

export type BillingInterval = "month" | "year"

export interface BillingPlan {
  id: BillingPlanId
  name: string
  description: string
}

export const BILLING_PLANS: Record<BillingPlanId, BillingPlan> = {
  free: {
    id: "free",
    name: "Free Access",
    description: "Billing integrations are disabled in this deployment.",
  },
}

export const DEFAULT_PLAN_ID: BillingPlanId = "free"

export const FEATURE_ENTITLEMENTS: Record<string, never> = {}

export const ROUTE_FEATURE_MAP: Record<string, string> = {}

export type PaymentProvider = "none"

export interface InvoiceLineItem {
  id: string
  description?: string
  quantity?: number
  unitAmount?: number
  currency?: string
}

export interface BillingInvoice {
  id: string
  status?: string
  total?: number
  currency?: string
  issuedAt?: string
  provider?: PaymentProvider
  lineItems?: InvoiceLineItem[]
}

export interface BillingReceipt {
  id: string
  invoiceId?: string
  amountPaid?: number
  currency?: string
  paidAt?: string
  provider?: PaymentProvider
}

export interface RevenueSummary {
  message: string
}

export interface CheckoutAddonRequest {
  sku: string
  quantity?: number
  metadata?: Record<string, any>
}

export interface CheckoutSessionRequest {
  planId: BillingPlanId
  successUrl: string
  cancelUrl: string
  customerEmail?: string
  metadata?: Record<string, any>
  locale?: string
  currency?: string
  billingInterval?: BillingInterval
  priceId?: string
  customUnitAmount?: number
  addons?: CheckoutAddonRequest[]
}

export interface InvoiceCreationPayload {
  workspaceId: string
  customerId?: string
  lineItems?: InvoiceLineItem[]
  provider?: PaymentProvider
  dueDate?: string
  metadata?: Record<string, any>
}

export interface ReceiptCreationPayload {
  invoiceId: string
  paymentIntentId?: string
  amountPaid?: number
  currency?: string
  provider?: PaymentProvider
  paidAt?: string
  paymentMethod?: string
  metadata?: Record<string, any>
}

export interface FeatureAccessResult {
  enabled: boolean
  requiredPlan?: BillingPlanId
  usageLimit?: { limit: number | "unlimited"; unit: string }
  usage?: { count: number; limit?: number | "unlimited"; unit?: string; metadata?: Record<string, any> }
  reason?: string
  upgradeHint?: string
}
