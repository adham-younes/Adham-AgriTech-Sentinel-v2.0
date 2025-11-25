// ===========================================
// Adham AgriTech - Weather Service
// ===========================================

import { WeatherData, GeoCoordinate, WeatherCondition } from '../types';
import { eosdaPublicConfig } from "@/lib/config/eosda"

export class WeatherService {
  private static readonly API_KEY = process.env.OPENWEATHER_API_KEY;
  private static readonly BASE_URL = 'https://api.openweathermap.org/data/2.5';
  private static readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  private static cache = new Map<string, { data: any; timestamp: number }>();

  /**
   * الحصول على بيانات الطقس الحالية
   */
  static async getCurrentWeather(
    location: GeoCoordinate,
    useCache: boolean = true
  ): Promise<WeatherData> {
    const cacheKey = `current_${location.latitude}_${location.longitude}`;
    
    // التحقق من التخزين المؤقت
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }
    }

    if (!this.API_KEY) {
      throw new Error('OpenWeather API key not configured');
    }

    try {
      const response = await fetch(
        `${this.BASE_URL}/weather?lat=${location.latitude}&lon=${location.longitude}&appid=${this.API_KEY}&units=metric&lang=ar`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      const weatherData = this.transformWeatherData(data, location);

      // حفظ في التخزين المؤقت
      this.cache.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now()
      });

      return weatherData;
    } catch (error) {
      console.error('Weather API error:', error);
      throw new Error('Failed to fetch weather data');
    }
  }

  /**
   * الحصول على توقعات الطقس
   */
  static async getWeatherForecast(
    location: GeoCoordinate,
    days: number = 5
  ): Promise<WeatherData[]> {
    const cacheKey = `forecast_${location.latitude}_${location.longitude}_${days}`;
    
    // التحقق من التخزين المؤقت
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data as WeatherData[];
    }

    if (!this.API_KEY) {
      throw new Error('OpenWeather API key not configured');
    }

    try {
      const response = await fetch(
        `${this.BASE_URL}/forecast?lat=${location.latitude}&lon=${location.longitude}&appid=${this.API_KEY}&units=metric&lang=ar&cnt=${days * 8}`
      );

      if (!response.ok) {
        throw new Error(`Weather forecast API error: ${response.status}`);
      }

      const data = await response.json();
      const forecastData = data.list.map((item: any) => 
        this.transformWeatherData(item, location)
      );

      // حفظ في التخزين المؤقت
      this.cache.set(cacheKey, {
        data: forecastData,
        timestamp: Date.now()
      });

      return forecastData;
    } catch (error) {
      console.error('Weather forecast API error:', error);
      throw new Error('Failed to fetch weather forecast');
    }
  }

  /**
   * تحويل بيانات API إلى نموذج WeatherData
   */
  private static transformWeatherData(apiData: any, location: GeoCoordinate): WeatherData {
    return {
      id: `weather_${Date.now()}_${Math.random()}`,
      location,
      temperature: Math.round(apiData.main.temp * 10) / 10,
      humidity: apiData.main.humidity,
      precipitation: apiData.rain?.['1h'] || apiData.snow?.['1h'] || 0,
      wind_speed: Math.round(apiData.wind.speed * 3.6 * 10) / 10, // تحويل m/s إلى km/h
      wind_direction: apiData.wind.deg,
      pressure: apiData.main.pressure,
      uv_index: apiData.uvi || 0,
      visibility: Math.round(apiData.visibility / 1000 * 10) / 10, // تحويل m إلى km
      weather_condition: this.mapWeatherCondition(apiData.weather[0].main),
      recorded_at: new Date(apiData.dt * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * تحويل حالة الطقس من API إلى نوع WeatherCondition
   */
  private static mapWeatherCondition(apiCondition: string): WeatherCondition {
    const conditionMap: Record<string, WeatherCondition> = {
      'Clear': 'clear',
      'Clouds': 'cloudy',
      'Rain': 'rainy',
      'Drizzle': 'rainy',
      'Thunderstorm': 'stormy',
      'Snow': 'snowy',
      'Mist': 'foggy',
      'Fog': 'foggy',
      'Haze': 'foggy'
    };

    return conditionMap[apiCondition] || 'clear';
  }

  /**
   * الحصول على بيانات الطقس التاريخية
   */
  static async getHistoricalWeather(
    location: GeoCoordinate,
    startDate: Date,
    endDate: Date
  ): Promise<WeatherData[]> {
    // ملاحظة: هذا يتطلب خطة مدفوعة من OpenWeather
    // يمكن استخدام خدمة أخرى أو قاعدة بيانات محلية
    throw new Error('Historical weather data requires premium plan');
  }

  /**
   * تنظيف التخزين المؤقت
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * الحصول على إحصائيات التخزين المؤقت
   */
  static getCacheStats(): {
    size: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } {
    const entries = Array.from(this.cache.values());
    
    if (entries.length === 0) {
      return {
        size: 0,
        oldestEntry: null,
        newestEntry: null
      };
    }

    const timestamps = entries.map(e => e.timestamp);
    return {
      size: entries.length,
      oldestEntry: new Date(Math.min(...timestamps)),
      newestEntry: new Date(Math.max(...timestamps))
    };
  }

  /**
   * التحقق من صحة API key
   */
  static async validateApiKey(): Promise<boolean> {
    if (!this.API_KEY) {
      return false;
    }

    try {
      const response = await fetch(
        `${this.BASE_URL}/weather?lat=${eosdaPublicConfig.center.lat}&lon=${eosdaPublicConfig.center.lng}&appid=${this.API_KEY}`
      )
      return response.ok;
    } catch {
      return false;
    }
  }
}
