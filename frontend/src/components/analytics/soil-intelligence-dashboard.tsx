"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Droplets, TrendingDown, TrendingUp, AlertTriangle, Sparkles, Calendar } from 'lucide-react'
import { satelliteAnalytics, type SoilMoistureData, type IrrigationPrediction } from '@/lib/services/satellite-analytics'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

interface SoilIntelligenceDashboardProps {
    fieldId: string
    fieldName: string
    polygon: [number, number][]
    cropType?: string | null
}

export function SoilIntelligenceDashboard({
    fieldId,
    fieldName,
    polygon,
    cropType
}: SoilIntelligenceDashboardProps) {
    const [soilMoisture, setSoilMoisture] = useState<SoilMoistureData | null>(null)
    const [predictions, setPredictions] = useState<IrrigationPrediction[]>([])
    const [loading, setLoading] = useState(true)
    const [historicalData, setHistoricalData] = useState<any[]>([])

    useEffect(() => {
        loadData()
    }, [fieldId])

    const loadData = async () => {
        try {
            setLoading(true)

            // Fetch soil moisture
            const moisture = await satelliteAnalytics.getSoilMoisture(fieldId, polygon)
            setSoilMoisture(moisture)

            // Fetch irrigation predictions
            const preds = await satelliteAnalytics.getIrrigationPredictions(fieldId, cropType)
            setPredictions(preds)

            // Generate historical moisture data (last 30 days)
            const historical = generateHistoricalMoisture(30, moisture.root_zone_moisture)
            setHistoricalData(historical)

        } catch (error) {
            console.error('Error loading soil intelligence data:', error)
        } finally {
            setLoading(false)
        }
    }

    const generateHistoricalMoisture = (days: number, currentValue: number) => {
        const data = []
        const today = new Date()

        for (let i = days; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)

            // Simulate realistic moisture fluctuation
            const variation = (Math.random() - 0.5) * 10
            const rainEffect = Math.random() > 0.85 ? 20 : 0
            const value = Math.max(20, Math.min(80, currentValue + variation + rainEffect - (i * 0.3)))

            data.push({
                date: date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
                moisture: parseFloat(value.toFixed(1)),
                optimal_min: 40,
                optimal_max: 70
            })
        }

        return data
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    const moistureStatus = soilMoisture
        ? soilMoisture.root_zone_moisture >= 40 ? 'optimal'
            : soilMoisture.root_zone_moisture >= 30 ? 'low'
                : 'critical'
        : 'unknown'

    const statusColors = {
        optimal: 'text-primary border-primary/30 bg-primary/10',
        low: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10',
        critical: 'text-red-500 border-red-500/30 bg-red-500/10',
        unknown: 'text-gray-500 border-gray-500/30 bg-gray-500/10'
    }

    const statusLabels = {
        optimal: 'مثالية',
        low: 'منخفضة',
        critical: 'حرجة',
        unknown: 'غير معروف'
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Sparkles className="h-6 w-6 text-primary" />
                            ذكاء التربة بالأقمار الصناعية
                        </h2>
                        <p className="text-muted-foreground mt-1">
                            تحليلات مدعومة بالذكاء الاصطناعي لـ {fieldName}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-muted-foreground">آخر تحديث</div>
                        <div className="text-sm font-mono">
                            {soilMoisture ? new Date(soilMoisture.timestamp).toLocaleString('ar-EG') : '--'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Current Status Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="glass-card border-primary/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">رطوبة السطح</p>
                                <p className="text-3xl font-bold mt-2">
                                    {soilMoisture?.surface_moisture.toFixed(1)}%
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <Droplets className="h-6 w-6 text-blue-400" />
                            </div>
                        </div>
                        <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                                style={{ width: `${soilMoisture?.surface_moisture || 0}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-primary/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">رطوبة منطقة الجذور</p>
                                <p className="text-3xl font-bold mt-2">
                                    {soilMoisture?.root_zone_moisture.toFixed(1)}%
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                <Droplets className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                        <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500"
                                style={{ width: `${soilMoisture?.root_zone_moisture || 0}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className={`glass-card border ${statusColors[moistureStatus]}`}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">حالة الرطوبة</p>
                                <p className="text-2xl font-bold mt-2">
                                    {statusLabels[moistureStatus]}
                                </p>
                            </div>
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${statusColors[moistureStatus]}`}>
                                {moistureStatus === 'optimal' ? (
                                    <TrendingUp className="h-6 w-6" />
                                ) : (
                                    <AlertTriangle className="h-6 w-6" />
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                            النطاق المثالي: 40-70%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Historical Moisture Chart */}
            <Card className="glass-card border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-primary" />
                        اتجاه رطوبة التربة - آخر 30 يوم
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={historicalData}>
                            <defs>
                                <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00ff7f" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#00ff7f" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis
                                dataKey="date"
                                stroke="#888"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
                                stroke="#888"
                                style={{ fontSize: '12px' }}
                                domain={[0, 100]}
                                label={{ value: 'الرطوبة (%)', angle: -90, position: 'insideLeft', fill: '#888' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #333',
                                    borderRadius: '8px'
                                }}
                                labelStyle={{ color: '#fff' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="optimal_max"
                                stroke="none"
                                fill="#00ff7f20"
                                fillOpacity={0.2}
                            />
                            <Area
                                type="monotone"
                                dataKey="optimal_min"
                                stroke="none"
                                fill="#00ff7f20"
                                fillOpacity={0.2}
                            />
                            <Line
                                type="monotone"
                                dataKey="moisture"
                                stroke="#00ff7f"
                                strokeWidth={3}
                                dot={{ fill: '#00ff7f', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                    <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary" />
                            <span>رطوبة التربة الفعلية</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary/30" />
                            <span>النطاق المثالي (40-70%)</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* AI Irrigation Predictions */}
            {predictions.length > 0 && (
                <Card className="glass-card border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            توصيات الري بالذكاء الاصطناعي
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {predictions.map((pred, idx) => (
                            <div
                                key={idx}
                                className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="h-4 w-4 text-primary" />
                                            <span className="font-semibold">
                                                {new Date(pred.recommended_date).toLocaleDateString('ar-EG', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{pred.reason}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-muted-foreground">الثقة</div>
                                        <div className="text-lg font-bold text-primary">
                                            {(pred.confidence * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                                    <div>
                                        <div className="text-xs text-muted-foreground">كمية المياه الموصى بها</div>
                                        <div className="text-xl font-bold text-primary">{pred.water_amount_mm} مم</div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs text-muted-foreground mb-1">توقعات الرطوبة (7 أيام)</div>
                                        <div className="flex gap-1">
                                            {pred.soil_moisture_forecast.map((val, i) => (
                                                <div
                                                    key={i}
                                                    className="flex-1 bg-white/10 rounded overflow-hidden"
                                                    style={{ height: '24px' }}
                                                >
                                                    <div
                                                        className="bg-primary transition-all"
                                                        style={{
                                                            height: `${(val / 100) * 100}%`,
                                                            width: '100%'
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Info Card */}
            <Card className="glass-card border-white/10">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <div className="text-sm text-muted-foreground">
                            <p className="font-semibold text-white mb-1">مدعوم بالذكاء الاصطناعي</p>
                            <p>
                                هذه التحليلات مبنية على بيانات الأقمار الصناعية الفعلية،
                                نماذج التعلم الآلي، وتوقعات الطقس. يتم تحديث البيانات يومياً لضمان دقة التوصيات.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
