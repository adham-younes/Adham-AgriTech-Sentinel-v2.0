"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Droplets, AlertCircle, CheckCircle2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n/use-language"

interface IrrigationRecommendationProps {
    moisture?: number
    weatherCondition?: string
    cropType?: string
}

export function IrrigationRecommendation({ moisture, weatherCondition, cropType }: IrrigationRecommendationProps) {
    const { language } = useTranslation()
    const isAr = language === "ar"

    if (moisture === undefined) return null

    const isLow = moisture < 40
    const isHigh = moisture > 80

    let status: "urgent" | "good" | "warning" = "good"
    let title = isAr ? "حالة الري ممتازة" : "Irrigation Status: Optimal"
    let message = isAr
        ? "مستويات الرطوبة في التربة مثالية. لا حاجة للري اليوم."
        : "Soil moisture levels are optimal. No irrigation needed today."

    if (isLow) {
        status = "urgent"
        title = isAr ? "تنبيه: جفاف التربة" : "Alert: Low Soil Moisture"
        message = isAr
            ? `نسبة الرطوبة ${moisture}% فقط. يُنصح بالري الفوري لتجنب إجهاد المحصول.`
            : `Moisture is only ${moisture}%. Immediate irrigation is recommended to avoid crop stress.`
    } else if (isHigh) {
        status = "warning"
        title = isAr ? "تنبيه: رطوبة عالية" : "Alert: High Soil Moisture"
        message = isAr
            ? "التربة مشبعة بالمياه. أوقف الري لتجنب تعفن الجذور."
            : "Soil is saturated. Stop irrigation to prevent root rot."
    }

    return (
        <Card className={`mb-6 border-l-4 ${status === "urgent" ? "border-l-red-500 bg-red-500/5" :
                status === "warning" ? "border-l-yellow-500 bg-yellow-500/5" :
                    "border-l-emerald-500 bg-emerald-500/5"
            }`}>
            <CardContent className="p-4 flex items-start gap-4">
                <div className={`p-2 rounded-full ${status === "urgent" ? "bg-red-100 text-red-600" :
                        status === "warning" ? "bg-yellow-100 text-yellow-600" :
                            "bg-emerald-100 text-emerald-600"
                    }`}>
                    {status === "good" ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                </div>
                <div>
                    <h4 className="font-bold text-lg mb-1">{title}</h4>
                    <p className="text-sm text-muted-foreground">{message}</p>
                    {cropType && (
                        <p className="text-xs text-primary mt-2">
                            {isAr ? `محصول: ${cropType}` : `Crop: ${cropType}`}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
