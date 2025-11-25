"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import dynamic from "next/dynamic"

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false })
const useMap = dynamic(() => import("react-leaflet").then(mod => mod.useMap), { ssr: false })
const useMapEvents = dynamic(() => import("react-leaflet").then(mod => mod.useMapEvents), { ssr: false })
const LayersControl = dynamic(() => import("react-leaflet").then(mod => mod.LayersControl), { ssr: false })
const GeoJSON = dynamic(() => import("react-leaflet").then(mod => mod.GeoJSON), { ssr: false })
const L = dynamic(() => import("leaflet"), { ssr: false })
const leafletCss = dynamic(() => import("leaflet/dist/leaflet.css"), { ssr: false })
import { eosdaPublicConfig } from "@/lib/config/eosda"

type SatelliteProvider = "mapbox" | "eosda" | "esri" | "maptiler" | "sentinel"
type MapLayer = "true-color" | "ndvi" | "ndmi" | "evi" | "chlorophyll" | "soil-moisture"

// Prefer ESRI first to avoid CORS issues, then Mapbox, then EOSDA; Sentinel يأتي أخيراً لتفادي البلاطات المكسورة
const PROVIDER_PRIORITY: SatelliteProvider[] = ["esri", "mapbox", "eosda", "maptiler", "sentinel"]

// Tile URLs
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? ""
const MAPBOX_STYLE = process.env.NEXT_PUBLIC_MAPBOX_STYLE?.trim() || "satellite-v9"
const MAPBOX_TILE_URL = MAPBOX_TOKEN
  ? `https://api.mapbox.com/styles/v1/mapbox/${MAPBOX_STYLE}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`
  : ""
const SENTINEL_TILE_URL = process.env.NEXT_PUBLIC_SENTINEL_TILE_URL?.trim() || ""
const EOSDA_TILE_URL = process.env.NEXT_PUBLIC_EOSDA_TILE_URL?.trim() || ""
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim() ?? ""
const MAPTILER_TILE_URL =
  process.env.NEXT_PUBLIC_MAPTILER_TILE_URL?.trim() ||
  (MAPTILER_KEY ? `https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}` : "")
const ESRI_TILE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
const ESRI_ATTRIBUTION = "Imagery &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"

// EOSDA Tile URLs for different indices with authentication
const EOSDA_INDEX_TILES = {
  "true-color": "https://api-connect.eos.com/api/lms/tiles/v1/sentinel2l2a/{z}/{x}/{y}",
  "ndvi": "https://api-connect.eos.com/api/lms/tiles/v1/ndvi/{z}/{x}/{y}",
  "ndmi": "https://api-connect.eos.com/api/lms/tiles/v1/ndmi/{z}/{x}/{y}",
  "evi": "https://api-connect.eos.com/api/lms/tiles/v1/evi/{z}/{x}/{y}",
  "chlorophyll": "https://api-connect.eos.com/api/lms/tiles/v1/chlorophyll/{z}/{x}/{y}",
  "soil-moisture": "https://api-connect.eos.com/api/lms/tiles/v1/soil_moisture/{z}/{x}/{y}"
}

// Get EOSDA API key from environment
const EOSDA_API_KEY = process.env.NEXT_PUBLIC_EOSDA_API_KEY?.trim() || ""

// Enhanced EOSDA tile URLs with authentication
const getEOSDATileUrl = (layer: MapLayer) => {
  const baseUrl = EOSDA_INDEX_TILES[layer]
  return EOSDA_API_KEY ? `${baseUrl}?apikey=${EOSDA_API_KEY}` : baseUrl
}

if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  })
}

const DEFAULT_CENTER: [number, number] = [eosdaPublicConfig.center.lat, eosdaPublicConfig.center.lng]
const DEFAULT_ZOOM = eosdaPublicConfig.zoom.default || 3
const MIN_ZOOM = eosdaPublicConfig.zoom.min || 1
const MAX_ZOOM = eosdaPublicConfig.zoom.max || 18

const TileSources: Record<SatelliteProvider, { url?: string; attribution: string }> = {
  mapbox: {
    url: MAPBOX_TILE_URL,
    attribution: "&copy; Mapbox",
  },
  sentinel: {
    url: SENTINEL_TILE_URL,
    attribution: "Imagery &copy; Sentinel Hub",
  },
  maptiler: {
    url: MAPTILER_TILE_URL,
    attribution: "Imagery &copy; MapTiler",
  },
  eosda: {
    url: EOSDA_TILE_URL,
    attribution: "Imagery &copy; Adham AgriTech",
  },
  esri: {
    url: ESRI_TILE_URL,
    attribution: ESRI_ATTRIBUTION,
  },
}

function RecenterOnChange({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center)
  }, [center, map])
  return null
}

function MapEvents() {
  useMapEvents({
    // Add any map event handlers here if needed
  });
  return null;
}

// Initialize Leaflet icons only on client side
if (typeof window !== 'undefined') {
  L.then((leaflet: any) => {
    delete leaflet.Icon.Default.prototype._getIconUrl
    leaflet.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    })
  })
}

interface AdvancedSatelliteMapProps {
  latitude?: number | null
  longitude?: number | null
  lang?: "ar" | "en"
  zoom?: number
  height?: string
  showGeolocate?: boolean
  allowProviderSwitch?: boolean
  allowLayerSwitch?: boolean
  onLocationSelect?: (lat: number, lng: number) => void
  overlayTileUrl?: string | null
  boundary?: GeoJSON.Polygon | null
  fieldId?: string | null
  fieldName?: string
  ndviValue?: number | null
  healthStatus?: string
}

// Layer configuration with Adham AgriTech theme colors
const LAYER_CONFIG: Record<MapLayer, { name: { ar: string; en: string }; color: string; description: { ar: string; en: string } }> = {
  "true-color": {
    name: { ar: "صور حقيقية", en: "True Color" },
    color: "#10b981", // Vivid Green
    description: { ar: "صور أقمار صناعية ملونة طبيعية", en: "Natural color satellite imagery" }
  },
  "ndvi": {
    name: { ar: "مؤشر NDVI", en: "NDVI Index" },
    color: "#10b981", // Vivid Green
    description: { ar: "صحة الغطاء النباتي", en: "Vegetation health index" }
  },
  "ndmi": {
    name: { ar: "مؤشر NDMI", en: "NDMI Index" },
    color: "#10b981", // Vivid Green
    description: { ar: "إجهاد المياه", en: "Moisture stress index" }
  },
  "evi": {
    name: { ar: "مؤشر EVI", en: "EVI Index" },
    color: "#10b981", // Vivid Green
    description: { ar: "مؤشر محسن للغطاء النباتي", en: "Enhanced vegetation index" }
  },
  "chlorophyll": {
    name: { ar: "الكلوروفيل", en: "Chlorophyll" },
    color: "#10b981", // Vivid Green
    description: { ar: "محتوى الكلوروفيل", en: "Chlorophyll content" }
  },
  "soil-moisture": {
    name: { ar: "رطوبة التربة", en: "Soil Moisture" },
    color: "#10b981", // Vivid Green
    description: { ar: "رطوبة التربة السطحية", en: "Surface soil moisture" }
  }
}

export function AdvancedSatelliteMap({
  latitude,
  longitude,
  lang = "ar",
  zoom = DEFAULT_ZOOM,
  height = "400px",
  showGeolocate = false,
  allowProviderSwitch = false,
  allowLayerSwitch = true,
  onLocationSelect,
  overlayTileUrl = null,
  boundary,
  fieldName,
}: AdvancedSatelliteMapProps) {
  const initialCenter = useMemo(() => {
    if (typeof latitude === "number" && typeof longitude === "number") {
      return [latitude, longitude] as [number, number]
    }
    return DEFAULT_CENTER
  }, [latitude, longitude])

  const [mapCenter, setMapCenter] = useState<[number, number]>(initialCenter)
  const initialProvider: SatelliteProvider = MAPBOX_TILE_URL
    ? "mapbox"
    : (EOSDA_TILE_URL
      ? "eosda"
      : (ESRI_TILE_URL
        ? "esri"
        : (MAPTILER_TILE_URL
          ? "maptiler"
          : "sentinel")))
  const [satelliteProvider, setSatelliteProvider] = useState<SatelliteProvider>(initialProvider)
  const [activeLayer, setActiveLayer] = useState<MapLayer>("true-color")
  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "error">("idle")
  const [geoError, setGeoError] = useState<string | null>(null)

  useEffect(() => {
    // Ensure we are on the highest-priority available provider (Mapbox first)
    for (const provider of PROVIDER_PRIORITY) {
      if (TileSources[provider].url) {
        setSatelliteProvider(provider)
        break
      }
    }
  }, [])

  useEffect(() => {
    if (typeof latitude === "number" && typeof longitude === "number") {
      setMapCenter([latitude, longitude])
    }
  }, [latitude, longitude])

  const triggerGeolocation = useCallback(() => {
    if (geoStatus === "locating") return
    if (!navigator.geolocation) {
      setGeoStatus("error")
      setGeoError(lang === "ar" ? "المتصفح لا يدعم تحديد الموقع." : "Geolocation not supported.")
      return
    }
    setGeoStatus("locating")
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setMapCenter([lat, lng])
        onLocationSelect?.(lat, lng)
        setGeoStatus("idle")
      },
      () => {
        setGeoStatus("error")
        setGeoError(lang === "ar" ? "تعذر الوصول إلى موقعك. حاول مرة أخرى." : "Unable to access your location.")
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    )
  }, [lang, onLocationSelect, geoStatus])

  const tileSource = TileSources[satelliteProvider]
  const baseTileUrl = tileSource?.url || ESRI_TILE_URL

  // Get the appropriate tile URL based on the active layer
  const getLayerTileUrl = useCallback((layer: MapLayer) => {
    if (satelliteProvider === "eosda" && EOSDA_INDEX_TILES[layer]) {
      return getEOSDATileUrl(layer)
    }
    return baseTileUrl
  }, [satelliteProvider, baseTileUrl])

  return (
    <div className="w-full space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Provider Switch */}
        {allowProviderSwitch && (
          <div className="flex flex-wrap gap-2">
            {PROVIDER_PRIORITY.map((provider) => (
              <button
                key={provider}
                onClick={() => {
                  if (!TileSources[provider].url) return
                  setSatelliteProvider(provider)
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  provider === satelliteProvider 
                    ? "border-emerald-400 text-emerald-300 bg-emerald-400/10" 
                    : "border-white/30 text-white/70 bg-black/20"
                }`}
                aria-pressed={provider === satelliteProvider}
              >
                {provider === "mapbox"
                  ? lang === "ar"
                    ? "طبقة عالية الدقة"
                    : "High‑resolution layer"
                  : provider === "sentinel"
                    ? lang === "ar"
                      ? "صور أقمار صناعية دورية"
                      : "Frequent satellite imagery"
                    : provider === "maptiler"
                      ? lang === "ar"
                        ? "صور فضائية بديلة"
                        : "Alternate satellite tiles"
                      : provider === "eosda"
                        ? lang === "ar"
                          ? "مصدر تحليلات القمر الصناعي"
                          : "Satellite analytics source"
                        : lang === "ar"
                          ? "طبقة عالمية افتراضية"
                          : "Global imagery layer"}
              </button>
            ))}
          </div>
        )}

        {/* Layer Switch */}
        {allowLayerSwitch && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(LAYER_CONFIG).map(([layer, config]) => (
              <button
                key={layer}
                onClick={() => setActiveLayer(layer as MapLayer)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  activeLayer === layer
                    ? "border-emerald-400 text-emerald-300 bg-emerald-400/10"
                    : "border-white/30 text-white/70 bg-black/20"
                }`}
                aria-pressed={activeLayer === layer}
              >
                {config.name[lang]}
              </button>
            ))}
          </div>
        )}

        {/* Geolocation */}
        {showGeolocate && (
          <button
            type="button"
            onClick={triggerGeolocation}
            className="rounded-full border border-emerald-400/60 px-4 py-1 text-xs text-emerald-200 transition hover:bg-emerald-500/20 bg-black/20"
            disabled={geoStatus === "locating"}
          >
            {geoStatus === "locating"
              ? lang === "ar"
                ? "جارٍ تحديد الموقع..."
                : "Locating..."
              : lang === "ar"
                ? "استخدم موقعي"
                : "Use my location"}
          </button>
        )}
      </div>

      {/* Layer Description */}
      <div className="bg-black/40 border border-emerald-400/30 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: LAYER_CONFIG[activeLayer].color }}
          />
          <span className="text-emerald-300 text-sm font-medium">
            {LAYER_CONFIG[activeLayer].name[lang]}
          </span>
        </div>
        <p className="text-white/70 text-xs mt-1">
          {LAYER_CONFIG[activeLayer].description[lang]}
        </p>
      </div>

      {/* Error Display */}
      {geoError && (
        <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3">
          <p className="text-red-300 text-xs">{geoError}</p>
        </div>
      )}

      {/* Map Container */}
      <div className="rounded-2xl border border-white/10 shadow-lg overflow-hidden" style={{ height }}>
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          style={{ height: '100%', width: '100%' }}
        >
          <RecenterOnChange center={mapCenter} />
          
          {/* Base Layer */}
          <TileLayer 
            key={`base-${activeLayer}-${provider}`}
            url={getLayerTileUrl(activeLayer)} 
            attribution={tileSource?.attribution} 
          />
          
          {/* Overlay Layer */}
          {overlayTileUrl && (
            <TileLayer 
              key={`overlay-${activeLayer}-${provider}`}
              url={overlayTileUrl} 
              opacity={0.75} 
              zIndex={3} 
            />
          )}
          
          {/* Marker */}
          <Marker position={mapCenter}>
            <Popup>
              <div className="text-xs bg-black/80 text-white p-2 rounded">
                <div className="font-medium text-emerald-300">
                  {fieldName || (lang === "ar" ? "الموقع الحالي" : "Current location")}
                </div>
                <div className="text-white/70 text-xs mt-1">
                  {lang === "ar" ? "طبقة:" : "Layer"} {LAYER_CONFIG[activeLayer].name[lang]}
                </div>
              </div>
            </Popup>
          </Marker>
          
          {/* Boundary */}
          {boundary && (
            <GeoJSON
              data={boundary}
              style={{
                color: "#10b981", // Vivid Green
                weight: 2,
                fillColor: "#10b981",
                fillOpacity: 0.2,
              }}
            />
          )}
          
          <MapEvents />
        </MapContainer>
      </div>
    </div>
  )
}
