"use client";

import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, ArrowRight, X, Send, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n/use-language';

interface AiAgronomistWidgetProps {
    fieldId?: string;
    cropType?: string | null;
    mode?: 'floating' | 'embedded';
}

export function AiAgronomistWidget({ fieldId, cropType, mode = 'floating' }: AiAgronomistWidgetProps) {
    const { language } = useTranslation();
    const isArabic = language === 'ar';
    const [isVisible, setIsVisible] = useState(true);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<string | null>(null);

    // Initial insight (placeholder or fetched)
    const [insight, setInsight] = useState<{ title: string; message: string; type: 'alert' | 'tip' | 'insight' } | null>(null);

    useEffect(() => {
        if (!fieldId) {
            // setInsight(null); // Keep visible for general questions if no field selected
            if (!insight) {
                setInsight({
                    title: isArabic ? "المساعد الذكي" : "OSIRIS AI",
                    message: isArabic ? "أنا هنا لمساعدتك. اسألني أي شيء عن مزرعتك." : "I am here to assist. Ask me anything about your farm.",
                    type: 'insight'
                });
            }
            return;
        }

        const crop = cropType || (isArabic ? "المحصول" : "Crop");

        setInsight({
            title: isArabic ? `تحليل ${crop}` : `${crop} Analysis`,
            message: isArabic
                ? `جاري مراقبة ${crop} في الحقل المحدد. الذكاء الاصطناعي يحلل بيانات الأقمار الصناعية للكشف عن أي إجهاد نباتي مبكر.`
                : `Monitoring ${crop} in the selected field. AI is analyzing satellite data to detect any early plant stress.`,
            type: 'insight'
        });
    }, [fieldId, cropType, isArabic]);

    const handleAsk = async () => {
        if (!input.trim()) return;

        setIsLoading(true);
        setResponse(null);

        try {
            const res = await fetch('/api/osiris', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: input,
                    context: { fieldId, cropType, language }
                })
            });

            const data = await res.json();

            if (data.error) {
                setResponse(isArabic ? "حدث خطأ في الاتصال." : "Connection error.");
            } else {
                setResponse(data.response);
            }
        } catch (e) {
            setResponse(isArabic ? "حدث خطأ غير متوقع." : "Unexpected error.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isVisible) return null;

    const containerClasses = mode === 'floating'
        ? "fixed bottom-6 right-6 z-50 w-full max-w-md"
        : "w-full";

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="ai-widget"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className={containerClasses}
            >
                <Card className={`glass-card border-primary/30 shadow-2xl backdrop-blur-xl bg-black/80 overflow-hidden relative ${mode === 'embedded' ? 'h-full' : ''}`}>
                    {/* Animated Gradient Border */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 animate-pulse pointer-events-none" />

                    <CardContent className="p-0">
                        <div className="flex flex-col gap-4 p-5">
                            {/* Header */}
                            <div className="flex items-start gap-4">
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
                                            {insight?.title || "OSIRIS"}
                                            <span className="text-[10px] px-2 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                                ONLINE
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
                                        {response || insight?.message}
                                    </p>
                                </div>
                            </div>

                            {/* Input Area */}
                            <div className="flex gap-2 mt-2">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={isArabic ? "اسأل OSIRIS..." : "Ask OSIRIS..."}
                                    className="bg-black/50 border-white/10 text-white placeholder:text-gray-500"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                                    disabled={isLoading}
                                />
                                <Button
                                    onClick={handleAsk}
                                    disabled={isLoading || !input.trim()}
                                    size="icon"
                                    className="bg-primary hover:bg-primary/90 text-black"
                                >
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}
