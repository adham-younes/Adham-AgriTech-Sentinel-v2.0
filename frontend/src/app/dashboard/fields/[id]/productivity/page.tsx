'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ZoningControls } from '@/components/zoning/zoning-controls'
import { ProductivityMapViewer } from '@/components/maps/productivity-map-viewer'
import { ZoneDetailCard } from '@/components/zoning/zone-detail-card'
import { Loader2, MapIcon, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { ZoneData } from '@/lib/services/zoning'

export default function ProductivityPage() {
    const params = useParams()
    const fieldId = params.id as string

    const [productivityMapId, setProductivityMapId] = useState<string | null>(null)
    const [zones, setZones] = useState<ZoneData[]>([])
    const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle')
    const [shapefileUrl, setShapefileUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [fieldData, setFieldData] = useState<any>(null)

    // Fetch field data
    useEffect(() => {
        const fetchField = async () => {
            try {
                const response = await fetch(`/api/fields/${fieldId}`)
                if (response.ok) {
                    const data = await response.json()
                    setFieldData(data)
                }
            } catch (error) {
                console.error('Failed to fetch field:', error)
            }
        }
        fetchField()
    }, [fieldId])

    // Poll for map status
    useEffect(() => {
        if (!productivityMapId || status === 'completed' || status === 'failed') return

        const pollStatus = async () => {
            try {
                const response = await fetch(`/api/eosda/zoning/status/${productivityMapId}`)
                const data = await response.json()

                if (!response.ok || !data.success) {
                    setStatus('failed')
                    setError(data.error || 'فشل في جلب حالة الخريطة')
                    return
                }

                if (data.status === 'completed' && data.zones) {
                    setZones(data.zones)
                    setShapefileUrl(data.shapefileUrl || null)
                    setStatus('completed')
                } else if (data.status === 'failed') {
                    setStatus('failed')
                    setError(data.error || 'فشل إنشاء خريطة الإنتاجية')
                } else {
                    setStatus('processing')
                }
            } catch (error) {
                console.error('Failed to poll status:', error)
                setError('حدث خطأ في جلب حالة الخريطة')
            }
        }

        // Poll every 5 seconds
        const interval = setInterval(pollStatus, 5000)

        // Initial poll
        pollStatus()

        return () => clearInterval(interval)
    }, [productivityMapId, status])

    const handleMapGenerated = (mapId: string) => {
        setProductivityMapId(mapId)
        setStatus('processing')
        setError(null)
    }

    const totalFieldArea = fieldData?.geom
        ? calculateArea(fieldData.geom)
        : zones.reduce((sum, zone) => sum + zone.area, 0)

    return (
        <div className="container py-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <MapIcon className="h-8 w-8 text-primary" />
                    خريطة الإنتاجية
                </h1>
                <p className="text-muted-foreground mt-1">
                    {fieldData?.name ? `حقل ${fieldData.name}` : 'جاري التحميل...'}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Controls */}
                <div className="lg:col-span-1">
                    <ZoningControls
                        fieldId={fieldId}
                        onMapGenerated={handleMapGenerated}
                        isGenerating={status === 'processing'}
                    />
                </div>

                {/* Right: Map & Results */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Map Viewer */}
                    {status === 'idle' && (
                        <Card className="glass-card">
                            <CardContent className="flex flex-col items-center justify-center py-20">
                                <MapIcon className="h-16 w-16 text-muted-foreground/30 mb-4" />
                                <p className="text-muted-foreground text-center">
                                    اختر الإعدادات واضغط على "إنشاء خريطة الإنتاجية" للبدء
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {status === 'processing' && (
                        <Card className="glass-card">
                            <CardContent className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                                <p className="text-lg font-medium mb-2">جاري إنشاء خريطة الإنتاجية...</p>
                                <p className="text-sm text-muted-foreground">
                                    قد يستغرق هذا من 30 ثانية إلى 5 دقائق
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {status === 'failed' && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>خطأ</AlertTitle>
                            <AlertDescription>{error || 'فشل إنشاء خريطة الإنتاجية'}</AlertDescription>
                        </Alert>
                    )}

                    {status === 'completed' && zones.length > 0 && (
                        <>
                            {/* Map */}
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle>خريطة المناطق</CardTitle>
                                    <CardDescription>
                                        تم تقسيم الحقل إلى {zones.length} مناطق بناءً على مستوى الإنتاجية
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ProductivityMapViewer
                                        zones={zones}
                                        center={fieldData?.center ? [fieldData.center.lng, fieldData.center.lat] : undefined}
                                        className="h-[500px]"
                                    />
                                </CardContent>
                            </Card>

                            {/* Zone Cards */}
                            <div>
                                <h2 className="text-xl font-bold mb-4">تفاصيل المناطق</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {zones.map((zone) => (
                                        <ZoneDetailCard
                                            key={zone.zone_id}
                                            zone={zone}
                                            totalFieldArea={totalFieldArea}
                                            shapefileUrl={shapefileUrl || undefined}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

// Helper to calculate area from GeoJSON geometry
function calculateArea(geom: any): number {
    // Simplified area calculation
    // In production, use turf.js or similar
    return 100000 // Placeholder
}
