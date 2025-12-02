'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingDown, TrendingUp, Minus, AlertTriangle } from 'lucide-react'
import type { ChangeAnalysisResult } from '@/lib/services/change-detection'

interface ChangeStatsCardProps {
    result: ChangeAnalysisResult
    onCreateAlert: () => void
    isCreatingAlert?: boolean
}

export function ChangeStatsCard({ result, onCreateAlert, isCreatingAlert = false }: ChangeStatsCardProps) {
    const { changePercentage, changeType, isSignificant } = result
    const absChange = Math.abs(changePercentage)

    const getChangeColor = () => {
        if (changeType === 'positive') return 'text-green-600'
        if (changeType === 'negative') return 'text-red-600'
        return 'text-yellow-600'
    }

    const getChangeIcon = () => {
        if (changeType === 'positive') return <TrendingUp className="h-8 w-8 text-green-600" />
        if (changeType === 'negative') return <TrendingDown className="h-8 w-8 text-red-600" />
        return <Minus className="h-8 w-8 text-yellow-600" />
    }

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>ملخص التغييرات</span>
                    {isSignificant && (
                        <Badge variant="destructive" className="animate-pulse">
                            تغيير ملحوظ
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Main Stat */}
                <div className="flex items-center justify-center gap-4 py-4">
                    {getChangeIcon()}
                    <div className="text-center">
                        <span className={`text-4xl font-bold ${getChangeColor()}`}>
                            {changePercentage > 0 ? '+' : ''}{changePercentage}%
                        </span>
                        <p className="text-sm text-muted-foreground mt-1">
                            {changeType === 'positive' ? 'تحسن في الغطاء النباتي' :
                                changeType === 'negative' ? 'تراجع في الغطاء النباتي' :
                                    'تغيير طفيف'}
                        </p>
                    </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground">المتوسط السابق</p>
                        <p className="font-semibold">{result.baselineStats.mean.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground">المتوسط الحالي</p>
                        <p className="font-semibold">{result.comparisonStats.mean.toFixed(2)}</p>
                    </div>
                </div>

                {/* Alert Button */}
                {isSignificant && (
                    <div className="pt-2">
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={onCreateAlert}
                            disabled={isCreatingAlert}
                        >
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            {isCreatingAlert ? 'جاري الحفظ...' : 'إنشاء تنبيه لهذا التغيير'}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                            سيتم حفظ هذا التغيير في سجل التنبيهات لمتابعته لاحقاً
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
