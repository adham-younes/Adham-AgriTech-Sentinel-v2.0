"use client"

/**
 * Unified Map Component
 * 
 * A comprehensive map component that integrates:
 * - EOSDA satellite imagery
 * - NDVI, EVI, NDWI, Chlorophyll, Thermal maps
 * - Field boundaries
 * - Real-time analytics overlays
 * - Layer switching
 * - 3D terrain visualization
 */

import React, { useRef, useEffect, useState, useCallback } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Layers, MapPin, ZoomIn, ZoomOut, RotateCcw, AlertCircle } from "lucide-react"
import { getEOSDATileUrl, getEOSDAThermalMap, getEOSDAChlorophyllMap } from "@/lib/services/eosda"
import type { EOSDATileRequest } from "@/lib/services/eosda"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

export interface UnifiedMapProps {
  // Field data
  fieldId?: string
  fieldName?: string
  coordinates?: number[][] // Polygon coordinates
  center?: [number, number] // [lng, lat]
  
  // Map configuration
  zoom?: number
  pitch?: number
  bearing?: number
  height?: string
  
  // Layer configuration
  defaultLayer?: "satellite" | "ndvi" | "evi" | "ndwi" | "chlorophyll" | "thermal" | "moisture"
  availableLayers?: Array<"satellite" | "ndvi" | "evi" | "ndwi" | "chlorophyll" | "thermal" | "moisture">
  showLayerControls?: boolean
  showNavigationControls?: boolean
  
  // EOSDA configuration
  eosdaViewId?: string
  eosdaApiKey?: string
  
  // Callbacks
  onLayerChange?: (layer: string) => void
  onMapClick?: (lng: number, lat: number) => void
  onError?: (error: Error) => void
  
  // UI
  lang?: "ar" | "en"
  className?: string
}

interface MapError {
  message: string
  type: "initialization" | "layer" | "tile" | "network"
}

export function UnifiedMap({
  fieldId,
  fieldName,
  coordinates,
  center,
  zoom = 14,
  pitch = 60,
  bearing = 0,
  height = "600px",
  defaultLayer = "satellite",
  availableLayers = ["satellite", "ndvi", "evi", "ndwi", "chlorophyll", "thermal", "moisture"],
  showLayerControls = true,
  showNavigationControls = true,
  eosdaViewId,
  eosdaApiKey,
  onLayerChange,
  onMapClick,
  onError,
  lang = "ar",
  className = "",
}: UnifiedMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [activeLayer, setActiveLayer] = useState(defaultLayer)
  const [layerLoading, setLayerLoading] = useState(false)
  const [error, setError] = useState<MapError | null>(null)
  const [currentViewId, setCurrentViewId] = useState<string | null>(eosdaViewId || null)

  // Calculate center from coordinates if not provided
  const mapCenter = center || (coordinates && coordinates.length > 0
    ? (() => {
        const lngs = coordinates.map(c => c[0])
        const lats = coordinates.map(c => c[1])
        return [
          (Math.min(...lngs) + Math.max(...lngs)) / 2,
          (Math.min(...lats) + Math.max(...lats)) / 2,
        ] as [number, number]
      })()
    : [31.2357, 30.0444] as [number, number])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    if (!MAPBOX_TOKEN) {
      const err = new Error(
        lang === "ar"
          ? "مفتاح Mapbox غير موجود. يرجى إضافة NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN"
          : "Mapbox token not found. Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN"
      )
      setError({ message: err.message, type: "initialization" })
      onError?.(err)
      return
    }

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/satellite-v9",
        center: mapCenter,
        zoom,
        pitch,
        bearing,
        antialias: true,
      } as any)

      map.current.on("load", () => {
        setMapLoaded(true)
        setError(null)
        
        // Add DEM source for 3D terrain
        if (map.current && !map.current.getSource("mapbox-dem")) {
          try {
            map.current.addSource("mapbox-dem", {
              type: "raster-dem",
              url: "mapbox://mapbox.mapbox-terrain-dem-v1",
              tileSize: 512,
              maxzoom: 14,
            })
            // Set terrain after source is added
            if (map.current.getSource("mapbox-dem")) {
              ;(map.current as any).setTerrain({ source: "mapbox-dem", exaggeration: 1.2 })
            }
          } catch (err) {
            console.warn("[UnifiedMap] Terrain not available:", err)
          }
        }

        // Add field boundary if coordinates provided
        if (coordinates && coordinates.length > 0) {
          addFieldBoundary()
        }
      })

      map.current.on("error", (e) => {
        const err = new Error(
          lang === "ar" ? `خطأ في تحميل الخريطة: ${e.error?.message || "خطأ غير معروف"}` : `Map error: ${e.error?.message || "Unknown error"}`
        )
        setError({ message: err.message, type: "tile" })
        onError?.(err)
      })

      map.current.on("click", (e) => {
        onMapClick?.(e.lngLat.lng, e.lngLat.lat)
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError({ message: error.message, type: "initialization" })
      onError?.(error)
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Add field boundary
  const addFieldBoundary = useCallback(() => {
    if (!map.current || !coordinates || coordinates.length === 0) return

    try {
      // Remove existing boundary if any
      if (map.current.getLayer("field-boundary")) {
        map.current.removeLayer("field-boundary")
      }
      if (map.current.getSource("field-boundary")) {
        map.current.removeSource("field-boundary")
      }

      // Add boundary source
      map.current.addSource("field-boundary", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [coordinates],
          },
        },
      })

      // Add boundary layer
      map.current.addLayer({
        id: "field-boundary",
        type: "line",
        source: "field-boundary",
        paint: {
          "line-color": "#10b981",
          "line-width": 3,
          "line-opacity": 0.8,
        },
      })

      // Add fill layer
      map.current.addLayer({
        id: "field-fill",
        type: "fill",
        source: "field-boundary",
        paint: {
          "fill-color": "#10b981",
          "fill-opacity": 0.1,
        },
      })
    } catch (err) {
      console.error("[UnifiedMap] Error adding boundary:", err)
    }
  }, [coordinates])

  // Update boundary when coordinates change
  useEffect(() => {
    if (mapLoaded && coordinates) {
      addFieldBoundary()
    }
  }, [mapLoaded, coordinates, addFieldBoundary])

  // Load EOSDA layer
  const loadEOSDALayer = useCallback(async (layerType: string) => {
    if (!eosdaApiKey || !currentViewId || layerType === "satellite") {
      return
    }

    setLayerLoading(true)
    setError(null)

    try {
      // Map layer types to EOSDA indices
      const indexMap: Record<string, string> = {
        ndvi: "ndvi",
        evi: "evi",
        ndwi: "ndwi",
        chlorophyll: "chlorophyll",
        thermal: "temperature",
        moisture: "soil_moisture",
      }

      const index = indexMap[layerType]
      if (!index) {
        throw new Error(`Unsupported layer type: ${layerType}`)
      }

      // Get bounds from coordinates or use default
      const bounds = coordinates && coordinates.length > 0
        ? [
            Math.min(...coordinates.map(c => c[0])),
            Math.min(...coordinates.map(c => c[1])),
            Math.max(...coordinates.map(c => c[0])),
            Math.max(...coordinates.map(c => c[1])),
          ] as [number, number, number, number]
        : [
            mapCenter[0] - 0.01,
            mapCenter[1] - 0.01,
            mapCenter[0] + 0.01,
            mapCenter[1] + 0.01,
          ] as [number, number, number, number]

      // For tile-based layers (NDVI, EVI, etc.)
      if (["ndvi", "evi", "ndwi"].includes(layerType)) {
        // Use tile URL for raster layers
        const tileUrl = getEOSDATileUrl({
          viewId: currentViewId,
          bands: index.toUpperCase(),
          z: Math.floor(zoom),
          x: 0,
          y: 0,
          colormap: layerType === "ndvi" ? "rdylgn" : "viridis",
        })

        if (tileUrl && map.current) {
          // Remove existing overlay
          if (map.current.getLayer("eosda-overlay")) {
            map.current.removeLayer("eosda-overlay")
          }
          if (map.current.getSource("eosda-overlay")) {
            map.current.removeSource("eosda-overlay")
          }

          // Add EOSDA tile source
          map.current.addSource("eosda-overlay", {
            type: "raster",
            tiles: [tileUrl],
            tileSize: 256,
          })

          map.current.addLayer({
            id: "eosda-overlay",
            type: "raster",
            source: "eosda-overlay",
            paint: {
              "raster-opacity": 0.7,
            },
          })
        }
      } else {
        // For image-based layers (thermal, chlorophyll)
        const mapResult = layerType === "chlorophyll"
          ? await getEOSDAChlorophyllMap({
              viewId: currentViewId,
              bbox: bounds,
            })
          : await getEOSDAThermalMap({
              viewId: currentViewId,
              bbox: bounds,
              index: index as any,
            })

        if (mapResult.imageUrl && map.current) {
          // Remove existing overlay
          if (map.current.getLayer("eosda-overlay")) {
            map.current.removeLayer("eosda-overlay")
          }
          if (map.current.getSource("eosda-overlay")) {
            map.current.removeSource("eosda-overlay")
          }

          // Add image overlay
          map.current.addSource("eosda-overlay", {
            type: "image",
            url: mapResult.imageUrl,
            coordinates: [
              [bounds[0], bounds[3]], // top-left
              [bounds[2], bounds[3]], // top-right
              [bounds[2], bounds[1]], // bottom-right
              [bounds[0], bounds[1]], // bottom-left
            ],
          })

          map.current.addLayer({
            id: "eosda-overlay",
            type: "raster",
            source: "eosda-overlay",
            paint: {
              "raster-opacity": 0.7,
            },
          })
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError({ message: error.message, type: "layer" })
      onError?.(error)
    } finally {
      setLayerLoading(false)
    }
  }, [eosdaApiKey, currentViewId, coordinates, mapCenter, zoom, lang, onError])

  // Handle layer change
  const handleLayerChange = useCallback(
    (newLayer: typeof defaultLayer) => {
      setActiveLayer(newLayer)
      onLayerChange?.(newLayer)

      if (newLayer === "satellite") {
        // Remove EOSDA overlay
        if (map.current) {
          if (map.current.getLayer("eosda-overlay")) {
            map.current.removeLayer("eosda-overlay")
          }
          if (map.current.getSource("eosda-overlay")) {
            map.current.removeSource("eosda-overlay")
          }
        }
      } else {
        loadEOSDALayer(newLayer)
      }
    },
    [loadEOSDALayer, onLayerChange]
  )

  // Navigation controls
  const handleZoomIn = () => {
    map.current?.zoomIn()
  }

  const handleZoomOut = () => {
    map.current?.zoomOut()
  }

  const handleReset = () => {
    if (map.current && coordinates && coordinates.length > 0) {
      const lngs = coordinates.map(c => c[0])
      const lats = coordinates.map(c => c[1])
      const bounds = new mapboxgl.LngLatBounds(
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)]
      )
      map.current.fitBounds(bounds, { padding: 50 })
    } else if (map.current) {
      map.current.flyTo({ center: mapCenter, zoom, pitch, bearing })
    }
  }

  if (error && error.type === "initialization") {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-semibold">
              {lang === "ar" ? "خطأ في تحميل الخريطة" : "Map Loading Error"}
            </p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Map Container */}
      <div ref={mapContainer} className="h-full w-full rounded-lg overflow-hidden" />

      {/* Loading Overlay */}
      {(!mapLoaded || layerLoading) && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {lang === "ar" ? "جاري تحميل الخريطة..." : "Loading map..."}
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && error.type !== "initialization" && (
        <div className="absolute top-4 left-4 right-4 z-20">
          <Card className="bg-destructive/10 border-destructive/50 p-3">
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error.message}</span>
            </div>
          </Card>
        </div>
      )}

      {/* Layer Controls */}
      {showLayerControls && mapLoaded && (
        <div className="absolute top-4 left-4 z-20">
          <Card className="p-2 bg-black/80 backdrop-blur-sm border-white/10">
            <div className="flex flex-col gap-1">
              {availableLayers.map((layer) => (
                <Button
                  key={layer}
                  variant={activeLayer === layer ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleLayerChange(layer)}
                  disabled={layerLoading}
                  className="justify-start text-xs"
                >
                  <Layers className="h-3 w-3 mr-2" />
                  {lang === "ar"
                    ? {
                        satellite: "القمر الصناعي",
                        ndvi: "NDVI",
                        evi: "EVI",
                        ndwi: "NDWI",
                        chlorophyll: "الكلوروفيل",
                        thermal: "حراري",
                        moisture: "الرطوبة",
                      }[layer]
                    : layer.charAt(0).toUpperCase() + layer.slice(1)}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Navigation Controls */}
      {showNavigationControls && mapLoaded && (
        <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
          <Card className="p-1 bg-black/80 backdrop-blur-sm border-white/10">
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8 w-8 p-0"
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
          <Badge variant="secondary" className="bg-black/80 backdrop-blur-sm">
            <MapPin className="h-3 w-3 mr-1" />
            {fieldName}
          </Badge>
        </div>
      )}
    </div>
  )
}

