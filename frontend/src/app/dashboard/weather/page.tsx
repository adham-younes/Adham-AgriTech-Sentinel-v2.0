"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, Cloud, Droplets, Wind, Eye, Gauge, Sun, CloudRain, CloudSnow, CloudDrizzle, MapPin } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n/use-language"
import { formatWeekdaySafe } from "@/lib/utils/date-safe"

export default function WeatherPage() {
  const { language, setLanguage } = useTranslation()
  const [weather, setWeather] = useState<any>(null)
  const [forecast, setForecast] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<"ar" | "en">(language === "en" ? "en" : "ar")
  const [location, setLocation] = useState("Cairo,EG")

  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [loadingLocation, setLoadingLocation] = useState(false)

  useEffect(() => {
    if (language === "ar" || language === "en") {
      setLang(language)
    }
  }, [language])

  useEffect(() => {
    fetchWeather()
  }, [location, lang, coords])

  async function fetchWeather() {
    setLoading(true)
    try {
      let url = `/api/weather?lang=${lang}`
      if (coords) {
        url += `&lat=${coords.lat}&lon=${coords.lon}`
      } else {
        url += `&location=${location}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (data.current) {
        setWeather(data.current)
      }
      if (data.forecast) {
        setForecast(data.forecast)
      }
    } catch (error) {
      console.error("[v0] Error fetching weather:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      setLoadingLocation(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          })
          setLocation("") // Clear text location when using coords
          setLoadingLocation(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          toast.error(lang === "ar" ? "تعذر تحديد الموقع. يرجى التحقق من إعدادات المتصفح." : "Could not get location. Please check browser settings.")
          setLoadingLocation(false)
        }
      )
    } else {
      toast.error(lang === "ar" ? "المتصفح لا يدعم تحديد الموقع" : "Geolocation is not supported by this browser")
    }
  }

  const getWeatherIcon = (condition: string) => {
    const lower = condition.toLowerCase()
    if (lower.includes("rain")) return <CloudRain className="h-8 w-8" />
    if (lower.includes("snow")) return <CloudSnow className="h-8 w-8" />
    if (lower.includes("drizzle")) return <CloudDrizzle className="h-8 w-8" />
    if (lower.includes("cloud")) return <Cloud className="h-8 w-8" />
    return <Sun className="h-8 w-8" />
  }

  const t = {
    ar: {
      title: "الطقس والتوقعات",
      currentWeather: "الطقس الحالي",
      forecast: "التوقعات",
      temperature: "درجة الحرارة",
      feelsLike: "تشعر بـ",
      humidity: "الرطوبة",
      windSpeed: "سرعة الرياح",
      visibility: "الرؤية",
      pressure: "الضغط الجوي",
      recommendations: "توصيات زراعية",
      loading: "جاري تحميل بيانات الطقس...",
      selectLocation: "اختر الموقع",
      useMyLocation: "استخدم موقعي",
      cairo: "القاهرة",
      alexandria: "الإسكندرية",
      giza: "الجيزة",
      aswan: "أسوان",
      luxor: "الأقصر",
    },
    en: {
      title: "Weather & Forecasts",
      currentWeather: "Current Weather",
      forecast: "Forecast",
      temperature: "Temperature",
      feelsLike: "Feels Like",
      humidity: "Humidity",
      windSpeed: "Wind Speed",
      visibility: "Visibility",
      pressure: "Pressure",
      recommendations: "Agricultural Recommendations",
      loading: "Loading weather data...",
      selectLocation: "Select Location",
      useMyLocation: "Use My Location",
      cairo: "Cairo",
      alexandria: "Alexandria",
      giza: "Giza",
      aswan: "Aswan",
      luxor: "Luxor",
    },
  }

  const locations = [
    { value: "Cairo,EG", label: lang === "ar" ? "القاهرة" : "Cairo" },
    { value: "Alexandria,EG", label: lang === "ar" ? "الإسكندرية" : "Alexandria" },
    { value: "Giza,EG", label: lang === "ar" ? "الجيزة" : "Giza" },
    { value: "Aswan,EG", label: lang === "ar" ? "أسوان" : "Aswan" },
    { value: "Luxor,EG", label: lang === "ar" ? "الأقصر" : "Luxor" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t[lang].title}</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLocationClick}
            disabled={loadingLocation}
            className="gap-2"
          >
            {loadingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
            <span className="hidden sm:inline">{t[lang].useMyLocation}</span>
          </Button>
          <select
            value={location}
            onChange={(e) => {
              setLocation(e.target.value)
              setCoords(null) // Reset coords when selecting manually
            }}
            className="px-3 py-2 rounded-md border bg-background"
          >
            {locations.map((loc) => (
              <option key={loc.value} value={loc.value}>
                {loc.label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const next = lang === "ar" ? "en" : "ar"
              setLang(next)
              setLanguage(next)
            }}
          >
            {lang === "ar" ? "EN" : "ع"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">{t[lang].loading}</span>
        </div>
      ) : weather ? (
        <>
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">{t[lang].currentWeather}</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex items-center gap-6">
                <div className="text-primary">{getWeatherIcon(weather.condition)}</div>
                <div>
                  <p className="text-5xl font-bold">{Math.round(weather.temp)}°C</p>
                  <p className="text-muted-foreground">{weather.condition}</p>
                  <p className="text-sm text-muted-foreground">
                    {t[lang].feelsLike}: {Math.round(weather.feels_like)}°C
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t[lang].humidity}</p>
                    <p className="font-semibold">{weather.humidity}%</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Wind className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t[lang].windSpeed}</p>
                    <p className="font-semibold">
                      {weather.wind_speed} {lang === "ar" ? "م/ث" : "m/s"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t[lang].visibility}</p>
                    <p className="font-semibold">
                      {(weather.visibility / 1000).toFixed(1)} {lang === "ar" ? "كم" : "km"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t[lang].pressure}</p>
                    <p className="font-semibold">{weather.pressure} hPa</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {forecast.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">{t[lang].forecast}</h2>
              <div className="grid gap-4 md:grid-cols-7">
                {forecast.map((day: any, index: number) => (
                  <Card key={index} className="p-4 text-center">
                    <p className="text-sm font-medium mb-2">
                      {formatForecastWeekday(day.date, lang)}
                    </p>
                    <div className="flex justify-center mb-2 text-primary">{getWeatherIcon(day.condition)}</div>
                    <p className="text-xs text-muted-foreground mb-1">{day.condition}</p>
                    <div className="flex items-center justify-center gap-1 text-sm">
                      <span className="font-bold">{Math.round(day.temp_max)}°</span>
                      <span className="text-muted-foreground">{Math.round(day.temp_min)}°</span>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-6 bg-primary/5 border-primary/20">
            <h2 className="text-xl font-bold mb-4">{t[lang].recommendations}</h2>
            <div className="space-y-2 text-sm leading-relaxed">
              {weather.temp > 35 && (
                <p>
                  {lang === "ar"
                    ? "⚠️ درجة الحرارة مرتفعة جداً. يُنصح بزيادة الري وتوفير الظل للمحاصيل الحساسة."
                    : "⚠️ Very high temperature. Increase irrigation and provide shade for sensitive crops."}
                </p>
              )}
              {weather.humidity > 80 && (
                <p>
                  {lang === "ar"
                    ? "💧 رطوبة عالية. راقب المحاصيل للكشف عن الأمراض الفطرية وتجنب الري الزائد."
                    : "💧 High humidity. Monitor crops for fungal diseases and avoid over-irrigation."}
                </p>
              )}
              {weather.wind_speed > 10 && (
                <p>
                  {lang === "ar"
                    ? "🌬️ رياح قوية. تحقق من دعامات النباتات وأنظمة الري بالرش."
                    : "🌬️ Strong winds. Check plant supports and sprinkler irrigation systems."}
                </p>
              )}
              {weather.condition.toLowerCase().includes("rain") && (
                <p>
                  {lang === "ar"
                    ? "🌧️ أمطار متوقعة. قلل الري وتأكد من تصريف المياه الجيد."
                    : "🌧️ Rain expected. Reduce irrigation and ensure good drainage."}
                </p>
              )}
              {weather.temp >= 20 && weather.temp <= 30 && weather.humidity < 70 && (
                <p>
                  {lang === "ar"
                    ? "✅ ظروف مثالية للزراعة. وقت جيد للزراعة والعناية بالمحاصيل."
                    : "✅ Ideal conditions for farming. Good time for planting and crop care."}
                </p>
              )}
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            {lang === "ar" ? "لا توجد بيانات طقس متاحة" : "No weather data available"}
          </p>
        </Card>
      )}
    </div>
  )
}

function formatForecastWeekday(value: string, language: "ar" | "en") {
  const locale = language === "ar" ? "ar-EG" : "en-US"
  return formatWeekdaySafe(value, locale, "")
}
