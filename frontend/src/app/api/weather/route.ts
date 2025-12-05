import { NextResponse } from "next/server";
import { getCurrentWeather, getWeatherForecast, getAgriculturalWeather } from "@/lib/services/weather";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "26.8");
    const lon = parseFloat(searchParams.get("lon") || "31.0");
    const type = searchParams.get("type") || "current";
    const days = parseInt(searchParams.get("days") || "7");

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 400 }
      );
    }

    let data;

    switch (type) {
      case "forecast":
        data = await getWeatherForecast(lat, lon, days);
        break;
      case "agricultural":
        data = await getAgriculturalWeather(lat, lon);
        break;
      case "current":
      default:
        data = await getCurrentWeather(lat, lon);
        break;
    }

    return NextResponse.json({
      success: true,
      type,
      coordinates: { lat, lon },
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Weather API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch weather data",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
