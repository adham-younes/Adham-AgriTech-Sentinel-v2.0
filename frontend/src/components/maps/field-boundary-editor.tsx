"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import MapboxDraw from "@mapbox/mapbox-gl-draw"
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css"
import area from "@turf/area"

// @ts-ignore
import * as MapboxDrawTypes from '@mapbox/mapbox-gl-draw';

type Geometry = GeoJSON.Polygon | null

interface FieldBoundaryEditorProps {
  value?: Geometry
  onChange?: (value: Geometry) => void
  onAreaChange?: (areaSqMeters: number | null) => void
  initialCenter?: [number, number]
  initialZoom?: number
  height?: number | string
  lang?: "ar" | "en"
}

const DEFAULT_CENTER: [number, number] = [31.2357, 30.0444] // Cairo
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

export function FieldBoundaryEditor({
  value = null,
  onChange,
  onAreaChange,
  initialCenter,
  initialZoom = 12,
  height = 400,
  lang = "ar",
}: FieldBoundaryEditorProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const drawRef = useRef<MapboxDraw | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapRef.current) return // Initialize only once
    if (!MAPBOX_TOKEN) {
      console.error("Mapbox token is missing")
      return
    }

    mapboxgl.accessToken = MAPBOX_TOKEN

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12", // Standard Satellite Style
      center: initialCenter || DEFAULT_CENTER,
      zoom: initialZoom,
      pitch: 0, // Start with 2D for easier drawing
      attributionControl: false,
    })

    map.addControl(new mapboxgl.NavigationControl(), "top-left")
    map.addControl(new mapboxgl.ScaleControl(), "bottom-left")

    map.on("load", () => {
      setMapLoaded(true)

      // Initialize Draw Control
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true
        },
        defaultMode: 'draw_polygon',
        styles: [
          // ACTIVE (being drawn)
          // line stroke
          {
            "id": "gl-draw-line",
            "type": "line",
            "filter": ["all", ["==", "$type", "LineString"], ["!=", "mode", "static"]],
            "layout": {
              "line-cap": "round",
              "line-join": "round"
            },
            "paint": {
              "line-color": "#00ff7f", // Brand Accent
              "line-dasharray": [0.2, 2],
              "line-width": 2
            }
          },
          // polygon fill
          {
            "id": "gl-draw-polygon-fill",
            "type": "fill",
            "filter": ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
            "paint": {
              "fill-color": "#00ff7f",
              "fill-outline-color": "#00ff7f",
              "fill-opacity": 0.2
            }
          },
          // polygon mid points
          {
            "id": "gl-draw-polygon-midpoint",
            "type": "circle",
            "filter": ["all", ["==", "$type", "Point"], ["==", "meta", "midpoint"]],
            "paint": {
              "circle-radius": 3,
              "circle-color": "#fbb03b"
            }
          },
          // polygon outline stroke
          {
            "id": "gl-draw-polygon-stroke-active",
            "type": "line",
            "filter": ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
            "layout": {
              "line-cap": "round",
              "line-join": "round"
            },
            "paint": {
              "line-color": "#00ff7f",
              "line-dasharray": [0.2, 2],
              "line-width": 2
            }
          },
          // vertex point halos
          {
            "id": "gl-draw-polygon-and-line-vertex-halo-active",
            "type": "circle",
            "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
            "paint": {
              "circle-radius": 5,
              "circle-color": "#FFF"
            }
          },
          // vertex points
          {
            "id": "gl-draw-polygon-and-line-vertex-active",
            "type": "circle",
            "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
            "paint": {
              "circle-radius": 3,
              "circle-color": "#00ff7f",
            }
          },
          // STATIC
          {
            "id": "gl-draw-polygon-fill-static",
            "type": "fill",
            "filter": ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
            "paint": {
              "fill-color": "#00ff7f",
              "fill-outline-color": "#00ff7f",
              "fill-opacity": 0.2
            }
          },
          {
            "id": "gl-draw-polygon-stroke-static",
            "type": "line",
            "filter": ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
            "layout": {
              "line-cap": "round",
              "line-join": "round"
            },
            "paint": {
              "line-color": "#00ff7f",
              "line-width": 2
            }
          }
        ]
      })

      map.addControl(draw, "top-right")
      drawRef.current = draw

      // Event Listeners
      map.on('draw.create', updateArea)
      map.on('draw.delete', updateArea)
      map.on('draw.update', updateArea)

      // Load initial value if present
      if (value) {
        const feature = {
          type: 'Feature',
          properties: {},
          geometry: value
        } as any
        draw.add(feature)

        // Fit bounds
        const bounds = new mapboxgl.LngLatBounds()
        value.coordinates[0].forEach((coord: any) => {
          bounds.extend(coord)
        })
        map.fitBounds(bounds, { padding: 50 })

        // Calculate initial area
        updateArea({ features: [feature] })
      }
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, []) // Empty dependency array to run once

  const updateArea = (e: any) => {
    const data = drawRef.current?.getAll()
    if (data && data.features.length > 0) {
      const feature = data.features[0]
      const polygonArea = area(feature)
      if (onAreaChange) onAreaChange(polygonArea)
      if (onChange) onChange(feature.geometry as Geometry)
    } else {
      if (onAreaChange) onAreaChange(null)
      if (onChange) onChange(null)
    }
  }

  const instructions = lang === "ar"
    ? "استخدم أدوات الرسم في الزاوية اليمنى لتحديد حدود حقلك بدقة."
    : "Use the drawing tools in the top-right corner to define your field boundaries."

  return (
    <div className="space-y-2">
      <div className="bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-gray-300 flex items-center gap-2">
        <span className="text-adham-accent">ℹ️</span> {instructions}
      </div>
      <div
        ref={mapContainerRef}
        className="w-full rounded-xl overflow-hidden border border-white/10 shadow-inner relative"
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-adham-accent"></div>
          </div>
        )}
      </div>
    </div>
  )
}
