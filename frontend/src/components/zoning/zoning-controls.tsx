'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Loader2, MapIcon } from 'lucide-react'
import { toast } from 'sonner'

interface ZoningControlsProps {
    fieldId: string
    onMapGenerated: (mapId: string) => void
    isGenerating?: boolean
}

export function ZoningControls({ fieldId, onMapGenerated, isGenerating = false }: ZoningControlsProps) {
    const [vegetationIndex, setVegetationIndex] = useState<string>('NDVI')
    const [zoneQuantity, setZoneQuantity] = useState<number[]>([5])
    const [isLoading, setIsLoading] = useState(false)

    const handleGenerateMap = async () => {
        setIsLoading(true)

        try {
            const response = await fetch('/api/eosda/zoning/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fieldId,
                    vegetationIndex,
                    zoneQuantity: zoneQuantity[0],
                    minZoneArea: 1000
                })
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'فشل إنشاء خريطة الإنتاجية')
            }

            toast.success('تم إنشاء مهمة خريطة الإنتاجية', {
                description: 'جاري معالجة البيانات... قد يستغرق هذا من 30 ثانية إلى 5 دقائق.'
            })

            onMapGenerated(data.productivityMapId || data.zmapId)

        } catch (error) {
            console.error('Failed to generate productivity map:', error)
            toast.error('فشل إنشاء خريطة الإنتاجية', {
                description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
            })
        } finally {
            setIsLoading(false)
        }
    }

    const loading = isLoading || isGenerating

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MapIcon className="h-5 w-5 text-primary" />
                    إعدادات خريطة الإنتاجية
                </CardTitle>
                <CardDescription>
                    اختر المؤشر وعدد المناطق لإنشاء خريطة إنتاجية للحقل
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Vegetation Index Selector */}
                <div className="space-y-2">
                    <Label htmlFor="vegetation-index">مؤشر النباتات</Label>
                    <Select value={vegetationIndex} onValueChange={setVegetationIndex} disabled={loading}>
                        <SelectTrigger id="vegetation-index">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NDVI">
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">NDVI</span>
                                    <span className="text-xs text-muted-foreground">
                                        مؤشر الفرق الطبيعي للنباتات
                                    </span>
                                </div>
                            </SelectItem>
                            <SelectItem value="NDWI">
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">NDWI</span>
                                    <span className="text-xs text-muted-foreground">
                                        مؤشر رطوبة التربة
                                    </span>
                                </div>
                            </SelectItem>
                            <SelectItem value="EVI">
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">EVI</span>
                                    <span className="text-xs text-muted-foreground">
                                        مؤشر النباتات المحسّن
                                    </span>
                                </div>
                            </SelectItem>
                            <SelectItem value="NDMI">
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">NDMI</span>
                                    <span className="text-xs text-muted-foreground">
                                        مؤشر رطوبة النباتات
                                    </span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Zone Quantity Slider */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="zone-quantity">عدد المناطق</Label>
                        <span className="text-sm font-medium text-primary">
                            {zoneQuantity[0]} مناطق
                        </span>
                    </div>
                    <Slider
                        id="zone-quantity"
                        min={3}
                        max={7}
                        step={2}
                        value={zoneQuantity}
                        onValueChange={setZoneQuantity}
                        disabled={loading}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>3 (أقل تفصيل)</span>
                        <span>5 (موصى به)</span>
                        <span>7 (أكثر تفصيل)</span>
                    </div>
                </div>

                {/* Info Box */}
                <div className="rounded-md bg-muted/50 p-3 text-sm">
                    <p className="text-muted-foreground">
                        ℹ️ سيتم تقسيم الحقل إلى <strong>{zoneQuantity[0]} مناطق</strong> بناءً على{' '}
                        <strong>{vegetationIndex}</strong>. كل منطقة ستحصل على توصيات محددة للأسمدة.
                    </p>
                </div>

                {/* Generate Button */}
                <Button
                    onClick={handleGenerateMap}
                    disabled={loading}
                    className="w-full"
                    size="lg"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            جاري الإنشاء...
                        </>
                    ) : (
                        <>
                            <MapIcon className="mr-2 h-4 w-4" />
                            إنشاء خريطة الإنتاجية
                        </>
                    )}
                </Button>

                {loading && (
                    <p className="text-center text-sm text-muted-foreground animate-pulse">
                        ⏳ قد يستغرق هذا من 30 ثانية إلى 5 دقائق...
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
