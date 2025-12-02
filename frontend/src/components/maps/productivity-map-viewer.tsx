'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { ZoneData } from '@/lib/services/zoning'
import { Loader2 } from 'lucide-react'

interface ProductivityMapViewerProps {
    zones: ZoneData[]
    center?: [number, number]
    className?: string
}

export function ProductivityMapViewer({ zones, center = [31.2357, 30.0444], className = '' }: ProductivityMapViewerProps) {
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
            zoom: 14,
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

    // Add zones to map
    useEffect(() => {
        if (!map.current || !zones || zones.length === 0) return
        if (!map.current.loaded()) return

        // Remove existing zone layers
        if (map.current.getLayer('zones-fill')) {
            map.current.removeLayer('zones-fill')
        }
        if (map.current.getLayer('zones-outline')) {
            map.current.removeLayer('zones-outline')
        }
        if (map.current.getSource('zones')) {
            map.current.removeSource('zones')
        }

        // Create GeoJSON from zones
        const features = zones.map(zone => ({
            type: 'Feature' as const,
            properties: {
                zone_id: zone.zone_id,
                productivity_level: zone.productivity_level,
                area: zone.area
            },
            geometry: zone.geometry
        }))

        const geojson = {
            type: 'FeatureCollection' as const,
            features
        }

        // Add source
        map.current.addSource('zones', {
            type: 'geojson',
            data: geojson
        })

        // Add fill layer with color based on productivity
        map.current.addLayer({
            id: 'zones-fill',
            type: 'fill',
            source: 'zones',
            paint: {
                'fill-color': [
                    'match',
                    ['get', 'productivity_level'],
                    'high', '#22c55e',  // Green
                    'medium', '#eab308', // Yellow
                    'low', '#ef4444',    // Red
                    '#94a3b8' // Default gray
                ],
                'fill-opacity': 0.5
            }
        })

        // Add outline layer
        map.current.addLayer({
            id: 'zones-outline',
            type: 'line',
            source: 'zones',
            paint: {
                'line-color': '#ffffff',
                'line-width': 2
            }
        })

        // Fit bounds to zones
        const bounds = new maplibregl.LngLatBounds()
        features.forEach(feature => {
            const coords = feature.geometry.coordinates[0]
            coords.forEach((coord: number[]) => {
                bounds.extend(coord as [number, number])
            })
        })

        map.current.fitBounds(bounds, { padding: 50 })

        // Add click handler
        map.current.on('click', 'zones-fill', (e) => {
            if (!e.features || e.features.length === 0) return

            const feature = e.features[0]
            const props = feature.properties

            new maplibregl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`
          <div class="p-2 text-sm" dir="rtl">
            <p class="font-bold mb-1">${props?.zone_id?.replace('zone_', 'منطقة ')}</p>
            <p class="text-muted-foreground">
              الإنتاجية: <span class="font-medium">${props?.productivity_level === 'high' ? 'عالية' :
                        props?.productivity_level === 'low' ? 'منخفضة' : 'متوسطة'
                    }</span>
            </p>
            <p class="text-muted-foreground">
              المساحة: <span class="font-medium">${(props?.area / 4200).toFixed(2)} فدان</span>
            </p>
          </div>
        `)
                .addTo(map.current!)
        })

        // Change cursor on hover
        map.current.on('mouseenter', 'zones-fill', () => {
            if (map.current) map.current.getCanvas().style.cursor = 'pointer'
        })

        map.current.on('mouseleave', 'zones-fill', () => {
            if (map.current) map.current.getCanvas().style.cursor = ''
        })

    }, [zones])

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
            {zones.length > 0 && !isLoading && (
                <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
                    <p className="text-sm font-medium mb-2">مستوى الإنتاجية</p>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-sm bg-green-500" />
                            <span className="text-xs">عالية</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-sm bg-yellow-500" />
                            <span className="text-xs">متوسطة</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-sm bg-red-500" />
                            <span className="text-xs">منخفضة</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
