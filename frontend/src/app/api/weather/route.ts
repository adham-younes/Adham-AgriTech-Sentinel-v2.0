import { z } from "zod"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

const querySchema = z.object({
  location: z
    .string()
    .trim()
    .transform((value) => value.replace(/[<>;$]/g, ""))
    .optional(),
  lat: z.string().optional(),
  lon: z.string().optional(),
  lang: z
    .string()
    .trim()
    .toLowerCase()
    .default("en")
    .refine((value) => ["en", "ar", "fr", "es", "de", "it"].includes(value), "unsupported language"),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({
      location: searchParams.get("location") ?? undefined,
      lat: searchParams.get("lat") ?? undefined,
      lon: searchParams.get("lon") ?? undefined,
      lang: searchParams.get("lang") ?? undefined,
    })

    if (!parsed.success) {
      return Response.json({ error: "Invalid query parameters" }, { status: 400 })
    }

    const { location, lat, lon, lang } = parsed.data

    let weatherUrl = `https://api.openweathermap.org/data/2.5/weather?appid=${process.env.OPENWEATHER_API_KEY}&units=metric&lang=${lang}`
    let forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?appid=${process.env.OPENWEATHER_API_KEY}&units=metric&cnt=56&lang=${lang}`

    if (lat && lon) {
      weatherUrl += `&lat=${lat}&lon=${lon}`
      forecastUrl += `&lat=${lat}&lon=${lon}`
    } else if (location) {
      const encodedLocation = encodeURIComponent(location)
      weatherUrl += `&q=${encodedLocation}`
      forecastUrl += `&q=${encodedLocation}`
    } else {
      return Response.json({ error: "Location or coordinates required" }, { status: 400 })
    }

    const currentResponse = await fetch(weatherUrl)

    if (!currentResponse.ok) {
      console.error("[v0] OpenWeather API error:", await currentResponse.text())
      return Response.json({ error: "Failed to fetch weather data" }, { status: currentResponse.status })
    }

    const currentData = await currentResponse.json()

    const forecastResponse = await fetch(forecastUrl)

    if (!forecastResponse.ok) {
      console.error("[v0] OpenWeather forecast API error:", await forecastResponse.text())
      return Response.json({ error: "Failed to fetch forecast data" }, { status: forecastResponse.status })
    }

    const forecastData = await forecastResponse.json()

    const dailyForecasts: Array<{
      date: string
      temp_max: number
      temp_min: number
      condition: string
    }> = []
    const processedDates = new Set<string>()

    for (const item of forecastData.list as Array<{ dt: number; main: { temp_max: number; temp_min: number }; weather: { description: string }[] }>) {
      const timestamp = new Date(item.dt * 1000)
      const dateKey = timestamp.toISOString().split("T")[0]
      if (!processedDates.has(dateKey) && dailyForecasts.length < 7) {
        processedDates.add(dateKey)
        dailyForecasts.push({
          date: timestamp.toISOString(),
          temp_max: item.main.temp_max,
          temp_min: item.main.temp_min,
          condition: item.weather[0]?.description ?? "",
        })
      }
    }

    return Response.json({
      current: {
        temp: currentData.main.temp,
        feels_like: currentData.main.feels_like,
        humidity: currentData.main.humidity,
        wind_speed: currentData.wind.speed,
        visibility: currentData.visibility,
        pressure: currentData.main.pressure,
        condition: currentData.weather[0]?.description ?? "",
      },
      forecast: dailyForecasts,
    })
  } catch (error) {
    console.error("[v0] Error fetching weather:", error)
    return Response.json({ error: "Failed to fetch weather data" }, { status: 500 })
  }
}
