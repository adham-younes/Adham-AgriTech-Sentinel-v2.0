"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sprout, Sun, CloudRain, Tractor, CheckCircle2, Calendar } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-language';

const STAGES = [
    { id: 'planting', label: { ar: 'الزراعة', en: 'Planting' }, icon: Sprout, days: 0 },
    { id: 'vegetative', label: { ar: 'النمو الخضري', en: 'Vegetative Growth' }, icon: Sun, days: 30 },
    { id: 'flowering', label: { ar: 'التزهير', en: 'Flowering' }, icon: CloudRain, days: 60 },
    { id: 'harvest', label: { ar: 'الحصاد', en: 'Harvest' }, icon: Tractor, days: 90 },
];

interface CropTimelineProps {
    plantingDate?: string | Date | null;
    cropType?: string | null;
}

export function CropTimeline({ plantingDate, cropType = 'Wheat' }: CropTimelineProps) {
    const { language } = useTranslation();
    const isArabic = language === 'ar';
    const cropName = cropType || (isArabic ? 'المحصول' : 'Crop');

    // Calculate progress
    let progress = 0;
    let currentStageIndex = 0;
    let daysSincePlanting = 0;
    let hasPlantingDate = false;

    if (plantingDate) {
        hasPlantingDate = true;
        const start = new Date(plantingDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - start.getTime());
        daysSincePlanting = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Assuming 120 days cycle for generic crop
        const totalDays = 120;
        progress = Math.min(100, (daysSincePlanting / totalDays) * 100);

        // Determine stage
        if (daysSincePlanting < 30) currentStageIndex = 0;
        else if (daysSincePlanting < 60) currentStageIndex = 1;
        else if (daysSincePlanting < 90) currentStageIndex = 2;
        else currentStageIndex = 3;
    }

    return (
        <Card className="glass-card border-primary/20 shadow-3d">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Sprout className="h-5 w-5 text-primary" />
                        {isArabic ? `دورة حياة المحصول: ${cropName}` : `Crop Lifecycle: ${cropName}`}
                    </span>
                    {hasPlantingDate ? (
                        <span className="text-xs font-normal text-muted-foreground bg-white/5 px-2 py-1 rounded-full border border-white/10">
                            {isArabic ? `اليوم ${daysSincePlanting} من 120` : `Day ${daysSincePlanting} of 120`}
                        </span>
                    ) : (
                        <span className="text-xs font-normal text-muted-foreground bg-white/5 px-2 py-1 rounded-full border border-white/10">
                            {isArabic ? 'لم يتم تحديد تاريخ الزراعة' : 'Planting date not specified'}
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative py-6">
                    {/* Progress Bar Background */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -translate-y-1/2 rounded-full" />

                    {/* Active Progress Bar */}
                    <div
                        className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-primary/50 to-primary -translate-y-1/2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                    />

                    {/* Stages */}
                    <div className="relative flex justify-between w-full">
                        {STAGES.map((stage, index) => {
                            const isCompleted = index <= currentStageIndex && hasPlantingDate;
                            const isCurrent = index === currentStageIndex && hasPlantingDate;
                            const Icon = stage.icon;

                            return (
                                <div key={stage.id} className="flex flex-col items-center gap-2 group cursor-pointer">
                                    <div
                                        className={`
                                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10
                                    ${isCompleted ? 'bg-black border-primary text-primary shadow-[0_0_15px_rgba(0,255,127,0.3)]' : 'bg-black border-white/20 text-muted-foreground'}
                                    ${isCurrent ? 'scale-125 ring-4 ring-primary/20' : ''}
                                `}
                                    >
                                        {isCompleted && !isCurrent ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                                    </div>
                                    <span className={`text-xs font-medium transition-colors ${isCompleted ? 'text-white' : 'text-muted-foreground'}`}>
                                        {isArabic ? stage.label.ar : stage.label.en}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Next Action Hint */}
                {hasPlantingDate ? (
                    <div className="mt-4 bg-primary/5 border border-primary/10 rounded-lg p-3 flex items-start gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0 animate-pulse" />
                        <div>
                            <p className="text-xs font-semibold text-primary mb-0.5">
                                {isArabic ? 'الإجراء القادم المتوقع' : 'Next Expected Action'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {isArabic ? 'متابعة حالة النمو والري بانتظام.' : 'Continue monitoring growth and irrigation regularly.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="mt-4 bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                            {isArabic ? 'يرجى تحديد تاريخ الزراعة لتفعيل تتبع دورة الحياة.' : 'Please specify the planting date to activate lifecycle tracking.'}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
