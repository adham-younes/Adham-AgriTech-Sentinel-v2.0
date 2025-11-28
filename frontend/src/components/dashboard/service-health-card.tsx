/**
 * Service Health Card Component
 * 
 * Displays platform and services health status.
 * 
 * @module components/dashboard/service-health-card
 */

'use client'

import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck } from 'lucide-react'
import type { ServiceHealthSnapshot, ServiceHealthStatus } from '@/lib/services/health-check'

interface ServiceHealthCardProps {
  services: ServiceHealthSnapshot[]
  language: 'ar' | 'en'
}

const STRINGS = {
  ar: {
    health_title: 'صحة المنصة والخدمات',
    status_operational: 'جاهز',
    status_degraded: 'متأثر',
    status_down: 'متوقف',
  },
  en: {
    health_title: 'Platform & services health',
    status_operational: 'Operational',
    status_degraded: 'Degraded',
    status_down: 'Down',
  },
} as const

const ENGLISH_LABELS: Record<string, string> = {
  supabase: 'Core database',
  ai: 'Intelligence engine',
  eosda: 'Satellite analytics',
  weather: 'Weather data',
}

function statusClasses(status: ServiceHealthStatus): string {
  switch (status) {
    case 'operational':
      return 'bg-primary/10 text-primary border border-primary/20'
    case 'degraded':
      return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
    case 'down':
    default:
      return 'bg-red-500/10 text-red-500 border border-red-500/20'
  }
}

function statusLabel(status: ServiceHealthStatus, lang: 'ar' | 'en'): string {
  return STRINGS[lang][`status_${status}` as keyof typeof STRINGS['ar']] || STRINGS[lang].status_down
}

function localiseService(service: ServiceHealthSnapshot, language: 'ar' | 'en'): ServiceHealthSnapshot {
  if (language === 'ar') return service
  const label = ENGLISH_LABELS[service.id] ?? service.label
  let details = service.details
  if (service.id === 'ai') {
    const providers = Array.isArray((service.metadata as any)?.providers)
      ? ((service.metadata as any)?.providers as string[])
      : []
    details = providers.length > 0 ? `Active providers: ${providers.join(', ')}` : service.details
  } else if (service.id === 'eosda') {
    details =
      service.status === 'operational'
        ? 'Satellite analytics responding normally'
        : 'Satellite analytics temporarily unavailable.'
  } else if (service.id === 'weather') {
    details =
      service.status === 'operational' ? 'Weather data refreshed successfully' : service.details
  } else if (service.id === 'supabase') {
    details = service.status === 'operational' ? 'Data layer connection healthy' : service.details
  }
  return { ...service, label, details }
}

export const ServiceHealthCard = memo(function ServiceHealthCard({
  services,
  language,
}: ServiceHealthCardProps) {
  const t = STRINGS[language]
  const servicesView = services.map(s => localiseService(s, language))

  return (
    <Card className="glass-card border-primary/20 shadow-3d">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground text-lg">
          <ShieldCheck className="h-5 w-5 text-primary" />
          {t.health_title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {servicesView.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-card/30 p-2 hover:bg-white/5 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{service.label}</p>
              </div>
              <span
                className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold ml-2 ${statusClasses(service.status)}`}
              >
                {statusLabel(service.status, language)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
})

