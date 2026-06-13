import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
      return NextResponse.json({ error: "Latitude and Longitude are required" }, { status: 400 });
    }

    const apiKey = process.env.OPENWEATHERMAP_API_KEY;

    // Fallback data if API key is not set or placeholder
    if (!apiKey || apiKey === "placeholder" || apiKey.startsWith("your-")) {
      return NextResponse.json({
        temp: 78.5,
        windSpeed: 6.2,
        conditions: "Sunny",
        description: "clear sky",
        icon: "01d",
      });
    }

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
    
    const res = await fetch(weatherUrl);
    if (!res.ok) {
      throw new Error(`OpenWeatherMap responded with status ${res.status}`);
    }

    const data = await res.json();

    return NextResponse.json({
      temp: data.main?.temp,
      windSpeed: data.wind?.speed,
      conditions: data.weather?.[0]?.main || "Sunny",
      description: data.weather?.[0]?.description || "clear sky",
      icon: data.weather?.[0]?.icon || "01d",
    });
  } catch (error) {
    console.error("GET /api/weather error:", error);
    // Return graceful fallback on failure so frontend doesn't crash
    return NextResponse.json({
      temp: 78.5,
      windSpeed: 6.2,
      conditions: "Sunny",
      description: "clear sky",
      icon: "01d",
      note: "Served from local fallback due to API error",
    });
  }
}
export const dynamic = "force-dynamic";
