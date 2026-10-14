import { NextResponse } from "next/server";

// Fallback coordinates (NCR / Manila center)
const NCR_LAT = 14.5995;
const NCR_LON = 120.9842;

function getCardinalDirection(angle: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 45) % 8;
  return directions[index];
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const latitude = body?.lat ?? NCR_LAT;
    const longitude = body?.lon ?? NCR_LON;

    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,precipitation,wind_speed_10m,wind_direction_10m,uv_index&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,uv_index,weather_code,precipitation_probability&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FManila&forecast_days=1`;

    // ⚡ Built-in server-side caching (revalidates every 300 seconds / 5 mins)
    const res = await fetch(openMeteoUrl, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      throw new Error(`Open-Meteo responded with status ${res.status}`);
    }

    const data = await res.json();

    // Map into the exact data structure expected by analyzeWeather and your UI cards
    const weatherData = {
      lat: latitude,
      lon: longitude,
      temp: Math.round(data.current.temperature_2m),
      heatIndex: Math.round(data.current.apparent_temperature),
      humidity: data.current.relative_humidity_2m,
      conditionCode: data.current.weather_code,
      precip: data.current.precipitation,
      windSpeed: Math.round(data.current.wind_speed_10m),
      windDirectionDeg: Math.round(data.current.wind_direction_10m),
      windDirection: getCardinalDirection(data.current.wind_direction_10m),
      uvIndex: data.current.uv_index,
      todayHi: Math.round(data.daily.temperature_2m_max[0]),
      todayLo: Math.round(data.daily.temperature_2m_min[0]),
      locationLabel: "Philippines",
      hourly: data.hourly.time.slice(0, 24).map((timeStr: string, i: number) => ({
        time: Math.floor(new Date(timeStr + "+08:00").getTime() / 1000),
        temp: Math.round(data.hourly.temperature_2m[i]),
        feelsLike: Math.round(data.hourly.apparent_temperature[i]),
        humidity: data.hourly.relative_humidity_2m[i],
        precip: data.hourly.precipitation[i],
        windSpeed: Math.round(data.hourly.wind_speed_10m[i]),
        uvIndex: data.hourly.uv_index[i],
        code: data.hourly.weather_code[i],
        pop: data.hourly.precipitation_probability[i],
      })),
    };

    return NextResponse.json(weatherData);
  } catch (err: any) {
    console.error("API route error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch weather" }, { status: 500 });
  }
}