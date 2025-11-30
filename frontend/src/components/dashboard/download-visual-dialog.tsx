"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2, Download, CheckCircle, AlertCircle, FileImage } from "lucide-react"
import { downloadVisualImage, checkDownloadTaskStatus, getDownloadUrl, type DownloadVisualParams } from "@/lib/services/eosda"
import { useTranslation } from "@/lib/i18n/use-language"

interface DownloadVisualDialogProps {
    isOpen: boolean
    onClose: () => void
    viewId: string
    geometry: {
        type: 'Polygon'
        coordinates: number[][][]
    }
    date: string
    cloudCoverage: number
}

type DownloadFormat = 'png' | 'jpeg' | 'tiff'
type Resolution = 'low' | 'medium' | 'high'
type LayerType = 'RGB' | 'NDVI' | 'NDWI' | 'NDMI'

export function DownloadVisualDialog({
    isOpen,
    onClose,
    viewId,
    geometry,
    date,
    cloudCoverage
}: DownloadVisualDialogProps) {
    const { t, language } = useTranslation()
    const isAr = language === 'ar'

    const [format, setFormat] = useState<DownloadFormat>('png')
    const [resolution, setResolution] = useState<Resolution>('medium')
    const [layerType, setLayerType] = useState<LayerType>('RGB')

    const [status, setStatus] = useState<'idle' | 'creating' | 'processing' | 'completed' | 'failed'>('idle')
    const [taskId, setTaskId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)

    // Reset state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setStatus('idle')
            setTaskId(null)
            setError(null)
            setProgress(0)
        }
    }, [isOpen])

    // Poll for status
    useEffect(() => {
        let intervalId: NodeJS.Timeout

        if (status === 'processing' && taskId) {
            intervalId = setInterval(async () => {
                try {
                    const result = await checkDownloadTaskStatus(taskId)

                    if (result.status === 'completed') {
                        setStatus('completed')
                        setProgress(100)
                        // Trigger download
                        window.location.href = getDownloadUrl(taskId)
                    } else if (result.status === 'failed') {
                        setStatus('failed')
                        setError(result.error || 'Download failed')
                    } else {
                        // Fake progress increment while processing
                        setProgress(prev => Math.min(prev + 5, 90))
                    }
                } catch (err) {
                    console.error('Polling error:', err)
                    // Don't fail immediately on network error, just retry
                }
            }, 2000)
        }

        return () => {
            if (intervalId) clearInterval(intervalId)
        }
    }, [status, taskId])

    const handleDownload = async () => {
        setStatus('creating')
        setError(null)
        setProgress(10)

        try {
            // Calculate pixel size based on resolution
            // Low: 30m, Medium: 10m (Sentinel native), High: 5m (Upscaled)
            let pxSize = 10
            if (resolution === 'low') pxSize = 30
            if (resolution === 'high') pxSize = 5

            const params: DownloadVisualParams = {
                viewId,
                bmType: layerType,
                geometry,
                pxSize,
                format,
                reference: `download_${Date.now()}`,
                calibrate: 1
            }

            const result = await downloadVisualImage(params)

            if (result.success && result.taskId) {
                setTaskId(result.taskId)
                setStatus('processing')
                setProgress(20)
            } else {
                throw new Error(result.error || 'Failed to start download')
            }
        } catch (err) {
            console.error('Download error:', err)
            setStatus('failed')
            setError(err instanceof Error ? err.message : 'Unknown error occurred')
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md glass-card border-emerald-500/20">
                <DialogHeader>
                    <DialogTitle className="text-xl text-emerald-400 flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        {isAr ? 'تصدير صورة القمر الصناعي' : 'Export Satellite Imagery'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {isAr
                            ? 'قم بتخصيص إعدادات التصدير للصورة المحددة.'
                            : 'Customize export settings for the selected imagery.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Image Info */}
                    <div className="rounded-lg bg-black/20 p-3 text-sm border border-white/5 space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-400">{isAr ? 'التاريخ:' : 'Date:'}</span>
                            <span className="text-gray-200 font-medium">{new Date(date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">{isAr ? 'الغطاء السحابي:' : 'Cloud Cover:'}</span>
                            <span className="text-gray-200 font-medium">{cloudCoverage}%</span>
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{isAr ? 'نوع الطبقة' : 'Layer Type'}</Label>
                            <Select value={layerType} onValueChange={(v: LayerType) => setLayerType(v)} disabled={status !== 'idle' && status !== 'failed'}>
                                <SelectTrigger className="bg-black/20 border-white/10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="RGB">True Color (RGB)</SelectItem>
                                    <SelectItem value="NDVI">NDVI (Vegetation)</SelectItem>
                                    <SelectItem value="NDWI">NDWI (Water)</SelectItem>
                                    <SelectItem value="NDMI">NDMI (Moisture)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>{isAr ? 'الصيغة' : 'Format'}</Label>
                            <Select value={format} onValueChange={(v: DownloadFormat) => setFormat(v)} disabled={status !== 'idle' && status !== 'failed'}>
                                <SelectTrigger className="bg-black/20 border-white/10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="png">PNG (Image)</SelectItem>
                                    <SelectItem value="jpeg">JPEG (Compressed)</SelectItem>
                                    <SelectItem value="tiff">GeoTIFF (Analysis)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 col-span-2">
                            <Label>{isAr ? 'الدقة' : 'Resolution'}</Label>
                            <Select value={resolution} onValueChange={(v: Resolution) => setResolution(v)} disabled={status !== 'idle' && status !== 'failed'}>
                                <SelectTrigger className="bg-black/20 border-white/10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low (30m/px) - Fast</SelectItem>
                                    <SelectItem value="medium">Medium (10m/px) - Standard</SelectItem>
                                    <SelectItem value="high">High (5m/px) - Upscaled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Status & Progress */}
                    {status !== 'idle' && (
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className={status === 'failed' ? 'text-red-400' : 'text-emerald-400'}>
                                    {status === 'creating' && (isAr ? 'جاري إنشاء المهمة...' : 'Creating task...')}
                                    {status === 'processing' && (isAr ? 'جاري المعالجة...' : 'Processing...')}
                                    {status === 'completed' && (isAr ? 'تم التحميل بنجاح!' : 'Download complete!')}
                                    {status === 'failed' && (isAr ? 'فشل التحميل' : 'Download failed')}
                                </span>
                                <span className="text-gray-400">{progress}%</span>
                            </div>
                            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${status === 'failed' ? 'bg-red-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            {error && (
                                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-between gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={status === 'creating' || status === 'processing'}>
                        {isAr ? 'إلغاء' : 'Cancel'}
                    </Button>

                    {status === 'completed' ? (
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                            onClick={() => window.location.href = getDownloadUrl(taskId!)}
                        >
                            <Download className="h-4 w-4" />
                            {isAr ? 'تحميل مرة أخرى' : 'Download Again'}
                        </Button>
                    ) : (
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                            onClick={handleDownload}
                            disabled={status === 'creating' || status === 'processing'}
                        >
                            {status === 'processing' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <FileImage className="h-4 w-4" />
                            )}
                            {isAr ? 'بدء التصدير' : 'Start Export'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
