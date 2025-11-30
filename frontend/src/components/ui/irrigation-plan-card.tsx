/**
 * Irrigation Plan Card
 */
'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Droplets, Calendar, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react'

interface IrrigationPlanCardProps {
  plan: any
  loading: boolean
  lang: 'ar' | 'en'
}

export function IrrigationPlanCard({ plan, loading, lang }: IrrigationPlanCardProps) {
  const t = {
    ar: {
      title: 'خطة الري الذكية',
      subtitle: 'توصيات ري دقيقة بناءً على حالة التربة',
      priority: 'الأولوية',
      waterVolume: 'كمية المياه',
      schedule: 'الجدول الزمني',
      zones: 'المناطق المستهدفة',
      rationale: 'السبب',
      high: 'عالية',
      medium: 'متوسطة',
      low: 'منخفضة',
      noData: 'لا توجد خطة ري',
      analyzing: 'جاري حساب الاحتياجات المائية...',
      m3: 'م³',
      hours: 'ساعات',
      zones_count: 'مناطق',
    },
    en: {
      title: 'Smart Irrigation Plan',
      subtitle: 'Precise irrigation recommendations based on soil data',
      priority: 'Priority',
      waterVolume: 'Water Volume',
      schedule: 'Schedule',
      zones: 'Target Zones',
      rationale: 'Rationale',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      noData: 'No irrigation plan',
      analyzing: 'Calculating water needs...',
      m3: 'm³',
      hours: 'hours',
      zones_count: 'zones',
    },
  }

  if (loading) {
    return (
      <Card className="glass-card border-emerald-400/30 bg-gradient-to-br from-emerald-950/40 via-black/60 to-cyan-950/40 backdrop-blur-xl p-6 h-full flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3 text-cyan-400">
          <Droplets className="h-8 w-8 animate-bounce" />
          <p className="text-sm font-medium animate-pulse">{t[lang].analyzing}</p>
        </div>
      </Card>
    )
  }

  if (!plan) {
    return (
      <Card className="glass-card border-amber-500/30 bg-gradient-to-br from-emerald-950/40 via-black/60 to-cyan-950/40 backdrop-blur-xl p-6 h-full flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3 text-amber-400">
          <AlertTriangle className="h-8 w-8" />
          <p className="text-sm font-medium">⚠️ {t[lang].noData}</p>
        </div>
      </Card>
    )
  }

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    if (priority === 'medium') return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  }

  return (
    <Card className="glass-card border-cyan-400/30 bg-gradient-to-br from-emerald-950/40 via-black/60 to-cyan-950/40 backdrop-blur-xl p-6 h-full hover:shadow-2xl transition-all duration-300">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Droplets className="h-5 w-5 text-cyan-400" />
            <h3 className="text-xl font-bold text-cyan-400">{t[lang].title}</h3>
          </div>
          <p className="text-sm text-gray-400">{t[lang].subtitle}</p>
        </div>
        <Badge variant="outline" className={`border ${getPriorityColor(plan.irrigation_priority)}`}>
          {t[lang].priority}: {t[lang][plan.irrigation_priority as keyof typeof t.ar]}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-black/40 rounded-lg p-3 border border-cyan-500/20 text-center">
          <div className="text-xs text-cyan-400/70 mb-1">{t[lang].waterVolume}</div>
          <div className="text-xl font-bold text-white">
            {plan.total_water_volume_m3} <span className="text-sm font-normal text-gray-400">{t[lang].m3}</span>
          </div>
        </div>

        <div className="bg-black/40 rounded-lg p-3 border border-cyan-500/20 text-center">
          <div className="text-xs text-cyan-400/70 mb-1">{t[lang].schedule}</div>
          <div className="text-xl font-bold text-white">
            {plan.schedule.duration_hours} <span className="text-sm font-normal text-gray-400">{t[lang].hours}</span>
          </div>
        </div>

        <div className="bg-black/40 rounded-lg p-3 border border-cyan-500/20 text-center">
          <div className="text-xs text-cyan-400/70 mb-1">{t[lang].zones}</div>
          <div className="text-xl font-bold text-white">
            {plan.irrigation_zones.length} <span className="text-sm font-normal text-gray-400">{t[lang].zones_count}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-black/40 rounded-lg p-4 border border-cyan-500/20">
          <h4 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
            <Info className="h-4 w-4" />
            {t[lang].rationale}
          </h4>
          <p className="text-sm text-gray-300 leading-relaxed">
            {typeof plan.rationale === 'string' ? plan.rationale : (plan.rationale as any)[lang]}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>
              {lang === "ar"
                ? `كل ${plan.schedule.frequency_days} أيام، ${plan.schedule.duration_hours} ساعات`
                : `Every ${plan.schedule.frequency_days} days, ${plan.schedule.duration_hours} hours`}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
