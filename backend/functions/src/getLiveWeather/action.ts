import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();
const NCR_LAT = 14.5995;
const NCR_LON = 120.9842;

function getCardinalDirection(angle: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 45) % 8;
  return directions[index];
}

async function getCityName(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      {
        headers: { "User-Agent": "SafeRunPH/1.0" },
      },
    );

    const data = (await res.json()) as any;

    const city =
      data.address.city ||
      data.address.town ||
      data.address.municipality ||
      "Metro Manila";
    return city;
  } catch {
    return "Metro Manila";
  }
}

export async function fetchAndCacheWeather(lat?: number, lon?: number) {
  const latitude = lat ?? NCR_LAT;
  const longitude = lon ?? NCR_LON;

  // Detect city and format the Firestore document ID
  const rawCity =
    lat && lon ? await getCityName(latitude, longitude) : "Metro Manila";

  // Sanitize: "Las Piñas" -> "las_pinas", "Quezon City" -> "quezon_city"
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

  if (
    snap.exists &&
    Date.now() - snap.data()?.timestamp.toDate().getTime() < 15 * 60 * 1000
  ) {
    return snap.data();
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,precipitation,wind_speed_10m,wind_direction_10m,uv_index&hourly=temperature_2m,weather_code,precipitation_probability&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FManila&forecast_days=1`;

  const res = await fetch(url);
  const data = (await res.json()) as any;

  const weatherData = {
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
  return weatherData;
}