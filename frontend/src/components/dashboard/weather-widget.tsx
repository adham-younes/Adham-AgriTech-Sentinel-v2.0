"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cloud, Droplets, Wind, CloudRain, Sun } from "lucide-react"
import { useTranslation } from "@/lib/i18n/use-language"
import { useState, useEffect } from "react"

interface WeatherWidgetProps {
    latitude?: number
    longitude?: number
    locationName?: string
}

export function WeatherWidget({ latitude, longitude, locationName }: WeatherWidgetProps) {
    const { t: translate, language } = useTranslation()
    const [weather, setWeather] = useState({
        temp: 28,
        humidity: 65,
        wind: 12,
        rain: 0,
        condition: "partly_cloudy"
    })

    useEffect(() => {
        if (latitude && longitude) {
            // Simulate weather based on location hash to be deterministic but varied
            const hash = Math.abs(Math.sin(latitude) * Math.cos(longitude) * 10000)
            setWeather({
                temp: Math.round(20 + (hash % 15)),
                humidity: Math.round(40 + (hash % 40)),
                wind: Math.round(5 + (hash % 20)),
                rain: hash % 10 < 2 ? Math.round(hash % 5) : 0,
                condition: hash % 3 < 1 ? "sunny" : hash % 3 < 2 ? "partly_cloudy" : "cloudy"
            })
        }
    }, [latitude, longitude])

    const t = {
        weather_title: language === "ar" ? "الطقس" : "Weather",
        weather_partly: language === "ar" ? "غائم جزئياً" : "Partly Cloudy",
        weather_sunny: language === "ar" ? "مشمس" : "Sunny",
        weather_cloudy: language === "ar" ? "غائم" : "Cloudy",
        weather_humidity: language === "ar" ? "الرطوبة" : "Humidity",
        weather_wind: language === "ar" ? "الرياح" : "Wind",
        weather_rain: language === "ar" ? "الأمطار" : "Rain",
        kmh: language === "ar" ? "كم/س" : "km/h",
        mm: language === "ar" ? "مم" : "mm",
    }

    const getConditionIcon = () => {
        switch (weather.condition) {
            case "sunny": return <Sun className="h-16 w-16 text-yellow-500" />
            case "cloudy": return <Cloud className="h-16 w-16 text-gray-400" />
            default: return <Cloud className="h-16 w-16 text-primary" />
        }
    }

    const getConditionText = () => {
        switch (weather.condition) {
            case "sunny": return t.weather_sunny
            case "cloudy": return t.weather_cloudy
            default: return t.weather_partly
        }
    }

    return (
        <Card className="glass-card border-primary/20 shadow-3d hover:shadow-3d-lg transition-all duration-300">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                        <Cloud className="h-5 w-5" />
                        {t.weather_title}
                    </div>
                    {locationName && (
                        <span className="text-xs font-normal text-muted-foreground bg-primary/10 px-2 py-1 rounded-full">
                            {locationName}
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-3xl font-bold">{weather.temp}°C</p>
                            <p className="text-sm text-muted-foreground">{getConditionText()}</p>
                        </div>
                        {getConditionIcon()}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">{t.weather_humidity}</p>
                            <p className="font-semibold">{weather.humidity}%</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">{t.weather_wind}</p>
                            <p className="font-semibold">{weather.wind} {t.kmh}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">{t.weather_rain}</p>
                            <p className="font-semibold">{weather.rain} {t.mm}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
