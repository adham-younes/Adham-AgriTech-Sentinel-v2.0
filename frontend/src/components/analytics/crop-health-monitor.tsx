"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Leaf, TrendingUp, AlertTriangle, Sparkles, Activity, Target } from 'lucide-react'
import {
    satelliteAnalytics,
    type CropHealthMetrics,
    type NDVIDataPoint,
    type StressZone,
    type YieldPrediction
} from '@/lib/services/satellite-analytics'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

interface CropHealthMonitorProps {
    fieldId: string
    fieldName: string
    polygon: [number, number][]
    cropType?: string | null
    areaHectares?: number
}

export function CropHealthMonitor({
    fieldId,
    fieldName,
    polygon,
    cropType,
    areaHectares = 1
}: CropHealthMonitorProps) {
    const [healthMetrics, setHealthMetrics] = useState<CropHealthMetrics | null>(null)
    const [ndviHistory, setNdviHistory] = useState<NDVIDataPoint[]>([])
    const [stressZones, setStressZones] = useState<StressZone[]>([])
    const [yieldPrediction, setYieldPrediction] = useState<YieldPrediction | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [fieldId])

    const loadData = async () => {
        try {
            setLoading(true)

            // Fetch all data in parallel
            const [metrics, ndvi, stress, yield_pred] = await Promise.all([
                satelliteAnalytics.getCropHealthMetrics(fieldId, polygon),
                satelliteAnalytics.getNDVITimeSeries(fieldId, 90),
                satelliteAnalytics.detectCropStress(fieldId, polygon),
                satelliteAnalytics.predictYield(fieldId, cropType, areaHectares)
            ])

            setHealthMetrics(metrics)
            setNdviHistory(ndvi)
            setStressZones(stress)
            setYieldPrediction(yield_pred)

        } catch (error) {
            console.error('Error loading crop health data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    const ndviStatus = healthMetrics?.ndvi.current
        ? healthMetrics.ndvi.current > 0.7 ? 'excellent'
            : healthMetrics.ndvi.current > 0.5 ? 'good'
                : healthMetrics.ndvi.current > 0.3 ? 'moderate'
                    : 'poor'
        : 'unknown'

    const statusColors = {
        excellent: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
        good: 'text-primary border-primary/30 bg-primary/10',
        moderate: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10',
        poor: 'text-red-500 border-red-500/30 bg-red-500/10',
        unknown: 'text-gray-500 border-gray-500/30 bg-gray-500/10'
    }

    const statusLabels = {
        excellent: 'ممتاز',
        good: 'جيد',
        moderate: 'متوسط',
        poor: 'ضعيف',
        unknown: 'غير معروف'
    }

    const trendIcons = {
        up: <TrendingUp className="h-4 w-4 text-emerald-400" />,
        down: <AlertTriangle className="h-4 w-4 text-red-400" />,
        stable: <Activity className="h-4 w-4 text-blue-400" />
    }

    const trendLabels = {
        up: 'تحسن',
        down: 'تراجع',
        stable: 'مستقر'
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Leaf className="h-6 w-6 text-primary" />
                            مراقبة صحة المحصول بالذكاء الاصطناعي
                        </h2>
                        <p className="text-muted-foreground mt-1">
                            تحليل شامل لـ {fieldName} - {cropType || 'محصول'}
                        </p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg border ${statusColors[ndviStatus]}`}>
                        <div className="text-xs">الحالة العامة</div>
                        <div className="text-lg font-bold">{statusLabels[ndviStatus]}</div>
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="glass-card border-primary/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm text-muted-foreground">NDVI الحالي</p>
                            {healthMetrics && trendIcons[healthMetrics.ndvi.trend]}
                        </div>
                        <p className="text-3xl font-bold text-primary">
                            {healthMetrics?.ndvi.current.toFixed(3) || '--'}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>متوسط 30 يوم:</span>
                            <span className="font-semibold">{healthMetrics?.ndvi.average_30d.toFixed(3)}</span>
                        </div>
                        <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-emerald-400"
                                style={{ width: `${(healthMetrics?.ndvi.current || 0) * 100}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-primary/20">
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-3">مؤشر الكلوروفيل</p>
                        <p className="text-3xl font-bold text-emerald-400">
                            {healthMetrics?.chlorophyll.index.toFixed(3) || '--'}
                        </p>
                        <div className="mt-2 text-xs">
                            <span className={`px-2 py-1 rounded-full ${healthMetrics?.chlorophyll.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' :
                                    healthMetrics?.chlorophyll.status === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                                }`}>
                                {healthMetrics?.chlorophyll.status === 'healthy' ? 'صحي' :
                                    healthMetrics?.chlorophyll.status === 'moderate' ? 'متوسط' : 'ضعيف'}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-primary/20">
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-3">رطوبة النبات</p>
                        <p className="text-3xl font-bold text-blue-400">
                            {healthMetrics?.moisture.current.toFixed(1)}%
                        </p>
                        <div className="mt-2 text-xs text-muted-foreground">
                            النطاق المثالي: {healthMetrics?.moisture.optimal_range.join('-')}%
                        </div>
                        <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                                style={{ width: `${healthMetrics?.moisture.current || 0}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-primary/20">
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-3">الترتيب المئوي</p>
                        <p className="text-3xl font-bold text-yellow-400">
                            {healthMetrics?.ndvi.percentile || 0}%
                        </p>
                        <div className="mt-2 text-xs text-muted-foreground">
                            مقارنة بالبيانات التاريخية
                        </div>
                        <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400"
                                style={{ width: `${healthMetrics?.ndvi.percentile || 0}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* NDVI Timeline */}
            <Card className="glass-card border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        مؤشر صحة النبات (NDVI) - آخر 90 يوم
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={ndviHistory}>
                            <defs>
                                <linearGradient id="ndviGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00ff7f" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#00ff7f" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis
                                dataKey="date"
                                stroke="#888"
                                style={{ fontSize: '11px' }}
                                tickFormatter={(value) => {
                                    const date = new Date(value)
                                    return `${date.getDate()}/${date.getMonth() + 1}`
                                }}
                            />
                            <YAxis
                                stroke="#888"
                                style={{ fontSize: '12px' }}
                                domain={[0, 1]}
                                ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0]}
                                label={{ value: 'NDVI', angle: -90, position: 'insideLeft', fill: '#888' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #333',
                                    borderRadius: '8px'
                                }}
                                labelStyle={{ color: '#fff' }}
                                formatter={(value: any) => [value.toFixed(3), 'NDVI']}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#00ff7f"
                                strokeWidth={2}
                                fill="url(#ndviGradient)"
                                dot={{ fill: '#00ff7f', r: 3 }}
                                activeDot={{ r: 5 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>

                    <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                        <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-xs text-muted-foreground">الاتجاه</div>
                            <div className="flex items-center justify-center gap-1 mt-1">
                                {healthMetrics && trendIcons[healthMetrics.ndvi.trend]}
                                <span className="font-semibold">{healthMetrics && trendLabels[healthMetrics.ndvi.trend]}</span>
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-xs text-muted-foreground">أعلى قيمة</div>
                            <div className="font-semibold mt-1 text-emerald-400">
                                {Math.max(...ndviHistory.map(d => d.value)).toFixed(3)}
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-xs text-muted-foreground">أدنى قيمة</div>
                            <div className="font-semibold mt-1 text-yellow-400">
                                {Math.min(...ndviHistory.map(d => d.value)).toFixed(3)}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Yield Prediction */}
            {yieldPrediction && (
                <Card className="glass-card border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            توقع الإنتاجية بالذكاء الاصطناعي
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm text-muted-foreground mb-2">الإنتاجية المتوقعة</div>
                                    <div className="text-4xl font-bold text-primary">
                                        {yieldPrediction.estimated_yield_tons_per_hectare.toFixed(2)}
                                        <span className="text-lg text-muted-foreground ml-2">طن/هكتار</span>
                                    </div>
                                    <div className="mt-2 text-sm text-muted-foreground">
                                        الإنتاج الكلي المتوقع: {(yieldPrediction.estimated_yield_tons_per_hectare * areaHectares).toFixed(2)} طن
                                    </div>
                                </div>

                                <div>
                                    <div className="text-sm text-muted-foreground mb-2">مستوى الثقة</div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary to-emerald-400"
                                                style={{ width: `${yieldPrediction.confidence * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-lg font-semibold text-primary">
                                            {(yieldPrediction.confidence * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="text-sm font-semibold mb-3">العوامل المؤثرة:</div>

                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                    <span className="text-sm">اتجاه NDVI</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${yieldPrediction.factors.ndvi_trend === 'improving' ? 'bg-emerald-500/20 text-emerald-400' :
                                            yieldPrediction.factors.ndvi_trend === 'declining' ? 'bg-red-500/20 text-red-400' :
                                                'bg-blue-500/20 text-blue-400'
                                        }`}>
                                        {yieldPrediction.factors.ndvi_trend === 'improving' ? 'تحسن' :
                                            yieldPrediction.factors.ndvi_trend === 'declining' ? 'تراجع' : 'مستقر'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                    <span className="text-sm">كفاية الرطوبة</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${yieldPrediction.factors.moisture_adequacy === 'sufficient' ? 'bg-emerald-500/20 text-emerald-400' :
                                            yieldPrediction.factors.moisture_adequacy === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-red-500/20 text-red-400'
                                        }`}>
                                        {yieldPrediction.factors.moisture_adequacy === 'sufficient' ? 'كافية' :
                                            yieldPrediction.factors.moisture_adequacy === 'moderate' ? 'متوسطة' : 'غير كافية'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                    <span className="text-sm">الإجهاد الحراري</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${yieldPrediction.factors.temperature_stress === 'none' ? 'bg-emerald-500/20 text-emerald-400' :
                                            yieldPrediction.factors.temperature_stress === 'low' ? 'bg-blue-500/20 text-blue-400' :
                                                yieldPrediction.factors.temperature_stress === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-red-500/20 text-red-400'
                                        }`}>
                                        {yieldPrediction.factors.temperature_stress === 'none' ? 'لا يوجد' :
                                            yieldPrediction.factors.temperature_stress === 'low' ? 'منخفض' :
                                                yieldPrediction.factors.temperature_stress === 'moderate' ? 'متوسط' : 'عالي'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stress Zones Alert */}
            {stressZones.length > 0 && (
                <Card className="glass-card border-red-500/30 bg-red-500/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-400">
                            <AlertTriangle className="h-5 w-5" />
                            تنبيه: تم اكتشاف مناطق إجهاد
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {stressZones.map((zone) => (
                            <div key={zone.id} className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="font-semibold text-red-400 mb-1">
                                            {zone.type === 'water' ? 'إجهاد مائي' :
                                                zone.type === 'heat' ? 'إجهاد حراري' :
                                                    zone.type === 'nutrient' ? 'نقص عناصر غذائية' : 'مرض محتمل'}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            NDVI: {zone.ndvi_value.toFixed(3)} | المساحة المتأثرة: {zone.affected_area_percentage}%
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${zone.severity === 'high' ? 'bg-red-500/30 text-red-300' :
                                            zone.severity === 'medium' ? 'bg-yellow-500/30 text-yellow-300' :
                                                'bg-blue-500/30 text-blue-300'
                                        }`}>
                                        {zone.severity === 'high' ? 'عالي' :
                                            zone.severity === 'medium' ? 'متوسط' : 'منخفض'}
                                    </span>
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
                            <p className="font-semibold text-white mb-1">تحليلات مدعومة بالذكاء الاصطناعي</p>
                            <p>
                                يستخدم هذا النظام بيانات NDVI من الأقمار الصناعية، نماذج التعلم الآلي،
                                والتحليل التاريخي لتقديم رؤى دقيقة حول صحة محصولك وتوقعات الإنتاجية.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
