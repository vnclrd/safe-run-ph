import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();
const NCR_LAT = 14.5995;
const NCR_LON = 120.9842;

// 1. Define the Metro Manila Grid
const METRO_MANILA_CITIES = [
  { name: "Manila", lat: 14.5995, lon: 120.9842 },
  { name: "Quezon City", lat: 14.676, lon: 121.0437 },
  { name: "Caloocan", lat: 14.6408, lon: 120.976 },
  { name: "Las Pinas", lat: 14.4445, lon: 120.9939 },
  { name: "Makati", lat: 14.5547, lon: 121.0244 },
  { name: "Malabon", lat: 14.6625, lon: 120.958 },
  { name: "Mandaluyong", lat: 14.5794, lon: 121.0359 },
  { name: "Marikina", lat: 14.6507, lon: 121.1029 },
  { name: "Muntinlupa", lat: 14.4081, lon: 121.0415 },
  { name: "Navotas", lat: 14.6732, lon: 120.9436 },
  { name: "Paranaque", lat: 14.4793, lon: 121.0198 },
  { name: "Pasay", lat: 14.5378, lon: 121.0014 },
  { name: "Pasig", lat: 14.5764, lon: 121.0851 },
  { name: "Pateros", lat: 14.5454, lon: 121.0687 },
  { name: "San Juan", lat: 14.6042, lon: 121.03 },
  { name: "Taguig", lat: 14.5176, lon: 121.0509 },
  { name: "Valenzuela", lat: 14.7011, lon: 120.983 },
];

function getCardinalDirection(angle: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 45) % 8;
  return directions[index];
}

async function getCityName(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { "User-Agent": "SafeRunPH/1.0" } },
    );
    const data = (await res.json()) as any;
    return (
      data.address.city ||
      data.address.town ||
      data.address.municipality ||
      "Metro Manila"
    );
  } catch {
    return "Metro Manila";
  }
}

// 2. Helper to fetch all MM cities in one burst
async function getMetroManilaHeatGrid() {
  const cacheKey = `ncr_heatmap_grid`;
  const cacheRef = db.collection("weather_cache").doc(cacheKey);
  const snap = await cacheRef.get();

  // Cache grid heavily (30 mins) as it's an aggregate background feature
  if (
    snap.exists &&
    Date.now() - snap.data()?.timestamp.toDate().getTime() < 30 * 60 * 1000
  ) {
    return snap.data()?.grid;
  }

  // Create comma-separated lists for the bulk API call
  const lats = METRO_MANILA_CITIES.map((c) => c.lat).join(",");
  const lons = METRO_MANILA_CITIES.map((c) => c.lon).join(",");

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m&timezone=Asia%2FManila`;
  const res = await fetch(url);

  const dataArray = (await res.json()) as any[];

  const grid = METRO_MANILA_CITIES.map((city, index) => ({
    lat: city.lat,
    lon: city.lon,
    temp: Math.round(dataArray[index]?.current?.temperature_2m || 32),
    name: city.name,
  }));

  await cacheRef.set({ grid, timestamp: new Date() });
  return grid;
}

export async function fetchAndCacheWeather(lat?: number, lon?: number) {
  const latitude = lat ?? NCR_LAT;
  const longitude = lon ?? NCR_LON;

  const rawCity =
    lat && lon ? await getCityName(latitude, longitude) : "Metro Manila";
  const citySlug = rawCity
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ city$/i, "")
    .trim()
    .replace(/\s+/g, "_");

  const cacheKey = `${citySlug}_weather`;
  const cacheRef = db.collection("weather_cache").doc(cacheKey);
  const snap = await cacheRef.get();

  let weatherData;

  if (
    snap.exists &&
    Date.now() - snap.data()?.timestamp.toDate().getTime() < 15 * 60 * 1000
  ) {
    weatherData = snap.data();
  } else {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,precipitation,wind_speed_10m,wind_direction_10m,uv_index&hourly=temperature_2m,weather_code,precipitation_probability&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FManila&forecast_days=1`;
    const res = await fetch(url);
    const data = (await res.json()) as any;

    weatherData = {
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
      locationLabel: rawCity,
      hourly: data.hourly.time.slice(0, 24).map((time: string, i: number) => ({
        time: new Date(time).getHours(),
        temp: Math.round(data.hourly.temperature_2m[i]),
        code: data.hourly.weather_code[i],
        pop: data.hourly.precipitation_probability[i],
      })),
      timestamp: new Date(),
    };
    await cacheRef.set(weatherData);
  }

  // 3. Fetch the grid and attach it to the final response
  try {
    const gridData = await getMetroManilaHeatGrid();
    return { ...weatherData, heatmapGrid: gridData };
  } catch (error) {
    console.error("Failed to load MM grid", error);
    return { ...weatherData, heatmapGrid: [] };
  }
}
