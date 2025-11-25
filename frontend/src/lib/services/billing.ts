// ===========================================
// Adham AgriTech - Billing Service Helpers (stubbed)
// ===========================================

import type {
  BillingInvoice,
  BillingReceipt,
  CheckoutSessionRequest,
  InvoiceCreationPayload,
  PaymentProvider,
  ReceiptCreationPayload,
  RevenueSummary,
} from "@/lib/domain/types/billing"

const NOT_ENABLED_ERROR = new Error("Billing integrations are disabled in this deployment.")

export function getPricingMatrix() {
  return {
    enabled: false,
    message: "Billing integrations are disabled in this deployment.",
    plans: {},
  }
}

export async function createCheckoutSession(
  _provider: PaymentProvider,
  _request: CheckoutSessionRequest,
): Promise<{ url?: string }> {
  throw NOT_ENABLED_ERROR
}

export async function createBillingInvoice(_payload: InvoiceCreationPayload): Promise<BillingInvoice> {
  throw NOT_ENABLED_ERROR
}

export async function createBillingReceipt(_payload: ReceiptCreationPayload): Promise<BillingReceipt> {
  throw NOT_ENABLED_ERROR
}

export async function listBillingInvoices(): Promise<BillingInvoice[]> {
  return []
}

export async function listBillingReceipts(): Promise<BillingReceipt[]> {
  return []
}

export async function getRevenueSummary(): Promise<RevenueSummary> {
  return { message: "Billing integrations are disabled in this deployment." }
}
