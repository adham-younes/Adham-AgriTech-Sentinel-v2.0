"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import { Droplets, Cloud, Cpu, Radio, Play } from "lucide-react"

interface ServiceStatus {
    soilMoisture: boolean
    weatherIntegration: boolean
    intelligenceEngine: boolean
    sensorNetwork: boolean
}

interface IrrigationAgentProps {
    readiness: number  // 0-100
    status: ServiceStatus
    lang?: "ar" | "en"
    onExecutePlan?: () => void
}

function ServiceToggle({
    label,
    enabled,
    icon: Icon
}: {
    label: string
    enabled: boolean
    icon: any
}) {
    return (
        <div className="flex items-center justify-between p-2 rounded-lg bg-card/30 border border-white/10">
            <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${enabled ? 'text-green-400' : 'text-gray-500'}`} />
                <span className="text-sm text-foreground">{label}</span>
            </div>
            <div className={`h-2 w-2 rounded-full ${enabled ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
        </div>
    )
}

export function IrrigationAutomationAgent({
    readiness,
    status,
    lang = "ar",
    onExecutePlan
}: IrrigationAgentProps) {
    const t = {
        ar: {
            title: "وكيل التشغيل الآلي للري",
            soilMoisture: "مراقبة رطوبة التربة",
            weather: "تكامل بيانات الطقس",
            intelligence: "محرك الذكاء",
            sensors: "شبكة المستشعرات",
            execute: "تنفيذ خطة الري",
            operational: "التشغيلي",
            readiness: "الجاهزية"
        },
        en: {
            title: "Irrigation Automation Agent",
            soilMoisture: "Soil Moisture Monitoring",
            weather: "Weather Data Integration",
            intelligence: "Intelligence Engine",
            sensors: "Sensor Network",
            execute: "Execute Irrigation Plan",
            operational: "Operational",
            readiness: "Readiness"
        }
    }

    const operationalServices = Object.values(status).filter(Boolean).length
    const totalServices = Object.values(status).length

    const getReadinessColor = () => {
        if (readiness >= 80) return "#00ff00"
        if (readiness >= 50) return "#ffd700"
        return "#ff4500"
    }

    return (
        <Card className="glass-card p-6 border-white/10 space-y-6">
            <div className="text-center">
                <h3 className="text-sm font-semibold text-green-400 mb-4">
                    {t[lang].title}
                </h3>

                {/* Circular Progress */}
                <div className="w-32 h-32 mx-auto mb-4">
                    <CircularProgressbar
                        value={readiness}
                        text={`${readiness}%`}
                        styles={buildStyles({
                            pathColor: getReadinessColor(),
                            textColor: '#fff',
                            trailColor: '#333',
                            pathTransitionDuration: 0.5,
                        })}
                    />
                </div>
                <p className="text-xs text-gray-400">{t[lang].readiness}</p>
            </div>

            {/* Service Toggles */}
            <div className="space-y-2">
                <ServiceToggle
                    label={t[lang].soilMoisture}
                    enabled={status.soilMoisture}
                    icon={Droplets}
                />
                <ServiceToggle
                    label={t[lang].weather}
                    enabled={status.weatherIntegration}
                    icon={Cloud}
                />
                <ServiceToggle
                    label={t[lang].intelligence}
                    enabled={status.intelligenceEngine}
                    icon={Cpu}
                />
                <ServiceToggle
                    label={t[lang].sensors}
                    enabled={status.sensorNetwork}
                    icon={Radio}
                />
            </div>

            {/* Operational Services Bar */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{t[lang].operational}</span>
                    <span className="text-green-400 font-semibold">
                        {operationalServices}/{totalServices}
                    </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-green-600 to-emerald-400 transition-all duration-500"
                        style={{ width: `${(operationalServices / totalServices) * 100}%` }}
                    />
                </div>
            </div>

            {/* Execute Button */}
            <Button
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold"
                onClick={onExecutePlan}
                disabled={readiness < 50}
            >
                <Play className="h-4 w-4 mr-2" />
                {t[lang].execute}
            </Button>
        </Card>
    )
}
