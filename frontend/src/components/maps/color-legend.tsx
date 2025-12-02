/**
 * Color Legend Component
 * Displays a gradient bar with labels for map layers
 */

import React from 'react'
import { getColormapConfig, generateGradient } from '@/lib/config/eosda-colormaps'

interface ColorLegendProps {
    layer: string
    className?: string
}

export function ColorLegend({ layer, className = '' }: ColorLegendProps) {
    const config = getColormapConfig(layer)

    if (!config || !config.colors) {
        return null
    }

    const [minValue, maxValue] = config.levels.split(',').map(Number)
    const gradient = generateGradient(config.colors)

    return (
        <div className={`bg-black/80 backdrop-blur-sm p-3 rounded-lg border border-white/10 ${className}`}>
            <div className="text-white text-xs space-y-2">
                {/* Title */}
                <div className="font-bold text-sm">{config.name}</div>

                {/* Description */}
                <div className="text-muted-foreground text-[10px] leading-tight">
                    {config.description}
                </div>

                {/* Gradient Bar */}
                <div className="relative">
                    <div
                        className="h-4 w-40 rounded border border-white/20"
                        style={{ background: gradient }}
                    />

                    {/* Value Labels */}
                    <div className="flex justify-between mt-1 text-[10px] font-mono">
                        <span className="text-white/80">{minValue}</span>
                        <span className="text-white/80">{maxValue}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
