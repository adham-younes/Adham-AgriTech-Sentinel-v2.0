'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Loader2 } from 'lucide-react'

interface DiffMapViewerProps {
    tileUrl: string
    center?: [number, number]
    className?: string
}

export function DiffMapViewer({ tileUrl, center = [31.2357, 30.0444], className = '' }: DiffMapViewerProps) {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<maplibregl.Map | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!mapContainer.current || map.current) return

        // Initialize map
        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: {
                version: 8,
                glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
                sources: {
                    'esri-world-imagery': {
                        type: 'raster',
                        tiles: [
                            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                        ],
                        tileSize: 256,
                        attribution: '© Esri'
                    }
                },
                layers: [
                    {
                        id: 'esri-imagery',
                        type: 'raster',
                        source: 'esri-world-imagery'
                    }
                ]
            },
            center: center,
            zoom: 13,
            attributionControl: false
        })

        map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

        map.current.on('load', () => {
            setIsLoading(false)
        })

        return () => {
            map.current?.remove()
            map.current = null
        }
    }, [])

    // Update tile layer when URL changes
    useEffect(() => {
        if (!map.current || !tileUrl) return
        if (!map.current.loaded()) return

        // Remove existing diff layer
        if (map.current.getLayer('diff-layer')) {
            map.current.removeLayer('diff-layer')
        }
        if (map.current.getSource('diff-source')) {
            map.current.removeSource('diff-source')
        }

        // Add new source
        map.current.addSource('diff-source', {
            type: 'raster',
            tiles: [tileUrl],
            tileSize: 256
        })

        // Add layer
        map.current.addLayer({
            id: 'diff-layer',
            type: 'raster',
            source: 'diff-source',
            paint: {
                'raster-opacity': 0.7
            }
        })

    }, [tileUrl])

    return (
        <div className={`relative ${className}`}>
            <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">جاري تحميل الخريطة...</p>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
                <p className="text-sm font-medium mb-2">مفتاح التغيير</p>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm bg-green-500" />
                        <span className="text-xs">نمو / تحسن</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm bg-yellow-500" />
                        <span className="text-xs">لا تغيير</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm bg-red-500" />
                        <span className="text-xs">تراجع / ضرر</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
