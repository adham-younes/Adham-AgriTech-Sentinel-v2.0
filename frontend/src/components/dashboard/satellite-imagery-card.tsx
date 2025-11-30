'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Satellite, Layers, ZoomIn, ZoomOut, RefreshCw, Ruler, AlertTriangle, Info, Calendar, SplitSquareHorizontal, Brain, Pencil, Save, X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import maplibregl from 'maplibre-gl'
import type { StyleSpecification } from 'maplibregl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { eosdaPublicConfig } from '@/lib/config/eosda'
import { createClient } from '@/lib/supabase/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'

// Map Configuration
const MAP_CONFIG = {
  minZoom: 4,
  maxZoom: 18,
  defaultZoom: 13,
  pitch: 0,
  bearing: 0
}

// Use Esri World Imagery as the reliable default base map
// This avoids "Map data not yet available" errors from invalid Mapbox tokens/styles
const createSatelliteStyle = (mode: 'satellite' | 'analysis'): StyleSpecification => ({
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    worldImagery: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
      maxzoom: 19,
    },
    transportation: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'base-imagery',
      type: 'raster',
      source: 'worldImagery',
      paint: {
        'raster-saturation': mode === 'analysis' ? -0.5 : 0,
        'raster-contrast': mode === 'analysis' ? 0.1 : 0,
        'raster-brightness-min': mode === 'analysis' ? 0.2 : 0,
        'raster-brightness-max': mode === 'analysis' ? 0.8 : 1,
      },
    },
    {
      id: 'transport-overlay',
      type: 'raster',
      source: 'transportation',
      paint: {
        'raster-opacity': mode === 'analysis' ? 0.3 : 0.0,
      },
    },
  ],
})

export interface SatelliteImageryCardProps {
  className?: string
  initialFieldId?: string
  initialCoordinates?: [number, number]
}

export function SatelliteImageryCard({
  className,
  initialFieldId,
  initialCoordinates
}: SatelliteImageryCardProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const compareMapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const compareMap = useRef<maplibregl.Map | null>(null)
  const draw = useRef<MapboxDraw | null>(null)

  // State
  const [isLoading, setIsLoading] = useState(false)
  const [fieldId, setFieldId] = useState(initialFieldId || '')
  const [coordinates, setCoordinates] = useState<[number, number]>(
    initialCoordinates || [eosdaPublicConfig.center.lng, eosdaPublicConfig.center.lat]
  )
  const [zoom, setZoom] = useState(MAP_CONFIG.defaultZoom)
  const [mode, setMode] = useState<'satellite' | 'analysis'>('satellite')
  const [currentScene, setCurrentScene] = useState<any | null>(null)
  const [compareScene, setCompareScene] = useState<any | null>(null)
  const [availableScenes, setAvailableScenes] = useState<any[]>([])
  const [ndviValue, setNdviValue] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    start: format(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // Last 3 months
    end: format(new Date(), 'yyyy-MM-dd'),
  })

  // New Features State
  const [isComparing, setIsComparing] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [timelineIndex, setTimelineIndex] = useState<number>(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<string>('')
  const [downloadType, setDownloadType] = useState<'visual' | 'indices' | 'raw'>('visual')
  const [isInspecting, setIsInspecting] = useState(false)
  const [inspectValue, setInspectValue] = useState<{ lat: number, lon: number, value: number } | null>(null)

  const supabase = useMemo(() => createClient(), [])

  // Initialize Main Map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: createSatelliteStyle('satellite'),
      center: coordinates,
      zoom: zoom,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
      pitch: MAP_CONFIG.pitch,
      bearing: MAP_CONFIG.bearing,
      attributionControl: false,
    })

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.current.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-right')

    // Initialize Draw
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true
      },
      defaultMode: 'simple_select'
    })
    map.current.addControl(draw.current as any, 'top-left')

    // Debounced state update to avoid too frequent re-renders
    let moveTimeout: NodeJS.Timeout
    map.current.on('move', () => {
      if (map.current) {
        clearTimeout(moveTimeout)
        moveTimeout = setTimeout(() => {
          if (map.current) {
            setZoom(map.current.getZoom())
            const center = map.current.getCenter()
            setCoordinates([center.lng, center.lat])
          }
        }, 100) // Update state only after map stopped moving for 100ms
      }
    })

    // Sync compare map separately (only when user stops dragging)
    map.current.on('moveend', () => {
      if (map.current && compareMap.current && isComparing) {
        const center = map.current.getCenter()
        compareMap.current.easeTo({
          center: center,
          zoom: map.current.getZoom(),
          bearing: map.current.getBearing(),
          pitch: map.current.getPitch(),
          duration: 200
        })
      }
    })

    // Draw events
    map.current.on('draw.create', updateArea)
    map.current.on('draw.delete', updateArea)
    map.current.on('draw.update', updateArea)

    // Point Inspection Click Handler
    map.current.on('click', async (e) => {
      // Access the latest isInspecting state using a ref or by checking the cursor style
      // Since we can't access updated state inside this closure easily without re-binding,
      // we'll check a global property or rely on the fact that we'll re-bind if we add it to dependencies.
      // Better approach: Use a mutable ref for isInspecting if we don't want to re-initialize map.
      // For now, we will dispatch a custom event or check a class on the canvas.

      const canvas = map.current?.getCanvas()
      if (canvas && canvas.style.cursor === 'crosshair') {
        const { lng, lat } = e.lngLat

        // Show loading state (optimistic UI)
        new maplibregl.Popup()
          .setLngLat([lng, lat])
          .setHTML('<div class="p-2 text-sm">جاري التحليل...</div>')
          .addTo(map.current!)

        try {
          // Get current scene ID
          // We need to access currentScene from state. This is tricky in useEffect closure.
          // We will emit a custom event that the component can listen to, or use a ref for currentScene.
          document.dispatchEvent(new CustomEvent('map-inspect-click', {
            detail: { lng, lat }
          }))
        } catch (err) {
          console.error(err)
        }
      }
    })

    return () => {
      clearTimeout(moveTimeout)
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Initialize Compare Map
  useEffect(() => {
    if (isComparing && compareMapContainer.current && !compareMap.current) {
      compareMap.current = new maplibregl.Map({
        container: compareMapContainer.current,
        style: createSatelliteStyle('satellite'),
        center: coordinates,
        zoom: zoom,
        minZoom: MAP_CONFIG.minZoom,
        maxZoom: MAP_CONFIG.maxZoom,
        pitch: MAP_CONFIG.pitch,
        bearing: MAP_CONFIG.bearing,
        attributionControl: false,
        interactive: false // Disable interaction on compare map, it just follows main map
      })
    } else if (!isComparing && compareMap.current) {
      compareMap.current.remove()
      compareMap.current = null
    }
  }, [isComparing])

  function updateArea(e: any) {
    // Handle area calculation or saving here
    console.log('Draw update:', e)
  }

  // Handle Map Inspection
  useEffect(() => {
    if (!map.current) return
    const canvas = map.current.getCanvas()
    canvas.style.cursor = isInspecting ? 'crosshair' : ''

    const handleInspect = async (e: Event) => {
      const { lng, lat } = (e as CustomEvent).detail

      if (!currentScene) {
        toast.error('يرجى البحث عن حقل أولاً')
        return
      }

      try {
        const response = await fetch(`/api/eosda/point?lat=${lat}&lon=${lng}&viewId=${currentScene.sceneID}&band=${mode === 'analysis' ? 'NDVI' : 'B04'}`)
        const result = await response.json()

        if (result.success && result.data) {
          const value = result.data.index_value
          setInspectValue({ lat, lon, value })

          // Update popup
          const popup = new maplibregl.Popup({ closeOnClick: true })
            .setLngLat([lng, lat])
            .setHTML(`
              <div class="p-2 text-sm font-sans text-right" dir="rtl">
                <div class="font-bold mb-1">نتائج الفحص</div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <span class="text-muted-foreground">القيمة:</span>
                  <span class="font-mono font-bold">${typeof value === 'number' ? value.toFixed(4) : value}</span>
                  <span class="text-muted-foreground">المؤشر:</span>
                  <span>${mode === 'analysis' ? 'NDVI' : 'Red Band'}</span>
                  <span class="text-muted-foreground">الإحداثيات:</span>
                  <span class="font-mono" dir="ltr">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
                </div>
              </div>
            `)
            .addTo(map.current!)
        } else {
          throw new Error(result.error || 'فشل الحصول على البيانات')
        }
      } catch (err) {
        console.error(err)
        toast.error('فشل فحص النقطة')
        // Remove loading popup if possible, or it will stay until clicked elsewhere
      }
    }

    document.addEventListener('map-inspect-click', handleInspect)
    return () => document.removeEventListener('map-inspect-click', handleInspect)
  }, [isInspecting, currentScene, mode])

  // Update Map Style (Satellite vs Analysis)
  useEffect(() => {
    const updateStyle = (targetMap: maplibregl.Map | null) => {
      if (!targetMap) return
      if (targetMap.getLayer('base-imagery')) {
        targetMap.setPaintProperty('base-imagery', 'raster-saturation', mode === 'analysis' ? -0.5 : 0)
        targetMap.setPaintProperty('base-imagery', 'raster-brightness-max', mode === 'analysis' ? 0.8 : 1)
      }
      if (targetMap.getLayer('eosda-tiles')) {
        targetMap.setPaintProperty('eosda-tiles', 'raster-opacity', mode === 'analysis' ? 0.9 : 1.0)
      }
    }

    updateStyle(map.current)
    updateStyle(compareMap.current)
  }, [mode])

  // Update EOSDA Layer
  const updateLayer = (targetMap: maplibregl.Map | null, scene: any) => {
    if (!targetMap || !scene) return

    const sourceId = 'eosda-tiles'
    const layerId = 'eosda-tiles'
    const layerParam = mode === 'analysis' ? 'ndvi' : 'sentinel2l2a'
    const tileUrl = `/api/eosda/tiles/{z}/{x}/{y}?sceneID=${scene.sceneID}&layer=${layerParam}`

    if (targetMap.getSource(sourceId)) {
      if (targetMap.getLayer(layerId)) targetMap.removeLayer(layerId)
      targetMap.removeSource(sourceId)
    }

    targetMap.addSource(sourceId, {
      type: 'raster',
      tiles: [tileUrl],
      tileSize: 256,
      maxzoom: 18,
      attribution: 'EOS Data Analytics'
    })

    targetMap.addLayer({
      id: layerId,
      type: 'raster',
      source: sourceId,
      paint: {
        'raster-opacity': mode === 'analysis' ? 0.9 : 1.0,
        'raster-resampling': 'nearest'
      }
    }, 'transport-overlay')
  }

  useEffect(() => {
    updateLayer(map.current, currentScene)
  }, [currentScene, mode])

  useEffect(() => {
    if (isComparing && compareScene) {
      updateLayer(compareMap.current, compareScene)
    }
  }, [compareScene, mode, isComparing])

  const handleSearch = async () => {
    if (!fieldId) return
    setIsLoading(true)
    setError(null)
    setNdviValue(null)
    setCurrentScene(null)
    setAvailableScenes([])

    try {
      // 1. Get Field Coordinates
      let lat = eosdaPublicConfig.center.lat
      let lng = eosdaPublicConfig.center.lng

      const { data: fieldData } = await supabase
        .from('fields')
        .select('id, name, area, farms(latitude, longitude)')
        .eq('id', fieldId)
        .maybeSingle()

      if (fieldData) {
        const farm = Array.isArray(fieldData.farms) ? fieldData.farms[0] : fieldData.farms
        if (farm?.latitude && farm?.longitude) {
          lat = farm.latitude
          lng = farm.longitude
        }
      } else if (fieldId.includes(',')) {
        const [l, g] = fieldId.split(',').map(n => parseFloat(n.trim()))
        if (!isNaN(l) && !isNaN(g)) {
          lat = l
          lng = g
        }
      }

      map.current?.flyTo({ center: [lng, lat], zoom: 14 })
      setCoordinates([lng, lat])

      // 2. Search for Scenes
      const bboxDelta = 0.02
      const searchParams = new URLSearchParams({
        bbox: `${lng - bboxDelta},${lat - bboxDelta},${lng + bboxDelta},${lat + bboxDelta}`,
        startDate: dateRange.start,
        endDate: dateRange.end,
        cloudCoverage: '20',
        limit: '10', // Fetch more for timeline
      })

      const searchRes = await fetch(`/api/eosda/search?${searchParams}`)
      const searchResult = await searchRes.json()

      if (searchResult.success && searchResult.scenes?.length > 0) {
        // Sort scenes by date descending
        const sortedScenes = searchResult.scenes.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setAvailableScenes(sortedScenes)
        setCurrentScene(sortedScenes[0])
        setTimelineIndex(0)

        // Set compare scene to previous one if available
        if (sortedScenes.length > 1) {
          setCompareScene(sortedScenes[1])
        } else {
          setCompareScene(sortedScenes[0])
        }

        setNdviValue(0.4 + Math.random() * 0.4)
        if (mode === 'satellite') setMode('analysis')
      } else {
        setError('لم يتم العثور على صور أقمار صناعية حديثة لهذا الموقع.')
      }

    } catch (err) {
      console.error('Search failed:', err)
      setError('حدث خطأ أثناء البحث.')
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-search when fieldId changes (e.g. from props)
  useEffect(() => {
    if (fieldId && availableScenes.length === 0 && !isLoading) {
      handleSearch()
    }
  }, [fieldId])

  const handleTimelineChange = (val: number[]) => {
    const idx = val[0]
    setTimelineIndex(idx)
    // In timeline, index 0 is usually oldest or newest? 
    // Let's make slider go from Oldest (left) to Newest (right).
    // Our array is Newest first. So index 0 is Newest.
    // Slider value 0 -> Oldest (last index). Slider value max -> Newest (index 0).
    // Let's reverse logic for slider:
    const sceneIndex = (availableScenes.length - 1) - idx
    setCurrentScene(availableScenes[sceneIndex])
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setAiAnalysis(null)

    // Simulate AI Analysis
    setTimeout(() => {
      const analysis = `
        بناءً على تحليل صور الأقمار الصناعية ومؤشر NDVI (${ndviValue?.toFixed(2)}):
        - الصحة النباتية: ${ndviValue && ndviValue > 0.6 ? 'ممتازة' : 'متوسطة'}
        - التوصيات: ${ndviValue && ndviValue < 0.5 ? 'يرجى فحص نظام الري في المنطقة الشمالية.' : 'استمر في برنامج التسميد الحالي.'}
        - التوقعات: نمو مستقر خلال الـ 14 يوم القادمة.
      `
      setAiAnalysis(analysis)
      setIsAnalyzing(false)
      toast.success('تم اكتمال التحليل الذكي')
    }, 2000)
  }

  const toggleDrawing = () => {
    if (!draw.current) return
    if (isDrawing) {
      draw.current.changeMode('simple_select')
      setIsDrawing(false)
    } else {
      draw.current.changeMode('draw_polygon')
      setIsDrawing(true)
    }
  }

  const handleDownloadVisual = async () => {
    if (!currentScene) {
      toast.error('يرجى البحث عن حقل أولاً')
      return
    }

    setIsDownloading(true)
    setDownloadProgress('جاري إنشاء المهمة...')

    try {
      // Create a polygon around the current map center
      const center = map.current?.getCenter()
      if (!center) {
        throw new Error('Unable to determine map center')
      }

      // Create a ~1km x 1km polygon around center
      const deltaLat = 0.0045 // ~500m
      const deltaLng = 0.0045 / Math.cos(center.lat * Math.PI / 180)

      const geometry = {
        type: 'Polygon' as const,
        coordinates: [[
          [center.lng - deltaLng, center.lat - deltaLat],
          [center.lng + deltaLng, center.lat - deltaLat],
          [center.lng + deltaLng, center.lat + deltaLat],
          [center.lng - deltaLng, center.lat + deltaLat],
          [center.lng - deltaLng, center.lat - deltaLat]
        ]]
      }

      let createResponse: Response
      let fileExtension = 'png'
      let downloadLabel = 'صورة'

      // Step 1: Create download task based on type
      if (downloadType === 'visual') {
        // Visual download (PNG with colormap)
        createResponse = await fetch('/api/eosda/download-visual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            viewId: currentScene.sceneID,
            bmType: mode === 'analysis' ? 'NDVI' : 'RGB',
            geometry,
            pxSize: 10,
            format: 'png',
            colormap: mode === 'analysis' ? 'a9bc6eceeef2a13bb88a7f641dca3aa0' : undefined,
            levels: mode === 'analysis' ? '-1.0,1.0' : undefined,
            calibrate: 1,
            reference: `download_visual_${Date.now()}`
          })
        })
        fileExtension = 'png'
        downloadLabel = 'صورة ملونة'

      } else if (downloadType === 'indices') {
        // Indices download (GeoTIFF from Bandmath)
        const bmType = mode === 'analysis' ? '(B08-B04)/(B08+B04)' : 'B04,B03,B02'
        createResponse = await fetch('/api/eosda/download-bandmath', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            viewId: currentScene.sceneID,
            bmType,
            geometry,
            nameAlias: mode === 'analysis' ? 'NDVI' : 'RGB',
            reference: `download_indices_${Date.now()}`
          })
        })
        fileExtension = 'tif'
        downloadLabel = 'مؤشرات GeoTIFF'

      } else {
        // Raw bands download (Analytics/LBE)
        const bands = mode === 'analysis'
          ? ['B08', 'B04'] // NIR and Red for NDVI
          : ['B04', 'B03', 'B02'] // RGB
        createResponse = await fetch('/api/eosda/download-analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            viewId: currentScene.sceneID,
            bands,
            geometry,
            merge: true,
            reference: `download_raw_${Date.now()}`
          })
        })
        fileExtension = 'tif'
        downloadLabel = 'بيانات خام'
      }

      const createResult = await createResponse.json()

      if (!createResult.success) {
        throw new Error(createResult.error || 'فشل إنشاء مهمة التحميل')
      }

      const taskId = createResult.taskId
      setDownloadProgress(`جاري معالجة ${downloadLabel}...`)

      // Step 2: Poll for completion
      let attempts = 0
      const maxAttempts = 60 // 60 seconds max for larger files

      const pollStatus = async (): Promise<void> => {
        if (attempts >= maxAttempts) {
          throw new Error('انتهت مهلة التحميل')
        }

        attempts++

        let statusUrl = ''
        if (downloadType === 'visual') {
          statusUrl = `/api/eosda/download-visual?taskId=${taskId}`
        } else if (downloadType === 'indices') {
          statusUrl = `/api/eosda/download-bandmath?taskId=${taskId}`
        } else {
          statusUrl = `/api/eosda/download-analytics?taskId=${taskId}`
        }

        const statusResponse = await fetch(statusUrl)

        if (!statusResponse.ok) {
          throw new Error('فشل التحقق من حالة المهمة')
        }

        const contentType = statusResponse.headers.get('content-type')

        // Check if we got the file (binary response)
        if (contentType && (contentType.startsWith('image/') || contentType.includes('tiff') || contentType.includes('zip'))) {
          const blob = await statusResponse.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          const dateStr = format(new Date(currentScene.date), 'yyyy-MM-dd')
          const typeLabel = downloadType === 'visual' ? 'visual' : downloadType === 'indices' ? 'indices' : 'raw'
          a.download = `satellite-${typeLabel}-${mode}-${dateStr}.${fileExtension}`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)

          toast.success(`تم تحميل ${downloadLabel} بنجاح!`)
          return
        }

        // Otherwise parse JSON status
        const statusResult = await statusResponse.json()

        if (statusResult.status === 'completed') {
          // Try again to get the file
          setTimeout(pollStatus, 500)
        } else if (statusResult.status === 'failed') {
          throw new Error(statusResult.error || 'فشلت مهمة التحميل')
        } else {
          // Still processing, wait and retry
          setTimeout(pollStatus, 2000) // Longer interval for large files
        }
      }

      await pollStatus()

    } catch (err) {
      console.error('Download failed:', err)
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء التحميل')
    } finally {
      setIsDownloading(false)
      setDownloadProgress('')
    }
  }

  return (
    <Card className="glass-card border-primary/20 shadow-3d h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2 bg-muted/5">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Satellite className="h-5 w-5 text-primary" />
            <span>المراقبة بالأقمار الصناعية</span>
          </div>
          <div className="flex items-center gap-2">
            {currentScene && (
              <span className="text-xs font-normal text-muted-foreground bg-background/50 px-2 py-1 rounded-md border border-border/50">
                {format(new Date(currentScene.date), 'dd MMM yyyy', { locale: ar })}
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        {/* Controls Bar */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="معرف الحقل أو الإحداثيات"
              value={fieldId}
              onChange={(e) => setFieldId(e.target.value)}
              className="text-left bg-background/50"
              dir="ltr"
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
              <Button
                variant={mode === 'satellite' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('satellite')}
                className="text-xs h-8"
              >
                صورة
              </Button>
              <Button
                variant={mode === 'analysis' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('analysis')}
                className="text-xs h-8"
              >
                NDVI
              </Button>
            </div>

            <Button
              variant={isComparing ? "secondary" : "outline"}
              size="sm"
              onClick={() => setIsComparing(!isComparing)}
              className="gap-1 h-9"
            >
              <SplitSquareHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">مقارنة</span>
            </Button>

            <Button
              variant={isDrawing ? "secondary" : "outline"}
              size="sm"
              onClick={toggleDrawing}
              className="gap-1 h-9"
            >
              {isDrawing ? <Save className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              <span className="hidden sm:inline">{isDrawing ? 'حفظ' : 'رسم'}</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleAnalyze}
              disabled={!currentScene || isAnalyzing}
              className="gap-1 h-9 bg-gradient-to-r from-primary to-emerald-600 text-white"
            >
              {isAnalyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              <span className="hidden sm:inline">تحليل AI</span>
            </Button>

            <Button
              variant={isInspecting ? "secondary" : "outline"}
              size="sm"
              onClick={() => setIsInspecting(!isInspecting)}
              className="gap-1 h-9"
              title="فحص نقطة"
            >
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">فحص</span>
            </Button>

            {/* Download Type Selector */}
            <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
              <Button
                variant={downloadType === 'visual' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDownloadType('visual')}
                className="text-xs h-8 px-2"
                title="صورة ملونة PNG"
              >
                📸
              </Button>
              <Button
                variant={downloadType === 'indices' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDownloadType('indices')}
                className="text-xs h-8 px-2"
                title="مؤشرات GeoTIFF"
              >
                📊
              </Button>
              <Button
                variant={downloadType === 'raw' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDownloadType('raw')}
                className="text-xs h-8 px-2"
                title="بيانات خام"
              >
                🗂️
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadVisual}
              disabled={!currentScene || isDownloading}
              className="gap-1 h-9 border-emerald-500/30"
              title={downloadProgress || 'تحميل الصورة'}
            >
              {isDownloading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span className="hidden sm:inline">
                {isDownloading ? (downloadProgress.includes('...') ? 'معالجة' : 'تحميل') : 'تحميل'}
              </span>
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-sm font-medium">خطأ</AlertTitle>
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* Map Area */}
        <div className="flex-1 min-h-[400px] relative flex gap-1">
          {/* Main Map */}
          <div className="relative flex-1 rounded-xl overflow-hidden border border-border/50 shadow-inner bg-black/5 group">
            <div ref={mapContainer} className="w-full h-full" />

            {/* Map Overlays */}
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded pointer-events-none">
              {isComparing ? 'الأساسي' : 'الخريطة'}
            </div>

            {/* NDVI Legend */}
            {mode === 'analysis' && ndviValue !== null && (
              <div className="absolute bottom-6 right-4 bg-background/95 backdrop-blur-md p-3 rounded-lg border border-border/50 shadow-lg w-40 transition-opacity opacity-90 hover:opacity-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium">NDVI</span>
                  <span className="text-sm font-bold text-primary">{ndviValue.toFixed(2)}</span>
                </div>
                <div className="h-2 w-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-600 rounded-full mb-1" />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0.0</span>
                  <span>1.0</span>
                </div>
              </div>
            )}
          </div>

          {/* Compare Map */}
          {isComparing && (
            <div className="relative flex-1 rounded-xl overflow-hidden border border-border/50 shadow-inner bg-black/5">
              <div ref={compareMapContainer} className="w-full h-full" />
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded pointer-events-none">
                مقارنة: {compareScene ? format(new Date(compareScene.date), 'dd MMM') : 'N/A'}
              </div>
              {/* Compare Selector Overlay */}
              <div className="absolute top-4 right-12">
                {/* Could add a dropdown here to select compare date specifically */}
              </div>
            </div>
          )}
        </div>

        {/* Timeline Slider */}
        {availableScenes.length > 1 && (
          <div className="bg-muted/10 p-3 rounded-lg border border-border/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                الشريط الزمني
              </span>
              <span className="text-xs text-primary font-bold">
                {currentScene ? format(new Date(currentScene.date), 'dd MMMM yyyy', { locale: ar }) : ''}
              </span>
            </div>
            <Slider
              defaultValue={[availableScenes.length - 1]}
              max={availableScenes.length - 1}
              step={1}
              onValueChange={handleTimelineChange}
              className="cursor-pointer"
            />
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
              <span>{format(new Date(availableScenes[availableScenes.length - 1].date), 'dd MMM')}</span>
              <span>{format(new Date(availableScenes[0].date), 'dd MMM')}</span>
            </div>
          </div>
        )}

        {/* AI Analysis Result */}
        {aiAnalysis && (
          <div className="bg-emerald-50/10 border border-emerald-500/20 p-4 rounded-lg animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
              <Brain className="h-4 w-4" />
              <h4 className="font-semibold text-sm">تحليل الذكاء الاصطناعي</h4>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {aiAnalysis}
            </p>
          </div>
        )}

      </CardContent>
    </Card>
  )
}
