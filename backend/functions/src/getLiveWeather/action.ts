import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();
const CACHE_DOC = "metro_manila_weather";
// NCR Coordinates used for the fetch
const NCR_LAT = 14.5995;
const NCR_LON = 120.9842;

export async function fetchAndCacheWeather() {
  const cacheRef = db.collection("weather_cache").doc(CACHE_DOC);
  const snap = await cacheRef.get();

  // 1. 15-minute cache to respect Open-Meteo limits
  if (
    snap.exists &&
    Date.now() - snap.data()?.timestamp.toDate().getTime() < 15 * 60 * 1000
  ) {
    return snap.data();
  }

  // 2. Updated URL to include Precipitation, UV Index, and Wind Speed
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${NCR_LAT}&longitude=${NCR_LON}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,precipitation,wind_speed_10m,uv_index&hourly=temperature_2m,weather_code,precipitation_probability&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FManila&forecast_days=1`;

  const res = await fetch(url);
  const data = (await res.json()) as any;

  // Transform hourly data for the chart
  const hourlyForecast = data.hourly.time
    .slice(0, 24)
    .map((time: string, i: number) => ({
      time: new Date(time).getHours(),
      temp: Math.round(data.hourly.temperature_2m[i]),
      code: data.hourly.weather_code[i],
      pop: data.hourly.precipitation_probability[i], 
    }));

  // Complete weather data object for Safe-Run PH
  const weatherData = {
    temp: Math.round(data.current.temperature_2m),
    heatIndex: Math.round(data.current.apparent_temperature),
    humidity: data.current.relative_humidity_2m,
    conditionCode: data.current.weather_code,
    precip: data.current.precipitation,
    windSpeed: Math.round(data.current.wind_speed_10m),
    uvIndex: data.current.uv_index,
    todayHi: Math.round(data.daily.temperature_2m_max[0]),
    todayLo: Math.round(data.daily.temperature_2m_min[0]),
    hourly: hourlyForecast, 
    timestamp: new Date(),
  };

  await cacheRef.set(weatherData);
  return weatherData;
}