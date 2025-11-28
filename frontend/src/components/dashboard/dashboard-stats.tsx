/**
 * Dashboard Stats Component
 * 
 * Displays key statistics cards for the dashboard.
 * 
 * @module components/dashboard/dashboard-stats
 */

'use client'

import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Sprout, TrendingUp, Droplets } from 'lucide-react'
import type { DashboardStats } from '@/lib/services/dashboard-service'

interface DashboardStatsProps {
  stats: DashboardStats
  lang: 'ar' | 'en'
  strings: {
    stats_fields: string
    stats_fields_trend: string
    stats_farms: string
    stats_farms_trend: string
    stats_productivity: string
    stats_productivity_trend: string
    stats_water: string
  }
  waterTrendText: string
}

function StatsCard({
  title,
  value,
  icon,
  trend,
  trendPositive,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  trendPositive?: boolean
}) {
  return (
    <Card className="glass-card border-primary/10 hover:border-primary/30 transition-all duration-300 group">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground group-hover:text-primary/80 transition-colors">
              {title}
            </p>
            <p className="text-2xl font-bold mt-2 text-foreground">{value}</p>
            {trend && (
              <p className={`text-xs mt-1 ${trendPositive ? 'text-primary' : 'text-muted-foreground'}`}>
                {trend}
              </p>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const DashboardStatsComponent = memo(function DashboardStatsComponent({
  stats,
  lang,
  strings,
  waterTrendText,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <StatsCard
        title={strings.stats_fields}
        value={stats.fieldsCount || 0}
        icon={<MapPin className="h-5 w-5" />}
        trend={strings.stats_fields_trend}
      />
      <StatsCard
        title={strings.stats_farms}
        value={stats.farmsCount || 0}
        icon={<Sprout className="h-5 w-5" />}
        trend={strings.stats_farms_trend}
      />
      <StatsCard
        title={strings.stats_productivity}
        value={
          stats.averageNDVI !== null
            ? `${stats.averageNDVI}%`
            : lang === 'ar'
              ? 'لا بيانات'
              : 'No data'
        }
        icon={<TrendingUp className="h-5 w-5" />}
        trend={strings.stats_productivity_trend}
        trendPositive
      />
      <StatsCard
        title={strings.stats_water}
        value={stats.averageMoisture !== null ? `${stats.averageMoisture}%` : '45%'}
        icon={<Droplets className="h-5 w-5" />}
        trend={stats.averageMoisture !== null ? waterTrendText : lang === 'ar' ? 'تقديري' : 'Estimated'}
        trendPositive={stats.dryFieldsCount === 0}
      />
    </div>
  )
})

