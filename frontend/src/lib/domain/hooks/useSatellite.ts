// ===========================================
// Adham AgriTech - Satellite Hook
// ===========================================

import { useState, useEffect, useCallback } from 'react';
import { GeoCoordinate } from '../types';
import type { SatelliteImage, NDVIImage } from '../services/SatelliteService';
import { SatelliteService } from '../services/SatelliteService';

interface UseSatelliteOptions {
  center: GeoCoordinate;
  zoom?: number;
  size?: { width: number; height: number };
  autoRefresh?: boolean;
  refreshInterval?: number; // in hours
}

interface UseSatelliteReturn {
  satelliteImage: SatelliteImage | null;
  ndviImage: NDVIImage | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

export const useSatellite = (options: UseSatelliteOptions): UseSatelliteReturn => {
  const {
    center,
    zoom = 15,
    size = { width: 512, height: 512 },
    autoRefresh = false,
    refreshInterval = 24
  } = options;

  const [satelliteImage, setSatelliteImage] = useState<SatelliteImage | null>(null);
  const [ndviImage, setNDVIImage] = useState<NDVIImage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // تحميل بيانات الأقمار الصناعية
  const loadSatelliteData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // تحميل صورة الأقمار الصناعية
      const satellite = await SatelliteService.getSatelliteImage(center, zoom, size);
      setSatelliteImage(satellite);

      // تحميل صورة NDVI
      const ndvi = await SatelliteService.getNDVIImage(center, {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date()
      });
      setNDVIImage(ndvi);

      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load satellite data');
    } finally {
      setIsLoading(false);
    }
  }, [center, zoom, size]);

  // التحديث اليدوي
  const refresh = useCallback(async () => {
    await loadSatelliteData();
  }, [loadSatelliteData]);

  // التحميل الأولي
  useEffect(() => {
    loadSatelliteData();
  }, [loadSatelliteData]);

  // التحديث التلقائي
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadSatelliteData();
    }, refreshInterval * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadSatelliteData]);

  return {
    satelliteImage,
    ndviImage,
    isLoading,
    error,
    refresh,
    lastUpdated
  };
};

// Hook لصورة الأقمار الصناعية فقط
export const useSatelliteImage = (center: GeoCoordinate, zoom: number = 15) => {
  const { satelliteImage, isLoading, error, refresh } = useSatellite({
    center,
    zoom,
    autoRefresh: false
  });

  return {
    image: satelliteImage,
    isLoading,
    error,
    refresh
  };
};

// Hook لصورة NDVI فقط
export const useNDVIImage = (center: GeoCoordinate) => {
  const { ndviImage, isLoading, error, refresh } = useSatellite({
    center,
    autoRefresh: false
  });

  return {
    ndviImage,
    isLoading,
    error,
    refresh
  };
};
