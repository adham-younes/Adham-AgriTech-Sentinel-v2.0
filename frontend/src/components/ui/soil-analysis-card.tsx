/**
 * Soil Analysis Card
 */
'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SoilAnalysis } from '@/lib/business-logic/field-analytics'
import { Leaf, TrendingUp, TrendingDown, Minus, Droplets } from 'lucide-react'

interface Props {
  analysis: SoilAnalysis | null
  loading?: boolean
  lang?: 'ar' | 'en'
}

export function SoilAnalysisCard({ analysis, loading = false, lang = 'ar' }: Props) {
  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-emerald-900/90 via-emerald-900/70 to-amber-900/60 border border-emerald-800/70">
        <div className="animate-pulse h-40 bg-emerald-800/30 rounded"></div>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card className="p-6 bg-gradient-to-br from-emerald-900/90 via-emerald-900/70 to-amber-900/60 border border-emerald-800/70">
        <p className="text-sm text-emerald-200/80">
          {lang === 'ar' ? '⚠️ لا توجد بيانات تحليل' : '⚠️ No analysis data'}
        </p>
      </Card>
    )
  }

  const getTrendIcon = () => {
    if (analysis.ndvi_trend === 'improving') return <TrendingUp className="h-4 w-4 text-green-400" />
    if (analysis.ndvi_trend === 'declining') return <TrendingDown className="h-4 w-4 text-red-400" />
    return <Minus className="h-4 w-4 text-yellow-400" />
  }

  const getMoistureColor = () => {
    if (analysis.moisture_level === 'high') return 'bg-blue-500/80'
    if (analysis.moisture_level === 'low') return 'bg-red-500/80'
    return 'bg-yellow-500/80'
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-emerald-900/90 via-emerald-900/70 to-amber-900/60 border border-emerald-800/70">
      <div className="flex items-center gap-2 mb-4">
        <Leaf className="h-5 w-5 text-emerald-400" />
        <h3 className="text-lg font-semibold text-emerald-50">
          {lang === 'ar' ? 'تحليل التربة' : 'Soil Analysis'}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-emerald-200/80 mb-1">NDVI</p>
          <p className="text-2xl font-bold text-emerald-50">{analysis.ndvi_mean.toFixed(3)}</p>
        </div>
        <div>
          <p className="text-xs text-emerald-200/80 mb-1">{lang === 'ar' ? 'الاتجاه' : 'Trend'}</p>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className="text-sm font-medium text-emerald-50">
              {lang === 'ar' 
                ? (analysis.ndvi_trend === 'improving' ? 'محسّن' : analysis.ndvi_trend === 'declining' ? 'متراجع' : 'مستقر')
                : analysis.ndvi_trend}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-emerald-200/80">{lang === 'ar' ? 'الرطوبة' : 'Moisture'}</span>
          </div>
          <Badge className={`${getMoistureColor()} text-white border-none`}>
            {lang === 'ar' 
              ? (analysis.moisture_level === 'high' ? 'عالية' : analysis.moisture_level === 'low' ? 'منخفضة' : 'متوسطة')
              : analysis.moisture_level}
          </Badge>
        </div>
      </div>

      {analysis.stress_zones.length > 0 && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
          <p className="text-xs text-red-200">
            ⚠️ {analysis.stress_zones.length} {lang === 'ar' ? 'منطقة إجهاد' : 'stress zone(s)'}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs text-emerald-200/80 font-medium">{lang === 'ar' ? 'التوصيات:' : 'Recommendations:'}</p>
        {analysis.recommendations.slice(0, 3).map((rec, idx) => (
          <p key={idx} className="text-sm text-emerald-100 pl-3 border-l-2 border-emerald-600/50">
            {rec}
          </p>
        ))}
      </div>
    </Card>
  )
}
