'use client';

import { useState } from 'react';
import { Bot, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ImageDiagnosis from './ImageDiagnosis';

export default function DiagnosisDrawer() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50 rounded-full w-14 h-14 shadow-[0_0_30px_-5px_rgba(0,255,157,0.4)] bg-primary hover:bg-primary/90 text-black p-0 flex items-center justify-center transition-transform hover:scale-110"
            >
                <Bot size={28} />
            </Button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Drawer Panel */}
            <div
                className={cn(
                    "fixed inset-y-0 right-0 w-full md:w-[450px] bg-card border-l border-border z-[60] shadow-2xl transform transition-transform duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <span className="font-mono text-xs text-primary/50">SYSTEM.DIAGNOSIS.V1</span>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                            <X size={20} />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <ImageDiagnosis />
                    </div>
                </div>
            </div>
        </>
    );
}
