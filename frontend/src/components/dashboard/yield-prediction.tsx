"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp, Target, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface YieldPredictionData {
    predictedYield: number      // Percentage prediction (0-100)
    confidence: number          // Model confidence (0-100)
    estimatedHarvest: string    // Date estimate
    comparisonToAverage: number // Percentage vs regional average
}

interface YieldPredictionProps {
    data: YieldPredictionData
    lang?: "ar" | "en"
}

export function YieldPrediction({ data, lang = "ar" }: YieldPredictionProps) {
    const t = {
        ar: {
            title: "توقع المحصول",
            predicted: "التوقع",
            confidence: "الثقة",
            harvest: "الحصاد المتوقع",
            vsAverage: "مقارنة بالمتوسط",
            aiPowered: "مدعوم بالذكاء الاصطناعي"
        },
        en: {
            title: "Yield Prediction",
            predicted: "Predicted",
            confidence: "Confidence",
            harvest: "Est. Harvest",
            vsAverage: "vs Average",
            aiPowered: "AI-Powered"
        }
    }

    const getYieldColor = (yield_val: number) => {
        if (yield_val >= 80) return "text-emerald-400"
        if (yield_val >= 60) return "text-green-400"
        if (yield_val >= 40) return "text-yellow-400"
        return "text-orange-400"
    }

    const getConfidenceColor = (conf: number) => {
        if (conf >= 80) return "text-green-400"
        if (conf >= 60) return "text-yellow-400"
        return "text-orange-400"
    }

    const comparisonColor = data.comparisonToAverage >= 0 ? "text-green-400" : "text-red-400"

    return (
        <Card className="glass-card p-6 border-white/10 bg-gradient-to-br from-emerald-900/20 to-green-900/20">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-green-400 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        {t[lang].title}
                    </h3>
                    <div className="flex items-center gap-1 text-[10px] text-purple-400">
                        <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                        {t[lang].aiPowered}
                    </div>
                </div>

                {/* Main Prediction */}
                <div className="text-center space-y-2">
                    <div className={cn("text-6xl font-bold", getYieldColor(data.predictedYield))}>
                        {data.predictedYield}
                        <span className="text-2xl">%</span>
                    </div>
                    <p className="text-xs text-gray-400">{t[lang].predicted}</p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Confidence */}
                    <div className="p-3 rounded-lg bg-card/30 border border-white/10">
                        <div className="text-xs text-gray-400 mb-1">{t[lang].confidence}</div>
                        <div className={cn("text-2xl font-bold", getConfidenceColor(data.confidence))}>
                            {data.confidence}%
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mt-2">
                            <div
                                className="h-full bg-gradient-to-r from-yellow-400 to-green-400 transition-all"
                                style={{ width: `${data.confidence}%` }}
                            />
                        </div>
                    </div>

                    {/* Harvest Date */}
                    <div className="p-3 rounded-lg bg-card/30 border border-white/10">
                        <div className="text-xs text-gray-400 mb-1">{t[lang].harvest}</div>
                        <div className="text-sm font-semibold text-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-blue-400" />
                            {data.estimatedHarvest}
                        </div>
                    </div>
                </div>

                {/* Comparison */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-card/20 border border-white/5">
                    <span className="text-xs text-gray-400">{t[lang].vsAverage}</span>
                    <div className={cn("flex items-center gap-1 text-sm font-semibold", comparisonColor)}>
                        <TrendingUp className="h-3 w-3" />
                        {data.comparisonToAverage > 0 ? '+' : ''}{data.comparisonToAverage}%
                    </div>
                </div>
            </div>
        </Card>
    )
}
