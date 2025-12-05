/**
 * Weather Service
 * Integrates with OpenWeatherMap API for agricultural weather data
 * Provides current conditions, forecasts, and agro-specific data
 */

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "bf14cf140dd3f8ddfd62b4fd9f6f9795";
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface WeatherCache {
  data: any;
  timestamp: number;
}

const weatherCache = new Map<string, WeatherCache>();

function getCacheKey(lat: number, lon: number, type: string): string {
  return `${type}_${lat.toFixed(4)}_${lon.toFixed(4)}`;
}

function getCachedData(key: string): any | null {
  const cached = weatherCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any): void {
  weatherCache.set(key, { data, timestamp: Date.now() });
}

export interface CurrentWeather {
  temperature: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_direction: number;
  description: string;
  icon: string;
  clouds: number;
  visibility: number;
  rain_1h?: number;
  sunrise: Date;
  sunset: Date;
  timestamp: Date;
}

export interface WeatherForecast {
  date: Date;
  temperature: { min: number; max: number; avg: number };
  humidity: number;
  rain_probability: number;
  rain_amount: number;
  wind_speed: number;
  description: string;
  icon: string;
}

export interface AgriculturalWeather {
  soil_temperature?: number;
  soil_moisture?: number;
  evapotranspiration?: number;
  uv_index: number;
  dew_point: number;
  frost_risk: boolean;
  irrigation_recommended: boolean;
  growing_degree_days?: number;
}

/**
 * Get current weather for a location
 */
export async function getCurrentWeather(lat: number, lon: number): Promise<CurrentWeather> {
  const cacheKey = getCacheKey(lat, lon, "current");
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=ar`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data = await response.json();

    const weather: CurrentWeather = {
      temperature: data.main.temp,
      feels_like: data.main.feels_like,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      wind_speed: data.wind?.speed || 0,
      wind_direction: data.wind?.deg || 0,
      description: data.weather?.[0]?.description || "",
      icon: data.weather?.[0]?.icon || "01d",
      clouds: data.clouds?.all || 0,
      visibility: data.visibility || 10000,
      rain_1h: data.rain?.["1h"],
      sunrise: new Date(data.sys.sunrise * 1000),
      sunset: new Date(data.sys.sunset * 1000),
      timestamp: new Date(),
    };

    setCachedData(cacheKey, weather);
    return weather;
  } catch (error) {
    console.error("Error fetching current weather:", error);
    // Return default data for graceful degradation
    return {
      temperature: 25,
      feels_like: 27,
      humidity: 50,
      pressure: 1013,
      wind_speed: 3,
      wind_direction: 0,
      description: "صافٍ",
      icon: "01d",
      clouds: 0,
      visibility: 10000,
      sunrise: new Date(),
      sunset: new Date(),
      timestamp: new Date(),
    };
  }
}

/**
 * Get 7-day weather forecast
 */
export async function getWeatherForecast(lat: number, lon: number, days: number = 7): Promise<WeatherForecast[]> {
  const cacheKey = getCacheKey(lat, lon, `forecast_${days}`);
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    // Using One Call API 3.0 for detailed forecast
    const response = await fetch(
      `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=ar&cnt=${days * 8}`
    );

    if (!response.ok) {
      throw new Error(`Forecast API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Group by day and get daily summary
    const dailyForecasts = new Map<string, any[]>();

    for (const item of data.list || []) {
      const date = new Date(item.dt * 1000).toDateString();
      if (!dailyForecasts.has(date)) {
        dailyForecasts.set(date, []);
      }
      dailyForecasts.get(date)!.push(item);
    }

    const forecasts: WeatherForecast[] = [];

    dailyForecasts.forEach((items, dateStr) => {
      const temps = items.map(i => i.main.temp);
      const rainProbs = items.map(i => i.pop || 0);
      const rainAmounts = items.map(i => i.rain?.["3h"] || 0);

      forecasts.push({
        date: new Date(dateStr),
        temperature: {
          min: Math.min(...temps),
          max: Math.max(...temps),
          avg: temps.reduce((a, b) => a + b, 0) / temps.length,
        },
        humidity: items[0].main.humidity,
        rain_probability: Math.max(...rainProbs) * 100,
        rain_amount: rainAmounts.reduce((a, b) => a + b, 0),
        wind_speed: items[0].wind?.speed || 0,
        description: items[Math.floor(items.length / 2)].weather?.[0]?.description || "",
        icon: items[Math.floor(items.length / 2)].weather?.[0]?.icon || "01d",
      });
    });

    setCachedData(cacheKey, forecasts.slice(0, days));
    return forecasts.slice(0, days);
  } catch (error) {
    console.error("Error fetching weather forecast:", error);
    return [];
  }
}

/**
 * Get agricultural-specific weather data
 */
export async function getAgriculturalWeather(lat: number, lon: number): Promise<AgriculturalWeather> {
  const cacheKey = getCacheKey(lat, lon, "agro");
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    // Get current weather for calculations
    const current = await getCurrentWeather(lat, lon);

    // Calculate dew point using Magnus formula
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * current.temperature) / (b + current.temperature)) + Math.log(current.humidity / 100);
    const dewPoint = (b * alpha) / (a - alpha);

    // Estimate UV index based on time and clouds
    const now = new Date();
    const hour = now.getHours();
    const baseUV = hour >= 10 && hour <= 16 ? 8 : (hour >= 8 && hour <= 18 ? 4 : 0);
    const uvIndex = Math.max(0, baseUV * (1 - current.clouds / 100));

    // Frost risk calculation
    const frostRisk = current.temperature < 5 || dewPoint < 2;

    // Irrigation recommendation
    const irrigationRecommended =
      current.humidity < 40 &&
      current.temperature > 20 &&
      current.rain_1h === undefined;

    const agro: AgriculturalWeather = {
      soil_temperature: current.temperature - 2, // Approximate soil temp
      soil_moisture: Math.max(20, 100 - current.temperature * 2), // Rough estimate
      evapotranspiration: (current.temperature * 0.1 + current.wind_speed * 0.5) * (1 - current.humidity / 200),
      uv_index: uvIndex,
      dew_point: dewPoint,
      frost_risk: frostRisk,
      irrigation_recommended: irrigationRecommended,
      growing_degree_days: Math.max(0, ((current.temperature - 10) + (current.feels_like - 10)) / 2),
    };

    setCachedData(cacheKey, agro);
    return agro;
  } catch (error) {
    console.error("Error calculating agricultural weather:", error);
    return {
      uv_index: 5,
      dew_point: 15,
      frost_risk: false,
      irrigation_recommended: false,
    };
  }
}

/**
 * Test weather API connection
 */
export async function testWeatherConnection(): Promise<{ status: string; message: string }> {
  try {
    const response = await fetch(
      `${OPENWEATHER_BASE_URL}/weather?q=Cairo,EG&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) {
      return {
        status: "error",
        message: `OpenWeather API error: ${response.statusText}`,
      };
    }

    return {
      status: "success",
      message: "OpenWeather connection successful",
    };
  } catch (error) {
    return {
      status: "error",
      message: `Weather connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
