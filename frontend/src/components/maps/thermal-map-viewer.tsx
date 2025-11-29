/**
 * Thermal Map Viewer Component
 * 
 * مكون لعرض الخرائط الحرارية من EOSDA في صفحة الحقل
 * يستخدم Render API مع colormaps حرارية
 * 
 * @module components/maps/thermal-map-viewer
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, Download, Layers } from 'lucide-react'
import { getEOSDAThermalMap } from '@/lib/services/eosda'
import { eosdaPublicConfig } from '@/lib/config/eosda'

interface ThermalMapViewerProps {
  fieldId: string
  fieldName?: string
  bbox: [number, number, number, number] // [west, south, east, north]
  viewId?: string
  lang?: 'ar' | 'en'
  className?: string
}

type ThermalIndex = 'ndvi' | 'evi' | 'ndwi' | 'chlorophyll' | 'temperature'
type ThermalColormap = 'thermal' | 'hot' | 'cool' | 'rdylgn' | 'viridis'

const INDEX_CONFIG: Record<ThermalIndex, { name: { ar: string; en: string }; colormap: ThermalColormap }> = {
  ndvi: {
    name: { ar: 'صحة النبات (NDVI)', en: 'Vegetation Health (NDVI)' },
    colormap: 'rdylgn', // Red-Yellow-Green
  },
  evi: {
    name: { ar: 'مؤشر نباتي محسن (EVI)', en: 'Enhanced Vegetation Index (EVI)' },
    colormap: 'viridis',
  },
  ndwi: {
    name: { ar: 'مؤشر مائي (NDWI)', en: 'Water Index (NDWI)' },
    colormap: 'blues',
  },
  chlorophyll: {
    name: { ar: 'الكلوروفيل', en: 'Chlorophyll' },
    colormap: 'viridis',
  },
  temperature: {
    name: { ar: 'درجة الحرارة', en: 'Temperature' },
    colormap: 'thermal',
  },
}

export function ThermalMapViewer({
  fieldId,
  fieldName,
  bbox,
  viewId,
  lang = 'ar',
  className = '',
}: ThermalMapViewerProps) {
  const [activeIndex, setActiveIndex] = useState<ThermalIndex>('ndvi')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const loadThermalMap = useCallback(async () => {
    if (!viewId || !eosdaPublicConfig.apiKey) {
      setError(lang === 'ar' ? 'EOSDA API غير مُعد' : 'EOSDA API not configured')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const config = INDEX_CONFIG[activeIndex]
      const result = await getEOSDAThermalMap({
        viewId,
        bbox,
        width: 1024,
        height: 1024,
        index: activeIndex,
        colormap: config.colormap,
        format: 'png',
      })

      setImageUrl(result.imageUrl)
      setLastUpdated(result.renderedAt)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('[ThermalMapViewer] Error loading thermal map:', errorMessage)
      setError(
        lang === 'ar'
          ? `فشل تحميل الخريطة الحرارية: ${errorMessage.slice(0, 50)}`
          : `Failed to load thermal map: ${errorMessage.slice(0, 50)}`
      )
    } finally {
      setLoading(false)
    }
  }, [viewId, bbox, activeIndex, lang])

  useEffect(() => {
    if (viewId) {
      loadThermalMap()
    }
  }, [viewId, activeIndex, loadThermalMap])

  const handleDownload = () => {
    if (!imageUrl) return
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `${fieldName || 'field'}-${activeIndex}-${Date.now()}.png`
    link.click()
  }

  return (
    <Card className={`glass-card border-primary/20 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">
              {lang === 'ar' ? 'الخرائط الحرارية' : 'Thermal Maps'}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {lang === 'ar'
                ? 'خرائط حرارية من EOSDA مع colormaps متخصصة'
                : 'EOSDA thermal maps with specialized colormaps'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadThermalMap}
            disabled={loading || !viewId}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {lang === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
          {imageUrl && (
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              {lang === 'ar' ? 'تحميل' : 'Download'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Index Selector */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(INDEX_CONFIG) as ThermalIndex[]).map((index) => {
            const config = INDEX_CONFIG[index]
            return (
              <Button
                key={index}
                variant={activeIndex === index ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveIndex(index)}
                disabled={loading}
                className="text-xs"
              >
                {config.name[lang]}
              </Button>
            )
          })}
        </div>

        {/* Map Display */}
        {loading ? (
          <div className="flex items-center justify-center h-96 bg-black/20 rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {lang === 'ar' ? 'جاري تحميل الخريطة الحرارية...' : 'Loading thermal map...'}
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-96 bg-red-900/20 rounded-lg border border-red-500/30">
            <div className="text-center p-4">
              <p className="text-sm text-red-400 mb-2">{error}</p>
              <Button variant="outline" size="sm" onClick={loadThermalMap}>
                {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
              </Button>
            </div>
          </div>
        ) : imageUrl ? (
          <div className="space-y-2">
            <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/20">
              <img
                src={imageUrl}
                alt={`${INDEX_CONFIG[activeIndex].name[lang]} thermal map`}
                className="w-full h-auto"
                style={{ maxHeight: '600px', objectFit: 'contain' }}
              />
            </div>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground text-center">
                {lang === 'ar' ? 'آخر تحديث:' : 'Last updated:'}{' '}
                {new Date(lastUpdated).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-96 bg-black/20 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {lang === 'ar'
                ? 'اختر مؤشراً لعرض الخريطة الحرارية'
                : 'Select an index to view thermal map'}
            </p>
          </div>
        )}

        {/* Colormap Legend */}
        {imageUrl && (
          <div className="pt-4 border-t border-white/10">
            <p className="text-xs text-muted-foreground mb-2">
              {lang === 'ar' ? 'مخطط الألوان:' : 'Colormap:'}{' '}
              <Badge variant="outline" className="ml-2">
                {INDEX_CONFIG[activeIndex].colormap}
              </Badge>
            </p>
            <div className="text-xs text-muted-foreground">
              {activeIndex === 'ndvi' && (
                <p>
                  {lang === 'ar'
                    ? 'أحمر = صحة منخفضة | أصفر = متوسطة | أخضر = عالية'
                    : 'Red = Low health | Yellow = Medium | Green = High'}
                </p>
              )}
              {activeIndex === 'chlorophyll' && (
                <p>
                  {lang === 'ar'
                    ? 'أزرق = منخفض | أخضر = متوسط | أصفر = عالي'
                    : 'Blue = Low | Green = Medium | Yellow = High'}
                </p>
              )}
              {activeIndex === 'temperature' && (
                <p>
                  {lang === 'ar'
                    ? 'أزرق = بارد | أحمر = ساخن'
                    : 'Blue = Cold | Red = Hot'}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}



