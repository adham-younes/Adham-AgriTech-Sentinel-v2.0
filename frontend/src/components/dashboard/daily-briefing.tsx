"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Sun, CloudRain, Wind, AlertTriangle, Lightbulb } from "lucide-react"
import { useTranslation } from "@/lib/i18n/use-language"

interface DailyBriefingProps {
    weather?: {
        temp: number
        condition: string
        humidity: number
    } | null
    alertCount: number
    userName?: string
}

export function DailyBriefing({ weather, alertCount, userName }: DailyBriefingProps) {
    const { language } = useTranslation()
    const isAr = language === "ar"

    const greeting = isAr
        ? `أهلاً بك، ${userName || "مزارعنا"}!`
        : `Welcome back, ${userName || "Farmer"}!`

    const date = new Date().toLocaleDateString(isAr ? "ar-EG" : "en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    })

    return (
        <Card className="glass-card border-primary/20 bg-gradient-to-r from-primary/10 to-transparent mb-6">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">

                {/* Greeting & Date */}
                <div className="space-y-1 text-center md:text-start">
                    <h3 className="text-2xl font-bold text-white">{greeting}</h3>
                    <p className="text-gray-400 text-sm">{date}</p>
                </div>

                {/* Quick Stats Row */}
                <div className="flex flex-wrap justify-center gap-4">

                    {/* Weather Pill */}
                    <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                        <Sun className="h-5 w-5 text-yellow-400" />
                        <div className="text-sm">
                            <span className="font-bold text-white">{weather?.temp ?? "--"}°C</span>
                            <span className="mx-2 text-gray-500">|</span>
                            <span className="text-gray-300">{weather?.condition || (isAr ? "صافي" : "Clear")}</span>
                        </div>
                    </div>

                    {/* Alerts Pill */}
                    {alertCount > 0 ? (
                        <div className="flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20">
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                            <span className="text-sm font-medium text-red-200">
                                {isAr ? `${alertCount} تنبيهات نشطة` : `${alertCount} Active Alerts`}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                            <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
                            <span className="text-sm font-medium text-emerald-200">
                                {isAr ? "كل الأنظمة مستقرة" : "All systems stable"}
                            </span>
                        </div>
                    )}

                    {/* AI Tip Pill */}
                    <div className="hidden md:flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
                        <Lightbulb className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-blue-200">
                            {isAr ? "نصيحة: راجع رطوبة التربة اليوم" : "Tip: Check soil moisture today"}
                        </span>
                    </div>

                </div>
            </CardContent>
        </Card>
    )
}

function ShieldCheckIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
