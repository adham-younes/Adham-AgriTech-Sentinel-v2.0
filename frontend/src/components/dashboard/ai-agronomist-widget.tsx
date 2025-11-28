"use client";

import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, ArrowRight, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';

interface AiAgronomistWidgetProps {
    fieldId?: string;
    cropType?: string | null;
    mode?: 'floating' | 'embedded';
}

export function AiAgronomistWidget({ fieldId, cropType, mode = 'floating' }: AiAgronomistWidgetProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [insight, setInsight] = useState<{ title: string; message: string; type: 'alert' | 'tip' | 'insight' } | null>(null);

    useEffect(() => {
        if (!fieldId) {
            setInsight(null);
            return;
        }

        const crop = cropType || "المحصول";

        setInsight({
            title: `تحليل ${crop}`,
            message: `جاري مراقبة ${crop} في الحقل المحدد. الذكاء الاصطناعي يحلل بيانات الأقمار الصناعية للكشف عن أي إجهاد نباتي مبكر.`,
            type: 'insight'
        });
    }, [fieldId, cropType]);

    if (!isVisible || !insight) return null;

    const containerClasses = mode === 'floating'
        ? "fixed bottom-6 right-6 z-50 w-full max-w-md"
        : "w-full";

    return (
        <AnimatePresence mode="wait">
            {isVisible && insight && (
                <motion.div
                    key="ai-widget"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className={containerClasses}
                >
                    <Card className={`glass-card border-primary/30 shadow-2xl backdrop-blur-xl bg-black/60 overflow-hidden relative ${mode === 'embedded' ? 'h-full' : ''}`}>
                        {/* Animated Gradient Border */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 animate-pulse pointer-events-none" />

                        <CardContent className="p-0 h-full">
                            <div className="flex items-start gap-4 p-5 h-full">
                                <div className="relative shrink-0">
                                    <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-inner">
                                        <Bot className="h-7 w-7 text-primary" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full border-2 border-black flex items-center justify-center">
                                        <Sparkles className="h-2.5 w-2.5 text-black fill-black" />
                                    </div>
                                </div>

                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-white text-lg flex items-center gap-2">
                                            {insight.title}
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${insight.type === 'alert' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                                insight.type === 'tip' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                                    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                }`}>
                                                AI
                                            </span>
                                        </h4>
                                        {mode === 'floating' && (
                                            <button
                                                onClick={() => setIsVisible(false)}
                                                className="text-gray-400 hover:text-white transition-colors"
                                                aria-label="Close"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-gray-300 text-sm leading-relaxed">
                                        {insight.message}
                                    </p>

                                    <div className="pt-3 flex items-center gap-3">
                                        <a href="/dashboard/ai-assistant">
                                            <Button size="sm" variant="default" className="bg-primary hover:bg-primary/90 text-black font-semibold text-xs h-8">
                                                عرض التفاصيل <ArrowRight className="h-3 w-3 mr-1" />
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
