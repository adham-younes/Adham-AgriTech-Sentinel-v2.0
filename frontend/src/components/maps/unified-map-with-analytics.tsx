/**
 * Unified Map with Analytics Sidebar
 * 
 * مكون خريطة موحد مع sidebar للتحليلات
 * - خريطة واحدة موحدة لجميع الصفحات
 * - تحليلات في sidebar منفصل
 * - Click handler لجلب بيانات EOSDA
 * - إصلاح مشكلة "map data not yet available"
 * 
 * @module components/maps/unified-map-with-analytics
 */

'use client'

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { FeatureCollection, Polygon } from 'geojson'
import { eosdaPublicConfig } from '@/lib/config/eosda'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Layers, ZoomIn, ZoomOut, RotateCcw, Loader2, AlertCircle, X, ChevronRight, ChevronLeft } from 'lucide-react'
import { AnalyticsSidebar } from './analytics-sidebar'

// ============================================================================
// Types
// ============================================================================

export type MapLayer = 'true-color' | 'ndvi' | 'ndmi' | 'evi' | 'soil-moisture' | 'chlorophyll'

export interface FieldFeature {
  id: string
  name: string
  crop?: string
  polygon: [number, number][] // [lng, lat]
  center?: [number, number]
  ndvi?: number
  health?: number
  moisture?: number
  areaFeddan?: number
}

export interface UnifiedMapWithAnalyticsProps {
  // Fields data
  fields?: FieldFeature[]
  selectedFieldId?: string | null
  onFieldSelect?: (fieldId: string) => void
  
  // Map configuration
  center?: [number, number] // [lng, lat]
  zoom?: number
  height?: string | number
  
  // Layer configuration
  defaultLayer?: MapLayer
  showLayerControls?: boolean
  showNavigationControls?: boolean
  
  // UI
  lang?: 'ar' | 'en'
  className?: string
}

interface PointAnalysis {
  coordinates: [number, number]
  ndvi?: number
  soilMoisture?: number
  chlorophyll?: number
  evi?: number
  temperature?: number
  timestamp?: string
}

// ============================================================================
// Constants
// ============================================================================

// Safe defaults - eosdaPublicConfig may not be available in all contexts
const DEFAULT_CENTER: [number, number] = (() => {
  try {
    return [eosdaPublicConfig.center.lng, eosdaPublicConfig.center.lat]
  } catch {
    return [30.8025, 26.8206] // Egypt default
  }
})()
const DEFAULT_ZOOM = (() => {
  try {
    return eosdaPublicConfig.zoom.default || 10
  } catch {
    return 10
  }
})()
const EOSDA_API_KEY = (() => {
  try {
    return process.env.NEXT_PUBLIC_EOSDA_API_KEY?.trim() || ''
  } catch {
    return ''
  }
})()

const LAYER_CONFIG: Record<MapLayer, { name: { ar: string; en: string }; color: string; eosdaLayer: string }> = {
  'true-color': {
    name: { ar: 'ألوان حقيقية', en: 'True Color' },
    color: '#ffffff',
    eosdaLayer: 'sentinel2l2a',
  },
  'ndvi': {
    name: { ar: 'صحة النبات (NDVI)', en: 'Vegetation Health (NDVI)' },
    color: '#22c55e',
    eosdaLayer: 'ndvi',
  },
  'ndmi': {
    name: { ar: 'إجهاد مائي (NDMI)', en: 'Moisture Stress (NDMI)' },
    color: '#3b82f6',
    eosdaLayer: 'ndmi',
  },
  'evi': {
    name: { ar: 'مؤشر نباتي محسن (EVI)', en: 'Enhanced Veg. Index (EVI)' },
    color: '#84cc16',
    eosdaLayer: 'evi',
  },
  'soil-moisture': {
    name: { ar: 'رطوبة التربة', en: 'Soil Moisture' },
    color: '#a855f7',
    eosdaLayer: 'soil_moisture',
  },
  'chlorophyll': {
    name: { ar: 'الكلوروفيل', en: 'Chlorophyll' },
    color: '#10b981',
    eosdaLayer: 'chlorophyll',
  },
}

// ============================================================================
// Component
// ============================================================================

export function UnifiedMapWithAnalytics({
  fields = [],
  selectedFieldId,
  onFieldSelect,
  center,
  zoom = DEFAULT_ZOOM,
  height = '600px',
  defaultLayer = 'true-color',
  showLayerControls = true,
  showNavigationControls = true,
  lang = 'ar',
  className = '',
}: UnifiedMapWithAnalyticsProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [activeLayer, setActiveLayer] = useState<MapLayer>(defaultLayer)
  const [layerLoading, setLayerLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pointAnalysis, setPointAnalysis] = useState<PointAnalysis | null>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)

  // Calculate center from fields if not provided
  const mapCenter = useMemo(() => {
    if (center) return center
    if (fields.length > 0) {
      const firstField = fields[0]
      if (firstField.center) return firstField.center
      if (firstField.polygon && firstField.polygon.length > 0) {
        const lngs = firstField.polygon.map(c => c[0])
        const lats = firstField.polygon.map(c => c[1])
        return [
          (Math.min(...lngs) + Math.max(...lngs)) / 2,
          (Math.min(...lats) + Math.max(...lats)) / 2,
        ] as [number, number]
      }
    }
    return DEFAULT_CENTER
  }, [center, fields])

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    try {
      mapRef.current = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            'esri-imagery': {
              type: 'raster',
              tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
              ],
              tileSize: 256,
              attribution: '© Esri',
            },
          },
          layers: [
            {
              id: 'esri-imagery',
              type: 'raster',
              source: 'esri-imagery',
            },
          ],
        },
        center: mapCenter,
        zoom,
        antialias: true,
        maxZoom: 18,
        minZoom: 1,
      })

      mapRef.current.on('load', () => {
        setMapLoaded(true)
        setError(null)
        
        // Add fields if provided
        if (fields.length > 0) {
          addFieldsToMap()
        }
      })

      mapRef.current.on('error', (e) => {
        console.error('[UnifiedMap] Map error:', e)
        // Don't show error for tile loading issues - use fallback instead
        if (!e.error?.message?.includes('tile')) {
          setError(e.error?.message || 'Map error')
        }
      })

      // Click handler for point analysis
      mapRef.current.on('click', async (e) => {
        const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat]
        await fetchPointAnalysis(coords)
      })

      // Handle tile loading errors gracefully - only log once per source
      const failedSources = new Set<string>()
      mapRef.current.on('sourcedata', (e) => {
        if (e.isSourceLoaded === false && e.sourceId?.includes('eosda')) {
          // Only log once per source to avoid spam
          if (!failedSources.has(e.sourceId)) {
            failedSources.add(e.sourceId)
            // Use logger instead of console.warn
            if (typeof window !== 'undefined' && (window as any).logger) {
              (window as any).logger.warn('[UnifiedMap] EOSDA tile source failed, using fallback', {
                sourceId: e.sourceId
              })
            }
          }
        }
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error.message)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Add fields to map
  const addFieldsToMap = useCallback(() => {
    if (!mapRef.current || !mapLoaded || fields.length === 0) return

    try {
      // Remove existing fields
      if (mapRef.current.getLayer('fields-outline')) {
        mapRef.current.removeLayer('fields-outline')
      }
      if (mapRef.current.getLayer('fields-fill')) {
        mapRef.current.removeLayer('fields-fill')
      }
      if (mapRef.current.getSource('fields')) {
        mapRef.current.removeSource('fields')
      }

      // Create feature collection
      const features = fields.map(field => {
        const closedCoords = [...field.polygon]
        const first = closedCoords[0]
        const last = closedCoords[closedCoords.length - 1]
        if (first[0] !== last[0] || first[1] !== last[1]) {
          closedCoords.push(first)
        }

        return {
          type: 'Feature' as const,
          id: field.id,
          properties: {
            id: field.id,
            name: field.name,
            crop: field.crop,
            ndvi: field.ndvi,
            health: field.health,
          },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [closedCoords],
          },
        }
      })

      mapRef.current.addSource('fields', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features,
        },
      })

      // Add fill layer
      mapRef.current.addLayer({
        id: 'fields-fill',
        type: 'fill',
        source: 'fields',
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'id'], selectedFieldId || ''],
            '#3b82f6', // Selected: blue
            '#10b981', // Default: green
          ],
          'fill-opacity': 0.1,
        },
      })

      // Add outline layer
      mapRef.current.addLayer({
        id: 'fields-outline',
        type: 'line',
        source: 'fields',
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'id'], selectedFieldId || ''],
            '#3b82f6', // Selected: blue
            '#10b981', // Default: green
          ],
          'line-width': 3,
          'line-opacity': 0.8,
        },
      })

      // Click handler for fields
      mapRef.current.on('click', 'fields-fill', (e) => {
        const feature = e.features?.[0]
        if (feature?.id && typeof feature.id === 'string') {
          onFieldSelect?.(feature.id)
        }
      })

      // Fit bounds
      if (fields.length > 0) {
        const bounds = new maplibregl.LngLatBounds()
        fields.forEach(field => {
          field.polygon.forEach(coord => bounds.extend(coord as [number, number]))
        })
        mapRef.current.fitBounds(bounds, { padding: 60, duration: 900, maxZoom: 16 })
      }
    } catch (err) {
      console.error('[UnifiedMap] Error adding fields:', err)
    }
  }, [mapLoaded, fields, selectedFieldId, onFieldSelect])

  // Update fields when they change
  useEffect(() => {
    if (mapLoaded && fields.length > 0) {
      addFieldsToMap()
    }
  }, [mapLoaded, fields, selectedFieldId, addFieldsToMap])

  // Load EOSDA layer
  const loadEOSDALayer = useCallback(
    async (layerType: MapLayer) => {
      if (!EOSDA_API_KEY) {
        return // Use base imagery only
      }

      if (layerType === 'true-color') {
        // Remove EOSDA overlay for true-color
        if (mapRef.current) {
          if (mapRef.current.getLayer('eosda-overlay')) {
            mapRef.current.removeLayer('eosda-overlay')
          }
          if (mapRef.current.getSource('eosda-overlay')) {
            mapRef.current.removeSource('eosda-overlay')
          }
        }
        return
      }

      setLayerLoading(true)
      setError(null)

      try {
        const layerConfig = LAYER_CONFIG[layerType]
        if (!layerConfig) {
          throw new Error(`Unsupported layer: ${layerType}`)
        }

        // Get colormap based on layer type for thermal maps
        const colormapMap: Record<MapLayer, string> = {
          'true-color': '',
          'ndvi': 'rdylgn', // Red-Yellow-Green for NDVI
          'ndmi': 'blues', // Blues for moisture
          'evi': 'viridis', // Viridis for EVI
          'soil-moisture': 'blues', // Blues for soil moisture
          'chlorophyll': 'viridis', // Viridis for chlorophyll
        }
        const colormap = colormapMap[layerType]

        // Use proxy endpoint for tiles with colormap for thermal visualization
        const tileUrl = colormap
          ? `/api/eosda/tiles/{z}/{x}/{y}?layer=${layerConfig.eosdaLayer}&colormap=${colormap}`
          : `/api/eosda/tiles/{z}/{x}/{y}?layer=${layerConfig.eosdaLayer}`

        if (mapRef.current) {
          // Remove existing overlay
          if (mapRef.current.getLayer('eosda-overlay')) {
            mapRef.current.removeLayer('eosda-overlay')
          }
          if (mapRef.current.getSource('eosda-overlay')) {
            mapRef.current.removeSource('eosda-overlay')
          }

          // Add EOSDA tile source with colormap for thermal visualization
          // Use multiple tile sources for redundancy to prevent "map data not yet available"
          mapRef.current.addSource('eosda-overlay', {
            type: 'raster',
            tiles: [
              tileUrl, // Primary: EOSDA with colormap
            ],
            tileSize: 256,
            attribution: 'EOS Data Analytics',
            maxzoom: 18,
            minzoom: 1,
          })
          
          // Add fallback source separately for better error handling
          if (!mapRef.current.getSource('esri-fallback')) {
            mapRef.current.addSource('esri-fallback', {
              type: 'raster',
              tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
              ],
              tileSize: 256,
              attribution: '© Esri',
              maxzoom: 19,
            })
          }

          // Add layer before fields-outline if it exists, otherwise before esri-imagery
          // Ensure proper z-index ordering: esri-imagery (base) -> eosda-overlay -> fields-outline
          const beforeLayer = mapRef.current.getLayer('fields-outline') ? 'fields-outline' : 'esri-imagery'
          mapRef.current.addLayer({
            id: 'eosda-overlay',
            type: 'raster',
            source: 'eosda-overlay',
            paint: {
              'raster-opacity': layerType === 'true-color' ? 1.0 : 0.7, // Optimized opacity for better visibility
            },
            minzoom: 1,
            maxzoom: 18,
          }, beforeLayer)
          
          // Ensure overlay is above base imagery but below field outlines
          if (mapRef.current.getLayer('fields-outline')) {
            mapRef.current.moveLayer('eosda-overlay', 'fields-outline')
          }
        }
      } catch (err) {
        console.error('[UnifiedMap] Error loading EOSDA layer:', err)
        // Don't show error - fallback will be used
      } finally {
        setLayerLoading(false)
      }
    },
    []
  )

  // Handle layer change
  const handleLayerChange = useCallback(
    (newLayer: MapLayer) => {
      setActiveLayer(newLayer)
      loadEOSDALayer(newLayer)
    },
    [loadEOSDALayer]
  )

  // Load layer on mount and when activeLayer changes
  useEffect(() => {
    if (mapLoaded) {
      loadEOSDALayer(activeLayer)
    }
  }, [mapLoaded, activeLayer, loadEOSDALayer])

  // Fetch point analysis from EOSDA
  const fetchPointAnalysis = useCallback(async (coords: [number, number]) => {
    setLoadingAnalysis(true)
    setSidebarOpen(true)
    setPointAnalysis(null)

    try {
      // Fetch EOSDA data for this point
      const response = await fetch('/api/eosda/point-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinates: coords }),
      })

      if (response.ok) {
        const data = await response.json()
        setPointAnalysis({
          coordinates: coords,
          ...data,
        })
      } else {
        throw new Error('Failed to fetch analysis')
      }
    } catch (err) {
      console.error('[UnifiedMap] Error fetching point analysis:', err)
      setPointAnalysis({
        coordinates: coords,
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoadingAnalysis(false)
    }
  }, [])

  // Navigation controls
  const handleZoomIn = () => mapRef.current?.zoomIn()
  const handleZoomOut = () => mapRef.current?.zoomOut()
  const handleReset = () => {
    if (mapRef.current && fields.length > 0) {
      const bounds = new maplibregl.LngLatBounds()
      fields.forEach(field => {
        field.polygon.forEach(coord => bounds.extend(coord as [number, number]))
      })
      mapRef.current.fitBounds(bounds, { padding: 60, duration: 900, maxZoom: 16 })
    } else if (mapRef.current) {
      mapRef.current.flyTo({ center: mapCenter, zoom })
    }
  }

  if (error && !mapLoaded) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-semibold">
              {lang === 'ar' ? 'خطأ في تحميل الخريطة' : 'Map Loading Error'}
            </p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className={`relative flex ${className}`} style={{ height }}>
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="flex-1 h-full rounded-lg overflow-hidden relative"
        style={{ minWidth: sidebarOpen ? '60%' : '100%' }}
      />

      {/* Loading Overlay */}
      {(!mapLoaded || layerLoading) && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {lang === 'ar' ? 'جاري تحميل الخريطة...' : 'Loading map...'}
            </p>
          </div>
        </div>
      )}

      {/* Layer Controls */}
      {showLayerControls && mapLoaded && (
        <div className="absolute top-4 left-4 z-20">
          <Card className="p-2 bg-black/80 backdrop-blur-sm border-white/10">
            <div className="flex flex-col gap-1">
              {(Object.keys(LAYER_CONFIG) as MapLayer[]).map((layer) => {
                const config = LAYER_CONFIG[layer]
                return (
                  <Button
                    key={layer}
                    variant={activeLayer === layer ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleLayerChange(layer)}
                    disabled={layerLoading}
                    className="justify-start text-xs"
                  >
                    <Layers className="h-3 w-3 mr-2" />
                    {config.name[lang]}
                  </Button>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Navigation Controls */}
      {showNavigationControls && mapLoaded && (
        <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
          <Card className="p-1 bg-black/80 backdrop-blur-sm border-white/10">
            <div className="flex flex-col gap-1">
              <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-8 w-8 p-0">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-8 w-8 p-0">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 w-8 p-0">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Sidebar Toggle */}
      {mapLoaded && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-4 right-4 z-20 bg-black/80 backdrop-blur-sm border-white/10"
        >
          {sidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      )}

      {/* Analytics Sidebar */}
      <AnalyticsSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        analysis={pointAnalysis}
        loading={loadingAnalysis}
        lang={lang}
      />
    </div>
  )
}

