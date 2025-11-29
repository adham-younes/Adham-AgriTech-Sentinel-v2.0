/**
 * Analytics Sidebar Component
 * 
 * Sidebar لعرض التحليلات عند الضغط على الخريطة
 * 
 * @module components/maps/analytics-sidebar
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, Loader2, Leaf, Droplets, Activity, TrendingUp } from 'lucide-react'
import type { PointAnalysis } from './unified-map-with-analytics'

interface AnalyticsSidebarProps {
  open: boolean
  onClose: () => void
  analysis: PointAnalysis | null
  loading: boolean
  lang: 'ar' | 'en'
}

export function AnalyticsSidebar({
  open,
  onClose,
  analysis,
  loading,
  lang,
}: AnalyticsSidebarProps) {
  if (!open) return null

  return (
    <div className="w-80 bg-black/90 backdrop-blur-sm border-l border-white/10 flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/10">
        <CardTitle className="text-lg">
          {lang === 'ar' ? 'تحليلات الموقع' : 'Location Analytics'}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {lang === 'ar' ? 'جاري تحليل البيانات...' : 'Analyzing data...'}
              </p>
            </div>
          </div>
        ) : analysis ? (
          <>
            {/* Coordinates */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {lang === 'ar' ? 'الإحداثيات' : 'Coordinates'}
              </p>
              <p className="text-sm font-mono">
                {analysis.coordinates[1].toFixed(6)}, {analysis.coordinates[0].toFixed(6)}
              </p>
            </div>

            {/* NDVI */}
            {analysis.ndvi !== undefined && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-semibold">NDVI</span>
                    </div>
                    <Badge variant={analysis.ndvi > 0.5 ? 'default' : 'destructive'}>
                      {analysis.ndvi.toFixed(2)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analysis.ndvi > 0.5
                      ? lang === 'ar' ? 'صحة نباتية جيدة' : 'Good vegetation health'
                      : lang === 'ar' ? 'صحة نباتية منخفضة' : 'Low vegetation health'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Soil Moisture */}
            {analysis.soilMoisture !== undefined && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-semibold">
                        {lang === 'ar' ? 'رطوبة التربة' : 'Soil Moisture'}
                      </span>
                    </div>
                    <Badge variant="outline">
                      {analysis.soilMoisture.toFixed(1)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Chlorophyll */}
            {analysis.chlorophyll !== undefined && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-semibold">
                        {lang === 'ar' ? 'الكلوروفيل' : 'Chlorophyll'}
                      </span>
                    </div>
                    <Badge variant="outline">
                      {analysis.chlorophyll.toFixed(1)} μg/cm²
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* EVI */}
            {analysis.evi !== undefined && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-semibold">EVI</span>
                    </div>
                    <Badge variant="outline">
                      {analysis.evi.toFixed(2)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timestamp */}
            {analysis.timestamp && (
              <div className="text-xs text-muted-foreground pt-2 border-t border-white/10">
                {lang === 'ar' ? 'آخر تحديث:' : 'Last updated:'}{' '}
                {new Date(analysis.timestamp).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
              </div>
            )}

            {!analysis.ndvi && !analysis.soilMoisture && !analysis.chlorophyll && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">
                  {lang === 'ar'
                    ? 'لا توجد بيانات متاحة لهذا الموقع'
                    : 'No data available for this location'}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">
              {lang === 'ar'
                ? 'اضغط على الخريطة لعرض التحليلات'
                : 'Click on the map to view analytics'}
            </p>
          </div>
        )}
      </CardContent>
    </div>
  )
}

