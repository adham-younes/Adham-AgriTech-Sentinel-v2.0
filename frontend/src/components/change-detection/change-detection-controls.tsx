'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { CalendarIcon, ArrowLeftRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ChangeDetectionControlsProps {
    fieldId: string
    onAnalyze: (date1: string, date2: string, index: string) => void
    isAnalyzing?: boolean
}

export function ChangeDetectionControls({ fieldId, onAnalyze, isAnalyzing = false }: ChangeDetectionControlsProps) {
    const [date1, setDate1] = useState<Date | undefined>(undefined)
    const [date2, setDate2] = useState<Date | undefined>(undefined)
    const [index, setIndex] = useState<string>('NDVI')

    const handleAnalyze = () => {
        if (!date1 || !date2) {
            toast.error('يرجى اختيار التاريخين للمقارنة')
            return
        }

        if (date1 >= date2) {
            toast.error('يجب أن يكون تاريخ الأساس قبل تاريخ المقارنة')
            return
        }

        onAnalyze(
            format(date1, 'yyyy-MM-dd'),
            format(date2, 'yyyy-MM-dd'),
            index
        )
    }

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ArrowLeftRight className="h-5 w-5 text-primary" />
                    إعدادات المقارنة
                </CardTitle>
                <CardDescription>
                    قارن بين تاريخين لتحليل التغيرات في الغطاء النباتي
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Index Selector */}
                <div className="space-y-2">
                    <Label>المؤشر</Label>
                    <Select value={index} onValueChange={setIndex} disabled={isAnalyzing}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NDVI">NDVI (صحة النبات)</SelectItem>
                            <SelectItem value="NDWI">NDWI (رطوبة الماء)</SelectItem>
                            <SelectItem value="EVI">EVI (نباتات كثيفة)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Date 1: Baseline */}
                <div className="space-y-2">
                    <Label>تاريخ الأساس (القديم)</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !date1 && "text-muted-foreground"
                                )}
                                disabled={isAnalyzing}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date1 ? format(date1, "PPP", { locale: ar }) : <span>اختر تاريخ</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={date1}
                                onSelect={setDate1}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Date 2: Comparison */}
                <div className="space-y-2">
                    <Label>تاريخ المقارنة (الجديد)</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !date2 && "text-muted-foreground"
                                )}
                                disabled={isAnalyzing}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date2 ? format(date2, "PPP", { locale: ar }) : <span>اختر تاريخ</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={date2}
                                onSelect={setDate2}
                                initialFocus
                                disabled={(date) => date1 ? date <= date1 : false}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Analyze Button */}
                <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !date1 || !date2}
                    className="w-full"
                    size="lg"
                >
                    {isAnalyzing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            جاري التحليل...
                        </>
                    ) : (
                        <>
                            <ArrowLeftRight className="mr-2 h-4 w-4" />
                            تحليل التغييرات
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}
