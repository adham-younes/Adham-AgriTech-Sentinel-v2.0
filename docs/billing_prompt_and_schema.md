# Billing & Paywall Implementation Prompt

Use the following implementation brief if you need to (re)build the Adham AgriTech billing stack and dashboard monetisation layer from scratch. It distils the functional requirements that informed the current code base so another team or tooling pass can reproduce the same outcome.

## Text Prompt

Design and implement an end-to-end subscription and monetisation workflow for the Adham AgriTech platform:

1. **Commercial Packaging**  
   - Offer three subscription tiers: Freemium, Pro, Enterprise.  
   - Document pricing, entitlements, and upgrade/downgrade rules.  
   - Support à-la-carte services (AI Insight Packs, Satellite Tasking, Irrigation Controller Integration, Blockchain Certificates, SMS Alerts) with shared SKU identifiers across providers.

2. **Checkout & Billing Services**  
   - Build a `/api/billing` Next.js route capable of creating checkout sessions and manual invoices.  
   - Integrate both Stripe (global) and PayTabs (MENA) gateways with consistent metadata (plan ID, interval, currency, add-on SKUs).  
   - Normalise currency, interval, and add-on quantities before hitting either provider.  
   - Support enterprise custom quotes via manual amount overrides.

3. **Paywall & Feature Gating**  
   - Introduce a subscription context provider for the dashboard.  
   - Wrap gated routes/components in a feature access boundary that reads feature entitlements and usage metrics.  
   - Present upgrade prompts/paywall notices and partially lock sidebar navigation when access is restricted.  
   - Persist usage counts via `lib/analytics` so upgrade nudges display contextual data.

4. **Analytics & Revenue Reporting**  
   - Track feature usage events and expose a revenue analytics dashboard summarising invoices, receipts, and provider-level breakdowns.  
   - Link the new dashboard surface from the existing reports section and ensure filters cover provider, region, and interval.  
   - Generate invoices, receipts, and revenue summaries automatically using stored usage data.

5. **Operational Documentation**  
   - Update `docs/pricing.md` with plan definitions, checkout configuration knobs, environment variables, and invoicing automation flows.  
   - Capture compliance/regional considerations for Stripe (EU residency) and PayTabs (PCI, VAT, Arabic invoices).

Deliverables must include TypeScript domain models, reusable billing helpers, dashboard React components, and documentation updates so finance and engineering teams can operate the system.

## Data & API Schema

> The following schema mirrors the current TypeScript domain definitions (`lib/domain/types/billing.ts`) and service helpers (`lib/services/billing.ts`). Use it as the canonical contract for any reimplementation.

### Tables

| Table | Key Columns | Description |
| --- | --- | --- |
| `billing_subscriptions` | `id` (uuid), `workspace_id`, `customer_id`, `plan_id` (`freemium/pro/enterprise`), `billing_interval` (`month/year`), `provider` (`stripe/paytabs`), `status` (`active/past_due/cancelled/trialing/incomplete`), `currency`, `unit_amount`, `current_period_start`, `current_period_end`, `cancel_at_period_end`, `metadata` (jsonb) | Tracks active plans per workspace and the gateway responsible for renewals. Webhooks from Stripe/PayTabs update lifecycle fields. |
| `billing_invoices` | `id`, `invoice_number`, `workspace_id`, `customer_id`, `status` (`draft/open/paid/void/uncollectible`), `total`, `currency`, `due_date`, `issued_at`, `provider`, `hosted_invoice_url`, `pdf_url`, `metadata` (jsonb) | Stores generated invoices, regardless of whether they originated from Stripe, PayTabs, or manual creation. |
| `billing_invoice_line_items` | `id`, `invoice_id`, `sku`, `description`, `quantity`, `unit_amount`, `currency`, `subtotal`, `metadata` (jsonb) | Line items attached to invoices; SKUs align with `SERVICE_PRICING` catalog entries. |
| `billing_receipts` | `id`, `invoice_id`, `payment_intent_id`, `amount_paid`, `currency`, `provider`, `paid_at`, `payment_method`, `receipt_url`, `metadata` (jsonb) | Records cleared payments across providers to power revenue reconciliation. |
| `billing_usage_metrics` | `id`, `workspace_id`, `feature_id`, `count`, `unit`, `last_used_at`, `metadata` (jsonb) | Aggregates feature usage for entitlement checks and billing of usage-based add-ons. |

### API Contracts

- **Checkout Session Request (`POST /api/billing/checkout`)**  
  ```ts
  interface CheckoutSessionRequest {
    planId: "freemium" | "pro" | "enterprise"
    successUrl: string
    cancelUrl: string
    customerEmail?: string
    metadata?: Record<string, any>
    locale?: Stripe.Checkout.SessionCreateParams.Locale
    currency?: string
    billingInterval?: "month" | "year"
    priceId?: string
    customUnitAmount?: number
    addons?: { sku: string; quantity?: number; metadata?: Record<string, any> }[]
  }
  ```
  The service chooses Stripe or PayTabs based on workspace preferences, normalises currencies, validates add-ons against the shared catalog, and returns provider-specific session payloads.

- **Invoice Creation (`POST /api/billing/invoices`)**  
  ```ts
  interface InvoiceCreationPayload {
    workspaceId: string
    customerId: string
    lineItems: InvoiceLineItem[]
    provider: "stripe" | "paytabs"
    dueDate: string
    metadata?: Record<string, any>
  }
  ```
  Line items follow `SERVICE_PRICING` SKUs. The handler persists the invoice, pushes it to the respective provider, and returns the enriched invoice record.

- **Receipt Logging (`POST /api/billing/receipts`)**  
  ```ts
  interface ReceiptCreationPayload {
    invoiceId: string
    paymentIntentId: string
    amountPaid: number
    currency: string
    provider: "stripe" | "paytabs"
    paidAt: string
    paymentMethod: string
    metadata?: Record<string, any>
  }
  ```
  Receipts are appended to the workspace revenue ledger and surface in the revenue dashboard.

- **Usage Metrics (`POST /api/analytics/usage`)**  
  ```ts
  interface UsageMetricSummary {
    featureId: string
    count: number
    unit?: string
    lastUsedAt?: string
    metadata?: Record<string, any>
  }
  ```
  Used by dashboard components to increment usage counters and inform paywall notices.

### Domain Catalogs & Feature Map

- `BILLING_PLANS`: Tier definitions with pricing, highlight bullets, Stripe price IDs, and prompt allowances.  
- `SERVICE_PRICING`: Shared add-on catalog consumed by both checkout providers.  
- `FEATURE_ENTITLEMENTS`: Paywall matrix mapping dashboard features to required plans and usage caps.  
- `ROUTE_FEATURE_MAP`: Maps dashboard routes to feature IDs so navigation can be automatically gated.

Leverage these structures to ensure consistency between documentation, API payloads, and UI gating.

