'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import maplibregl, { type StyleSpecification } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import type { FeatureCollection, Polygon } from "geojson"
import { eosdaPublicConfig } from "@/lib/config/eosda"

const DEFAULT_CENTER: [number, number] = [eosdaPublicConfig.center.lng, eosdaPublicConfig.center.lat]
const DEFAULT_ZOOM_LEVEL = Math.max(2, Math.min(eosdaPublicConfig.zoom.default, eosdaPublicConfig.zoom.max))
const SENTINEL_TILE_URL = process.env.NEXT_PUBLIC_SENTINEL_TILE_URL?.trim()
const SENTINEL_DISABLED =
  (process.env.NEXT_PUBLIC_DISABLE_SENTINEL ?? "").trim().toLowerCase() === "1" ||
  (process.env.NEXT_PUBLIC_DISABLE_SENTINEL ?? "").trim().toLowerCase() === "true"
const SENTINEL_ATTRIBUTION =
  process.env.NEXT_PUBLIC_SENTINEL_TILE_ATTRIBUTION?.trim() ||
  "Imagery \u00A9 Sentinel Hub"
const ESRI_TILE_URL = "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
const ESRI_ATTRIBUTION = "Imagery \u00A9 Esri, Maxar, Earthstar Geographics"

// Mapbox raster tiles (fallback to Sentinel/Esri if token not provided)
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim()
const MAPBOX_STYLE = process.env.NEXT_PUBLIC_MAPBOX_STYLE?.trim() || "satellite-v9"
const MAPBOX_TILE_URL = MAPBOX_TOKEN
  ? `https://api.mapbox.com/styles/v1/mapbox/${MAPBOX_STYLE}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`
  : undefined
const MAPBOX_ATTRIBUTION = "Imagery \u00A9 Mapbox"
const EOSDA_TILE_URL =
  process.env.NEXT_PUBLIC_EOSDA_TILE_URL?.trim() ||
  "https://api.eosda.com";

type MapLayer = "true-color" | "ndvi" | "ndmi" | "evi" | "soil-moisture" | "chlorophyll"

const LAYER_CONFIG: Record<MapLayer, { name: { ar: string; en: string }; url: string; color: string }> = {
  "true-color": {
    name: { ar: "ألوان حقيقية", en: "True Color" },
    url: "https://api-connect.eos.com/api/lms/tiles/v1/sentinel2l2a/{z}/{x}/{y}",
    color: "#ffffff"
  },
  "ndvi": {
    name: { ar: "صحة النبات (NDVI)", en: "Vegetation Health (NDVI)" },
    url: "https://api-connect.eos.com/api/lms/tiles/v1/ndvi/{z}/{x}/{y}",
    color: "#22c55e"
  },
  "ndmi": {
    name: { ar: "إجهاد مائي (NDMI)", en: "Moisture Stress (NDMI)" },
    url: "https://api-connect.eos.com/api/lms/tiles/v1/ndmi/{z}/{x}/{y}",
    color: "#3b82f6"
  },
  "evi": {
    name: { ar: "مؤشر نباتي محسن (EVI)", en: "Enhanced Veg. Index (EVI)" },
    url: "https://api-connect.eos.com/api/lms/tiles/v1/evi/{z}/{x}/{y}",
    color: "#84cc16"
  },
  "soil-moisture": {
    name: { ar: "رطوبة التربة", en: "Soil Moisture" },
    url: "https://api-connect.eos.com/api/lms/tiles/v1/soil_moisture/{z}/{x}/{y}",
    color: "#a855f7"
  },
  "chlorophyll": {
    name: { ar: "الكلوروفيل", en: "Chlorophyll" },
    url: "https://api-connect.eos.com/api/lms/tiles/v1/chlorophyll/{z}/{x}/{y}",
    color: "#10b981"
  }
}

const EOSDA_API_KEY = process.env.NEXT_PUBLIC_EOSDA_API_KEY?.trim() || ""

function getLayerUrl(layer: MapLayer) {
  const baseUrl = LAYER_CONFIG[layer].url
  return EOSDA_API_KEY ? `${baseUrl}?apikey=${EOSDA_API_KEY}` : baseUrl
}

function withDefaultSentinelParams(url?: string) {
  if (!url) return url
  const hasTime = /([&?])TIME=/.test(url)
  const hasMaxcc = /([&?])maxcc=/.test(url)
  let result = url
  if (!hasTime) {
    const now = new Date()
    const start = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    const iso = (d: Date) => d.toISOString().split('T')[0]
    const sep = result.includes('?') ? '&' : '?'
    result += `${sep}TIME=${iso(start)}/${iso(now)}`
  }
  if (!hasMaxcc) {
    const sep = result.includes('?') ? '&' : '?'
    result += `${sep}maxcc=80`
  }
  return result
}

function inferTileSize(url?: string): 256 | 512 {
  if (!url) return 512
  return /PopularWebMercator512/i.test(url) ? 512 : 256
}

function proxySentinelTileTemplate() {
  const now = new Date()
  const start = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  const iso = (d: Date) => d.toISOString().split("T")[0]
  return `/api/sentinel/tiles/{z}/{x}/{y}?tileMatrixSet=PopularWebMercator512&layer=SENTINEL-2-L2A&time=${iso(start)}/${iso(now)}`
}

const ACTIVE_SENTINEL_TILE_URL = SENTINEL_DISABLED
  ? undefined
  : SENTINEL_TILE_URL
    ? withDefaultSentinelParams(SENTINEL_TILE_URL)
    : proxySentinelTileTemplate()

const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    worldImagery: {
      type: "raster",
      tiles: [
        ESRI_TILE_URL, // Primary: Esri World Imagery
      ],
      tileSize: 256, // Esri uses 256px tiles
      attribution: ESRI_ATTRIBUTION,
      maxzoom: 19,
    },
    // Fallback sources
    sentinelImagery: {
      type: "raster",
      tiles: ACTIVE_SENTINEL_TILE_URL ? [ACTIVE_SENTINEL_TILE_URL] : [],
      tileSize: 512,
      attribution: SENTINEL_ATTRIBUTION,
      maxzoom: 18,
    },
    mapboxImagery: {
      type: "raster",
      tiles: MAPBOX_TILE_URL ? [MAPBOX_TILE_URL] : [],
      tileSize: 512,
      attribution: MAPBOX_ATTRIBUTION,
      maxzoom: 18,
    },
  },
  layers: [
    { id: "esri-imagery", type: "raster", source: "worldImagery", paint: {} },
    { id: "sentinel-imagery", type: "raster", source: "sentinelImagery", paint: {}, layout: { visibility: "none" } },
    { id: "mapbox-imagery", type: "raster", source: "mapboxImagery", paint: {}, layout: { visibility: "none" } },
  ],
}

type FieldFeatureProperties = {
  id: string
  name: string
  crop?: string | null
  ndvi: number
  health: number
  yield: number
  moisture?: number | null
  areaFeddan?: number | null
  lastUpdated?: string | null
}

export interface FarmAnalyticsFeature {
  id: string
  name: string
  crop?: string | null
  areaFeddan?: number | null
  ndvi?: number | null
  moisture?: number | null
  yieldPotential?: number | null
  health?: number | null
  lastUpdated?: string | null
  center: [number, number]
  polygon: [number, number][]
}

interface FarmAnalyticsMapProps {
  fields: FarmAnalyticsFeature[]
  selectedFieldId?: string | null
  onFieldSelect?: (fieldId: string) => void
  height?: number
  isLoading?: boolean
  error?: string | null
  lang?: "ar" | "en"
}

const EMPTY_COLLECTION: FeatureCollection<Polygon, FieldFeatureProperties> = {
  type: "FeatureCollection",
  features: [],
}

function ensureClosedRing(coords: [number, number][]): [number, number][] {
  if (coords.length === 0) return coords
  const first = coords[0]
  const last = coords[coords.length - 1]
  if (first[0] === last[0] && first[1] === last[1]) {
    return coords
  }
  return [...coords, first]
}

function toFeatureCollection(
  fields: FarmAnalyticsFeature[],
): FeatureCollection<Polygon, FieldFeatureProperties> {
  if (fields.length === 0) return EMPTY_COLLECTION

  return {
    type: "FeatureCollection",
    features: fields.map((field) => ({
      type: "Feature",
      id: field.id,
      properties: {
        id: field.id,
        name: field.name,
        crop: field.crop,
        ndvi: field.ndvi ?? 0.62,
        health: field.health ?? field.ndvi ?? 0.62,
        yield: field.yieldPotential ?? 70,
        moisture: field.moisture ?? null,
        areaFeddan: field.areaFeddan ?? null,
        lastUpdated: field.lastUpdated ?? null,
      },
      geometry: {
        type: "Polygon",
        coordinates: [ensureClosedRing(field.polygon)],
      },
    })),
  }
}

export function FarmAnalyticsMap({
  fields,
  selectedFieldId,
  onFieldSelect,
  height = 520,
  isLoading = false,
  error = null,
  lang = "ar"
}: FarmAnalyticsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const mapReadyRef = useRef(false)
  const eventsBoundRef = useRef(false)
  const initialFitRef = useRef(false)
  const onFieldSelectRef = useRef<typeof onFieldSelect>()

  onFieldSelectRef.current = onFieldSelect

  const featureCollection = useMemo(() => toFeatureCollection(fields), [fields])
  const [activeLayer, setActiveLayer] = useState<MapLayer>("true-color")
  const [showLayers, setShowLayers] = useState(false)

  const ensureLayers = useCallback((map: maplibregl.Map) => {
    if (!map.getSource("farm-fields")) {
      map.addSource("farm-fields", {
        type: "geojson",
        data: EMPTY_COLLECTION,
        promoteId: "id",
      })
    }

    if (!map.getLayer("field-extrusions")) {
      map.addLayer({
        id: "field-extrusions",
        type: "fill-extrusion",
        source: "farm-fields",
        paint: {
          // أخضر بالكامل مع تدرج بسيط حسب NDVI
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            ["get", "ndvi"],
            0.3,
            "#bbf7d0", // أخضر فاتح
            0.55,
            "#4ade80", // أخضر متوسط
            0.7,
            "#22c55e", // أخضر ساطع
            0.9,
            "#166534", // أخضر داكن
          ],
          // تقليل الارتفاع بشكل كبير حتى لا يظهر كمكعب ضخم
          "fill-extrusion-height": ["*", ["get", "yield"], 1],
          "fill-extrusion-opacity": 0.9,
        },
      })
    }

    if (!map.getLayer("field-outline")) {
      map.addLayer({
        id: "field-outline",
        type: "line",
        source: "farm-fields",
        paint: {
          "line-color": "#10b981",
          "line-width": 1.2,
          "line-opacity": 0.85,
        },
      })
    }

    if (!map.getLayer("field-selected")) {
      map.addLayer({
        id: "field-selected",
        type: "line",
        source: "farm-fields",
        paint: {
          "line-color": "#38bdf8",
          "line-width": 3,
        },
        filter: ["==", ["get", "id"], ""],
      })
    }

    if (!eventsBoundRef.current) {
      map.on("click", "field-extrusions", (event) => {
        const feature = event.features?.[0]
        if (feature?.id && typeof feature.id === "string") {
          onFieldSelectRef.current?.(feature.id)
        }
      })

      map.on("mousemove", "field-extrusions", () => {
        map.getCanvas().style.cursor = "pointer"
      })

      map.on("mouseleave", "field-extrusions", () => {
        map.getCanvas().style.cursor = ""
      })

      eventsBoundRef.current = true
    }
    eventsBoundRef.current = true
  }
  }, [])

// Update active raster layer
useEffect(() => {
  const map = mapRef.current
  if (!map || !mapReadyRef.current) return

  // Remove existing raster layers if any (except base)
  const layers = ["eosda-layer"]
  layers.forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id)
    if (map.getSource(id)) map.removeSource(id)
  })

  if (activeLayer !== "true-color" || EOSDA_API_KEY) {
    // Add new layer
    const url = getLayerUrl(activeLayer)
    map.addSource("eosda-layer", {
      type: "raster",
      tiles: [url],
      tileSize: 256,
      attribution: "EOS Data Analytics"
    })

    map.addLayer({
      id: "eosda-layer",
      type: "raster",
      source: "eosda-layer",
      paint: { "raster-opacity": 0.7 },
      layout: { visibility: "visible" }
    }, "field-outline") // Place below field outlines
  }

}, [activeLayer])

const updateSource = useCallback(
  (map: maplibregl.Map) => {
    const source = map.getSource("farm-fields") as maplibregl.GeoJSONSource | undefined
    if (source) {
      source.setData(featureCollection)
    }
  },
  [featureCollection],
)

const fitMapToFields = useCallback(
  (map: maplibregl.Map) => {
    if (fields.length === 0) return
    const bounds = new maplibregl.LngLatBounds()
    fields.forEach((field) => {
      field.polygon.forEach(([lng, lat]) => bounds.extend([lng, lat]))
    })
    if (bounds.isEmpty()) return
    map.fitBounds(bounds, { padding: 60, duration: 900, maxZoom: 15 })
  },
  [fields],
)

useEffect(() => {
  if (!mapContainerRef.current) return

  const map = new maplibregl.Map({
    container: mapContainerRef.current,
    style: SATELLITE_STYLE,
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM_LEVEL,
    pitch: 55,
    bearing: -20,
    antialias: true,
  })

  mapRef.current = map

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right")
  map.addControl(new maplibregl.FullscreenControl())

  map.on("load", () => {
    mapReadyRef.current = true
    ensureLayers(map)
    updateSource(map)
    if (fields.length > 0) {
      fitMapToFields(map)
      initialFitRef.current = true
    }
  })

  return () => {
    map.remove()
    mapRef.current = null
    mapReadyRef.current = false
    eventsBoundRef.current = false
    initialFitRef.current = false
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])

useEffect(() => {
  const map = mapRef.current
  if (!map || !mapReadyRef.current) return

  ensureLayers(map)
  updateSource(map)

  if (fields.length > 0 && !initialFitRef.current) {
    fitMapToFields(map)
    initialFitRef.current = true
  }

  if (fields.length === 0) {
    initialFitRef.current = false
  }
}, [ensureLayers, updateSource, fitMapToFields, fields])

useEffect(() => {
  const map = mapRef.current
  if (!map || !mapReadyRef.current) return

  if (map.getLayer("field-selected")) {
    map.setFilter("field-selected", ["==", ["get", "id"], selectedFieldId ?? ""])
  }

  if (selectedFieldId) {
    const target = fields.find((field) => field.id === selectedFieldId)
    if (target) {
      map.easeTo({
        center: target.center,
        zoom: 13,
        duration: 900,
        essential: true,
      })
    }
  }
}, [selectedFieldId, fields])

const showNoData = !isLoading && !error && fields.length === 0

return (
  <div className="relative">
    <div
      ref={mapContainerRef}
      className="w-full rounded-3xl border border-white/10"
      style={{ height }}
    />

    {isLoading && (
      <div className="absolute top-3 left-3 rounded-full bg-black/70 px-3 py-1.5 text-xs text-gray-100 border border-white/10">
        جارٍ تحميل خريطة الحقول…
      </div>
    )}

    {!isLoading && error && (
      <div className="absolute top-3 left-3 rounded-full bg-red-900/70 px-3 py-1.5 text-xs text-red-100 border border-red-400/30">
        {error}
      </div>
    )}

    {showNoData && (
      <div className="absolute top-3 left-3 rounded-full bg-black/70 px-3 py-1.5 text-xs text-gray-200 border border-white/10">
        لا توجد حقول مسجلة بعد.
      </div>
    )}

    {/* Layer Switcher */}
    <div className="absolute top-3 right-14 z-10">
      <div className="relative">
        <button
          onClick={() => setShowLayers(!showLayers)}
          className="flex items-center gap-2 bg-black/80 border border-white/20 rounded-lg px-3 py-2 text-white hover:bg-black/90 transition-colors"
        >
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: LAYER_CONFIG[activeLayer].color }} />
          <span className="text-xs font-medium">{LAYER_CONFIG[activeLayer].name[lang === "ar" ? "ar" : "en"]}</span>
        </button>

        {showLayers && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-black/90 border border-white/20 rounded-xl overflow-hidden shadow-xl backdrop-blur-md">
            {Object.entries(LAYER_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => {
                  setActiveLayer(key as MapLayer)
                  setShowLayers(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs transition-colors ${activeLayer === key
                    ? "bg-white/10 text-white font-medium"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                {config.name[lang === "ar" ? "ar" : "en"]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
)
}
