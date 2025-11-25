"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/use-language"
import {
  LayoutDashboard,
  Sprout,
  MapPin,
  Droplets,
  Cloud,
  MessageSquare,
  Bell,
  FileText,
  ShoppingCart,
  Users,
  Settings,
  BrainCircuit,
  Handshake,
  Activity,
  Satellite,
  Code,
} from "lucide-react"

interface SidebarProps {
  user: any
  profile: any
}

type NavStatus = "live" | "beta"

const navStatusTokens: Record<NavStatus, { en: string; ar: string; className: string }> = {
  live: { en: "Live", ar: "نشط", className: "border-emerald-400/60 text-emerald-200" },
  beta: { en: "Beta", ar: "تجريبي", className: "border-amber-400/60 text-amber-200" },
}

const navigationItems = {
  dashboard: { translationKey: "navigation.dashboard", href: "/dashboard", icon: LayoutDashboard },
  satellite: { translationKey: "navigation.satellite", href: "/dashboard/satellite", icon: Satellite, status: "live" as NavStatus },
  ai: { translationKey: "navigation.ai_assistant", href: "/dashboard/ai-assistant", icon: MessageSquare, status: "live" as NavStatus },
  farms: { translationKey: "navigation.farms", href: "/dashboard/farms", icon: Sprout },
  fields: { translationKey: "navigation.fields", href: "/dashboard/fields", icon: MapPin },
  soil: { translationKey: "navigation.soil_analysis", href: "/dashboard/soil-analysis", icon: Droplets, status: "beta" as NavStatus },
  cropMonitoring: { translationKey: "navigation.crop_monitoring", href: "/dashboard/crop-monitoring", icon: Sprout },
  weather: { translationKey: "navigation.weather", href: "/dashboard/weather", icon: Cloud },
  irrigation: { translationKey: "navigation.irrigation", href: "/dashboard/irrigation", icon: Droplets, status: "beta" as NavStatus },
  agronomy: { translationKey: "navigation.agronomy_insights", href: "/dashboard/agronomy-insights", icon: BrainCircuit },
  reports: { translationKey: "navigation.reports", href: "/dashboard/reports", icon: FileText },
  notifications: { translationKey: "navigation.notifications", href: "/dashboard/notifications", icon: Bell, status: "beta" as NavStatus },
  marketplace: { translationKey: "navigation.marketplace", href: "/dashboard/marketplace", icon: ShoppingCart },
  forum: { translationKey: "navigation.forum", href: "/dashboard/forum", icon: Users },
  services: { translationKey: "navigation.services", href: "/dashboard/services", icon: Activity },
  features: { translationKey: "navigation.features", href: "/dashboard/features", icon: Code },
  partners: { translationKey: "navigation.partners", href: "/partners", icon: Handshake },
}

const navGroups = [
  { id: "overview", titleKey: "navigation_groups.overview", items: ["dashboard", "satellite", "ai"] },
  {
    id: "operations",
    titleKey: "navigation_groups.operations",
    items: ["farms", "fields", "soil", "cropMonitoring"],
  },
  {
    id: "insights",
    titleKey: "navigation_groups.insights",
    items: ["weather", "irrigation", "agronomy", "reports"],
  },
  {
    id: "engagement",
    titleKey: "navigation_groups.engagement",
    items: ["notifications", "marketplace", "forum", "partners"],
  },
  { id: "platform", titleKey: "navigation_groups.platform", items: ["services", "features"] },
]

export function DashboardSidebar({ user, profile }: SidebarProps) {
  const pathname = usePathname()
  const { t, language } = useTranslation()
  const showPartners = process.env.NEXT_PUBLIC_SHOW_PARTNERS === "true"
  const showAdvanced = process.env.NEXT_PUBLIC_ENABLE_ADVANCED_NAV === "true"
  const advancedSet = new Set([
    "/dashboard/reports",
    "/dashboard/marketplace",
    "/dashboard/forum",
    "/dashboard/features",
    "/partners",
  ])

  const isVisible = (itemId: keyof typeof navigationItems) => {
    const item = navigationItems[itemId]
    if (!item) return false
    if (item.href === "/partners") return showPartners
    return advancedSet.has(item.href) ? showAdvanced : true
  }

  return (
    <aside className="flex w-full flex-col border-l bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="glow-primary flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg">
          <Sprout className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{t("branding.name")}</span>
          <span className="text-xs text-muted-foreground">{t("branding.tagline")}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-4 overflow-y-auto p-4">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((id) => isVisible(id as keyof typeof navigationItems))
          if (visibleItems.length === 0) return null
          return (
            <div key={group.id} className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/70 px-2">
                {t(group.titleKey)}
              </p>
              <div className="space-y-1">
                {visibleItems.map((id) => {
                  const item = navigationItems[id as keyof typeof navigationItems]
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-lg glow-primary"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-accent-foreground",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="flex items-center gap-2">
                          {t(item.translationKey)}
                          {(item as any).status && (
                            <span
                              className={cn(
                                "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                                navStatusTokens[(item as any).status as keyof typeof navStatusTokens]?.className,
                              )}
                            >
                              {language === "ar" 
                                ? navStatusTokens[(item as any).status as keyof typeof navStatusTokens]?.ar 
                                : navStatusTokens[(item as any).status as keyof typeof navStatusTokens]?.en
                              }
                            </span>
                          )}
                        </span>
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Settings */}
      <div className="border-t border-sidebar-border p-4">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
            pathname === "/dashboard/settings"
              ? "bg-primary text-primary-foreground shadow-lg glow-primary"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-accent-foreground",
          )}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          <span>{t("navigation.settings")}</span>
        </Link>
      </div>
    </aside>
  )
}
