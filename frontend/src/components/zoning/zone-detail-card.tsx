'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import type { ZoneData } from '@/lib/services/zoning'

interface ZoneDetailCardProps {
    zone: ZoneData
    totalFieldArea: number
    shapefileUrl?: string
}

export function ZoneDetailCard({ zone, totalFieldArea, shapefileUrl }: ZoneDetailCardProps) {
    const areaInFeddan = (zone.area / 4200).toFixed(2) // Convert m² to feddan
    const areaPercent = ((zone.area / totalFieldArea) * 100).toFixed(1)

    const getProductivityIcon = () => {
        switch (zone.productivity_level) {
            case 'high':
                return <TrendingUp className="h-4 w-4" />
            case 'low':
                return <TrendingDown className="h-4 w-4" />
            default:
                return <Minus className="h-4 w-4" />
        }
    }

    const getProductivityColor = () => {
        switch (zone.productivity_level) {
            case 'high':
                return 'bg-green-500/10 text-green-700 border-green-500/20'
            case 'low':
                return 'bg-red-500/10 text-red-700 border-red-500/20'
            default:
                return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20'
        }
    }

    const getProductivityLabel = () => {
        switch (zone.productivity_level) {
            case 'high':
                return 'إنتاجية عالية'
            case 'low':
                return 'إنتاجية منخفضة'
            default:
                return 'إنتاجية متوسطة'
        }
    }

    const handleDownloadShapefile = () => {
        if (shapefileUrl) {
            window.open(shapefileUrl, '_blank')
        }
    }

    return (
        <Card className="glass-card hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                        منطقة {zone.zone_id.replace('zone_', '')}
                    </CardTitle>
                    <Badge variant="outline" className={`gap-1 ${getProductivityColor()}`}>
                        {getProductivityIcon()}
                        {getProductivityLabel()}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Area Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">المساحة</p>
                        <p className="text-lg font-bold text-primary">
                            {areaInFeddan} فدان
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">النسبة من الحقل</p>
                        <p className="text-lg font-bold">
                            {areaPercent}%
                        </p>
                    </div>
                </div>

                {/* Fertilizer Recommendations */}
                {zone.fertilizer_recommendation && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">توصيات الأسمدة:</p>
                        <div className="grid grid-cols-3 gap-2">
                            {zone.fertilizer_recommendation.N !== undefined && (
                                <div className="rounded-md bg-blue-500/10 p-2 text-center">
                                    <p className="text-xs text-muted-foreground">نيتروجين (N)</p>
                                    <p className="text-sm font-bold text-blue-700">
                                        {zone.fertilizer_recommendation.N} كجم/فدان
                                    </p>
                                </div>
                            )}
                            {zone.fertilizer_recommendation.P !== undefined && (
                                <div className="rounded-md bg-purple-500/10 p-2 text-center">
                                    <p className="text-xs text-muted-foreground">فوسفور (P)</p>
                                    <p className="text-sm font-bold text-purple-700">
                                        {zone.fertilizer_recommendation.P} كجم/فدان
                                    </p>
                                </div>
                            )}
                            {zone.fertilizer_recommendation.K !== undefined && (
                                <div className="rounded-md bg-orange-500/10 p-2 text-center">
                                    <p className="text-xs text-muted-foreground">بوتاسيوم (K)</p>
                                    <p className="text-sm font-bold text-orange-700">
                                        {zone.fertilizer_recommendation.K} كجم/فدان
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Download Button */}
                {shapefileUrl && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleDownloadShapefile}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        تحميل Shapefile
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
