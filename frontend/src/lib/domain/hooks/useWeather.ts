// ===========================================
// Adham AgriTech - Weather Hook
// ===========================================

import { useState, useEffect, useCallback } from 'react';
import { WeatherData, GeoCoordinate } from '../types';
import { WeatherService } from '../services/WeatherService';

interface UseWeatherOptions {
  location: GeoCoordinate;
  autoRefresh?: boolean;
  refreshInterval?: number; // in minutes
  enableForecast?: boolean;
  forecastDays?: number;
}

interface UseWeatherReturn {
  currentWeather: WeatherData | null;
  forecast: WeatherData[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

export const useWeather = (options: UseWeatherOptions): UseWeatherReturn => {
  const {
    location,
    autoRefresh = true,
    refreshInterval = 10,
    enableForecast = true,
    forecastDays = 5
  } = options;

  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<WeatherData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // تحميل بيانات الطقس
  const loadWeatherData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // تحميل الطقس الحالي
      const current = await WeatherService.getCurrentWeather(location);
      setCurrentWeather(current);

      // تحميل التوقعات
      if (enableForecast) {
        const forecastData = await WeatherService.getWeatherForecast(location, forecastDays);
        setForecast(forecastData);
      }

      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load weather data');
    } finally {
      setIsLoading(false);
    }
  }, [location, enableForecast, forecastDays]);

  // التحديث اليدوي
  const refresh = useCallback(async () => {
    await loadWeatherData();
  }, [loadWeatherData]);

  // التحميل الأولي
  useEffect(() => {
    loadWeatherData();
  }, [loadWeatherData]);

  // التحديث التلقائي
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadWeatherData();
    }, refreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadWeatherData]);

  return {
    currentWeather,
    forecast,
    isLoading,
    error,
    refresh,
    lastUpdated
  };
};

// Hook مبسط للطقس الحالي فقط
export const useCurrentWeather = (location: GeoCoordinate) => {
  const { currentWeather, isLoading, error, refresh } = useWeather({
    location,
    enableForecast: false,
    autoRefresh: true,
    refreshInterval: 15
  });

  return {
    weather: currentWeather,
    isLoading,
    error,
    refresh
  };
};

// Hook للتوقعات فقط
export const useWeatherForecast = (location: GeoCoordinate, days: number = 5) => {
  const { forecast, isLoading, error, refresh } = useWeather({
    location,
    enableForecast: true,
    forecastDays: days,
    autoRefresh: false
  });

  return {
    forecast,
    isLoading,
    error,
    refresh
  };
};