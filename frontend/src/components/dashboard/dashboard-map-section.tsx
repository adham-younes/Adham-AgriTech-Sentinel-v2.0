/**
 * Dashboard Map Section Component
 * 
 * Displays the 3D Farm Intelligence map section.
 * 
 * @module components/dashboard/dashboard-map-section
 */

'use client'

import { memo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Layers3, MapPin } from 'lucide-react'
import AdhamSatelliteMap from '@/components/dashboard/AdhamSatelliteMap'
import type { FarmAnalyticsFeature } from '@/components/maps/farm-analytics-map'
import { UnifiedMapWithAnalytics, type FieldFeature } from '@/components/maps/unified-map-with-analytics'

interface DashboardMapSectionProps {
  fields: FarmAnalyticsFeature[]
  lang: 'ar' | 'en'
  strings: {
    card_3d_title: string
    go_satellite: string
    add_field: string
  }
  eosdaKey: string
}

export const DashboardMapSection = memo(function DashboardMapSection({
  fields,
  lang,
  strings,
  eosdaKey,
}: DashboardMapSectionProps) {
  const hasFields = fields.length > 0
  const firstField = fields[0]

  return (
    <Card className="glass-card border-primary/20 shadow-3d overflow-hidden h-full min-h-[600px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Layers3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">{strings.card_3d_title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {lang === 'ar'
                ? 'خرائط تفاعلية مع تحليلات NDVI ورطوبة التربة من EOSDA'
                : 'Interactive maps with NDVI and soil moisture analytics from EOSDA'}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/satellite"
          className="text-sm text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
        >
          {strings.go_satellite}
        </Link>
      </CardHeader>
      <CardContent className="flex-1 p-0 relative bg-black/20">
        {hasFields ? (
          <UnifiedMapWithAnalytics
            fields={fields.map(f => ({
              id: f.id,
              name: f.name || '',
              crop: f.crop,
              polygon: f.polygon,
              center: f.center,
              ndvi: f.ndvi,
              health: f.health,
              moisture: f.moisture,
              areaFeddan: f.areaFeddan,
            })) as FieldFeature[]}
            selectedFieldId={firstField.id}
            defaultLayer="true-color"
            showLayerControls={true}
            showNavigationControls={true}
            lang={lang}
            height="100%"
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <Layers3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-white/80 mb-2">
              {lang === 'ar' ? 'لا توجد حقول لعرضها' : 'No fields to display'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              {lang === 'ar'
                ? 'أضف حقولاً إلى مزرعتك لعرض الخرائط ثلاثية الأبعاد والتحليلات التفاعلية'
                : 'Add fields to your farm to view 3D maps and interactive analytics'}
            </p>
            <Link href="/dashboard/fields/new">
              <Button variant="default" className="gap-2">
                <MapPin className="h-4 w-4" />
                {strings.add_field}
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

