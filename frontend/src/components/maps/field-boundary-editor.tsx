"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import maplibregl, { type StyleSpecification } from "maplibre-gl"
import area from "@turf/area"
import type { FeatureCollection } from "geojson"
import { eosdaPublicConfig } from "@/lib/config/eosda"

type Geometry = GeoJSON.Polygon | null

interface FieldBoundaryEditorProps {
  value?: Geometry
  onChange?: (value: Geometry) => void
  onAreaChange?: (areaSqMeters: number | null) => void
  initialCenter?: [number, number]
  initialZoom?: number
  height?: number | string
  lang?: "ar" | "en"
  enforceFourPoints?: boolean
}

const DEFAULT_CENTER: [number, number] = [eosdaPublicConfig.center.lng, eosdaPublicConfig.center.lat]

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim()
const MAPBOX_STYLE = process.env.NEXT_PUBLIC_MAPBOX_STYLE?.trim() || "satellite-v9"
const MAPBOX_TILE_URL = MAPBOX_TOKEN
  ? `https://api.mapbox.com/styles/v1/mapbox/${MAPBOX_STYLE}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`
  : null
const ESRI_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
const EOSDA_TILE_URL = process.env.NEXT_PUBLIC_EOSDA_TILE_URL?.trim() || null
const TRANSPORT_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
const ESRI_ATTRIBUTION = "Imagery © Esri, Maxar, Earthstar Geographics"
const SENTINEL_ATTRIBUTION = "Imagery © Sentinel Hub, Copernicus"
const EOSDA_ATTRIBUTION = "Imagery © EOSDA"

const inferTileSize = (url?: string | null) => (/PopularWebMercator512/i.test(url ?? "") ? 512 : 256)

const withDefaultSentinelParams = (url?: string | null) => {
  if (!url) return url ?? undefined
  let result = url
  const hasTime = /([&?])time=/i.test(result)
  const hasMaxcc = /([&?])maxcc=/i.test(result)
  if (!hasTime) {
    const now = new Date()
    const start = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    const iso = (d: Date) => d.toISOString().split("T")[0]
    const timeRange = `${iso(start)}/${iso(now)}`
    result += `${result.includes("?") ? "&" : "?"}time=${timeRange}`
  }
  if (!hasMaxcc) {
    result += `${result.includes("?") ? "&" : "?"}maxcc=20`
  }
  return result
}

const SENTINEL_TILE_TEMPLATE = (() => {
  const now = new Date()
  const start = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  const iso = (d: Date) => d.toISOString().split("T")[0]
  return `/api/sentinel/tiles/{z}/{x}/{y}?tileMatrixSet=PopularWebMercator512&layer=SENTINEL-2-L2A&time=${iso(
    start,
  )}/${iso(now)}&maxcc=20`
})()

// Disable Sentinel tiles by default to avoid broken imagery when credentials are absent.
const SENTINEL_TILE_URL = null

const MAPBOX_ATTRIBUTION = "Imagery © Mapbox"

const buildStyle = (options?: { sentinelTile?: string | null }): StyleSpecification => {
  const sentinelTile = options?.sentinelTile ?? undefined
  return {
    version: 8,
    sources: {
      ...(EOSDA_TILE_URL
        ? {
          eosda: {
            type: "raster",
            tiles: [EOSDA_TILE_URL],
            tileSize: 256,
            attribution: EOSDA_ATTRIBUTION,
          },
        }
        : {}),
      ...(MAPBOX_TILE_URL
        ? {
          mapbox: {
            type: "raster",
            tiles: [MAPBOX_TILE_URL],
            tileSize: 512,
            attribution: MAPBOX_ATTRIBUTION,
          },
        }
        : {}),
      ...(sentinelTile
        ? {
          sentinel: {
            type: "raster",
            tiles: [sentinelTile],
            tileSize: inferTileSize(sentinelTile),
            attribution: SENTINEL_ATTRIBUTION,
          },
        }
        : {}),
      esri: {
        type: "raster",
        tiles: [ESRI_TILE_URL],
        tileSize: 256,
        attribution: ESRI_ATTRIBUTION,
      },
      transportation: {
        type: "raster",
        tiles: [TRANSPORT_TILE_URL],
        tileSize: 256,
        attribution: "Roads © Esri",
      },
    },
    layers: [
      ...(EOSDA_TILE_URL
        ? [
          {
            id: "eosda-layer",
            type: "raster",
            source: "eosda",
            minzoom: 0,
            maxzoom: 22,
            paint: {
              "raster-opacity": 1,
            },
          } as const,
        ]
        : []),
      ...(MAPBOX_TILE_URL
        ? [
          {
            id: "mapbox-layer",
            type: "raster",
            source: "mapbox",
            minzoom: 0,
            maxzoom: 22,
            paint: {
              "raster-opacity": 1,
            },
          } as const,
        ]
        : []),
      ...(sentinelTile
        ? [
          {
            id: "sentinel-layer",
            type: "raster",
            source: "sentinel",
            minzoom: 0,
            maxzoom: 22,
            paint: {
              "raster-opacity": MAPBOX_TILE_URL ? 0 : 1,
            },
          } as const,
        ]
        : []),
      {
        id: "esri-layer",
        type: "raster",
        source: "esri",
        minzoom: 0,
        maxzoom: 22,
        paint: {
          "raster-opacity": MAPBOX_TILE_URL || sentinelTile ? 0 : 1,
        },
      },
      {
        id: "transportation-layer",
        type: "raster",
        source: "transportation",
        minzoom: 6,
        maxzoom: 22,
        paint: {
          "raster-opacity": 0.6,
        },
      },
    ],
  }
}

const drawStyles = [
  {
    id: "gl-draw-polygon-fill",
    type: "fill",
    filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
    paint: {
      "fill-color": "#22c55e",
      "fill-outline-color": "#15803d",
      "fill-opacity": 0.4,
    },
  },
  {
    id: "gl-draw-polygon-stroke-active",
    type: "line",
    filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": "#22c55e",
      "line-dasharray": [0.2, 2],
      "line-width": 2.5,
    },
  },
]

const DRAW_SCRIPT_SRC = "/vendor/mapbox-gl-draw.js"
const DRAW_STYLESHEET_HREF = "/vendor/mapbox-gl-draw.css"

declare global {
  interface Window {
    MapboxDraw?: any
    mapboxgl?: typeof maplibregl
  }
}

function ensureMapboxDraw(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve(null)
      return
    }

    if (!window.mapboxgl) {
      window.mapboxgl = maplibregl as typeof window.mapboxgl
    }

    if (!document.querySelector('link[data-mapbox-draw-css="true"]')) {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = DRAW_STYLESHEET_HREF
      link.dataset.mapboxDrawCss = "true"
      document.head.appendChild(link)
    }

    if (window.MapboxDraw) {
      resolve(window.MapboxDraw)
      return
    }

    const finalize = () => {
      if (window.MapboxDraw) {
        resolve(window.MapboxDraw)
      } else {
        reject(new Error("MapboxDraw script loaded but constructor missing"))
      }
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-mapbox-draw="true"]')
    if (existingScript) {
      existingScript.addEventListener("load", finalize, { once: true })
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Mapbox Draw script")),
        { once: true },
      )
      return
    }

    const script = document.createElement("script")
    script.src = DRAW_SCRIPT_SRC
    script.async = true
    script.dataset.mapboxDraw = "true"
    script.onload = finalize
    script.onerror = () => reject(new Error("Failed to load Mapbox Draw script"))
    document.head.appendChild(script)
  })
}

function polygonsEqual(a: Geometry, b: Geometry): boolean {
  if (!a && !b) return true
  if (!a || !b) return false
  const ringA = a.coordinates?.[0] ?? []
  const ringB = b.coordinates?.[0] ?? []
  if (ringA.length !== ringB.length) return false
  for (let i = 0; i < ringA.length; i += 1) {
    const [ax, ay] = ringA[i] ?? []
    const [bx, by] = ringB[i] ?? []
    if (Math.abs(ax - bx) > 1e-9 || Math.abs(ay - by) > 1e-9) {
      return false
    }
  }
  return true
}

function polygonToFeatureCollection(polygon: GeoJSON.Polygon): FeatureCollection<GeoJSON.Polygon> {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: polygon,
        properties: {},
      },
    ],
  }
}

export function FieldBoundaryEditor({
  value = null,
  onChange,
  onAreaChange,
  initialCenter,
  initialZoom = 12,
  height = 360,
  lang = "ar",
  enforceFourPoints = false,
}: FieldBoundaryEditorProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const drawRef = useRef<any>(null)
  const updateHandlerRef = useRef<((event: any) => void) | null>(null)

  const [currentArea, setCurrentArea] = useState<number | null>(null)
  const [drawReady, setDrawReady] = useState(false)
  const [hasGeometry, setHasGeometry] = useState(Boolean(value))
  const [locked, setLocked] = useState(false)
  const [imageryProvider, setImageryProvider] = useState<"mapbox" | "sentinel" | "esri">(
    MAPBOX_TILE_URL ? "mapbox" : "esri",
  )
  const [providerFallback, setProviderFallback] = useState(false)
  const quadPointsRef = useRef<[number, number][]>([])
  const fallbackTriggeredRef = useRef(false)
  const addQuadPoint = useCallback((lng: number, lat: number) => {
    if (locked) return
    if (quadPointsRef.current.length >= 4) return
    quadPointsRef.current = [...quadPointsRef.current, [lng, lat]]
  }, [locked])

  const updateQuadLayers = useCallback(() => {
    if (!mapRef.current) return
    const points = quadPointsRef.current
    const lineCoords = points
    const polygonCoords = points.length >= 3 ? [...points, points[0]] : []

    const lineFc: FeatureCollection = {
      type: "FeatureCollection",
      features: lineCoords.length >= 2
        ? [{ type: "Feature", geometry: { type: "LineString", coordinates: lineCoords as any }, properties: {} }]
        : [],
    }

    const polyFc: FeatureCollection = {
      type: "FeatureCollection",
      features: polygonCoords.length >= 4
        ? [{ type: "Feature", geometry: { type: "Polygon", coordinates: [polygonCoords as any] }, properties: {} }]
        : [],
    }

    const ptsFc: FeatureCollection = {
      type: "FeatureCollection",
      features: points.map((p, idx) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: p as any },
        properties: { index: idx },
      })),
    }

    const map = mapRef.current
    if (map.getSource("quad-line")) {
      ; (map.getSource("quad-line") as maplibregl.GeoJSONSource).setData(lineFc)
    }
    if (map.getSource("quad-polygon")) {
      ; (map.getSource("quad-polygon") as maplibregl.GeoJSONSource).setData(polyFc)
    }
    if (map.getSource("quad-points")) {
      ; (map.getSource("quad-points") as maplibregl.GeoJSONSource).setData(ptsFc)
    }
  }, [])

  const finalizeQuad = useCallback(() => {
    if (quadPointsRef.current.length !== 4) return
    const ring = [...quadPointsRef.current, quadPointsRef.current[0]]
    const polygon: GeoJSON.Polygon = { type: "Polygon", coordinates: [ring] as any }
    const fc = { type: "Feature", geometry: polygon, properties: {} } as any
    const polygonArea = area(fc)
    lastPolygonRef.current = polygon
    setCurrentArea(polygonArea)
    setHasGeometry(true)
    setLocked(true)
    onChangeRef.current?.(polygon)
    onAreaChangeRef.current?.(polygonArea)
    // fit bounds
    const bounds = new maplibregl.LngLatBounds()
    ring.forEach((c) => bounds.extend(c as [number, number]))
    if (!bounds.isEmpty()) mapRef.current?.fitBounds(bounds, { padding: 40, duration: 400 })
  }, [locked])

  const onChangeRef = useRef(onChange)
  const onAreaChangeRef = useRef(onAreaChange)
  const lastPolygonRef = useRef<Geometry>(value ?? null)
  const initialValueRef = useRef<Geometry>(value ?? null)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    onAreaChangeRef.current = onAreaChange
  }, [onAreaChange])

  const mapHeightStyle = useMemo(
    () => (typeof height === "number" ? `${height}px` : height),
    [height],
  )
  const enableImageryFallback = useCallback(() => {
    if (fallbackTriggeredRef.current) return
    fallbackTriggeredRef.current = true
    setProviderFallback(true)
    const mapInstance = mapRef.current
    if (imageryProvider === "mapbox" && SENTINEL_TILE_URL) {
      setImageryProvider("sentinel")
      requestAnimationFrame(() => {
        if (!mapInstance) return
        if (mapInstance.getLayer("mapbox-layer")) {
          mapInstance.setPaintProperty("mapbox-layer", "raster-opacity", 0)
        }
        if (mapInstance.getLayer("sentinel-layer")) {
          mapInstance.setPaintProperty("sentinel-layer", "raster-opacity", 1)
        }
      })
    } else {
      setImageryProvider("esri")
      requestAnimationFrame(() => {
        if (!mapInstance) return
        if (mapInstance.getLayer("mapbox-layer")) {
          mapInstance.setPaintProperty("mapbox-layer", "raster-opacity", 0)
        }
        if (mapInstance.getLayer("sentinel-layer")) {
          mapInstance.setPaintProperty("sentinel-layer", "raster-opacity", 0)
        }
        if (mapInstance.getLayer("esri-layer")) {
          mapInstance.setPaintProperty("esri-layer", "raster-opacity", 1)
        }
      })
    }
  }, [imageryProvider])

  const initialCenterRef = useRef<[number, number]>(
    (initialValueRef.current?.coordinates?.[0]?.[0] as [number, number]) ??
    (initialCenter as [number, number]) ??
    DEFAULT_CENTER,
  )
  const initialZoomRef = useRef(initialZoom)

  useEffect(() => {
    if (!mapContainerRef.current) return
    let isCancelled = false

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: buildStyle({ sentinelTile: SENTINEL_TILE_URL }),
      center: initialCenterRef.current,
      zoom: initialValueRef.current ? initialZoomRef.current : 9,
      attributionControl: false,
    })

    map.doubleClickZoom.disable()
    map.touchZoomRotate.enable()
    if (typeof (map as any).touchPitchEnable === "function") {
      ; (map as any).touchPitchEnable()
    }
    try {
      map.getCanvas().style.touchAction = "manipulation"
    } catch {
      // ignore styling issues on unsupported browsers
    }
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-left")

    const handleImageryError = (event: any) => {
      if (!SENTINEL_TILE_URL) return
      const sourceId = event?.sourceId
      const message = String(event?.error?.message ?? "")
      if (sourceId === "sentinel" || /sentinel|tile/i.test(message)) {
        enableImageryFallback()
      }
    }

    if (SENTINEL_TILE_URL) {
      map.on("error", handleImageryError)
    } else {
      setImageryProvider("esri")
    }

    const updateQuadLayers = () => {
      if (!mapRef.current) return
      const points = quadPointsRef.current
      const lineCoords = points
      const polygonCoords = points.length >= 3 ? [...points, points[0]] : []

      const lineFc: FeatureCollection = {
        type: "FeatureCollection",
        features: lineCoords.length >= 2
          ? [{ type: "Feature", geometry: { type: "LineString", coordinates: lineCoords as any }, properties: {} }]
          : [],
      }

      const polyFc: FeatureCollection = {
        type: "FeatureCollection",
        features: polygonCoords.length >= 4
          ? [{ type: "Feature", geometry: { type: "Polygon", coordinates: [polygonCoords as any] }, properties: {} }]
          : [],
      }

      const ptsFc: FeatureCollection = {
        type: "FeatureCollection",
        features: points.map((p, idx) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: p as any },
          properties: { idx },
        })) as any,
      }

      if (!mapRef.current.getSource("quad-line")) {
        mapRef.current.addSource("quad-line", { type: "geojson", data: lineFc })
        mapRef.current.addLayer({ id: "quad-line-layer", type: "line", source: "quad-line", paint: { "line-color": "#22c55e", "line-width": 2 } })
      } else {
        ; (mapRef.current.getSource("quad-line") as maplibregl.GeoJSONSource).setData(lineFc)
      }

      if (!mapRef.current.getSource("quad-polygon")) {
        mapRef.current.addSource("quad-polygon", { type: "geojson", data: polyFc })
        mapRef.current.addLayer({ id: "quad-polygon-fill", type: "fill", source: "quad-polygon", paint: { "fill-color": "#22c55e", "fill-opacity": 0.12 } })
        mapRef.current.addLayer({ id: "quad-polygon-stroke", type: "line", source: "quad-polygon", paint: { "line-color": "#15803d", "line-width": 2 } })
      } else {
        ; (mapRef.current.getSource("quad-polygon") as maplibregl.GeoJSONSource).setData(polyFc)
      }

      if (!mapRef.current.getSource("quad-points")) {
        mapRef.current.addSource("quad-points", { type: "geojson", data: ptsFc })
        mapRef.current.addLayer({
          id: "quad-points-layer",
          type: "circle",
          source: "quad-points",
          paint: {
            "circle-radius": 5,
            "circle-color": [
              "case",
              ["==", ["get", "idx"], 0], "#22c55e",
              ["==", ["get", "idx"], 1], "#84cc16",
              ["==", ["get", "idx"], 2], "#f59e0b",
              "#e11d48",
            ],
            "circle-stroke-color": "#00ff00",
            "circle-stroke-width": 1.5,
          },
        })
      } else {
        ; (mapRef.current.getSource("quad-points") as maplibregl.GeoJSONSource).setData(ptsFc)
      }
    }

    const finalizeQuad = () => {
      if (quadPointsRef.current.length !== 4) return
      const ring = [...quadPointsRef.current, quadPointsRef.current[0]]
      const polygon: GeoJSON.Polygon = { type: "Polygon", coordinates: [ring] as any }
      const fc = { type: "Feature", geometry: polygon, properties: {} } as any
      const polygonArea = area(fc)
      lastPolygonRef.current = polygon
      setCurrentArea(polygonArea)
      setHasGeometry(true)
      setLocked(true)
      onChangeRef.current?.(polygon)
      onAreaChangeRef.current?.(polygonArea)
      // fit bounds
      const bounds = new maplibregl.LngLatBounds()
      ring.forEach((c) => bounds.extend(c as [number, number]))
      if (!bounds.isEmpty()) mapRef.current?.fitBounds(bounds, { padding: 40, duration: 400 })
    }

    const handleQuadClick = (e: maplibregl.MapMouseEvent) => {
      if (locked) return
      if (quadPointsRef.current.length >= 4) return
      addQuadPoint(e.lngLat.lng, e.lngLat.lat)
      updateQuadLayers()
      if (quadPointsRef.current.length === 4) finalizeQuad()
    }

    const handleQuadTap = (e: maplibregl.MapTouchEvent) => {
      if (locked) return
      if (e.points && e.points.length > 1) return
      if (quadPointsRef.current.length >= 4) return
      addQuadPoint(e.lngLat.lng, e.lngLat.lat)
      updateQuadLayers()
      if (quadPointsRef.current.length === 4) finalizeQuad()
    }

    const initializeDraw = async () => {
      try {
        if (enforceFourPoints) {
          // custom 4-point capture mode (no Mapbox Draw)
          setDrawReady(true)
          updateQuadLayers()
          mapRef.current?.on("click", handleQuadClick)
          mapRef.current?.on("touchend", handleQuadTap)
          return
        }

        const DrawConstructor = await ensureMapboxDraw()
        if (!DrawConstructor || isCancelled || !mapRef.current) return

        const draw = new DrawConstructor({
          displayControlsDefault: false,
          controls: { polygon: true, trash: true },
          defaultMode: "draw_polygon",
          styles: drawStyles,
        })

        drawRef.current = draw
        mapRef.current.addControl(draw, "top-right")

        const handleUpdate = () => {
          if (!drawRef.current) return
          const data = drawRef.current.getAll()
          if (!data?.features?.length) {
            setCurrentArea(null)
            lastPolygonRef.current = null
            onChangeRef.current?.(null)
            onAreaChangeRef.current?.(null)
            setHasGeometry(false)
            return
          }

          const feature = data.features[0]
          if (feature.geometry?.type === "Polygon") {
            const polygonGeometry = feature.geometry as GeoJSON.Polygon
            lastPolygonRef.current = polygonGeometry
            const polygonArea = area(feature)
            setCurrentArea(polygonArea)
            setHasGeometry(true)
            onChangeRef.current?.(polygonGeometry)
            onAreaChangeRef.current?.(polygonArea)
          }
        }

        updateHandlerRef.current = handleUpdate

        mapRef.current.on("draw.create", handleUpdate)
        mapRef.current.on("draw.update", handleUpdate)
        mapRef.current.on("draw.delete", handleUpdate)

        setDrawReady(true)

        const initialValue = initialValueRef.current
        if (initialValue) {
          const fc = polygonToFeatureCollection(initialValue)
          draw.add(fc)
          lastPolygonRef.current = initialValue

          const bounds = new maplibregl.LngLatBounds()
          initialValue.coordinates[0]?.forEach((coord) => bounds.extend(coord as [number, number]))
          if (!bounds.isEmpty()) {
            mapRef.current.fitBounds(bounds, { padding: 40, duration: 0 })
          }

          const initialArea = area(initialValue)
          setCurrentArea(initialArea)
          setHasGeometry(true)
          onAreaChangeRef.current?.(initialArea)
        }
      } catch (error) {
        console.error("[FieldBoundaryEditor] Failed to initialize drawing tools:", error)
      }
    }

    map.on("load", initializeDraw)

    return () => {
      isCancelled = true
      map.off("load", initializeDraw)

      if (mapRef.current && updateHandlerRef.current) {
        mapRef.current.off("draw.create", updateHandlerRef.current)
        mapRef.current.off("draw.update", updateHandlerRef.current)
        mapRef.current.off("draw.delete", updateHandlerRef.current)
      }

      if (!enforceFourPoints) {
        if (mapRef.current && drawRef.current) {
          mapRef.current.removeControl(drawRef.current)
        }
      } else if (mapRef.current) {
        mapRef.current.off("click", handleQuadClick)
        mapRef.current.off("touchend", handleQuadTap)
      }

      if (SENTINEL_TILE_URL) {
        map.off("error", handleImageryError)
      }
      // map.remove() can throw if the container was already detached (fast navigation/React double render)
      try {
        const container = typeof map.getContainer === "function" ? map.getContainer() : null
        if (container && container.parentNode) {
          map.remove()
        }
      } catch (error) {
        console.warn("[FieldBoundaryEditor] Failed to remove map safely:", error)
      }
      mapRef.current = null
      drawRef.current = null
      updateHandlerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return
    if (!initialCenter) return
    if (lastPolygonRef.current) return
    mapRef.current.setCenter(initialCenter)
  }, [initialCenter])

  useEffect(() => {
    if (!drawReady || !drawRef.current) return
    if (polygonsEqual(value, lastPolygonRef.current)) return

    drawRef.current.deleteAll()

    if (value) {
      const fc = polygonToFeatureCollection(value)
      drawRef.current.add(fc)
      lastPolygonRef.current = value

      const bounds = new maplibregl.LngLatBounds()
      value.coordinates[0]?.forEach((coord) => bounds.extend(coord as [number, number]))
      if (mapRef.current && !bounds.isEmpty()) {
        mapRef.current.fitBounds(bounds, { padding: 40, duration: 400 })
      }

      const polygonArea = area(value)
      setCurrentArea(polygonArea)
      setHasGeometry(true)
      onAreaChangeRef.current?.(polygonArea)
    } else {
      lastPolygonRef.current = null
      setCurrentArea(null)
      setHasGeometry(false)
      onAreaChangeRef.current?.(null)
    }
  }, [drawReady, value])

  const finalizeDrawing = useCallback(() => {
    if (!drawRef.current) return
    try {
      if (typeof drawRef.current.getMode === "function") {
        const mode = drawRef.current.getMode()
        if (mode === "draw_polygon") {
          drawRef.current.changeMode("simple_select")
        }
      }

      const data = drawRef.current.getAll()
      if (!data?.features?.length) return

      const feature = data.features[0]
      if (feature.geometry?.type === "Polygon") {
        const polygonGeometry = feature.geometry as GeoJSON.Polygon
        const polygonArea = area(feature)
        lastPolygonRef.current = polygonGeometry
        setCurrentArea(polygonArea)
        setHasGeometry(true)
        onChangeRef.current?.(polygonGeometry)
        onAreaChangeRef.current?.(polygonArea)
      }
    } catch (error) {
      console.error("[FieldBoundaryEditor] finalizeDrawing error:", error)
    }
  }, [])

  const clearBoundary = useCallback(() => {
    if (!drawRef.current) return
    drawRef.current.deleteAll()
    lastPolygonRef.current = null
    setCurrentArea(null)
    setHasGeometry(false)
    onChangeRef.current?.(null)
    onAreaChangeRef.current?.(null)
  }, [])

  const instructions =
    lang === "ar"
      ? [
        "انقر على زر المضلع لبدء الرسم (الخيار الأول في أعلى الخريطة).",
        "ارسم نقاطًا حول حدود الحقل، ثم اضغط زر \"إنهاء الرسم\" أو انقر نقرتين متتاليتين لإغلاق المضلع.",
        "استخدم زر \"مسح الحدود\" لإعادة المحاولة بسرعة عند الحاجة.",
      ]
      : [
        "Select the polygon tool to start drawing (first button on the map toolbar).",
        "Drop points around the field, then click “Finish drawing” or double-click to close the polygon.",
        "Use “Clear boundary” to reset instantly if you need to redraw.",
      ]

  const areaLabel = (() => {
    if (!currentArea) return lang === "ar" ? "لم يتم تحديد مساحة" : "No area defined"
    const hectares = currentArea / 10_000
    const acres = currentArea / 4046.86
    const feddan = currentArea / 4200
    if (lang === "ar") {
      return `المساحة: ${hectares.toFixed(2)} هكتار / ${feddan.toFixed(2)} فدان / ${acres.toFixed(2)} فدان إنجليزي`
    }
    return `Area: ${hectares.toFixed(2)} ha / ${acres.toFixed(2)} acres / ${feddan.toFixed(2)} feddan`
  })()

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground">
        <span>{lang === "ar" ? "مزود صور الأقمار الصناعية" : "Satellite imagery provider"}</span>
        <span
          className={`font-semibold ${imageryProvider === "mapbox"
            ? "text-emerald-400"
            : imageryProvider === "sentinel"
              ? "text-emerald-500"
              : "text-amber-500"
            }`}
        >
          {imageryProvider === "mapbox"
            ? "Mapbox"
            : imageryProvider === "sentinel"
              ? "Sentinel Hub"
              : "Esri World Imagery"}
        </span>
      </div>
      {providerFallback && (
        <div className="text-[11px] text-amber-500">
          {lang === "ar"
            ? "تم التبديل تلقائياً إلى المزود الاحتياطي لضمان استمرار عرض الخريطة."
            : "Automatically switched to the fallback provider to keep the map running."}
        </div>
      )}
      <div
        ref={mapContainerRef}
        className="overflow-hidden rounded-xl border border-primary/30 shadow-lg"
        style={{ height: mapHeightStyle }}
      />
      <div className="flex flex-wrap gap-3 rounded-xl bg-background/70 p-3 text-xs sm:text-sm">
        {!enforceFourPoints ? (
          <>
            <button
              type="button"
              onClick={finalizeDrawing}
              disabled={!drawReady}
              className="rounded-full bg-emerald-500/15 px-4 py-2 font-medium text-emerald-200 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {lang === "ar" ? "إنهاء الرسم وتثبيت الحدود" : "Finish drawing & lock boundary"}
            </button>
            <button
              type="button"
              onClick={clearBoundary}
              disabled={!hasGeometry}
              className="rounded-full border border-white/20 px-4 py-2 font-medium text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {lang === "ar" ? "مسح الحدود وإعادة الرسم" : "Clear boundary"}
            </button>
          </>
        ) : (
          <>
            <span className="rounded-full border border-white/20 px-4 py-2 text-white/80">
              {lang === "ar"
                ? `وضع أربع نقاط: ${quadPointsRef.current.length}/4`
                : `Four‑point mode: ${quadPointsRef.current.length}/4`}
            </span>
            <button
              type="button"
              onClick={() => {
                if (!navigator.geolocation) return
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    const { longitude, latitude } = pos.coords
                    addQuadPoint(longitude, latitude)
                    updateQuadLayers()
                    if (quadPointsRef.current.length === 4) finalizeQuad()
                  },
                  () => {/* ignore error */ },
                  { enableHighAccuracy: true, maximumAge: 10_000, timeout: 10_000 },
                )
              }}
              disabled={!drawReady || quadPointsRef.current.length >= 4 || locked}
              className="rounded-full border border-white/20 px-4 py-2 font-medium text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {lang === "ar" ? "استخدم موقعي كنقطة" : "Use my location"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!mapRef.current) return
                if (!locked && quadPointsRef.current.length === 4) {
                  setLocked(true)
                }
              }}
              disabled={!drawReady || quadPointsRef.current.length !== 4 || locked}
              className="rounded-full bg-emerald-500/15 px-4 py-2 font-medium text-emerald-200 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {lang === "ar" ? "تثبيت الحدود" : "Lock boundary"}
            </button>
            <button
              type="button"
              onClick={() => {
                quadPointsRef.current = quadPointsRef.current.slice(0, -1)
                setLocked(false)
                updateQuadLayers()
                // reset outputs
                onChangeRef.current?.(null)
                onAreaChangeRef.current?.(null)
                setCurrentArea(null)
                setHasGeometry(false)
              }}
              disabled={quadPointsRef.current.length === 0}
              className="rounded-full border border-white/20 px-4 py-2 font-medium text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {lang === "ar" ? "تراجع" : "Undo point"}
            </button>
            <button
              type="button"
              onClick={() => {
                quadPointsRef.current = []
                setLocked(false)
                updateQuadLayers()
                onChangeRef.current?.(null)
                onAreaChangeRef.current?.(null)
                setCurrentArea(null)
                setHasGeometry(false)
              }}
              className="rounded-full border border-white/20 px-4 py-2 font-medium text-white/80 transition hover:bg-white/10"
            >
              {lang === "ar" ? "مسح الحدود" : "Clear"}
            </button>
          </>
        )}
        {!drawReady && (
          <span className="text-[11px] text-orange-200 sm:text-xs">
            {lang === "ar"
              ? "يتم تحميل أدوات الرسم، انتظر لحظات وسيظهر شريط الأدوات أعلى الخريطة."
              : "Drawing toolbar is loading; it will appear at the top of the map in a moment."}
          </span>
        )}
      </div>
      <div className="rounded-xl border border-dashed border-primary/40 bg-background/40 p-4 text-sm leading-relaxed">
        <p className="font-semibold text-primary">
          {lang === "ar" ? "إرشادات رسم حدود الحقل" : "How to define your field"}
        </p>
        {enforceFourPoints ? (
          <ul className="mt-2 list-disc space-y-1 ps-6 text-muted-foreground">
            <li>{lang === "ar" ? "انقر على الخريطة لإسقاط 4 نقاط (زوايا الحقل) بالترتيب." : "Click the map to drop 4 corner points in order."}</li>
            <li>{lang === "ar" ? "سيتم إغلاق المضلع تلقائياً عند النقطة الرابعة." : "Polygon closes automatically on the 4th point."}</li>
            <li>{lang === "ar" ? "استخدم زر \"تراجع\" لإزالة آخر نقطة أو \"مسح\" للبدء من جديد." : "Use Undo to remove the last point or Clear to restart."}</li>
          </ul>
        ) : (
          <ul className="mt-2 list-disc space-y-1 ps-6 text-muted-foreground">
            {instructions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
        {areaLabel}
      </div>
      {!drawReady && (
        <div className="rounded-xl border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-sm text-orange-200">
          {lang === "ar"
            ? "جاري تحميل أدوات الرسم... قد يستغرق الأمر لحظات قليلة."
            : "Loading drawing tools… this may take a moment."}
        </div>
      )}
    </div>
  )
}
