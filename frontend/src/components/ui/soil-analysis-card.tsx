/**
 * Soil Analysis Card
 */
'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from "@/components/ui/progress"
import type { SoilAnalysis } from '@/lib/business-logic/field-analytics'
import { AlertTriangle, CheckCircle, Droplets, TrendingUp, Sprout, FlaskConical, AlertCircle } from "lucide-react"

interface SoilAnalysisCardProps {
  analysis: SoilAnalysis | null
  loading?: boolean
  lang?: "ar" | "en"
}

export function SoilAnalysisCard({ analysis, loading = false, lang = 'ar' }: SoilAnalysisCardProps) {
  const t = {
    ar: {
      title: "تحليل التربة (AI)",
      subtitle: "تحليل مدعوم بالذكاء الاصطناعي لبيانات الأقمار الصناعية",
      ndviMean: "متوسط NDVI",
      trend: "الاتجاه",
      moisture: "مستوى الرطوبة",
      stressZones: "مناطق الإجهاد",
      recommendations: "التوصيات",
      improving: "تحسن",
      stable: "مستقر",
      declining: "تراجع",
      high: "مرتفع",
      medium: "متوسط",
      low: "منخفض",
      noData: "لا توجد بيانات تحليل",
      analyzing: "جاري تحليل التربة...",
    },
    en: {
      title: "Soil Analysis (AI)",
      subtitle: "AI-powered analysis of satellite data",
      ndviMean: "Mean NDVI",
      trend: "Trend",
      moisture: "Moisture Level",
      stressZones: "Stress Zones",
      recommendations: "Recommendations",
      improving: "Improving",
      stable: "Stable",
      declining: "Declining",
      high: "High",
      medium: "Medium",
      low: "Low",
      noData: "No analysis data",
      analyzing: "Analyzing soil...",
    },
  }

  if (loading) {
    return (
      <Card className="glass-card border-emerald-400/30 bg-gradient-to-br from-emerald-950/40 via-black/60 to-cyan-950/40 backdrop-blur-xl p-6 h-full flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3 text-emerald-400">
          <FlaskConical className="h-8 w-8 animate-pulse" />
          <p className="text-sm font-medium animate-pulse">{t[lang].analyzing}</p>
        </div>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card className="glass-card border-amber-500/30 bg-gradient-to-br from-emerald-950/40 via-black/60 to-cyan-950/40 backdrop-blur-xl p-6 h-full flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3 text-amber-400">
          <AlertTriangle className="h-8 w-8" />
          <p className="text-sm font-medium">⚠️ {t[lang].noData}</p>
        </div>
      </Card>
    )
  }

  const getTrendIcon = (trend: string) => {
    if (trend === "improving") return <TrendingUp className="h-4 w-4 text-emerald-400" />
    if (trend === "declining") return <TrendingUp className="h-4 w-4 text-amber-400 rotate-180" />
    return <TrendingUp className="h-4 w-4 text-blue-400 rotate-90" />
  }

  const getMoistureColor = (level: string) => {
    if (level === "high") return "text-blue-400 bg-blue-400/10 border-blue-400/20"
    if (level === "medium") return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
    return "text-amber-400 bg-amber-400/10 border-amber-400/20"
  }

  return (
    <Card className="glass-card border-emerald-400/30 bg-gradient-to-br from-emerald-950/40 via-black/60 to-cyan-950/40 backdrop-blur-xl p-6 h-full hover:shadow-2xl transition-all duration-300">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="h-5 w-5 text-emerald-400" />
            <h3 className="text-xl font-bold text-emerald-400">{t[lang].title}</h3>
          </div>
          <p className="text-sm text-gray-400">{t[lang].subtitle}</p>
        </div>
        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
          AI-V2.0
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-black/40 rounded-lg p-4 border border-emerald-500/20">
          <div className="text-xs text-emerald-400/70 mb-1">{t[lang].ndviMean}</div>
          <div className="text-2xl font-bold text-white mb-1">{analysis.ndvi_mean.toFixed(2)}</div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            {getTrendIcon(analysis.ndvi_trend)}
            <span>{t[lang][analysis.ndvi_trend as keyof typeof t.ar]}</span>
          </div>
        </div>

        <div className={`rounded-lg p-4 border ${getMoistureColor(analysis.moisture_level)} bg-black/40`}>
          <div className="text-xs opacity-70 mb-1">{t[lang].moisture}</div>
          <div className="text-2xl font-bold mb-1">
            {t[lang][analysis.moisture_level as keyof typeof t.ar]}
          </div>
          <Droplets className="h-4 w-4 opacity-70" />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">{t[lang].stressZones}</span>
            <span className="text-xs text-amber-400 font-mono">
              {analysis.stress_zones.length} {lang === "ar" ? "مناطق" : "zones"}
            </span>
          </div>
          <Progress
            value={Math.max(5, (analysis.stress_zones.length / 5) * 100)}
            className="h-2 bg-black/40 border border-emerald-500/20"
            indicatorClassName={analysis.stress_zones.length > 0 ? "bg-amber-500" : "bg-emerald-500"}
          />
        </div>

        <div className="bg-black/40 rounded-lg p-4 border border-emerald-500/20">
          <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
            <Sprout className="h-4 w-4" />
            {t[lang].recommendations}
          </h4>
          <ul className="space-y-2">
            {(Array.isArray(analysis.recommendations) ? analysis.recommendations : (analysis.recommendations as any)[lang] || []).map((rec: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}
