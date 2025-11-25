"use client"

import { Card } from "@/components/ui/card"
import { Waves, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface ECSalinityData {
    electricalConductivity: number  // EC in dS/m
    salinityRatio: number          // Percentage 0-100
    moistureLevel: number          // Soil moisture %
}

interface ECSalinityDisplayProps {
    data: ECSalinityData
    lang?: "ar" | "en"
}

export function ECSalinityDisplay({ data, lang = "ar" }: ECSalinityDisplayProps) {
    const t = {
        ar: {
            ecTitle: "التوصيل الكهربائي (EC)",
            salinityTitle: "نسبة الملوحة",
            moistureTitle: "رطوبة التربة",
            unit: {
                ec: "dS/m",
                salinity: "%",
                moisture: "%"
            },
            sentinel: "Sentinel-1 SAR"
        },
        en: {
            ecTitle: "Electrical Conductivity (EC)",
            salinityTitle: "Salinity Ratio",
            moistureTitle: "Soil Moisture",
            unit: {
                ec: "dS/m",
                salinity: "%",
                moisture: "%"
            },
            sentinel: "Sentinel-1 SAR"
        }
    }

    const getECColor = (ec: number) => {
        if (ec < 2) return "text-green-400"      // Low - optimal
        if (ec < 4) return "text-yellow-400"     // Medium
        if (ec < 8) return "text-orange-400"     // High
        return "text-red-400"                     // Very high - problematic
    }

    const getSalinityColor = (salinity: number) => {
        if (salinity < 20) return "text-green-400"
        if (salinity < 40) return "text-yellow-400"
        if (salinity < 60) return "text-orange-400"
        return "text-red-400"
    }

    const getMoistureColor = (moisture: number) => {
        if (moisture >= 60) return "text-blue-400"
        if (moisture >= 30) return "text-yellow-400"
        return "text-red-400"
    }

    return (
        <div className="grid grid-cols-3 gap-3">
            {/* Soil Moisture with EC */}
            <Card className="glass-card p-4 border-white/10 hover:border-blue-500/30 transition-all">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-medium text-gray-400">{t[lang].moistureTitle}</h4>
                        <Waves className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className={cn("text-3xl font-bold", getMoistureColor(data.moistureLevel))}>
                        {data.moistureLevel.toFixed(1)}<span className="text-lg">%</span>
                    </div>
                    <div className="text-[10px] text-gray-500 flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                        {t[lang].sentinel}
                    </div>
                </div>
            </Card>

            {/* EC Readout */}
            <Card className="glass-card p-4 border-white/10 hover:border-yellow-500/30 transition-all bg-gradient-to-br from-yellow-900/10 to-orange-900/10">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-medium text-gray-400">{t[lang].ecTitle}</h4>
                        <Zap className="h-4 w-4 text-yellow-400" />
                    </div>
                    <div className={cn("text-3xl font-bold", getECColor(data.electricalConductivity))}>
                        {data.electricalConductivity.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">{t[lang].unit.ec}</div>
                </div>
            </Card>

            {/* Salinity Ratio */}
            <Card className="glass-card p-4 border-white/10 hover:border-orange-500/30 transition-all">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-medium text-gray-400">{t[lang].salinityTitle}</h4>
                        <Waves className="h-4 w-4 text-orange-400" />
                    </div>
                    <div className={cn("text-3xl font-bold", getSalinityColor(data.salinityRatio))}>
                        {data.salinityRatio.toFixed(0)}<span className="text-lg">%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden mt-2">
                        <div
                            className={cn(
                                "h-full transition-all duration-500",
                                data.salinityRatio < 20 ? "bg-green-400" :
                                    data.salinityRatio < 40 ? "bg-yellow-400" :
                                        data.salinityRatio < 60 ? "bg-orange-400" : "bg-red-400"
                            )}
                            style={{ width: `${data.salinityRatio}%` }}
                        />
                    </div>
                </div>
            </Card>
        </div>
    )
}
