// backend/functions/src/getWeather/action.ts
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();
const CACHE_DOC = "metro_manila_weather";
const NCR_LAT = 14.5995;
const NCR_LON = 120.9842;

export async function fetchAndCacheWeather() {
  const cacheRef = db.collection("weather_cache").doc(CACHE_DOC);
  const snap = await cacheRef.get();

  // 1. Keep the 15-minute cache to be polite to the Open-Meteo servers
  if (
    snap.exists &&
    Date.now() - snap.data()?.timestamp.toDate().getTime() < 15 * 60 * 1000
  ) {
    return snap.data();
  }

  // 2. Fetch EVERYTHING: Current + 7-Day Forecast
  const url = `https://api.open-meteo.com/v1/forecast?latitude=14.5995&longitude=120.9842&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code&hourly=temperature_2m,weather_code,precipitation_probability&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FManila&forecast_days=1`;

  const res = await fetch(url);
  const data = (await res.json()) as any;

  // Transform data: We take the first 24 entries of the hourly arrays
  const hourlyForecast = data.hourly.time
    .slice(0, 24)
    .map((time: string, i: number) => ({
      time: new Date(time).getHours(),
      temp: Math.round(data.hourly.temperature_2m[i]),
      code: data.hourly.weather_code[i],
      pop: data.hourly.precipitation_probability[i], // Probability of Precipitation
    }));

  const weatherData = {
    temp: Math.round(data.current.temperature_2m),
    heatIndex: Math.round(data.current.apparent_temperature),
    humidity: data.current.relative_humidity_2m,
    conditionCode: data.current.weather_code,
    todayHi: Math.round(data.daily.temperature_2m_max[0]),
    todayLo: Math.round(data.daily.temperature_2m_min[0]),
    hourly: hourlyForecast, // ⚡ New 24-hour data
    timestamp: new Date(),
  };

  await cacheRef.set(weatherData);
  return weatherData;
}
