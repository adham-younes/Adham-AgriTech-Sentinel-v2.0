# Adham AgriTech Pricing & Billing Guide

This guide outlines the commercial plans, add-on services, and billing automation workflows for the Adham AgriTech platform. It is intended for both internal product teams and customer-facing staff to ensure pricing consistency across channels.

## Subscription Tiers

| Plan | Monthly Price | Annual Price | Ideal For | Key Features |
| --- | --- | --- | --- | --- |
| **Freemium** | $0 | $0 | Smallholder farmers exploring digital tools | Farm & field management basics, 3 active fields, core weather dashboard, community forum access, limited AI assistant prompts, standard email support |
| **Pro** | $79 | $790 (17% savings) | Commercial farms that need automation & collaboration | All Freemium features, unlimited fields, irrigation optimization, AI assistant (advanced models), crop & soil analytics, satellite snapshots (4/mo), priority chat support |
| **Enterprise** | Custom (starting at $499) | Custom | Cooperatives & agribusinesses with compliance needs | All Pro features, real-time satellite feeds, multi-farm governance, predictive agronomy alerts, advanced analytics exports, dedicated success manager, 99.9% uptime SLA |

### Feature Entitlements by Tier

| Capability | Freemium | Pro | Enterprise |
| --- | --- | --- | --- |
| Farm/field CRUD | ✅ | ✅ | ✅ |
| AI Assistant daily prompts | 5 | 100 | Unlimited |
| Satellite imagery refresh | Snapshot archive | 4 per month | Hourly NDVI refresh |
| Irrigation automation recipes | Limited templates | Full library | Custom ML models |
| Agronomy intelligence alerts | — | Core alerts | Predictive network with compliance workflows |
| Team seats | 1 | 10 | Unlimited |
| API access | — | Standard | Enterprise SLA + regional shards |

## À-La-Carte & Usage-Based Services

| Service | Included In | Base Allowance | Overage Pricing | Notes |
| --- | --- | --- | --- | --- |
| **AI Insight Packs** | Pro (20/mo) · Enterprise (Unlimited) | 20 insights | $2 per extra insight | Packs deliver seasonal recommendations & economic forecasting |
| **Satellite Tasking** | Enterprise | 50 ha per task | $12 per additional 10 ha | Includes orthomosaic export & vegetation indices |
| **Irrigation Controller Integration** | Pro/Enterprise | 5 controllers | $15 per controller | Hardware activation + remote diagnostics |
| **Agronomy Alert Packs** | Enterprise | 200 alerts | $0.30 per alert | High-priority sensor & satellite anomaly notifications |
| **SMS Alerts Bundle** | Any plan | 250 SMS | $0.05 per SMS | Multilingual notifications routed through local carriers |

## Billing & Payment Rails

- **Stripe** powers international credit-card and wallet payments with automated invoicing, subscription management, and support for PSD2/SCA.
- **PayTabs** provides MENA-local card processing, Mada/KNET payments, and supports settlement in EGP/SAR/AED.
- Customers can toggle between providers per workspace; taxes and currency rules are applied automatically using Stripe Tax or PayTabs VAT APIs.

### Checkout Configuration

- `pages/api/billing` accepts `billingInterval` (`"month"` or `"year"`), optional checkout currency overrides, and a list of add-on SKUs so that the Stripe/PayTabs helpers can assemble plan + usage bundles automatically.
- Set the published Stripe price identifiers via the environment variables `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY`, `NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL`, `NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY`, and `NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUAL`. Custom enterprise quotes can provide a `customUnitAmount` instead.
- Per-service add-ons map to the `SERVICE_PRICING` catalog, ensuring both checkout providers share the same SKU identifiers and currency rules.

## Invoicing & Receipts Automation

1. **Subscription Lifecycle**
   - Webhooks from Stripe/PayTabs update the `billing_subscriptions` table (status, next billing date, payment method).
   - Renewal attempts trigger automated invoice generation via the `/api/billing` endpoint.
   - Receipts are emailed instantly with PDF attachments stored in object storage (Supabase bucket `billing-documents`).
2. **Usage-Based Charges**
   - Usage metrics recorded through `lib/analytics` accumulate per billing period.
   - Scheduled jobs (cron/Supabase Edge Functions) transform raw metrics into invoice line items (SKU, quantity, rate).
   - Administrators can review drafts inside the dashboard revenue workspace before auto-finalization.
3. **Revenue Reporting**
   - Revenue dashboards aggregate invoices, payments, refunds, and outstanding balances.
   - Filters cover date range, region, payment provider, and crop-specific services to help finance teams reconcile settlements.

## Upgrade & Downgrade Flows

- Freemium users initiate upgrade from any paywalled feature; the system requests a checkout session via `/api/billing`.
- Plan downgrades are scheduled at period end to avoid mid-cycle disruption and to ensure prorated credit compliance.
- Admins can grant temporary feature unlocks (e.g., trial satellite imagery) using the `feature_overrides` array stored with each profile.

## Compliance & Regional Considerations

- Stripe data residency in the EU (Frankfurt) with replication to Bahrain for redundancy.
- PayTabs contracts enforce PCI DSS SAQ-D compliance; card data never touches Adham AgriTech servers.
- Egyptian VAT invoices adhere to e-invoicing regulations with sequential numbering and Arabic translations automatically generated.

For implementation specifics, refer to `lib/domain/types/billing.ts`, `lib/services/billing.ts`, and the `/dashboard/reports/revenue` dashboard module.

## Usage Analytics API

- `GET /api/analytics/usage?userId=<uuid>&planId=<plan>&from=<iso>&to=<iso>` returns the cached usage summary leveraged by
  the paywall boundary to render upgrade hints and remaining allowances.
- `POST /api/analytics/usage` accepts a usage event body matching `UsageEvent` in `lib/analytics` and persists the action to
  Supabase (or the in-memory buffer when the service client is unavailable).
- Optional `flushMemory=true` may be passed to the GET endpoint during local development to clear the in-memory event buffer
  after metrics are synced.
