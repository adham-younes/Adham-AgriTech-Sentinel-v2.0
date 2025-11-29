/**
 * Irrigation Plan Card
 */
'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { IrrigationPlan } from '@/lib/business-logic/field-analytics'
import { Droplets, Calendar, Clock, AlertTriangle } from 'lucide-react'

interface Props {
  plan: IrrigationPlan | null
  loading?: boolean
  lang?: 'ar' | 'en'
}

export function IrrigationPlanCard({ plan, loading = false, lang = 'ar' }: Props) {
  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-blue-900/90 via-blue-900/70 to-cyan-900/60 border border-blue-800/70">
        <div className="animate-pulse h-40 bg-blue-800/30 rounded"></div>
      </Card>
    )
  }

  if (!plan) {
    return (
      <Card className="p-6 bg-gradient-to-br from-blue-900/90 via-blue-900/70 to-cyan-900/60 border border-blue-800/70">
        <p className="text-sm text-blue-200/80">
          {lang === 'ar' ? '⚠️ لا توجد خطة ري' : '⚠️ No irrigation plan'}
        </p>
      </Card>
    )
  }

  const getPriorityColor = () => {
    if (plan.priority === 'urgent') return 'bg-red-500/80'
    if (plan.priority === 'high') return 'bg-orange-500/80'
    if (plan.priority === 'medium') return 'bg-yellow-500/80'
    return 'bg-green-500/80'
  }

  const getPriorityLabel = () => {
    if (lang === 'ar') {
      const labels: Record<string, string> = {
        urgent: 'عاجل',
        high: 'عالي',
        medium: 'متوسط',
        low: 'منخفض'
      }
      return labels[plan.priority] || plan.priority
    }
    return plan.priority.charAt(0).toUpperCase() + plan.priority.slice(1)
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-900/90 via-blue-900/70 to-cyan-900/60 border border-blue-800/70">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-blue-50">
            {lang === 'ar' ? 'خطة الري' : 'Irrigation Plan'}
          </h3>
        </div>
        <Badge className={`${getPriorityColor()} text-white border-none`}>
          {getPriorityLabel()}
        </Badge>
      </div>

      {!plan.irrigation_recommended ? (
        <div className="p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
          <p className="text-sm text-green-200">
            ✅ {lang === 'ar' ? 'لا حاجة للري حالياً' : 'No irrigation needed currently'}
          </p>
          <p className="text-xs text-green-300/70 mt-2">{plan.rationale}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plan.priority === 'urgent' && (
            <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <p className="text-sm text-red-200">
                {lang === 'ar' ? 'إرواء عاجل مطلوب!' : 'Urgent irrigation required!'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-blue-200/80 mb-1">{lang === 'ar' ? 'حجم المياه' : 'Water Volume'}</p>
              <p className="text-2xl font-bold text-blue-50">
                {plan.total_water_volume_m3?.toFixed(0) || '--'} {lang ==='ar' ? 'م³' : 'm³'}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-200/80 mb-1">{lang === 'ar' ? 'المناطق' : 'Zones'}</p>
              <p className="text-2xl font-bold text-blue-50">{plan.recommended_zones.length}</p>
            </div>
          </div>

          {plan.schedule && (
            <div className="space-y-2 p-3 bg-blue-800/20 border border-blue-700/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-100">
                <Calendar className="h-4 w-4" />
                <span>
                  {lang === 'ar' ? 'البدء:' : 'Start:'} {new Date(plan.schedule.start_date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-100">
                <Clock className="h-4 w-4" />
                <span>
                  {lang === 'ar' 
                    ? `كل ${plan.schedule.frequency_days} أيام، ${plan.schedule.duration_hours} ساعات`
                    : `Every ${plan.schedule.frequency_days} days, ${plan.schedule.duration_hours} hours`}
                </span>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-blue-200/80 mb-2">{lang === 'ar' ? 'السبب:' : 'Rationale:'}</p>
            <p className="text-sm text-blue-100">{plan.rationale}</p>
          </div>

          {plan.recommended_zones.length > 0 && (
            <div>
              <p className="text-xs text-blue-200/80 mb-2">{lang === 'ar' ? 'المناطق المستهدفة:' : 'Target Zones:'}</p>
              <div className="space-y-2">
                {plan.recommended_zones.slice(0, 3).map((zone, idx) => (
                  <div key={idx} className="text-xs text-blue-100 pl-3 border-l-2 border-blue-600/50">
                    {zone.reason} ({zone.water_need_mm}mm)
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
