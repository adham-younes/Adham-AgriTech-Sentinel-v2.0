"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useEffect, useMemo } from "react"
import { useTranslation } from "@/lib/i18n/use-language"
import type { SupportedLanguage } from "@/lib/i18n/language-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WorkgroupChannelCard } from "@/components/dashboard/workgroup-channel-card"
import { TaskPlannerCard } from "@/components/dashboard/task-planner-card"
import { demoWorkgroups } from "@/lib/domain/workgroups"
import {
  MapPin,
  Sprout,
  TrendingUp,
  Droplets,
  Cloud,
  AlertTriangle,
  ShieldCheck,
  Bot,
  BookOpen,
  Satellite,
} from "lucide-react"
import type { ReactNode } from "react"
import type { ServiceHealthSnapshot, ServiceHealthStatus } from "@/lib/services/health-check"
import { DEFAULT_PLAN_ID } from "@/lib/domain/types/billing"
import { trackUsageEvent } from "@/lib/analytics"
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client"

const SatelliteImageryCard = dynamic(
  () => import('@/components/ui/satellite-imagery-card').then((mod) => mod.SatelliteImageryCard),
  {
    ssr: false,
    loading: () => <SatelliteLoading />,
  },
)

const SatelliteLoading = () => {
  const { t } = useTranslation()
  return (
    <div className="h-[500px] w-full rounded-xl border border-white/10 bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
      {t("common.loading")}
    </div>
  )
}

export type DashboardNotification = {
  id: string
  title?: string | null
  message?: string | null
  title_ar?: string | null
  message_ar?: string | null
  type?: string | null
  created_at?: string | null
}

interface DashboardClientProps {
  fieldsCount: number
  farmsCount: number
  notifications: DashboardNotification[]
  services: ServiceHealthSnapshot[]
}

type StatDefinition = {
  key: string
  title: string
  value: ReactNode
  icon: ReactNode
  trend?: string
  positive?: boolean
}

const KNOWLEDGE_SECTIONS = ["precision", "greenhouse", "growlight", "satellite"] as const
const KNOWLEDGE_SECTION_BULLETS: Record<(typeof KNOWLEDGE_SECTIONS)[number], number> = {
  precision: 3,
  greenhouse: 3,
  growlight: 3,
  satellite: 3,
}

const QUICK_ACTION_DEFS = [
  { key: "add_field", href: "/dashboard/fields/new", icon: MapPin },
  { key: "soil_analysis", href: "/dashboard/soil-analysis/new", icon: Droplets },
  { key: "schedule_irrigation", href: "/dashboard/irrigation/new", icon: Sprout },
  { key: "launch_ai", href: "/dashboard/ai-assistant", icon: Bot },
] as const

export function DashboardClient({ fieldsCount, farmsCount, notifications, services }: DashboardClientProps) {
  const { t, language } = useTranslation()
  const preferredLanguage: SupportedLanguage = language === "ar" ? "ar" : "en"
  const locale = preferredLanguage === "ar" ? "ar-EG" : "en-US"

  const numberFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(locale)
    } catch {
      return new Intl.NumberFormat("en-US")
    }
  }, [locale])

  const percentFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 })
    } catch {
      return new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 })
    }
  }, [locale])

  useEffect(() => {
    let cancelled = false

    async function trackDashboardView() {
      try {
        const supabase = createSupabaseBrowserClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user || cancelled) return

        await trackUsageEvent({
          userId: user.id,
          featureId: "dashboard.main",
          action: "view",
          planId: DEFAULT_PLAN_ID,
        })
      } catch {
        // Analytics failures must never block dashboard rendering.
      }
    }

    void trackDashboardView()

    return () => {
      cancelled = true
    }
  }, [])

  const stats: StatDefinition[] = [
    {
      key: "fields",
      title: t("dashboard_main.stats.fields.label"),
      value: numberFormatter.format(fieldsCount),
      icon: <MapPin className="h-6 w-6 text-primary" />,
      trend: t("dashboard_main.stats.fields.trend"),
      positive: true,
    },
    {
      key: "farms",
      title: t("dashboard_main.stats.farms.label"),
      value: numberFormatter.format(farmsCount),
      icon: <Sprout className="h-6 w-6 text-primary" />,
      trend: t("dashboard_main.stats.farms.trend"),
      positive: true,
    },
    {
      key: "productivity",
      title: t("dashboard_main.stats.productivity.label"),
      value: percentFormatter.format(0.87),
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
      trend: t("dashboard_main.stats.productivity.trend"),
      positive: true,
    },
    {
      key: "water",
      title: t("dashboard_main.stats.water.label"),
      value: `${numberFormatter.format(1234)} ${t("dashboard_main.stats.water.unit")}`,
      icon: <Droplets className="h-6 w-6 text-primary" />,
      trend: t("dashboard_main.stats.water.trend"),
      positive: false,
    },
  ]

  const quickActions = QUICK_ACTION_DEFS.map((action) => ({
    ...action,
    label: t(`dashboard_main.quick_actions.items.${action.key}`),
  }))

  const knowledgeSections = KNOWLEDGE_SECTIONS.map((sectionKey) => ({
    key: sectionKey,
    title: t(`dashboard_main.knowledge.sections.${sectionKey}.title`),
    body: t(`dashboard_main.knowledge.sections.${sectionKey}.body`),
    bullets: Array.from({ length: KNOWLEDGE_SECTION_BULLETS[sectionKey] }).map((_, index) =>
      t(`dashboard_main.knowledge.sections.${sectionKey}.bullets.${index}`),
    ),
  }))

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl shadow-3d">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          {t("dashboard_main.heading")}
        </h2>
        <p className="text-gray-400 mt-2">{t("dashboard_main.subheading")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ key, ...stat }) => (
          <StatsCard key={key} {...stat} />
        ))}
      </div>

      {fieldsCount === 0 && farmsCount === 0 && (
        <div className="rounded-xl border border-white/10 bg-background/40 p-5">
          <p className="text-sm text-muted-foreground mb-3">{t("dashboard_main.empty.message")}</p>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/dashboard/farms" className="underline text-primary">
              {t("dashboard_main.empty.manage")}
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/dashboard/fields/new" className="underline text-primary">
              {t("dashboard_main.empty.add")}
            </Link>
          </div>
        </div>
      )}

      <ServiceHealthCard services={services} preferredLanguage={preferredLanguage} />

      {/* Live Satellite Data Card */}
      <div className="grid gap-6">
        <SatelliteImageryCard className="w-full" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <WeatherCard preferredLanguage={preferredLanguage} />
        <AlertsCard
          notifications={notifications}
          title={t("dashboard_main.alerts.title")}
          emptyLabel={t("dashboard_main.alerts.empty")}
          preferredLanguage={preferredLanguage}
        />
      </div>

      <QuickActions title={t("dashboard_main.quick_actions.title")} actions={quickActions} />
      <KnowledgeCard title={t("dashboard_main.knowledge.title")} sections={knowledgeSections} preferredLanguage={preferredLanguage} />

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white/80">{t("dashboard_main.workgroups.title")}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {demoWorkgroups.map((workgroup) => (
              <WorkgroupChannelCard key={workgroup.id} workgroup={workgroup} />
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white/80 mb-4">{t("dashboard_main.tasks.title")}</h3>
          <TaskPlannerCard />
          <TaskPlannerCard />
        </div>
      </div>
    </div>
  )
}

function StatsCard({ title, value, icon, trend, positive }: StatDefinition) {
  return (
    <Card className="glass-card border-primary/20 shadow-3d hover:shadow-3d-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <p className="text-3xl font-bold mt-2 text-white">{value}</p>
            {trend && (
              <p className={`text-xs mt-1 ${positive ? "text-emerald-400" : "text-red-400"}`}>
                {trend}
              </p>
            )}
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-inner">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ServiceHealthCard({ services, preferredLanguage }: { services: ServiceHealthSnapshot[]; preferredLanguage: SupportedLanguage }) {
  const { t } = useTranslation()
  const locale = preferredLanguage === "ar" ? "ar-EG" : "en-US"
  const statusBadge: Record<ServiceHealthStatus, string> = {
    operational: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    degraded: "bg-amber-500/10 text-amber-200 border-amber-500/30",
    down: "bg-amber-500/10 text-amber-200 border-amber-500/30",
  }

  return (
    <Card className="glass-card border-primary/20 shadow-3d">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          {t("dashboard_main.services.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {services.map((service) => {
          const label = service.label || service.id;
          const detail = resolveServiceDetail(service, preferredLanguage, t)
          const checkedAt = service.checkedAt ? formatServiceCheckedAt(service.checkedAt, locale) : null

          return (
            <div key={service.id} className="rounded-xl border border-white/10 p-4 bg-white/5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                  {renderServiceIcon(service.id)}
                  <span>{label}</span>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${statusBadge[service.status]}`}>
                  {t(`dashboard_main.services.status.${service.status}`)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{detail}</p>
              {checkedAt && <p className="text-xs text-muted-foreground">{checkedAt}</p>}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function resolveServiceDetail(
  service: ServiceHealthSnapshot,
  preferredLanguage: SupportedLanguage,
  t: (key: string, options?: { values?: Record<string, string | number> }) => string,
) {
  if (typeof service.details === 'object' && service.details && preferredLanguage in service.details) {
    return (service.details as any)[preferredLanguage] as string
  }

  const providers = Array.isArray(service.metadata?.providers) ? (service.metadata!.providers as string[]) : []
  if (providers.length) {
    return t("dashboard_main.services.providers", { values: { providers: providers.join(", ") } })
  }

  return service.details ?? t("dashboard_main.services.no_details")
}

function renderServiceIcon(serviceId: string) {
  switch (serviceId) {
    case "supabase":
      return <ShieldCheck className="h-5 w-5 text-primary" />
    case "ai":
      return <Bot className="h-5 w-5 text-primary" />
    case "eosda":
      return <Satellite className="h-5 w-5 text-primary" />
    case "weather":
      return <Cloud className="h-5 w-5 text-primary" />
    default:
      return <AlertTriangle className="h-5 w-5 text-primary" />
  }
}

function formatServiceCheckedAt(value: string, locale: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date)
  } catch {
    try {
      return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date)
    } catch {
      return value
    }
  }
}

function WeatherCard({ preferredLanguage }: { preferredLanguage: SupportedLanguage }) {
  const { t } = useTranslation()
  const metrics = [
    { label: t("dashboard_main.weather.humidity"), value: "65%" },
    { label: t("dashboard_main.weather.wind"), value: `12 ${t("dashboard_main.weather.wind_unit")}` },
    { label: t("dashboard_main.weather.rain"), value: `0 ${t("dashboard_main.weather.rain_unit")}` },
  ]

  return (
    <Card className="glass-card border-primary/20 shadow-3d">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-primary" />
          {t("dashboard_main.weather.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-4xl font-bold text-white">28°C</div>
        <p className="text-sm text-muted-foreground">{t("dashboard_main.weather.condition")}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-xl border border-white/10 p-3 text-center">
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className="text-lg font-semibold text-white">{metric.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function AlertsCard({
  preferredLanguage,
  notifications,
  title,
  emptyLabel,
}: {
  preferredLanguage: SupportedLanguage
  notifications: DashboardNotification[]
  title: string
  emptyLabel: string
}) {
  const locale = preferredLanguage === "ar" ? "ar-EG" : "en-US"
  return (
    <Card className="glass-card border-primary/20 shadow-3d">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.length === 0 && <p className="text-sm text-muted-foreground">{emptyLabel}</p>}
        {notifications.map((notification) => {
          const message = preferredLanguage === "ar" ? notification.message_ar ?? notification.message : notification.message ?? notification.message_ar
          const notifTitle = preferredLanguage === "ar" ? notification.title_ar ?? notification.title : notification.title ?? notification.title_ar
          const timestamp = notification.created_at
            ? formatServiceCheckedAt(notification.created_at, locale)
            : null

          return (
            <div key={notification.id} className="rounded-xl border border-white/10 p-3 bg-white/5">
              {notifTitle && <p className="text-sm font-semibold text-white">{notifTitle}</p>}
              {message && <p className="text-sm text-muted-foreground">{message}</p>}
              {timestamp && <p className="text-xs text-muted-foreground mt-1">{timestamp}</p>}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function QuickActions({
  title,
  actions,
}: {
  title: string
  actions: Array<{ key: string; label: string; href: string; icon: typeof MapPin }>
}) {
  return (
    <Card className="glass-card border-primary/20 shadow-3d">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => (
            <Link
              key={action.key}
              href={action.href}
              className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2 hover:border-primary/40 transition"
            >
              <action.icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-white">{action.label}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function KnowledgeCard({
  title,
  sections,
  preferredLanguage,
}: {
  title: string
  sections: Array<{ key: string; title: string; body: string; bullets: string[] }>
  preferredLanguage: SupportedLanguage
}) {
  return (
    <Card className="glass-card border-primary/20 shadow-3d">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          {sections.map((section) => (
            <div key={section.key} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
              <h4 className="text-white font-semibold">{section.title}</h4>
              <p className="text-sm text-muted-foreground">{section.body}</p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                {section.bullets.map((bullet, index) => (
                  <li key={`${section.key}-bullet-${index}`}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
