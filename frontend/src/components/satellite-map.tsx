"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, LayersControl, GeoJSON } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { eosdaPublicConfig } from "@/lib/config/eosda"

type SatelliteProvider = "mapbox" | "eosda" | "esri" | "maptiler" | "sentinel"
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
    // For example:
    // click: (e) => {
    //   console.log('Map clicked at', e.latlng);
    // },
  });
  return null;
}

if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  })
}

interface SatelliteMapProps {
  latitude?: number | null
  longitude?: number | null
  lang?: "ar" | "en"
  zoom?: number
  height?: string
  showGeolocate?: boolean
  allowProviderSwitch?: boolean
  onLocationSelect?: (lat: number, lng: number) => void
  overlayTileUrl?: string | null
  boundary?: GeoJSON.Polygon | null
  fieldId?: string | null
  fieldName?: string
  ndviValue?: number | null
  healthStatus?: string
}

export function SatelliteMap({
  latitude,
  longitude,
  lang = "ar",
  zoom = DEFAULT_ZOOM,
  height = "400px",
  showGeolocate = false,
  allowProviderSwitch = false,
  onLocationSelect,
  overlayTileUrl = null,
  boundary,
  fieldName,
}: SatelliteMapProps) {
  const [mapError, setMapError] = useState<string | null>(null)
  const [isMapLoading, setIsMapLoading] = useState(true)
  
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
  const tileUrl = tileSource?.url || ESRI_TILE_URL

  return (
    <div className="w-full space-y-3">
      {isMapLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-gray-400">
            {lang === "ar" ? "جاري تحميل الخريطة..." : "Loading map..."}
          </div>
        </div>
      )}
      
      {mapError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {mapError}
        </div>
      )}
      
      {allowProviderSwitch && (
        <div className="flex flex-wrap gap-2">
          {PROVIDER_PRIORITY.map((provider) => (
            <button
              key={provider}
              onClick={() => {
                if (!TileSources[provider].url) return
                setSatelliteProvider(provider)
                setMapError(null)
              }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${provider === satelliteProvider ? "border-emerald-400 text-emerald-300" : "border-white/30 text-white/70"
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
      {showGeolocate && (
        <button
          type="button"
          onClick={triggerGeolocation}
          className="rounded-full border border-emerald-400/60 px-4 py-1 text-xs text-emerald-200 transition hover:bg-emerald-500/20"
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
      {geoError && <p className="text-xs text-amber-300">{geoError}</p>}

      <div className="rounded-2xl border border-white/10 shadow-lg" style={{ height }}>
        {!mapError && (
          <MapContainer
            center={mapCenter}
            zoom={zoom}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            style={{ height: '420px', width: '100%' }}
            whenReady={() => {
              setIsMapLoading(false)
              console.log("[SatelliteMap] Map loaded successfully")
            }}
          >
            <RecenterOnChange center={mapCenter} />
            <TileLayer 
              url={tileUrl} 
              attribution={tileSource?.attribution}
              eventHandlers={{
                load: () => setIsMapLoading(false),
                error: (error) => {
                  console.error("[SatelliteMap] Tile layer error:", error)
                  setMapError(lang === "ar" ? "فشل تحميل الخريطة" : "Failed to load map")
                  setIsMapLoading(false)
                }
              }}
            />
            {overlayTileUrl && (
              <TileLayer url={overlayTileUrl} opacity={0.75} zIndex={3} />
            )}
            <Marker position={mapCenter}>
              <Popup>
                <div className="text-xs">{lang === "ar" ? "الموقع الحالي" : "Current location"}</div>
              </Popup>
            </Marker>
            {boundary && (
              <GeoJSON
                data={boundary}
                style={{
                  color: "#10b981", // emerald-500
                  weight: 2,
                  fillColor: "#10b981",
                  fillOpacity: 0.2,
                }}
              />
            )}
            <MapEvents />
          </MapContainer>
        )}
      </div>
    </div>
  )
}
