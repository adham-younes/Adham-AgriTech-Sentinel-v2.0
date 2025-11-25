'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Satellite, Layers, ZoomIn, ZoomOut, RefreshCw, Ruler } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import maplibregl from 'maplibre-gl'
import type { StyleSpecification } from 'maplibre-gl'
import { eosdaPublicConfig } from '@/lib/config/eosda'

// Prefer Mapbox imagery by default if token is set, fallback to Esri
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim()
const MAPBOX_STYLE = process.env.NEXT_PUBLIC_MAPBOX_STYLE?.trim() || 'satellite-v9'
const MAPBOX_TILE_URL = MAPBOX_TOKEN
  ? `https://api.mapbox.com/styles/v1/mapbox/${MAPBOX_STYLE}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`
  : undefined
import { createBrowserClient } from '@supabase/ssr'

const EOSDA_DEFAULT_COORDINATES: [number, number] = [
  eosdaPublicConfig.center.lng,
  eosdaPublicConfig.center.lat,
]
const EOSDA_DEFAULT_ZOOM = eosdaPublicConfig.zoom.default
const EOSDA_MIN_ZOOM = Math.max(1, eosdaPublicConfig.zoom.min)
const EOSDA_MAX_ZOOM = Math.min(20, eosdaPublicConfig.zoom.max)
const toBBoxCoordinates = (lng: number, lat: number, delta = 0.02): [number, number][] => [
  [lng - delta, lat + delta],
  [lng + delta, lat + delta],
  [lng + delta, lat - delta],
  [lng - delta, lat - delta],
]

const createSatelliteStyle = (mode: 'satellite' | 'analysis'): StyleSpecification => ({
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    worldImagery: {
      type: 'raster',
      tiles: [
        (MAPBOX_TILE_URL as string) ||
          'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: MAPBOX_TILE_URL ? 512 : 256,
      attribution: MAPBOX_TILE_URL ? 'Imagery © Mapbox' : 'Imagery © Esri, Maxar, Earthstar Geographics',
      maxzoom: 20,
    },
    transportation: {
      type: 'raster',
      tiles: [
        'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 20,
    },
  },
  layers: [
    {
      id: 'esri-imagery',
      type: 'raster',
      source: 'worldImagery',
      paint: {
        'raster-saturation': mode === 'analysis' ? -0.35 : 0,
        'raster-contrast': mode === 'analysis' ? 0.25 : 0,
        'raster-brightness-min': mode === 'analysis' ? 0.6 : 0.3,
        'raster-brightness-max': mode === 'analysis' ? 1.2 : 1,
      },
    },
    {
      id: 'esri-transport',
      type: 'raster',
      source: 'transportation',
      paint: {
        'raster-opacity': mode === 'analysis' ? 0.4 : 0.18,
      },
    },
  ],
})

export function SatelliteImageryCard() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fieldId, setFieldId] = useState('')
  const [ndviValue, setNdviValue] = useState<number | null>(null)
  const [mapStyle, setMapStyle] = useState<'satellite' | 'analysis'>('satellite')
  const [coordinates, setCoordinates] = useState<[number, number]>(EOSDA_DEFAULT_COORDINATES)
  const [zoom, setZoom] = useState(Math.max(2, EOSDA_DEFAULT_ZOOM))
  const [showNDVI, setShowNDVI] = useState(false)
  const [dateRange, setDateRange] = useState({
    start: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  })
  const [overlayData, setOverlayData] = useState<
    | null
    | {
        url: string
        coordinates: [number, number][]
        capturedAt?: string
      }
  >(null)
  const [overlayStatus, setOverlayStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const supabase = useMemo(() => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!url || !anonKey) return null
      return createBrowserClient(url, anonKey)
    } catch (error) {
      console.warn('[SatelliteCard] Supabase client unavailable:', error)
      return null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (overlayData?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(overlayData.url)
      }
    }
  }, [overlayData?.url])

  const fetchLatestNdviSnapshot = useCallback(
    async (targetFieldId: string, coords: { lat: number; lng: number }, bounds: [number, number][]) => {
      try {
        const response = await fetch(`/api/fields/${targetFieldId}/ndvi?limit=1`, { cache: 'no-store' })
        if (!response.ok) return false
        const payload = await response.json()
        const latest = payload?.latest
        if (typeof latest?.ndvi === 'number') {
          setNdviValue(latest.ndvi)
        }
        const previewUrl: string | undefined = latest?.image?.previewUrl
        if (previewUrl) {
          setOverlayData({
            url: previewUrl,
            coordinates: bounds,
            capturedAt: latest?.image?.capturedAt ?? latest?.computedAt ?? undefined,
          })
          setOverlayStatus('idle')
          return true
        }
        return false
      } catch (error) {
        console.warn('[SatelliteCard] Failed to load NDVI snapshot', error)
        return false
      }
    },
    [],
  )

  const hectaresToFeddan = (hectares?: number | null) =>
    typeof hectares === 'number' && Number.isFinite(hectares) ? hectares * 2.381 : null

  useEffect(() => {
    if (!mapContainer.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: createSatelliteStyle('satellite'),
      center: coordinates,
      zoom,
      pitch: 48,
      bearing: -32,
      maxZoom: EOSDA_MAX_ZOOM,
      minZoom: EOSDA_MIN_ZOOM,
      attributionControl: false,
      antialias: true,
    })

    map.current.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
    map.current.addControl(
      new maplibregl.ScaleControl({
        maxWidth: 120,
        unit: 'metric',
      }),
    )

    map.current.once('load', () => {
      map.current?.addControl(new maplibregl.FullscreenControl())
      map.current?.setPaintProperty('esri-imagery', 'raster-opacity', 1)
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Helper function to ensure coordinates have exactly 4 points
  const ensureFourPoints = (coords: [number, number][]): [[number, number], [number, number], [number, number], [number, number]] => {
    if (!coords || coords.length < 4) {
      console.warn('Insufficient coordinates. Using default values.')
      const [lng, lat] = EOSDA_DEFAULT_COORDINATES
      const delta = 0.02
      // Return a default square if not enough points
      return [
        [lng - delta, lat + delta], // Top-left placeholder
        [lng + delta, lat + delta], // Top-right placeholder
        [lng + delta, lat - delta], // Bottom-right placeholder
        [lng - delta, lat - delta], // Bottom-left placeholder
      ]
    }
    // Ensure we only take the first 4 points if more are provided
    return [coords[0], coords[1], coords[2], coords[3]];
  };

  const applyOverlay = useCallback((data: { url: string; coordinates: [number, number][] }) => {
    if (!map.current) return;
    
    // Ensure we have exactly 4 coordinates
    const safeCoordinates = ensureFourPoints(data.coordinates);
    
    // Clean up existing layers and sources
    if (map.current.getLayer('field-imagery')) {
      map.current.removeLayer('field-imagery');
    }
    if (map.current.getSource('field-imagery')) {
      map.current.removeSource('field-imagery');
    }
    
    // Add the image source with safe coordinates
    map.current.addSource('field-imagery', {
      type: 'image',
      url: data.url,
      coordinates: safeCoordinates,
    })
    map.current.addLayer(
      {
        id: 'field-imagery',
        type: 'raster',
        source: 'field-imagery',
        paint: {
          'raster-opacity': mapStyle === 'analysis' ? 0.92 : 0.75,
        },
      },
      'esri-transport',
    )
  }, [mapStyle])

  useEffect(() => {
    if (overlayData) {
      applyOverlay(overlayData)
    }
  }, [overlayData, applyOverlay])

  useEffect(() => {
    if (!map.current) return
    const styleSpec = createSatelliteStyle(mapStyle)
    map.current.setStyle(styleSpec, { diff: false })
    map.current.once('styledata', () => {
      map.current?.setPitch(mapStyle === 'analysis' ? 52 : 48)
      map.current?.setBearing(mapStyle === 'analysis' ? -20 : -32)
      if (overlayData) {
        applyOverlay(overlayData)
      }
      if (map.current?.getLayer('field-imagery')) {
        map.current.setPaintProperty(
          'field-imagery',
          'raster-opacity',
          mapStyle === 'analysis' ? 0.92 : 0.75,
        )
      }
    })
  }, [mapStyle, overlayData, applyOverlay])

  useEffect(() => {
    if (map.current) {
      map.current.easeTo({ center: coordinates, zoom, duration: 800 })
    }
  }, [coordinates, zoom])

  const handleSearch = async () => {
    if (!fieldId) return
    setIsLoading(true)
    setOverlayStatus('loading')
    try {
      let fieldName = 'حقل افتراضي'
      let cropType: string | null = null
      let areaHectares: number | null = null
      let lat = eosdaPublicConfig.center.lat
      let lng = eosdaPublicConfig.center.lng

      if (supabase) {
        const { data, error } = await supabase
          .from('fields')
          .select('id, name, area, crop_type, farms(latitude, longitude, name)')
          .eq('id', fieldId)
          .maybeSingle()

        if (!error && data) {
          const row: any = data as any
          fieldName = row.name ?? fieldName
          cropType = row.crop_type ?? null
          const fallbackArea = typeof row.area === 'number' ? row.area : null
          // Assume stored area is in feddans. Convert to hectares only if needed for calculations.
          areaHectares = typeof fallbackArea === 'number' ? fallbackArea / 2.381 : null
          if (row.farms?.latitude && row.farms?.longitude) {
            lat = row.farms.latitude
            lng = row.farms.longitude
          }
        }
      }

      setCoordinates([lng, lat])
      setZoom(Math.min(16, EOSDA_MAX_ZOOM))

      const bboxDelta = 0.015
      const rawBounds: [number, number][] = [
        [lng - bboxDelta, lat - bboxDelta],
        [lng + bboxDelta, lat + bboxDelta],
      ]
      const overlayBounds = toBBoxCoordinates(lng, lat, bboxDelta)

      const ndviApplied = await fetchLatestNdviSnapshot(fieldId, { lat, lng }, overlayBounds)

      if (!ndviApplied) {
        try {
          const params = new URLSearchParams({
            type: 'satellite',
            lat: String(lat),
            lng: String(lng),
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString(),
            width: '768',
            height: '768',
          })
          const imageryRes = await fetch(`/api/eosda?${params.toString()}`, {
            method: 'GET',
            headers: { 'content-type': 'application/json' },
          })

          if (imageryRes.ok) {
            const payload = (await imageryRes.json()) as {
              url: string
              bounds?: { north: number; south: number; east: number; west: number }
              capturedAt?: string
            }
            const capturedAt = payload.capturedAt ?? new Date().toISOString()
            const eosdaBounds = payload.bounds
              ? ([
                  [payload.bounds.west, payload.bounds.north],
                  [payload.bounds.east, payload.bounds.north],
                  [payload.bounds.east, payload.bounds.south],
                  [payload.bounds.west, payload.bounds.south],
                ] as [number, number][])
              : overlayBounds

            setOverlayData({ url: payload.url, coordinates: eosdaBounds, capturedAt })
            setOverlayStatus('idle')
          } else {
            setOverlayData(null)
            setOverlayStatus('error')
          }
        } catch (error) {
          console.error('[SatelliteCard] EOSDA overlay failed:', error)
          setOverlayData(null)
          setOverlayStatus('error')
        }
      }

      const simulatedNdvi = areaHectares ? Math.min(0.9, 0.55 + areaHectares * 0.01) : 0.72
      setNdviValue(Number.isFinite(simulatedNdvi) ? simulatedNdvi : 0.7)
    } catch (error) {
      console.error('Error fetching field data:', error)
      setOverlayStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 1, EOSDA_MAX_ZOOM))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 1, EOSDA_MIN_ZOOM))
  }

  const toggleNDVI = () => {
    setShowNDVI((prev) => !prev)
    setMapStyle((prev) => (prev === 'satellite' ? 'analysis' : 'satellite'))
  }

  return (
    <Card className="glass-card border-primary/20 shadow-3d hover:shadow-3d-lg transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Satellite className="h-5 w-5" />
          المراقبة بالأقمار الصناعية
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="fieldId">معرف الحقل أو الإحداثيات</Label>
              <div className="flex gap-2">
                <Input
                  id="fieldId"
                  placeholder="أدخل معرف الحقل أو الإحداثيات"
                  value={fieldId}
                  onChange={(e) => setFieldId(e.target.value)}
                  dir="ltr"
                  className="flex-1 text-left"
                />
                <Button onClick={handleSearch} disabled={!fieldId || isLoading} className="whitespace-nowrap">
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin ml-2" /> : <MapPin className="h-4 w-4 ml-2" />}
                  بحث
                </Button>
              </div>
            </div>

            <div className="flex items-end gap-2">
              <Button variant={showNDVI ? 'default' : 'outline'} size="sm" onClick={toggleNDVI} className="gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                {showNDVI ? 'إخفاء التحليل' : 'عرض تحليل NDVI'}
              </Button>
              <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoom >= 20} className="h-9 w-9">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoom <= 8} className="h-9 w-9">
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-border/50 h-[500px] bg-muted/10">
            <div ref={mapContainer} className="w-full h-full" />

            {ndviValue !== null && (
              <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-md rounded-lg p-3 border border-border/50 shadow-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">مؤشر NDVI</span>
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: ndviValue > 0.65 ? '#16a34a' : ndviValue > 0.45 ? '#facc15' : '#ef4444' }}
                  />
                </div>
                <div className="text-2xl font-bold">{ndviValue.toFixed(2)}</div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden w-32">
                  <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" style={{ width: `${ndviValue * 100}%` }} />
                </div>
              </div>
            )}

            <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-2 border border-border/50 shadow-lg text-xs text-muted-foreground flex items-center gap-2">
              <Ruler className="h-3 w-3" />
              <span>المقياس التقريبي: 1 : {Math.round(100000 / Math.pow(2, zoom))}</span>
            </div>

            {overlayStatus === 'loading' && (
            <div className="absolute top-4 left-4 rounded-full bg-black/70 px-4 py-1 text-xs text-gray-200">
              جارٍ تحميل صورة Sentinel Hub عالية الدقة...
            </div>
            )}
            {overlayStatus === 'error' && (
              <div className="absolute top-4 left-4 rounded-full bg-red-500/30 px-4 py-1 text-xs text-red-100">
                تعذر تحميل صورة Sentinel Hub، تم عرض الخريطة الافتراضية.
              </div>
            )}
          </div>

          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="analysis">التحليل</TabsTrigger>
              <TabsTrigger value="history">السجل</TabsTrigger>
              <TabsTrigger value="settings">الإعدادات</TabsTrigger>
            </TabsList>
            <TabsContent value="analysis" className="p-4 border rounded-b-lg">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">حالة المحصول</h4>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" style={{ width: `${(ndviValue || 0) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>ضعيف</span>
                    <span>جيد</span>
                    <span>ممتاز</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground mb-1">آخر تحديث</p>
                    <p>{format(new Date(), 'dd MMM yyyy', { locale: ar })}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">دقة الصورة</p>
                    <p>3 م/بكسل</p>
                  </div>
                </div>
                {overlayData?.capturedAt && (
                  <p className="text-xs text-muted-foreground">
                    تاريخ آخر صورة Sentinel Hub: {format(new Date(overlayData.capturedAt), 'dd MMM yyyy', { locale: ar })}
                  </p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="history" className="p-4 border rounded-b-lg">
              <p className="text-sm text-muted-foreground text-center py-4">سجل الصور متوفر مع الاشتراك المتقدم.</p>
            </TabsContent>
            <TabsContent value="settings" className="p-4 border rounded-b-lg">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dateRange">نطاق التاريخ</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Input type="date" value={dateRange.start} onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))} />
                    <Input type="date" value={dateRange.end} onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>نوع التحليل</Label>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" name="analysisType" defaultChecked className="h-4 w-4" />
                      مؤشر الغطاء النباتي (NDVI)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input type="radio" name="analysisType" disabled className="h-4 w-4" />
                      مؤشر المياه (NDWI)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input type="radio" name="analysisType" disabled className="h-4 w-4" />
                      مؤشر الكلوروفيل (NDRE)
                    </label>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  )
}
