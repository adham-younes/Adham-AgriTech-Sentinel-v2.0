// ===========================================
// Adham AgriTech - Satellite Service
// ===========================================

import { GeoCoordinate } from '../types';
import {
  fetchESDNDVIImage,
  fetchESDSatelliteImage,
  isESDConfigured
} from '../../services/esd';
import {
  fetchEOSDANDVI,
  fetchEOSDASatelliteImage,
  isEOSDAConfigured
} from '../../services/eosda';

export interface SatelliteImage {
  id: string;
  url: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  resolution: number;
  date: string;
  source: 'eosda' | 'esd';
  cloud_coverage?: number;
}

export interface NDVIImage {
  id: string;
  url: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  ndvi_value: number;
  vegetation_health: 'poor' | 'fair' | 'good' | 'excellent';
  date: string;
}

export class SatelliteService {
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  private static cache = new Map<string, { data: any; timestamp: number }>();

  /**
   * الحصول على صورة أقمار صناعية
   */
  static async getSatelliteImage(
    center: GeoCoordinate,
    zoom: number = 15,
    size: { width: number; height: number } = { width: 512, height: 512 }
  ): Promise<SatelliteImage> {
    const cacheKey = `satellite_${center.latitude}_${center.longitude}_${zoom}_${size.width}_${size.height}`;
    
    // التحقق من التخزين المؤقت
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      let satelliteImage: SatelliteImage;

      // Try EOSDA first if configured
      if (isEOSDAConfigured()) {
        try {
          const eosdaImage = await fetchEOSDASatelliteImage({
            center,
            zoom,
            size
          });

          satelliteImage = {
            id:
              eosdaImage.id ||
              `sat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url: eosdaImage.url,
            bounds: eosdaImage.bounds || this.calculateBounds(center, zoom),
            resolution: eosdaImage.resolution || this.calculateResolution(zoom),
            date: eosdaImage.capturedAt || new Date().toISOString(),
            source: 'eosda',
            cloud_coverage: eosdaImage.cloudCoverage
          };
        } catch (eosdaError) {
          console.warn('EOSDA failed, falling back to ESD:', eosdaError);
          // Fall back to ESD
          const esdImage = await fetchESDSatelliteImage({
            center,
            zoom,
            size
          });

          satelliteImage = {
            id:
              esdImage.id ||
              `sat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url: esdImage.url,
            bounds: esdImage.bounds || this.calculateBounds(center, zoom),
            resolution: esdImage.resolution || this.calculateResolution(zoom),
            date: esdImage.capturedAt || new Date().toISOString(),
            source: 'esd',
            cloud_coverage: esdImage.cloudCoverage
          };
        }
      } else if (isESDConfigured()) {
        // Use ESD if EOSDA is not configured
        const esdImage = await fetchESDSatelliteImage({
          center,
          zoom,
          size
        });

        satelliteImage = {
          id:
            esdImage.id ||
            `sat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url: esdImage.url,
          bounds: esdImage.bounds || this.calculateBounds(center, zoom),
          resolution: esdImage.resolution || this.calculateResolution(zoom),
          date: esdImage.capturedAt || new Date().toISOString(),
          source: 'esd',
          cloud_coverage: esdImage.cloudCoverage
        };
      } else {
        throw new Error('No satellite API configured (EOSDA or ESD)');
      }

      // حفظ في التخزين المؤقت
      this.cache.set(cacheKey, {
        data: satelliteImage,
        timestamp: Date.now()
      });

      return satelliteImage;
    } catch (error) {
      console.error('Satellite image error:', error);
      throw new Error('Failed to fetch satellite image');
    }
  }

  /**
   * حساب حدود الصورة
   */
  private static calculateBounds(
    center: GeoCoordinate,
    zoom: number
  ): SatelliteImage['bounds'] {
    const latRange = 180 / Math.pow(2, zoom);
    const lngRange = 360 / Math.pow(2, zoom);
    
    return {
      north: center.latitude + latRange / 2,
      south: center.latitude - latRange / 2,
      east: center.longitude + lngRange / 2,
      west: center.longitude - lngRange / 2
    };
  }

  /**
   * حساب دقة الصورة
   */
  private static calculateResolution(zoom: number): number {
    // دقة تقريبية بالمتر لكل بكسل
    const earthCircumference = 40075017; // متر
    return earthCircumference / Math.pow(2, zoom + 8);
  }

  /**
   * الحصول على صورة NDVI (مؤشر الغطاء النباتي)
   */
  static async getNDVIImage(
    center: GeoCoordinate,
    dateRange: { start: Date; end: Date }
  ): Promise<NDVIImage> {
    const cacheKey = `ndvi_${center.latitude}_${center.longitude}_${dateRange.start.getTime()}`;
    
    // التحقق من التخزين المؤقت
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      let ndviImage: NDVIImage;

      // Try EOSDA first if configured
      if (isEOSDAConfigured()) {
        try {
          const eosdaData = await fetchEOSDANDVI({
            center,
            startDate: dateRange.start,
            endDate: dateRange.end
          });

          ndviImage = {
            id:
              eosdaData.id ||
              `ndvi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url: eosdaData.url,
            bounds: eosdaData.bounds || this.calculateBounds(center, 12),
            ndvi_value: eosdaData.ndvi_value,
            vegetation_health: this.calculateVegetationHealth(eosdaData.ndvi_value),
            date: eosdaData.date
          };
        } catch (eosdaError) {
          console.warn('EOSDA NDVI failed, falling back to ESD:', eosdaError);
          // Fall back to ESD
          const ndviData = await fetchESDNDVIImage({
            center,
            dateRange
          });

          ndviImage = {
            id:
              ndviData.id ||
              `ndvi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url: ndviData.url,
            bounds: ndviData.bounds || this.calculateBounds(center, 12),
            ndvi_value: ndviData.ndvi_value,
            vegetation_health: this.calculateVegetationHealth(ndviData.ndvi_value),
            date: ndviData.date
          };
        }
      } else if (isESDConfigured()) {
        // Use ESD if EOSDA is not configured
        const ndviData = await fetchESDNDVIImage({
          center,
          dateRange
        });

        ndviImage = {
          id:
            ndviData.id ||
            `ndvi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url: ndviData.url,
          bounds: ndviData.bounds || this.calculateBounds(center, 12),
          ndvi_value: ndviData.ndvi_value,
          vegetation_health: this.calculateVegetationHealth(ndviData.ndvi_value),
          date: ndviData.date
        };
      } else {
        throw new Error('No satellite API configured (EOSDA or ESD)');
      }

      // حفظ في التخزين المؤقت
      this.cache.set(cacheKey, {
        data: ndviImage,
        timestamp: Date.now()
      });

      return ndviImage;
    } catch (error) {
      console.error('NDVI image error:', error);
      throw new Error('Failed to fetch NDVI image');
    }
  }

  /**
   * حساب صحة الغطاء النباتي من قيمة NDVI
   */
  private static calculateVegetationHealth(ndviValue: number): NDVIImage['vegetation_health'] {
    if (ndviValue >= 0.7) return 'excellent';
    if (ndviValue >= 0.5) return 'good';
    if (ndviValue >= 0.3) return 'fair';
    return 'poor';
  }

  /**
   * الحصول على صور متعددة الأطياف
   */
  static async getMultispectralImages(
    center: GeoCoordinate,
    bands: string[] = ['red', 'green', 'blue', 'nir']
  ): Promise<Record<string, string>> {
    const images: Record<string, string> = {};
    
    for (const band of bands) {
      try {
        const imageUrl = await this.getBandImage(center, band);
        images[band] = imageUrl;
      } catch (error) {
        console.error(`Error fetching ${band} band:`, error);
      }
    }

    return images;
  }

  /**
   * الحصول على صورة لطيف معين
   */
  private static async getBandImage(
    center: GeoCoordinate,
    band: string
  ): Promise<string> {
    // هذا مثال مبسط - يحتاج تنفيذ كامل
    const { latitude, longitude } = center;
    return `https://example.com/${band}/${longitude},${latitude}.png`;
  }

  /**
   * تحليل التغير في الغطاء النباتي
   */
  static async analyzeVegetationChange(
    center: GeoCoordinate,
    period1: { start: Date; end: Date },
    period2: { start: Date; end: Date }
  ): Promise<{
    change_percentage: number;
    trend: 'improving' | 'declining' | 'stable';
    areas_of_concern: GeoCoordinate[];
  }> {
    try {
      const ndvi1 = await this.getNDVIImage(center, period1);
      const ndvi2 = await this.getNDVIImage(center, period2);
      
      const changePercentage = ((ndvi2.ndvi_value - ndvi1.ndvi_value) / ndvi1.ndvi_value) * 100;
      
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (changePercentage > 5) trend = 'improving';
      else if (changePercentage < -5) trend = 'declining';

      return {
        change_percentage: Math.round(changePercentage * 100) / 100,
        trend,
        areas_of_concern: [] // يحتاج تحليل أكثر تعقيداً
      };
    } catch (error) {
      console.error('Vegetation change analysis error:', error);
      throw new Error('Failed to analyze vegetation change');
    }
  }

  /**
   * تنظيف التخزين المؤقت
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * التحقق من صحة المفاتيح
   */
  static validateCredentials(): {
    esd: boolean;
  } {
    return {
      esd: isESDConfigured()
    };
  }
}