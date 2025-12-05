/**
 * Unified EOSDA Map Component
 * 
 * Single unified map component using EOSDA API exclusively.
 * Replaces all other map components across the application.
 * 
 * @module components/maps/unified-eosda-map
 * 
 * @author Adham AgriTech
 * @since 1.0.0
 */

'use client'

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { FeatureCollection, Polygon } from 'geojson'
import { eosdaPublicConfig } from '@/lib/config/eosda'
import { getEOSDATileUrl } from '@/lib/services/eosda'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Layers, ZoomIn, ZoomOut, RotateCcw, Loader2, AlertCircle, Moon, Sun, Map as MapIcon } from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

export type EOSDAMapLayer = 'true-color' | 'ndvi' | 'ndmi' | 'evi' | 'soil-moisture' | 'chlorophyll'
export type MapStyle = 'satellite' | 'dark'

export interface UnifiedEOSDAMapProps {
  // Field data
  fieldId?: string
  fieldName?: string
  coordinates?: [number, number][] // Polygon coordinates [lng, lat]
  center?: [number, number] // [lng, lat]

  // Map configuration
  zoom?: number
  pitch?: number
  bearing?: number
  height?: string | number

  // Layer configuration
  defaultLayer?: EOSDAMapLayer
  availableLayers?: EOSDAMapLayer[]
  showLayerControls?: boolean
  showNavigationControls?: boolean

  // EOSDA configuration
  eosdaViewId?: string

  // Callbacks
  onLayerChange?: (layer: EOSDAMapLayer) => void
  onMapClick?: (lng: number, lat: number) => void
  onError?: (error: Error) => void

  // UI
  lang?: 'ar' | 'en'
  className?: string
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CENTER: [number, number] = [eosdaPublicConfig.center.lng, eosdaPublicConfig.center.lat]
const DEFAULT_ZOOM = eosdaPublicConfig.zoom.default || 10
const MIN_ZOOM = eosdaPublicConfig.zoom.min || 1
const MAX_ZOOM = eosdaPublicConfig.zoom.max || 18
const EOSDA_API_KEY = process.env.NEXT_PUBLIC_EOSDA_API_KEY?.trim() || ''

// Fallback tile sources for when EOSDA is unavailable
const FALLBACK_TILE_SOURCES = {
  esri: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  osm: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
}

const LAYER_CONFIG: Record<EOSDAMapLayer, { name: { ar: string; en: string }; color: string; eosdaLayer: string }> = {
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

export function UnifiedEOSDAMap({
  fieldId,
  fieldName,
  coordinates,
  center,
  zoom = DEFAULT_ZOOM,
  pitch = 60,
  bearing = 0,
  height = '600px',
  defaultLayer = 'true-color',
  availableLayers = ['true-color', 'ndvi', 'ndmi', 'evi', 'soil-moisture', 'chlorophyll'],
  showLayerControls = true,
  showNavigationControls = true,
  eosdaViewId,
  onLayerChange,
  onMapClick,
  onError,
  lang = 'ar',
  className = '',
}: UnifiedEOSDAMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [activeLayer, setActiveLayer] = useState<EOSDAMapLayer>(defaultLayer)
  const [mapStyle, setMapStyle] = useState<MapStyle>('satellite')
  const [layerLoading, setLayerLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentViewId, setCurrentViewId] = useState<string | null>(eosdaViewId || null)

  // Calculate center from coordinates if not provided
  const mapCenter = useMemo(() => {
    if (center) return center
    if (coordinates && coordinates.length > 0) {
      const lngs = coordinates.map(c => c[0])
      const lats = coordinates.map(c => c[1])
      return [
        (Math.min(...lngs) + Math.max(...lngs)) / 2,
        (Math.min(...lats) + Math.max(...lats)) / 2,
      ] as [number, number]
    }
    return DEFAULT_CENTER
  }, [center, coordinates])

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
            'carto-dark': {
              type: 'raster',
              tiles: [
                'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              ],
              tileSize: 256,
              attribution: '© CartoDB',
            },
          },
          layers: [
            {
              id: 'carto-dark',
              type: 'raster',
              source: 'carto-dark',
              layout: {
                visibility: 'none', // Initially hidden
              },
            },
            {
              id: 'esri-imagery',
              type: 'raster',
              source: 'esri-imagery',
              layout: {
                visibility: 'visible', // Initially visible
              },
            },
          ],
        },
        center: mapCenter,
        zoom: Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM),
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        pitch,
        bearing,
        antialias: true,
        failIfMajorPerformanceCaveat: false,
      })

      mapRef.current.on('load', () => {
        setMapLoaded(true)
        setError(null)

        // Add field boundary if coordinates provided
        if (coordinates && coordinates.length > 0) {
          addFieldBoundary()
        }
      })

      mapRef.current.on('error', (e) => {
        // Ignore tile loading errors - they're common and don't break the map
        if (e.error?.message?.includes('tile') || e.error?.message?.includes('404')) {
          console.warn('[UnifiedEOSDAMap] Tile loading warning:', e.error?.message)
          return
        }
        const err = new Error(
          lang === 'ar'
            ? `خطأ في تحميل الخريطة: ${e.error?.message || 'خطأ غير معروف'}`
            : `Map error: ${e.error?.message || 'Unknown error'}`
        )
        setError(err.message)
        onError?.(err)
      })

      mapRef.current.on('click', (e) => {
        onMapClick?.(e.lngLat.lng, e.lngLat.lat)
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error.message)
      onError?.(error)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Add field boundary
  const addFieldBoundary = useCallback(() => {
    if (!mapRef.current || !coordinates || coordinates.length === 0) return

    try {
      // Remove existing boundary if any
      if (mapRef.current.getLayer('field-boundary')) {
        mapRef.current.removeLayer('field-boundary')
      }
      if (mapRef.current.getLayer('field-fill')) {
        mapRef.current.removeLayer('field-fill')
      }
      if (mapRef.current.getSource('field-boundary')) {
        mapRef.current.removeSource('field-boundary')
      }

      // Ensure closed ring
      const closedCoords = [...coordinates]
      const first = closedCoords[0]
      const last = closedCoords[closedCoords.length - 1]
      if (first[0] !== last[0] || first[1] !== last[1]) {
        closedCoords.push(first)
      }

      // Add boundary source
      mapRef.current.addSource('field-boundary', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [closedCoords],
          },
        },
      })

      // Add fill layer
      mapRef.current.addLayer({
        id: 'field-fill',
        type: 'fill',
        source: 'field-boundary',
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': 0.1,
        },
      })

      // Add boundary layer
      mapRef.current.addLayer({
        id: 'field-boundary',
        type: 'line',
        source: 'field-boundary',
        paint: {
          'line-color': '#10b981',
          'line-width': 3,
          'line-opacity': 0.8,
        },
      })

      // Fit bounds
      const bounds = new maplibregl.LngLatBounds()
      closedCoords.forEach(coord => bounds.extend(coord as [number, number]))
      mapRef.current.fitBounds(bounds, { padding: 60, duration: 900, maxZoom: 16 })
    } catch (err) {
      console.error('[UnifiedEOSDAMap] Error adding boundary:', err)
    }
  }, [coordinates])

  // Update boundary when coordinates change
  useEffect(() => {
    if (mapLoaded && coordinates) {
      addFieldBoundary()
    }
  }, [mapLoaded, coordinates, addFieldBoundary])

  // Load EOSDA layer
  const loadEOSDALayer = useCallback(
    async (layerType: EOSDAMapLayer) => {
      if (!EOSDA_API_KEY) {
        setError(lang === 'ar' ? 'مفتاح EOSDA API غير موجود' : 'EOSDA API key not configured')
        return
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

        // Use proxy endpoint for tiles (MapLibre GL doesn't support custom headers)
        const tileUrl = `/api/eosda/tiles/{z}/{x}/{y}?layer=${layerConfig.eosdaLayer}`

        if (mapRef.current) {
          // Remove existing overlay
          if (mapRef.current.getLayer('eosda-overlay')) {
            mapRef.current.removeLayer('eosda-overlay')
          }
          if (mapRef.current.getSource('eosda-overlay')) {
            mapRef.current.removeSource('eosda-overlay')
          }

          // Add EOSDA tile source
          mapRef.current.addSource('eosda-overlay', {
            type: 'raster',
            tiles: [tileUrl],
            tileSize: 256,
            attribution: 'EOS Data Analytics',
          })

          mapRef.current.addLayer({
            id: 'eosda-overlay',
            type: 'raster',
            source: 'eosda-overlay',
            paint: {
              'raster-opacity': layerType === 'true-color' ? 1.0 : 0.7,
            },
          }, 'field-boundary' || 'esri-imagery')
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error.message)
        onError?.(error)
      } finally {
        setLayerLoading(false)
      }
    },
    [lang, onError]
  )

  // Handle layer change
  const handleLayerChange = useCallback(
    (newLayer: EOSDAMapLayer) => {
      setActiveLayer(newLayer)
      onLayerChange?.(newLayer)
      loadEOSDALayer(newLayer)
    },
    [loadEOSDALayer, onLayerChange]
  )

  // Handle style change
  const toggleMapStyle = useCallback(() => {
    if (!mapRef.current) return

    const newStyle = mapStyle === 'satellite' ? 'dark' : 'satellite'
    setMapStyle(newStyle)

    if (newStyle === 'dark') {
      mapRef.current.setLayoutProperty('esri-imagery', 'visibility', 'none')
      mapRef.current.setLayoutProperty('carto-dark', 'visibility', 'visible')
    } else {
      mapRef.current.setLayoutProperty('carto-dark', 'visibility', 'none')
      mapRef.current.setLayoutProperty('esri-imagery', 'visibility', 'visible')
    }
  }, [mapStyle])

  // Load layer on mount and when activeLayer changes
  useEffect(() => {
    if (mapLoaded) {
      loadEOSDALayer(activeLayer)
    }
  }, [mapLoaded, activeLayer, loadEOSDALayer])

  // Navigation controls
  const handleZoomIn = () => {
    mapRef.current?.zoomIn()
  }

  const handleZoomOut = () => {
    mapRef.current?.zoomOut()
  }

  const handleReset = () => {
    if (mapRef.current && coordinates && coordinates.length > 0) {
      const bounds = new maplibregl.LngLatBounds()
      coordinates.forEach(coord => bounds.extend(coord as [number, number]))
      mapRef.current.fitBounds(bounds, { padding: 60, duration: 900, maxZoom: 16 })
    } else if (mapRef.current) {
      mapRef.current.flyTo({ center: mapCenter, zoom, pitch, bearing })
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
    <div className={`relative ${className}`} style={{ height }}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="h-full w-full rounded-lg overflow-hidden" />

      {/* Loading Overlay */}
      {(!mapLoaded || layerLoading) && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <p className="text-sm text-gray-300">
              {lang === 'ar' ? 'جاري تحميل الخريطة...' : 'Loading map...'}
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && mapLoaded && (
        <div className="absolute top-4 left-4 right-4 z-20">
          <Card className="bg-destructive/10 border-destructive/50 p-3 backdrop-blur-md">
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </Card>
        </div>
      )}

      {/* Controls Container - Top Left */}
      {showLayerControls && mapLoaded && (
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          {/* Layer Switcher */}
          <Card className="p-2 bg-black/60 backdrop-blur-xl border-emerald-500/30 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
            <div className="flex flex-col gap-1">
              {availableLayers.map((layer) => {
                const config = LAYER_CONFIG[layer]
                const isActive = activeLayer === layer
                return (
                  <Button
                    key={layer}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLayerChange(layer)}
                    disabled={layerLoading}
                    className={`justify-start text-xs transition-all duration-200 ${isActive
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300'
                        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                      }`}
                  >
                    <Layers className={`h-3 w-3 mr-2 ${isActive ? 'text-emerald-400' : 'text-gray-500'}`} />
                    {config.name[lang]}
                  </Button>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Controls Container - Top Right */}
      {mapLoaded && (
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          {/* Style Switcher */}
          <Card className="p-1 bg-black/60 backdrop-blur-xl border-emerald-500/30 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMapStyle}
              className="h-8 w-8 p-0 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
              title={lang === 'ar' ? 'تغيير نمط الخريطة' : 'Toggle Map Style'}
            >
              {mapStyle === 'satellite' ? <Moon className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
            </Button>
          </Card>
        </div>
      )}

      {/* Navigation Controls - Bottom Right */}
      {showNavigationControls && mapLoaded && (
        <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
          <Card className="p-1 bg-black/60 backdrop-blur-xl border-emerald-500/30 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                className="h-8 w-8 p-0 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                className="h-8 w-8 p-0 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8 w-8 p-0 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Field Info Badge */}
      {fieldName && mapLoaded && (
        <div className="absolute bottom-4 left-4 z-20">
          <Badge
            variant="secondary"
            className="bg-black/60 backdrop-blur-xl border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(0,0,0,0.3)]"
          >
            {fieldName}
          </Badge>
        </div>
      )}
    </div>
  )
}
