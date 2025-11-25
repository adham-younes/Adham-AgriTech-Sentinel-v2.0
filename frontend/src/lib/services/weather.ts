export async function testWeatherConnection(): Promise<{ status: string; message: string }> {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY

    if (!apiKey) {
      return {
        status: "error",
        message: "OpenWeather API key not configured",
      }
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=Cairo,EG&appid=${apiKey}&units=metric`,
    )

    if (!response.ok) {
      return {
        status: "error",
        message: `OpenWeather API error: ${response.statusText}`,
      }
    }

    return {
      status: "success",
      message: "OpenWeather connection successful",
    }
  } catch (error) {
    return {
      status: "error",
      message: `Weather connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
