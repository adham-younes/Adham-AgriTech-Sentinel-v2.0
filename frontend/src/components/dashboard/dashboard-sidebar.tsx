/**
 * Dashboard Sidebar Component
 * 
 * Displays the right sidebar with analytics, timeline, AI, and weather widgets.
 * 
 * @module components/dashboard/dashboard-sidebar
 */

'use client'

import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
import { WeatherWidget } from '@/components/dashboard/weather-widget'
import { SoilCropAnalytics } from '@/components/dashboard/soil-crop-analytics'
import { CropTimeline } from '@/components/dashboard/crop-timeline'
import { AiAgronomistWidget } from '@/components/dashboard/ai-agronomist-widget'
import type { FarmAnalyticsFeature } from '@/components/maps/farm-analytics-map'

interface DashboardSidebarProps {
  fields: FarmAnalyticsFeature[]
  notifications: any[]
  lang: 'ar' | 'en'
}

export const DashboardSidebar = memo(function DashboardSidebar({
  fields,
  notifications,
  lang,
}: DashboardSidebarProps) {
  const hasFields = fields.length > 0
  const firstField = fields[0]

  return (
    <div className="space-y-6">
      {hasFields && (
        <>
          <CropTimeline cropType={firstField.crop || 'Wheat'} plantingDate={firstField.plantingDate ?? null} />
          <SoilCropAnalytics fieldId={firstField.id} />
        </>
      )}

      <WeatherWidget
        latitude={firstField?.center?.[1]}
        longitude={firstField?.center?.[0]}
        locationName={firstField?.name}
      />

      <AiAgronomistWidget
        fieldId={hasFields ? firstField.id : undefined}
        cropType={hasFields ? firstField.crop : undefined}
        mode="embedded"
      />

      <Card className="glass-card border-primary/20 shadow-3d">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {lang === 'ar' ? 'التنبيهات' : 'Alerts'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifications && notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/5 p-3"
                >
                  <div
                    className={`mt-0.5 h-2 w-2 rounded-full ${
                      notification.type === 'alert'
                        ? 'bg-destructive'
                        : notification.type === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-primary'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.title_ar || notification.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {notification.message_ar || notification.message}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">
                {lang === 'ar' ? 'لا توجد إشعارات' : 'No new alerts'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

