"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
    Sprout, Droplets, Thermometer, Activity, AlertTriangle,
    Leaf, Zap, TrendingUp, Info, CheckCircle, XCircle,
    BarChart3, Wind
} from "lucide-react"
import { useTranslation } from "@/lib/i18n/use-language"
import { AnalyticsService, type SoilCropData } from "@/services/analytics"
import { cn } from "@/lib/utils"

export function SoilCropAnalytics({ fieldId }: { fieldId: string }) {
    const { t: translate, language } = useTranslation()
    const [data, setData] = useState<SoilCropData | null>(null)
    const [loading, setLoading] = useState(true)
    const analyticsService = AnalyticsService.getInstance()

    const t = (key: string) => {
        // Simple translation helper since we don't have full keys here
        const translations: Record<string, Record<string, string>> = {
            "analytics.soil_crop_title": { ar: "تحليلات التربة والمحاصيل", en: "Soil & Crop Analytics" },
            "analytics.simulated": { ar: "بيانات محاكاة", en: "Simulated Data" },
            "analytics.satellite": { ar: "بيانات الأقمار الصناعية", en: "Satellite Data" },
            "analytics.health_score": { ar: "نقاط الصحة", en: "Health Score" },
            "analytics.ndvi": { ar: "مؤشر الغطاء النباتي (NDVI)", en: "NDVI" },
            "analytics.moisture": { ar: "رطوبة التربة", en: "Soil Moisture" },
            "analytics.temp": { ar: "درجة الحرارة", en: "Temperature" },
            "analytics.chlorophyll": { ar: "مؤشر الكلوروفيل", en: "Chlorophyll Index" },
            "analytics.npk": { ar: "مغذيات التربة (NPK)", en: "Soil Nutrients (NPK)" },
            "analytics.ec_salinity": { ar: "الملوحة والتوصيل الكهربائي", en: "EC & Salinity" },
            "analytics.irrigation_agent": { ar: "وكيل الري الآلي", en: "Irrigation Agent" },
            "analytics.yield_prediction": { ar: "توقعات المحصول", en: "Yield Prediction" },
            "analytics.trend": { ar: "الاتجاه (30 يوم)", en: "30-Day Trend" },
            "analytics.alerts": { ar: "تنبيهات حرجة", en: "Critical Alerts" },
        }
        return translations[key]?.[language] || key
    }

    useEffect(() => {
        async function loadData() {
            try {
                const analyticsData = await analyticsService.getFieldAnalytics(fieldId)
                setData(analyticsData)
            } catch (error) {
                console.error("Failed to load analytics:", error)
            } finally {
                setLoading(false)
            }
        }
        if (fieldId) loadData()
    }, [fieldId])

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading analytics...</div>
    if (!data) return null

    const metrics = [
        {
            label: t("analytics.health_score"),
            value: `${Math.round(data.healthScore)}%`,
            icon: Activity,
            color: data.healthScore > 75 ? "text-emerald-500" : data.healthScore > 50 ? "text-yellow-500" : "text-red-500",
            bg: data.healthScore > 75 ? "bg-emerald-500/10" : data.healthScore > 50 ? "bg-yellow-500/10" : "bg-red-500/10",
            border: data.healthScore > 75 ? "border-emerald-500/20" : data.healthScore > 50 ? "border-yellow-500/20" : "border-red-500/20",
            info: language === "ar" ? "مقياس عام لصحة الحقل بناءً على جميع المؤشرات" : "Overall field health score based on all indicators"
        },
        {
            label: t("analytics.ndvi"),
            value: data.ndvi.toFixed(2),
            icon: Leaf,
            color: data.ndvi > 0.6 ? "text-emerald-500" : "text-yellow-500",
            bg: data.ndvi > 0.6 ? "bg-emerald-500/10" : "bg-yellow-500/10",
            border: data.ndvi > 0.6 ? "border-emerald-500/20" : "border-yellow-500/20",
            info: language === "ar" ? "مؤشر الاختلاف الخضري الطبيعي - يقيس كثافة وصحة النبات" : "Normalized Difference Vegetation Index - measures plant density and health"
        },
        {
            label: t("analytics.moisture"),
            value: `${data.moisture}%`,
            icon: Droplets,
            color: data.moisture > 40 ? "text-blue-500" : "text-yellow-500",
            bg: data.moisture > 40 ? "bg-blue-500/10" : "bg-yellow-500/10",
            border: data.moisture > 40 ? "border-blue-500/20" : "border-yellow-500/20",
            info: language === "ar" ? "نسبة الرطوبة الحالية في التربة" : "Current soil moisture percentage"
        },
        {
            label: t("analytics.temp"),
            value: `${data.temperature}°C`,
            icon: Thermometer,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
            border: "border-orange-500/20",
            info: language === "ar" ? "درجة حرارة التربة السطحية" : "Surface soil temperature"
        }
    ]

    return (
        <div className="space-y-6">
            {/* Main Analytics Card */}
            <Card className="glass-card border-white/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
                        <Sprout className="h-5 w-5 text-primary" />
                        {t("analytics.soil_crop_title")}
                    </CardTitle>
                    {data.source && (
                        <Badge variant="outline" className={cn(
                            "text-xs font-normal capitalize",
                            data.source === 'simulated' ? "border-yellow-500/50 text-yellow-500" : "border-primary/50 text-primary"
                        )}>
                            {data.source === 'simulated' ? t("analytics.simulated") : t("analytics.satellite")}
                        </Badge>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Core Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {metrics.map((metric) => (
                            <div
                                key={metric.label}
                                className={cn(
                                    "flex flex-col gap-2 rounded-xl border p-4 transition-all hover:scale-105 group relative",
                                    metric.bg,
                                    metric.border,
                                )}
                                title={metric.info}
                            >
                                <div className="flex items-center justify-between">
                                    <metric.icon className={cn("h-5 w-5", metric.color)} />
                                    <span className={cn("text-xs font-medium opacity-70", metric.color)}>
                                        {metric.label}
                                    </span>
                                    <Info className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity absolute top-2 right-2" />
                                </div>
                                <span className="text-2xl font-bold text-white">{metric.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Enhanced Chlorophyll Index */}
                    {data.chlorophyll && (
                        <div className="space-y-3 border-t border-white/10 pt-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                                    <Leaf className="h-4 w-4 text-green-400" />
                                    {t("analytics.chlorophyll")}
                                </h4>
                                <span className="text-xs text-muted-foreground">EOSDA Sentinel-2</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs text-muted-foreground">Current</span>
                                        <span className="text-xs font-bold text-white">{data.chlorophyll.current.toFixed(1)} μg/cm²</span>
                                    </div>
                                    <Progress value={(data.chlorophyll.current / 80) * 100} className="h-2 bg-green-900/20" />
                                </div>
                                <div className="text-right">
                                    <span className={cn("text-xs font-bold", data.chlorophyll.trendPercent >= 0 ? "text-green-400" : "text-red-400")}>
                                        {data.chlorophyll.trendPercent > 0 ? "+" : ""}{data.chlorophyll.trendPercent.toFixed(1)}%
                                    </span>
                                    <p className="text-[10px] text-muted-foreground">vs last month</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* NPK Nutrients */}
                    {data.npk && (
                        <div className="space-y-3 border-t border-white/10 pt-4">
                            <h4 className="text-sm font-medium text-white flex items-center gap-2">
                                <Activity className="h-4 w-4 text-purple-400" />
                                {t("analytics.npk")}
                            </h4>
                            <div className="grid grid-cols-3 gap-2">
                                <NutrientBar label="N" value={data.npk.nitrogen} max={100} color="bg-blue-500" />
                                <NutrientBar label="P" value={data.npk.phosphorus} max={100} color="bg-orange-500" />
                                <NutrientBar label="K" value={data.npk.potassium} max={100} color="bg-purple-500" />
                            </div>
                        </div>
                    )}

                    {/* EC & Salinity */}
                    {data.ecSalinity && (
                        <div className="space-y-3 border-t border-white/10 pt-4">
                            <h4 className="text-sm font-medium text-white flex items-center gap-2">
                                <Wind className="h-4 w-4 text-blue-400" />
                                {t("analytics.ec_salinity")}
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                                    <p className="text-xs text-blue-300">EC (dS/m)</p>
                                    <p className="text-lg font-bold text-white">{data.ecSalinity.electricalConductivity.toFixed(2)}</p>
                                </div>
                                <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">
                                    <p className="text-xs text-orange-300">Salinity (%)</p>
                                    <p className="text-lg font-bold text-white">{data.ecSalinity.salinityRatio.toFixed(1)}%</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Critical Alerts */}
                    {data.alerts && data.alerts.length > 0 && (
                        <div className="space-y-3 border-t border-white/10 pt-4">
                            <h4 className="text-sm font-medium text-white flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-400" />
                                {t("analytics.alerts")}
                            </h4>
                            <div className="space-y-2">
                                {data.alerts.map(alert => (
                                    <div key={alert.id} className="flex items-start gap-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-white">{alert.message}</p>
                                            <p className="text-xs text-red-300 capitalize">{alert.severity}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Secondary Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Irrigation Agent */}
                {data.irrigationAgent && (
                    <Card className="glass-card border-white/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                                <Zap className="h-4 w-4 text-yellow-400" />
                                {t("analytics.irrigation_agent")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-white">{data.irrigationAgent.readiness}%</div>
                                    <div className="text-xs text-muted-foreground">Readiness</div>
                                </div>
                                <div className="space-y-1">
                                    <StatusRow label="Soil Moisture" active={data.irrigationAgent.status.soilMoisture} />
                                    <StatusRow label="Weather" active={data.irrigationAgent.status.weatherIntegration} />
                                    <StatusRow label="AI Engine" active={data.irrigationAgent.status.intelligenceEngine} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Yield Prediction */}
                {data.yieldPrediction && (
                    <Card className="glass-card border-white/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-emerald-400" />
                                {t("analytics.yield_prediction")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-3xl font-bold text-white">{data.yieldPrediction.predictedYield} <span className="text-sm font-normal text-muted-foreground">tons/ha</span></p>
                                        <p className="text-xs text-emerald-400">+{data.yieldPrediction.comparisonToAverage}% vs avg</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground">Confidence</p>
                                        <p className="text-lg font-bold text-white">{data.yieldPrediction.confidence}%</p>
                                    </div>
                                </div>
                                <div className="p-2 bg-white/5 rounded text-xs text-center text-muted-foreground">
                                    Est. Harvest: {new Date(data.yieldPrediction.estimatedHarvest).toLocaleDateString()}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

function NutrientBar({ label, value, max, color }: { label: string, value: number, max: number, color: string }) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="font-bold text-white">{label}</span>
                <span className="text-muted-foreground">{value}</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", color)} style={{ width: `${(value / max) * 100}%` }} />
            </div>
        </div>
    )
}

function StatusRow({ label, active }: { label: string, active: boolean }) {
    return (
        <div className="flex items-center gap-2 text-xs">
            {active ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
            <span className={active ? "text-white" : "text-muted-foreground"}>{label}</span>
        </div>
    )
}
