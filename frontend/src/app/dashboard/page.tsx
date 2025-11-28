/**
 * Dashboard Page
 * 
 * Main dashboard page with comprehensive farm monitoring and analytics.
 * Refactored to use DashboardService for clean architecture.
 * 
 * @module app/dashboard/page
 * 
 * @author Adham AgriTech
 * @since 1.0.0
 */

import type React from "react"
import Link from "next/link"
import { cookies, headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { MapPin, Bot } from "lucide-react"
import { DailyBriefing } from "@/components/dashboard/daily-briefing"
import { DashboardService } from "@/lib/services/dashboard-service"
import { DashboardStatsComponent } from "@/components/dashboard/dashboard-stats"
import { DashboardMapSection } from "@/components/dashboard/dashboard-map-section"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { ServiceHealthCard } from "@/components/dashboard/service-health-card"
import { resolveActiveProfile } from "@/lib/supabase/demo-session"

// ============================================================================
// Constants
// ============================================================================

const STRINGS = {
  ar: {
    dash_title: "لوحة التحكم الرئيسية",
    dash_subtitle: "راقب مزارعك بتحليلات ذكية وصور أقمار صناعية",
    stats_fields: "الحقول",
    stats_fields_trend: "+5 هذا الشهر",
    stats_farms: "المزارع",
    stats_farms_trend: "+2 هذا الشهر",
    stats_productivity: "مؤشر صحة النبات (NDVI)",
    stats_productivity_trend: "+5% عن الشهر الماضي",
    stats_water: "استهلاك المياه",
    add_field: "إضافة حقل",
    card_3d_title: "عرض 3D Farm Intelligence",
    go_satellite: "الانتقال إلى لوحة الأقمار الصناعية",
    health_title: "صحة المنصة والخدمات",
  },
  en: {
    dash_title: "Main Dashboard",
    dash_subtitle: "Monitor your farms with smart analytics and satellite imagery",
    stats_fields: "Fields",
    stats_fields_trend: "+5 this month",
    stats_farms: "Farms",
    stats_farms_trend: "+2 this month",
    stats_productivity: "Vegetation health (NDVI)",
    stats_productivity_trend: "+5% vs last month",
    stats_water: "Water usage",
    add_field: "Add field",
    card_3d_title: "3D Farm Intelligence",
    go_satellite: "Open Satellite Console",
    health_title: "Platform & services health",
  },
} as const

// ============================================================================
// Helper Functions
// ============================================================================

type Lang = "ar" | "en"

function detectLanguage(): Lang {
  try {
    const jar = cookies()
    const stored = jar.get("adham-agritech-language")?.value
    if (stored === "en" || stored === "ar") return stored
  } catch {}
  try {
    const h = headers()
    const al = h.get("accept-language")?.toLowerCase() || ""
    if (al.startsWith("en")) return "en"
  } catch {}
  return "ar"
}

function isValidUuid(value: string | null | undefined): value is string {
  if (!value) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function buildWaterTrendText(
  averageMoisture: number | null,
  dryFieldsCount: number,
  lang: Lang
): string {
  if (averageMoisture === null && dryFieldsCount === 0) {
    return lang === "ar" ? "لا توجد بيانات رطوبة بعد" : "No moisture data yet"
  }
  if (lang === "ar") {
    if (dryFieldsCount === 0) return "كل الحقول في نطاق آمن"
    if (dryFieldsCount === 1) return "حقل واحد يحتاج ري"
    return `${dryFieldsCount} حقول تحتاج ري`
  }
  if (dryFieldsCount === 0) return "All fields are in a safe range"
  if (dryFieldsCount === 1) return "1 field needs irrigation"
  return `${dryFieldsCount} fields need irrigation`
}

// ============================================================================
// Main Component
// ============================================================================

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const lang = detectLanguage()
  const t = STRINGS[lang]
  const supabase = await createClient()
  const { user } = await resolveActiveProfile(supabase)
  const activeUserId = isValidUuid(user?.id ?? null) ? (user!.id as string) : null

  // Use DashboardService to fetch all data
  const dashboardService = new DashboardService(supabase)
  const dashboardData = await dashboardService.getDashboardData(activeUserId)

  // Update stats with farms count
  const stats = {
    ...dashboardData.stats,
    farmsCount: dashboardData.farms.length,
  }

  const waterTrendText = buildWaterTrendText(
    stats.averageMoisture,
    stats.dryFieldsCount,
    lang
  )

  const weatherMock = { temp: 28, condition: lang === "ar" ? "مشمس" : "Sunny", humidity: 45 }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl shadow-3d flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
            {t.dash_title}
          </h2>
          <p className="text-gray-400 mt-2">{t.dash_subtitle}</p>
        </div>
        <div className="flex gap-2">
          <QuickActionButton
            title={t.add_field}
            href="/dashboard/fields/new"
            icon={<MapPin className="h-5 w-5" />}
          />
          <QuickActionButton
            title="AI Assistant"
            href="/dashboard/ai-assistant"
            icon={<Bot className="h-5 w-5" />}
          />
        </div>
      </div>

      {/* Daily Briefing Summary */}
      <DailyBriefing
        weather={weatherMock}
        alertCount={dashboardData.notifications.length}
        userName={user?.user_metadata?.full_name?.split(' ')[0]}
      />

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Column: Stats & Health (1/4) */}
        <div className="space-y-6 xl:col-span-1">
          <ServiceHealthCard services={dashboardData.healthSnapshot.services} language={lang} />
          <DashboardStatsComponent
            stats={stats}
            lang={lang}
            strings={t}
            waterTrendText={waterTrendText}
          />
        </div>

        {/* Center Column: Digital Twin Map (2/4) */}
        <div className="xl:col-span-2 space-y-6">
          <DashboardMapSection
            fields={dashboardData.fields}
            lang={lang}
            strings={t}
            eosdaKey={process.env.NEXT_PUBLIC_EOSDA_API_KEY || ''}
          />
        </div>

        {/* Right Column: Analytics, Timeline, AI & Weather (1/4) */}
        <div className="space-y-6 xl:col-span-1">
          <DashboardSidebar
            fields={dashboardData.fields}
            notifications={dashboardData.notifications}
            lang={lang}
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Sub-Components
// ============================================================================

function QuickActionButton({
  title,
  href,
  icon,
}: {
  title: string
  href: string
  icon?: React.ReactNode
}) {
  return (
    <a
      href={href}
      className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-card/50 px-4 py-2 text-center transition-all duration-200 hover:bg-primary/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 group"
    >
      {icon && <span className="text-primary group-hover:scale-110 transition-transform">{icon}</span>}
      <span className="text-sm font-medium text-foreground group-hover:text-primary">{title}</span>
    </a>
  )
}
