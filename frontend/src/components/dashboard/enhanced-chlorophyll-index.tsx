"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Leaf } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChlorophyllData {
    current: number        // Current chlorophyll index (μg/cm²)
    eosda: number         // EOSDA satellite reading
    trendPercent: number  // Percentage change vs last month
    lastMonth: number
}

interface EnhancedChlorophyllIndexProps {
    data: ChlorophyllData
    lang?: "ar" | "en"
}

export function EnhancedChlorophyllIndex({ data, lang = "ar" }: EnhancedChlorophyllIndexProps) {
    const t = {
        ar: {
            title: "مؤشر الكلوروفيل",
            eosdaTitle: "مؤشر الكلوروفيل (EOSDA)",
            vsLastMonth: "مقارنة بالشهر الماضي",
            unit: "μg/cm²"
        },
        en: {
            title: "Chlorophyll Index",
            eosdaTitle: "Chlorophyll Index (EOSDA)",
            vsLastMonth: "vs last month",
            unit: "μg/cm²"
        }
    }

    const isPositiveTrend = data.trendPercent > 0
    const trendColor = isPositiveTrend ? "text-green-400" : "text-red-400"

    const getChlorophyllColor = (value: number) => {
        if (value >= 70) return "text-emerald-400"
        if (value >= 50) return "text-green-400"
        if (value >= 30) return "text-yellow-400"
        return "text-orange-400"
    }

    const currentColor = getChlorophyllColor(data.current)
    const eosdaColor = getChlorophyllColor(data.eosda)

    return (
        <div className="grid grid-cols-2 gap-3">
            {/* Current Chlorophyll Index */}
            <Card className="glass-card p-4 border-white/10 hover:border-green-500/30 transition-all">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-medium text-gray-400">{t[lang].title}</h4>
                        <Leaf className="h-4 w-4 text-green-400" />
                    </div>
                    <div className={cn("text-4xl font-bold", currentColor)}>
                        {data.current.toFixed(0)}
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                        <span className="text-gray-500">{t[lang].unit}</span>
                    </div>
                    <div className={cn("flex items-center gap-1 text-sm font-medium", trendColor)}>
                        {isPositiveTrend ? (
                            <TrendingUp className="h-3 w-3" />
                        ) : (
                            <TrendingDown className="h-3 w-3" />
                        )}
                        <span>{Math.abs(data.trendPercent).toFixed(1)}%</span>
                        <span className="text-xs text-gray-500">{t[lang].vsLastMonth}</span>
                    </div>
                </div>
            </Card>

            {/* EOSDA Chlorophyll Index */}
            <Card className="glass-card p-4 border-white/10 hover:border-green-500/30 transition-all bg-gradient-to-br from-green-900/20 to-emerald-900/20">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-medium text-gray-400">{t[lang].eosdaTitle}</h4>
                        <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-[10px] text-green-400">LIVE</span>
                        </div>
                    </div>
                    <div className={cn("text-4xl font-bold", eosdaColor)}>
                        {data.eosda.toFixed(0)}
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                        <span className="text-gray-500">Sentinel-2</span>
                    </div>
                    <div className="text-xs text-gray-400">
                        {t[lang].vsLastMonth}: <span className={trendColor}>{data.trendPercent > 0 ? '+' : ''}{data.trendPercent.toFixed(1)}%</span>
                    </div>
                </div>
            </Card>
        </div>
    )
}
