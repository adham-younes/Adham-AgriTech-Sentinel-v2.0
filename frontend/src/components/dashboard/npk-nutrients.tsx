"use client"

import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

interface NPKNutrientsProps {
    data: {
        nitrogen: number
        phosphorus: number
        potassium: number
        trends: {
            n: number
            p: number
            k: number
        }
    }
}

interface NutrientTileProps {
    label: string
    value: number
    trend: number
    color: string
}

function NutrientTile({ label, value, trend, color }: NutrientTileProps) {
    const isPositive = trend > 0
    const trendColor = isPositive ? "text-emerald-400" : "text-red-400"

    return (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-card/30 p-4 transition-all hover:bg-card/50">
            <div className="flex items-center gap-2">
                <span className={cn("text-2xl font-bold", color)}>{label}</span>
            </div>
            <div className="text-3xl font-bold text-foreground">{value.toFixed(1)}</div>
            <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
                {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                ) : (
                    <TrendingDown className="h-3 w-3" />
                )}
                <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
            <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
    )
}

export function NPKNutrients({ data }: NPKNutrientsProps) {
    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
                Vegetation Levels (EOSDA)
            </h3>
            <div className="grid grid-cols-3 gap-3">
                <NutrientTile
                    label="N"
                    value={data.nitrogen}
                    trend={data.trends.n}
                    color="text-primary"
                />
                <NutrientTile
                    label="P"
                    value={data.phosphorus}
                    trend={data.trends.p}
                    color="text-emerald-400"
                />
                <NutrientTile
                    label="K"
                    value={data.potassium}
                    trend={data.trends.k}
                    color="text-green-400"
                />
            </div>
        </div>
    )
}
